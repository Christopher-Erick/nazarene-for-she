import { getMaintenance } from "@/lib/cms/settings";

export const runtime = "nodejs";

export async function GET() {
  const maintenance = await getMaintenance();
  const retry = maintenance.estimatedReturnAt
    ? Math.max(30, Math.ceil((maintenance.estimatedReturnAt - Date.now()) / 1000))
    : 3600;
  const html = `<!doctype html>
<html lang="en-KE">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(maintenance.title)}</title>
  <style>
    body { margin:0; font-family: Georgia, serif; background:#f7f1e8; color:#1a121c; }
    main { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:2rem; }
    .card { max-width:34rem; }
    p { line-height:1.6; color:#5c4e60; }
    a { color:#5e2063; }
  </style>
</head>
<body>
  <main>
    <div class="card">
      <p style="letter-spacing:.2em; text-transform:uppercase; font-size:.75rem; color:#c47a2c;">Nazarene for She</p>
      <h1>${escapeHtml(maintenance.title)}</h1>
      <p>${escapeHtml(maintenance.message)}</p>
      ${maintenance.contact ? `<p>Contact: ${escapeHtml(maintenance.contact)}</p>` : ""}
    </div>
  </main>
</body>
</html>`;
  return new Response(html, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Retry-After": String(retry),
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
