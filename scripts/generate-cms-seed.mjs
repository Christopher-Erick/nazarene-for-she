import { writeFileSync } from "node:fs";

const MODULES = [
  "pages",
  "programs",
  "stories",
  "events",
  "atelier",
  "media",
  "impact",
  "organization",
  "donations",
  "users",
  "settings",
  "audit",
  "roles",
  "maintenance",
  "privacy",
  "documents",
];
const ACTIONS = ["view", "create", "edit", "delete", "approve", "publish"];
const ALL = MODULES.flatMap((cmsModule) => ACTIONS.map((action) => `${cmsModule}.${action}`));

const ROLES = [
  ["super_admin", "Super Admin", "Controls the authorization system and the full CMS."],
  ["admin", "Admin", "Operates the website and CMS. Cannot manage roles or permissions."],
  ["chair", "Chair", "Leadership oversight, including authorized approval and publishing."],
  ["vice_chair", "Vice Chair", "Supports chair oversight for authorized content."],
  ["secretary", "Secretary", "Creates and edits organisational content. Does not publish by default."],
  ["vice_secretary", "Vice Secretary", "Supports the secretary with content creation and editing."],
  ["treasurer", "Treasurer", "Manages public donation and payment information."],
  ["member", "Member", "Limited organisational access and personal account management."],
];

function except(denied) {
  return ALL.filter((key) => !denied.some((prefix) => key === prefix || key.startsWith(prefix)));
}

const MATRIX = {
  super_admin: ALL,
  admin: except(["roles.", "maintenance.", "documents."]),
  chair: [
    "pages.view",
    "pages.approve",
    "pages.publish",
    "programs.view",
    "programs.approve",
    "programs.publish",
    "stories.view",
    "stories.approve",
    "stories.publish",
    "events.view",
    "events.approve",
    "events.publish",
    "atelier.view",
    "atelier.approve",
    "atelier.publish",
    "media.view",
    "impact.view",
    "organization.view",
    "donations.view",
    "users.view",
    "settings.view",
    "audit.view",
    "privacy.view",
  ],
  vice_chair: [
    "pages.view",
    "pages.approve",
    "pages.publish",
    "programs.view",
    "programs.approve",
    "programs.publish",
    "stories.view",
    "stories.approve",
    "stories.publish",
    "events.view",
    "events.approve",
    "events.publish",
    "atelier.view",
    "atelier.approve",
    "atelier.publish",
    "media.view",
    "impact.view",
    "organization.view",
    "donations.view",
    "settings.view",
    "privacy.view",
  ],
  secretary: [
    "pages.view",
    "pages.create",
    "pages.edit",
    "programs.view",
    "programs.create",
    "programs.edit",
    "stories.view",
    "stories.create",
    "stories.edit",
    "events.view",
    "events.create",
    "events.edit",
    "atelier.view",
    "atelier.create",
    "atelier.edit",
    "media.view",
    "media.create",
    "media.edit",
    "impact.view",
    "impact.edit",
    "organization.view",
    "organization.edit",
    "donations.view",
    "privacy.view",
    "privacy.edit",
  ],
  vice_secretary: [
    "pages.view",
    "pages.create",
    "pages.edit",
    "programs.view",
    "programs.create",
    "programs.edit",
    "stories.view",
    "stories.create",
    "stories.edit",
    "events.view",
    "events.create",
    "events.edit",
    "atelier.view",
    "atelier.create",
    "atelier.edit",
    "media.view",
    "media.create",
    "media.edit",
    "impact.view",
    "organization.view",
    "donations.view",
    "privacy.view",
  ],
  treasurer: [
    "pages.view",
    "programs.view",
    "stories.view",
    "events.view",
    "atelier.view",
    "media.view",
    "impact.view",
    "organization.view",
    "donations.view",
    "donations.create",
    "donations.edit",
    "donations.approve",
    "donations.publish",
    "privacy.view",
  ],
  member: [],
};

const now = 1700000000000;
const lines = ["-- Seed roles, permissions, default matrix, and site settings. No user passwords.", ""];

lines.push("INSERT OR IGNORE INTO roles (id, slug, name, description, status, created_at, updated_at) VALUES");
lines.push(
  ROLES.map(
    ([slug, name, description]) =>
      `  ('${slug}', '${slug}', '${name}', '${description.replace(/'/g, "''")}', 'active', ${now}, ${now})`,
  ).join(",\n") + ";",
);

