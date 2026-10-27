import { BUDGET_MAX } from "../constants/tutorFilters.js";

// Shared compatibility score (Sprint 1 setup task).
// Used by Find Tutors and the Tutor Profile page (FR-011), and meant to be
// reused by Find Assignments (FR-014) and Home recommendations (FR-007).
//
// Formula: the percentage of the student's criteria that the tutor meets.
// Every criterion counts equally, and criteria the student hasn't set are
// skipped. For example, 3 of 4 criteria met = 75%.
//
// criteria (every field optional):
//   { subjects: [], level: "", location: "", maxBudget: null,
//     availability: [], teachingStyles: [], lessonModes: [] }
//
// Returns a whole number from 0 to 100, or null when there is nothing to
// compare (the ring then shows "--%").
export function getCompatibility(tutor, criteria) {
  const checks = [];

  if (criteria.subjects?.length > 0) {
    checks.push(sharesAny(tutor.subjects, criteria.subjects));
  }

  if (criteria.level) {
    checks.push(sharesAny(tutor.levels, [criteria.level]));
  }

  if (criteria.location) {
    // Location doesn't matter if both sides are happy with online lessons.
    const bothOnline =
      sharesAny(tutor.lessonModes, ["Online"]) &&
      sharesAny(criteria.lessonModes, ["Online"]);

    checks.push(tutor.location === criteria.location || bothOnline);
  }

  if (typeof criteria.maxBudget === "number") {
    checks.push(tutor.hourlyRate <= criteria.maxBudget);
  }

  if (criteria.availability?.length > 0) {
    checks.push(sharesAny(tutor.availability, criteria.availability));
  }

  if (criteria.teachingStyles?.length > 0) {
    checks.push(sharesAny(tutor.teachingStyles, criteria.teachingStyles));
  }

  if (criteria.lessonModes?.length > 0) {
    checks.push(sharesAny(tutor.lessonModes, criteria.lessonModes));
  }

  if (checks.length === 0) {
    return null;
  }

  const met = checks.filter(Boolean).length;

  return Math.round((met / checks.length) * 100);
}

// Builds the criteria for Find Tutors and the Tutor Profile page.
// Filters the student has set take priority (so the score updates when the
// filters change, FR-011). Anything not filtered falls back to the
// preferences the student saved in Create Profile (FR-026).
// Tutors and logged-out users have no preferences, so pass {}.
export function buildCriteria(filters, preferences = {}) {
  const savedBudget =
    typeof preferences.budgetMax === "number" &&
    preferences.budgetMax < BUDGET_MAX
      ? preferences.budgetMax
      : null;

  return {
    subjects: filters.subject
      ? [filters.subject]
      : preferences.subjects ?? [],
    level: filters.level || preferences.level || "",
    location: filters.location || preferences.location || "",
    maxBudget: filters.maxBudget ?? savedBudget,
    availability:
      filters.availability.length > 0
        ? filters.availability
        : preferences.availability ?? [],
    teachingStyles:
      filters.teachingStyles.length > 0
        ? filters.teachingStyles
        : preferences.teachingStyles ?? [],
    lessonModes: preferences.lessonModes ?? [],
  };
}

// True if the two lists have at least one value in common.
function sharesAny(list, wanted) {
  return (wanted ?? []).some((value) => (list ?? []).includes(value));
}
