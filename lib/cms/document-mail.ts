import { isPublicContactEmail, sanitizeHeaderValue } from "@/lib/security";
import { site } from "@/lib/data/site";
import { OFFICER_LABELS, type DocumentOfficerRole, type DocumentStatus } from "@/lib/cms/documents";

export type MailPerson = { id: string; name: string; email: string };

export type DocumentMailKind =
  | "submitted"
  | "approved"
  | "approved_final"
  | "declined"
  | "changes_requested"
  | "replaced"
  | "comment";

function deskUrl(itemId: string) {
  const base = site.url.replace(/\/$/, "");
  return `${base}/admin/documents/${itemId}`;
}

export function uniqueMailPeople(people: MailPerson[]) {
  const seen = new Set<string>();
  const out: MailPerson[] = [];
  for (const person of people) {
    const email = person.email.trim().toLowerCase();
    if (!isPublicContactEmail(email) || seen.has(email)) continue;
    seen.add(email);
    out.push({ ...person, email });
  }
  return out;
}

async function sendResend(to: string[], subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to.length) return false;
  const from = process.env.CONTACT_FROM ?? "Nazarene for She <noreply@nazarene-for-she.org>";
  const recipients = to.slice(0, 40);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [recipients[0]],
        ...(recipients.length > 1 ? { bcc: recipients.slice(1) } : {}),
        subject: sanitizeHeaderValue(subject, 180),
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error("[documents] mail rejected", response.status);
    }
    return response.ok;
  } catch (error) {
    console.error("[documents] mail failed", error);
    return false;
  }
}

export function waitingProgress(status: DocumentStatus, currentStageRole: string, typeLabel: string) {
  if (status === "approved") return `${typeLabel}: all stages signed`;
  if (status === "declined") return `${typeLabel}: declined — the chain has stopped`;
  if (status === "changes_requested") return `${typeLabel}: changes requested — chain starts again after a new file`;
  if (status === "archived") return `${typeLabel}: archived`;
  if (currentStageRole && currentStageRole in OFFICER_LABELS) {
    return `${typeLabel}: waiting on ${OFFICER_LABELS[currentStageRole as DocumentOfficerRole]}`;
  }
  return `${typeLabel}: in the chain`;
}

function subjectFor(kind: DocumentMailKind, typeLabel: string, title: string, progress: string, reference: string) {
  switch (kind) {
    case "submitted":
      return `[Nazarene for She] New ${typeLabel} submitted — waiting approval: ${title}`;
    case "declined":
      return `[Nazarene for She] ${typeLabel} declined: ${title}`;
    case "approved_final":
      return `[Nazarene for She] ${typeLabel} fully approved: ${title}`;
    case "changes_requested":
      return `[Nazarene for She] Changes requested — ${title}`;
    case "replaced":
      return `[Nazarene for She] ${typeLabel} reset after a new file: ${title}`;
    case "comment":
      return `[Nazarene for She] New note on ${reference} — ${title}`;
    default:
      return `[Nazarene for She] ${progress} — ${title}`;
  }
}

export async function notifyDocumentDesk(input: {
  itemId: string;
  reference: string;
  title: string;
  typeLabel: string;
  status: DocumentStatus;
  currentStageRole: string;
  actorName: string;
  actorEmail?: string;
  note?: string;
  summary?: string;
  kind: DocumentMailKind;
  watchers: MailPerson[];
  urgent: MailPerson[];
}) {
  const people = uniqueMailPeople([...input.watchers, ...input.urgent]);
  if (!people.length) return;
  if (!process.env.RESEND_API_KEY) {
    console.warn("[documents] RESEND_API_KEY is not set — desk mail was skipped. The written record is still on the desk.");
    return;
  }

  const url = deskUrl(input.itemId);
  const progress = waitingProgress(input.status, input.currentStageRole, input.typeLabel);
  const actorLine = `${input.actorName}${input.actorEmail ? ` <${input.actorEmail}>` : ""}`;
  const note = input.note?.trim() ?? "";
  const summary = input.summary?.trim() ?? "";

  const fyiText = [
    `Paper: ${input.title} (${input.typeLabel})`,
    `Reference: ${input.reference}`,
    `Status: ${progress}`,
    `Recorded by: ${actorLine}`,
    note ? `Reason / note: ${note}` : "",
    summary ? `\nAI sketch (not a substitute for reading the paper):\n${summary}` : "",
    "",
    "This email is only a ping. The written record — including who wrote each note, the day, and the time — is on the Documents desk.",
    `Open: ${url}`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  const urgent = uniqueMailPeople(input.urgent);
  const sendUrgent =
    urgent.length > 0 &&
    input.status === "pending" &&
    (input.kind === "submitted" || input.kind === "approved" || input.kind === "replaced" || input.kind === "changes_requested");

  const jobs: Array<Promise<boolean>> = [
    sendResend(
      people.map((person) => person.email),
      subjectFor(input.kind, input.typeLabel, input.title, progress, input.reference),
      fyiText,
    ),
  ];

  if (sendUrgent) {
    jobs.push(
      sendResend(
        urgent.map((person) => person.email),
        `[URGENT] Your review is needed: ${input.title}`,
        [
          "Action required. Open the paper on the desk and read it before you approve or decline.",
          `Reference: ${input.reference}`,
          `Status: ${progress}`,
          summary ? `AI sketch (not a substitute for reading):\n${summary}` : "Read the preview on the desk, then approve, decline with a reason, or add a note if you disagree.",
          url,
        ].join("\n"),
      ),
    );
  }

  await Promise.all(jobs);
}
