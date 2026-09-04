import { jsonNoStore } from "@/lib/security";

export const runtime = "nodejs";

const spec = {
  openapi: "3.0.3",
  info: {
    title: "Nazarene for She CMS API",
    version: "1.0.0",
    description: "Public content APIs and authenticated administrative APIs. Permissions are enforced server-side.",
  },
  servers: [{ url: "/api/v1" }],
  paths: {
    "/public/content/{type}": {
      get: {
        summary: "Published public content",
        description: "Returns only published/active content. Drafts are never included. Types: pages, programs, stories, events, atelier, impact, donations, privacy.",
        parameters: [
          { name: "type", in: "path", required: true, schema: { type: "string" } },
          { name: "slug", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Published records" },
          "404": { description: "Unknown type or slug" },
          "503": { description: "Maintenance mode" },
        },
      },
    },
    "/admin/session": {
      get: { summary: "Current session and CSRF cookie", security: [{ cookieAuth: [] }] },
      post: {
        summary: "Sign in",
        requestBody: {
          content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" }, password: { type: "string" } } } } },
        },
        responses: { "200": { description: "Signed in" }, "401": { description: "Invalid credentials" }, "429": { description: "Rate limited" } },
      },
      delete: { summary: "Sign out and invalidate the session" },
    },
    "/admin/bootstrap": {
      post: {
        summary: "Create the first Super Admin when no users exist",
        description: "Requires CMS_BOOTSTRAP_TOKEN. Disabled after the first user exists. No default password is created.",
      },
    },
    "/admin/content/{type}": {
      get: { summary: "List CMS content", security: [{ cookieAuth: [] }], description: "Requires {type}.view" },
      post: { summary: "Create CMS content", security: [{ cookieAuth: [] }], description: "Requires {type}.create" },
    },
    "/admin/content/{type}/{id}": {
      get: { summary: "Get one record", description: "Requires {type}.view. 403 if unauthorized even when authenticated." },
      patch: { summary: "Update", description: "Requires {type}.edit. Mass assignment is limited to content fields." },
      delete: { summary: "Soft delete", description: "Requires {type}.delete" },
    },
    "/admin/content/{type}/{id}/transition": {
      post: { summary: "Change workflow status", description: "Requires the action mapped to that transition: edit, approve, or publish." },
    },
    "/admin/roles": {
      get: { summary: "Permission matrix", description: "Super Admin only. All other roles receive 403." },
      put: { summary: "Save a role's permissions", description: "Super Admin only. roles.* cannot be granted to other roles. Super Admin always retains all permissions." },
    },
    "/admin/users": {
      get: { summary: "List users", description: "Requires users.view. Password hashes are never returned." },
      post: { summary: "Create a user", description: "Requires users.create. Only Super Admin can assign Super Admin." },
      patch: { summary: "Update a user", description: "Requires users.edit. Last Super Admin cannot be disabled or demoted." },
    },
    "/admin/media": {
      get: { summary: "List media metadata" },
      post: { summary: "Upload an image to R2", description: "JPEG/PNG/WebP/GIF/AVIF, max 8MB." },
    },
    "/admin/impact": { get: { summary: "List impact statistics" }, put: { summary: "Replace impact statistics" } },
    "/admin/settings": { get: { summary: "Site settings" }, put: { summary: "Update one settings key" } },
    "/admin/maintenance": { get: { summary: "Maintenance mode", description: "Super Admin only" }, put: { summary: "Set maintenance mode", description: "Super Admin only" } },
    "/admin/audit": { get: { summary: "Audit log", description: "Requires audit.view. Logs cannot be deleted." } },
    "/admin/account": { get: { summary: "Own profile" }, patch: { summary: "Update own name or password" }, post: { summary: "Request export or deletion" } },
    "/admin/dashboard": { get: { summary: "Permission-aware dashboard counts" } },
  },
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "nfs_session" },
    },
  },
};

export async function GET() {
  return jsonNoStore(spec);
}
