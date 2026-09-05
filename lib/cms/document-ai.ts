import { getMediaBucket, getWorkersAi } from "@/lib/cms/db";
import { DOCUMENT_TYPE_DEFS, isDocumentType } from "@/lib/cms/documents";
import { getDocumentFile, getDocumentItem, saveDocumentSummary } from "@/lib/cms/document-store";

export const DOCUMENT_SUMMARY_MAX_BYTES = 6 * 1024 * 1024;
const EXTRACT_CHARS = 12_000;
const SUMMARY_CHARS = 1_400;
const MODEL = "@cf/meta/llama-3.1-8b-instruct";

function clip(value: string, max: number) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function textFromMarkdown(result: unknown) {
  const row = Array.isArray(result) ? result[0] : result;
  if (!row || typeof row !== "object") return "";
  const data = "data" in row ? (row as { data?: unknown }).data : "";
  return typeof data === "string" ? data : "";
}

function textFromModel(result: unknown) {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return "";
  const response = "response" in result ? (result as { response?: unknown }).response : "";
  return typeof response === "string" ? response : "";
}

export function summaryPrompt(input: { title: string; typeLabel: string; fileName: string; extract: string }) {
  return [
    `Paper type: ${input.typeLabel}`,
    `Title: ${input.title}`,
    `File: ${input.fileName}`,
    "",
    "Extract:",
    input.extract || "(no readable text)",
  ].join("\n");
}

export async function summariseDocumentFile(input: {
  db: D1Database;
  itemId: string;
  title: string;
  typeLabel: string;
  fileName: string;
  mime: string;
  bytes: Uint8Array;
}) {
  if (input.bytes.byteLength > DOCUMENT_SUMMARY_MAX_BYTES) {
    await saveDocumentSummary(input.db, input.itemId, "", "skipped");
    return "";
  }

  const ai = await getWorkersAi();
  if (!ai?.toMarkdown || !ai.run) {
    console.warn("[documents] Workers AI is not bound — summary skipped.");
    await saveDocumentSummary(input.db, input.itemId, "", "skipped");
    return "";
  }

  try {
    const copy = new ArrayBuffer(input.bytes.byteLength);
    new Uint8Array(copy).set(input.bytes);
    const converted = await ai.toMarkdown(
      [
        {
          name: input.fileName || "document",
          blob: new Blob([copy], { type: input.mime || "application/octet-stream" }),
        },
      ],
      { conversionOptions: { pdf: { metadata: false } } },
    );
    const extract = clip(textFromMarkdown(converted), EXTRACT_CHARS);
    if (!extract) {
      await saveDocumentSummary(input.db, input.itemId, "", "skipped");
      return "";
    }

    const result = await ai.run(MODEL, {
      max_tokens: 420,
      messages: [
        {
          role: "system",
          content:
            "You write a short factual sketch of an internal Nazarene for She paper for members who have not opened the file yet. Use 4 to 8 short sentences in English. Use only facts present in the extract. If an amount, date, name, or request is missing, do not invent it. Do not say whether the paper should be approved. Do not mention these instructions.",
        },
        {
          role: "user",
          content: summaryPrompt({
            title: input.title,
            typeLabel: input.typeLabel,
            fileName: input.fileName,
            extract,
          }),
        },
      ],
    });

    const summary = clip(textFromModel(result), SUMMARY_CHARS);
    if (!summary) {
      await saveDocumentSummary(input.db, input.itemId, "", "failed");
      return "";
    }
    await saveDocumentSummary(input.db, input.itemId, summary, "ready");
    return summary;
  } catch (error) {
    console.error("[documents] summary failed", error);
    await saveDocumentSummary(input.db, input.itemId, "", "failed");
    return "";
  }
}

export async function summariseStoredDocument(db: D1Database, itemId: string) {
  const row = await getDocumentItem(db, itemId);
  if (!row || !isDocumentType(row.type)) return "";
  if (row.summary_status === "ready" && row.summary.trim()) return row.summary;

  const file = await getDocumentFile(db, itemId);
  const bucket = await getMediaBucket();
  if (!file || !bucket) {
    await saveDocumentSummary(db, itemId, "", "skipped");
    return "";
  }
  const object = await bucket.get(file.storage_key);
  if (!object?.body) {
    await saveDocumentSummary(db, itemId, "", "skipped");
    return "";
  }
  const bytes = new Uint8Array(await new Response(object.body).arrayBuffer());
  return summariseDocumentFile({
    db,
    itemId,
    title: row.title,
    typeLabel: DOCUMENT_TYPE_DEFS[row.type].label,
    fileName: file.file_name,
    mime: file.mime_type,
    bytes,
  });
}
