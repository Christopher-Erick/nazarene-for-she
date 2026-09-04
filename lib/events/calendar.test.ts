import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  daysInNairobiMonth,
  getNairobiMonthGrid,
  groupEventsByDateKey,
  nairobiNoon,
  nairobiWeekdaySun0,
  shiftNairobiMonth,
  toNairobiDateKey,
} from "./calendar.ts";

describe("event calendar", () => {
  it("keys event days in Nairobi, not the browser timezone", () => {
    assert.equal(toNairobiDateKey("2026-10-18T10:00:00+03:00"), "2026-10-18");
    assert.equal(toNairobiDateKey("2026-10-18T00:30:00+03:00"), "2026-10-18");
  });

  it("builds an October 2026 grid that starts on Sunday", () => {
    assert.equal(daysInNairobiMonth(2026, 10), 31);
    assert.equal(nairobiWeekdaySun0(nairobiNoon(2026, 10, 1)), 4);
    assert.equal(nairobiWeekdaySun0(nairobiNoon(2026, 10, 18)), 0);

    const grid = getNairobiMonthGrid(2026, 10);
    assert.equal(grid.length, 42);
    assert.equal(grid[0]?.dateKey, "2026-09-27");
    assert.equal(grid[4]?.dateKey, "2026-10-01");
    assert.equal(grid[4]?.inCurrentMonth, true);
    assert.equal(grid[21]?.dateKey, "2026-10-18");
  });

  it("shifts December into the next year", () => {
    assert.deepEqual(shiftNairobiMonth(2026, 12, 1), { year: 2027, month: 1 });
    assert.deepEqual(shiftNairobiMonth(2026, 1, -1), { year: 2025, month: 12 });
  });

  it("groups events onto their Nairobi date", () => {
    const grouped = groupEventsByDateKey([
      { startsAt: "2026-10-18T10:00:00+03:00", slug: "pads" },
      { startsAt: "2026-11-08T09:30:00+03:00", slug: "mentors" },
    ]);

    assert.equal(grouped.get("2026-10-18")?.[0]?.slug, "pads");
    assert.equal(grouped.get("2026-11-08")?.[0]?.slug, "mentors");
  });
});
