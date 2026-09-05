interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
  run(): Promise<unknown>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface R2ObjectBody {
  body: ReadableStream;
}

interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | string | ReadableStream | Blob,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
}

interface WorkersAi {
  toMarkdown(
    files: Array<{ name: string; blob: Blob }>,
    options?: unknown,
  ): Promise<unknown>;
  run(
    model: string,
    input: {
      messages: Array<{ role: string; content: string }>;
      max_tokens?: number;
    },
  ): Promise<unknown>;
}

interface CloudflareEnv {
  ASSETS: unknown;
  WORKER_SELF_REFERENCE: unknown;
  DB: D1Database;
  MEDIA: R2Bucket;
  AI?: WorkersAi;
  CMS_BOOTSTRAP_TOKEN?: string;
  CMS_MAINTENANCE?: string;
}
