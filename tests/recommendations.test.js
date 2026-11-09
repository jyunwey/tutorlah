import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  recommendAssignments,
  recommendTutors,
} from "../src/utils/recommendations.js";

const student = {
  subjects: ["Mathematics"],
  level: "Secondary",
  location: "East",
  budgetMax: 50,
  availability: ["Weekend"],
  teachingStyles: ["Patient"],
  lessonModes: ["Online"],
};

function tutor(id, overrides = {}) {
  return {
    id,
    subjects: ["Mathematics"],
    levels: ["Secondary"],
    location: "East",
    hourlyRate: 40,
    availability: ["Weekend"],
    teachingStyles: ["Patient"],
    lessonModes: ["Online"],
    ...overrides,
  };
}

describe("recommendTutors", () => {
  test("returns the top three from more than three candidates", () => {
    const results = recommendTutors([
      tutor("low", {
        subjects: ["English"],
        levels: ["Primary"],
        availability: ["Weekday Morning"],
      }),
      tutor("first"),
      tutor("second", { subjects: ["English"] }),
      tutor("third", {
        subjects: ["English"],
        availability: ["Weekday Morning"],
      }),
    ], student);

    assert.equal(results.length, 3);
    assert.deepEqual(results.map(({ item }) => item.id), ["first", "second", "third"]);
  });

  test("returns exactly three candidates", () => {
    assert.equal(
      recommendTutors([tutor("a"), tutor("b"), tutor("c")], student).length,
      3,
    );
  });

  test("returns every candidate when fewer than three exist", () => {
    assert.equal(recommendTutors([tutor("a"), tutor("b")], student).length, 2);
  });

  test("keeps candidates whose compatibility is zero", () => {
    const zeroScoreTutors = ["a", "b", "c"].map((id) => tutor(id, {
      subjects: ["English"],
      levels: ["Primary"],
      location: "West",
      hourlyRate: 100,
      availability: ["Weekday Morning"],
      teachingStyles: ["Exam-focused"],
      lessonModes: ["In-person"],
    }));

    const results = recommendTutors(zeroScoreTutors, student);
    assert.equal(results.length, 3);
    assert.ok(results.every(({ compatibility }) => compatibility === 0));
  });

  test("returns no recommendations when there are no candidates", () => {
    assert.deepEqual(recommendTutors([], student), []);
  });

  test("orders by descending score and preserves input order for ties", () => {
    const results = recommendTutors([
      tutor("tie-a", { subjects: ["English"] }),
      tutor("best"),
      tutor("tie-b", { subjects: ["English"] }),
    ], student);

    assert.deepEqual(results.map(({ item }) => item.id), ["best", "tie-a", "tie-b"]);
    assert.ok(results[0].compatibility > results[1].compatibility);
  });
});

describe("recommendAssignments", () => {
  test("returns zero-score assignments instead of an empty state", () => {
    const profile = tutor("tutor");
    const assignments = ["a", "b", "c"].map((id) => ({
      id,
      subject: "Chinese",
      level: "Primary",
      learningMode: "In-person",
      location: "West",
      maximumRate: 20,
      preferredDay: "Monday",
      preferredTimeSlot: "08:00-10:00",
      teachingStyle: "Exam-focused",
    }));

    assert.equal(recommendAssignments(assignments, profile).length, 3);
  });
});
