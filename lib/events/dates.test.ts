import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatEventSchedule,
  getEventEndMs,
  isUpcomingEvent,
} from "./dates.ts";

describe("event dates", () => {
  it("treats an event as upcoming until the end of its Nairobi day", () => {
    const event = { startsAt: "2026-10-18T10:00:00+03:00" };
    const duringDay = new Date("2026-10-18T20:00:00+03:00");
    const afterDay = new Date("2026-10-19T00:05:00+03:00");

    assert.equal(isUpcomingEvent(event, duringDay), true);
    assert.equal(isUpcomingEvent(event, afterDay), false);
  });

  it("respects an explicit end time", () => {
    const event = {
      startsAt: "2026-10-18T10:00:00+03:00",
      endsAt: "2026-10-18T14:00:00+03:00",
    };

    assert.equal(isUpcomingEvent(event, new Date("2026-10-18T13:59:00+03:00")), true);
    assert.equal(isUpcomingEvent(event, new Date("2026-10-18T14:01:00+03:00")), false);
    assert.equal(getEventEndMs(event), new Date("2026-10-18T14:00:00+03:00").getTime());
  });

  it("formats same-day schedules on one line", () => {
    const formatted = formatEventSchedule({
      startsAt: "2026-10-18T10:00:00+03:00",
      endsAt: "2026-10-18T14:00:00+03:00",
    });

    assert.match(formatted, /18/);
    assert.match(formatted, /–/);
  });
});
