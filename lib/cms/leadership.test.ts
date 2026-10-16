import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { initials, isSafePhotoPath, LEADERSHIP_LIMITS, normalizeLeadership } from "./leadership.ts";

describe("leadership team", () => {
  it("keeps named members in order and trims their text", () => {
    const team = normalizeLeadership([
      { id: "a", name: "  Grace  Wanjiru ", title: "Chair", bio: "Leads the committee.\n\n\n\nMentors girls." },
      { id: "b", name: "", title: "Ignored" },
      { id: "c", name: "Erick Otieno", title: "Secretary" },
    ]);
    assert.deepEqual(
      team.map((member) => [member.id, member.name, member.title]),
      [
        ["a", "Grace Wanjiru", "Chair"],
        ["c", "Erick Otieno", "Secretary"],
      ],
    );
    assert.equal(team[0].bio, "Leads the committee.\n\nMentors girls.");
  });

  it("only accepts our own uploads or bundled images as photos", () => {
    assert.equal(isSafePhotoPath("/api/v1/public/media/3f2b8c1e-1d2a-4c5b-9e8f-0a1b2c3d4e5f"), true);
    assert.equal(isSafePhotoPath("/images/library/mentorship.webp"), true);
    assert.equal(isSafePhotoPath("https://evil.example/x.jpg"), false);
    assert.equal(isSafePhotoPath("javascript:alert(1)"), false);
    const [member] = normalizeLeadership([{ name: "A", photo: "https://evil.example/x.jpg" }]);
    assert.equal(member.photo, "");
  });

  it("caps the team size and gives duplicate ids new ones", () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ id: "same", name: `Person ${i}` }));
    const team = normalizeLeadership(many);
    assert.equal(team.length, LEADERSHIP_LIMITS.members);
    assert.equal(new Set(team.map((member) => member.id)).size, team.length);
  });

  it("makes a two-letter monogram", () => {
    assert.equal(initials("Christopher Erick Otieno"), "CO");
    assert.equal(initials("Grace"), "G");
  });

  it("treats anything that is not a list as an empty team", () => {
    assert.deepEqual(normalizeLeadership({}), []);
    assert.deepEqual(normalizeLeadership(null), []);
  });
});