const permRows = [];
for (const cmsModule of MODULES) {
  for (const action of ACTIONS) {
    permRows.push(`  ('${cmsModule}.${action}', '${cmsModule}', '${action}', '${action} ${cmsModule}')`);
  }
}
lines.push("", "INSERT OR IGNORE INTO permissions (id, module, action, description) VALUES");
lines.push(permRows.join(",\n") + ";");

const rp = [];
for (const [slug, keys] of Object.entries(MATRIX)) {
  for (const key of keys) rp.push(`  ('${slug}', '${key}')`);
}
lines.push("", "INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES");
lines.push(rp.join(",\n") + ";");

const settings = {
  organization: {
    name: "Nazarene for She",
    description:
      "Nazarene for She (NS) is a community-based organisation in Congo, Kawangware, Nairobi County. It empowers young girls through sanitary pads, vocational skills, and economic opportunity.",
    mission: "Empowering young girls through provision of sanitary pads and economic empowerment of school dropouts.",
    vision: "To create a self-sustaining generation of young women.",
    values: ["Dignity", "Knowledge", "Faith", "Community", "Skill", "Integrity"],
    email: "nazareneforshe@gmail.com",
    phone: "",
    location: "Congo, Kawangware, Nairobi County, Kenya.",
    postalAddress: "P.O. Box 20025-00200 Nairobi, Kenya",
    social: { instagram: "", facebook: "", linkedin: "", youtube: "", tiktok: "" },
  },
  donations: {
    intro:
      "Your contribution can help provide practical support today while helping build sustainable opportunities for tomorrow.",
    methods: [],
    note: "Official payment details are published only when the organisation confirms them.",
  },
  seo_defaults: {
    title: "Nazarene for She — She Empowered, Community Inspired.",
    description:
      "Nazarene for She helps girls and young women in Kawangware, Nairobi, overcome period poverty, stay in school, gain practical skills, and move toward self-sustaining futures.",
  },
  privacy_policy: {
    title: "Privacy",
    body: "<p>This policy covers the public website. Contact, donation-inquiry and atelier request forms may collect your name, email, optional phone number, organisation, garment preferences, and a message. We use that information to respond to your inquiry.</p><p>We do not sell personal data. We do not publish beneficiary identities without consent.</p>",
  },
  maintenance: {
    enabled: false,
    status: "completed",
    title: "We will be back shortly",
    message: "The website is temporarily unavailable while we carry out scheduled work.",
    estimatedReturnAt: null,
    contact: "nazareneforshe@gmail.com",
    startAt: null,
    endAt: null,
  },
  privacy_settings: {
    auditRetentionDays: 365,
    cookieConsentRequired: false,
  },
};

for (const [key, value] of Object.entries(settings)) {
  const json = JSON.stringify(value).replace(/'/g, "''");
  lines.push(
    "",
    `INSERT OR IGNORE INTO site_settings (key, value, updated_by, updated_at) VALUES ('${key}', '${json}', NULL, ${now});`,
  );
}

lines.push(
  "",
  `INSERT OR IGNORE INTO impact_statistics (id, label, value, status, note, sort_order, published, updated_at) VALUES
  ('girls-supported', 'Girls currently supported', '600+', 'verified', 'Verified organisational figure.', 1, 1, ${now}),
  ('girls-reached', 'Girls reached', '—', 'awaiting-verification', '', 2, 1, ${now}),
  ('dignity-kits', 'Dignity kits distributed', '—', 'awaiting-verification', '', 3, 1, ${now}),
  ('mentorship-sessions', 'Mentorship sessions', '—', 'awaiting-verification', '', 4, 1, ${now}),
  ('health-sessions', 'Menstrual health sessions', '—', 'awaiting-verification', '', 5, 1, ${now}),
  ('vocational-trainees', 'Vocational trainees', '—', 'awaiting-verification', '', 6, 1, ${now}),
  ('entrepreneurship', 'Entrepreneurship beneficiaries', '—', 'awaiting-verification', '', 7, 1, ${now}),
  ('partners', 'Community partners', '—', 'awaiting-verification', '', 8, 1, ${now});`,
);

writeFileSync(new URL("../migrations/0002_seed.sql", import.meta.url), `${lines.join("\n")}\n`);
console.log("Wrote migrations/0002_seed.sql");
