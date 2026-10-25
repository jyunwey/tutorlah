import {
  SUBJECTS,
  LEVELS,
  LOCATIONS,
  AVAILABILITY,
  TEACHING_STYLES,
  BUDGET_MIN,
  BUDGET_MAX,
  createEmptyFilters,
} from "../constants/tutorFilters.js";

// FR-013: Find Tutors keeps its filters in the URL, e.g.
// /find-tutors?subject=Mathematics&availability=Weekend&availability=Weekday%20Evening
// so "Back to Results" on the Tutor Profile page can bring them back.

// Filters -> URL query. Empty filters are left out to keep the URL short.
export function filtersToQuery(filters) {
  const query = {};

  if (filters.subject) {
    query.subject = filters.subject;
  }

  if (filters.level) {
    query.level = filters.level;
  }

  if (filters.location) {
    query.location = filters.location;
  }

  if (filters.maxBudget !== null) {
    query.maxBudget = String(filters.maxBudget);
  }

  if (filters.availability.length > 0) {
    query.availability = filters.availability;
  }

  if (filters.teachingStyles.length > 0) {
    query.teachingStyles = filters.teachingStyles;
  }

  return query;
}

// URL query -> filters. Values that aren't real options
// (e.g. from a mistyped URL) are ignored.
export function filtersFromQuery(query) {
  const filters = createEmptyFilters();

  if (SUBJECTS.includes(query.subject)) {
    filters.subject = query.subject;
  }

  if (LEVELS.some((level) => level.value === query.level)) {
    filters.level = query.level;
  }

  if (LOCATIONS.includes(query.location)) {
    filters.location = query.location;
  }

  const budget = Number(query.maxBudget);

  if (query.maxBudget && budget >= BUDGET_MIN && budget < BUDGET_MAX) {
    filters.maxBudget = budget;
  }

  filters.availability = toArray(query.availability).filter((slot) =>
    AVAILABILITY.includes(slot)
  );

  filters.teachingStyles = toArray(query.teachingStyles).filter((style) =>
    TEACHING_STYLES.includes(style)
  );

  return filters;
}

// Vue Router gives a string for one value and an array for several.
function toArray(value) {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}
