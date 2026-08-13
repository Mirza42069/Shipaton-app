import { describe, expect, test } from "bun:test";

import { daysUntil, expiryLabel, formatDate, formatLocalDate } from "@/lib/date";

describe("calendar dates", () => {
  test("serializes the local calendar day without converting through UTC", () => {
    expect(formatLocalDate(new Date(2026, 7, 13, 23, 30))).toBe("2026-08-13");
  });

  test("compares calendar days without daylight-saving duration assumptions", () => {
    expect(daysUntil("2026-03-09", new Date(2026, 2, 8, 0, 0))).toBe(1);
  });

  test("handles malformed persisted dates without throwing during render", () => {
    expect(formatDate("2026-02-31")).toBe("Invalid date");
    expect(expiryLabel("not-a-date")).toEqual({ label: "Invalid expiry date", tone: "neutral" });
  });
});
