import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  formatDate,
  formatListTime,
  formatTime,
  toDate,
} from "../src/utils/matchDisplay.js";

describe("match timestamp display", () => {
  test("accepts Firestore-like timestamps and JavaScript Dates", () => {
    const value = new Date("2026-11-08T12:30:00Z");
    assert.equal(toDate(value), value);
    assert.equal(toDate({ toDate: () => value }), value);
    assert.notEqual(formatDate(value), "");
    assert.notEqual(formatTime(value), "");
  });

  test("returns safe fallbacks for pending, missing and invalid values", () => {
    for (const value of [null, undefined, "not-a-date", {}, { toDate: () => null }]) {
      assert.equal(toDate(value), null);
      assert.equal(formatDate(value), "");
      assert.equal(formatTime(value), "");
      assert.equal(formatListTime(value), "");
    }
  });
});
