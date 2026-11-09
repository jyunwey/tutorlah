import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

import {
  formatTutorRating,
  hasRating,
} from "../src/utils/tutorDisplay.js";

describe("tutor rating display", () => {
  test("formats valid illustrative ratings to one decimal place", () => {
    for (const [rating, expected] of [
      [4, "4.0"],
      [4.5, "4.5"],
      [4.8, "4.8"],
      [5, "5.0"],
    ]) {
      assert.equal(hasRating({ rating }), true);
      assert.equal(formatTutorRating({ rating }), expected);
    }
  });

  test("shows New tutor for every missing or invalid rating", () => {
    for (const rating of [
      undefined,
      null,
      0,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      "4.8",
      -1,
      5.1,
    ]) {
      assert.equal(hasRating({ rating }), false);
      assert.equal(formatTutorRating({ rating }), "New tutor");
    }

    assert.equal(hasRating({}), false);
    assert.equal(formatTutorRating({}), "New tutor");
  });

  test("rating displays do not expose review counts or a Reviews tab", () => {
    for (const path of [
      "src/components/TutorCard.vue",
      "src/views/TutorProfileView.vue",
    ]) {
      const source = readFileSync(path, "utf8");
      assert.doesNotMatch(source, /reviewCount|ratingCount|based on \d+ reviews/i);
      assert.doesNotMatch(source, />\s*Reviews\s*</i);
    }
  });

  test("keeps the fixed illustrative ratings in the tutor seed", () => {
    const source = readFileSync("scripts/seedTutors.js", "utf8");
    const ratings = [...source.matchAll(/^\s*rating:\s*([\d.]+),$/gm)].map(
      ([, rating]) => Number(rating),
    );

    assert.deepEqual(ratings, [4.8, 4.5, 4.9, 4.3, 4.6, 4.7]);
  });
});
