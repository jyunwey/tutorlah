// Options for the Find Tutors filters (FR-010).
// Availability and teaching styles follow the midterm prototype.

export const SUBJECTS = [
  "English",
  "Mathematics",
  "Science",
  "Chinese",
  "Physics",
  "Chemistry",
  "Biology",
];

export const LEVELS = [
  "Primary",
  "Secondary",
  "Junior College",
];

export const LOCATIONS = [
  "North",
  "South",
  "East",
  "West",
  "Central",
];

export const AVAILABILITY = [
  "Weekday Morning",
  "Weekday Afternoon",
  "Weekday Evening",
  "Weekend",
];

export const TEACHING_STYLES = [
  "Patient",
  "Concept-focused",
  "Exam-focused",
  "Visual / Interactive",
];

// Budget slider range in SGD per hour.
// The slider at BUDGET_MAX means "any budget".
export const BUDGET_MIN = 20;
export const BUDGET_MAX = 100;

// An empty value means "no filter applied".
export function createEmptyFilters() {
  return {
    subject: "",
    level: "",
    location: "",
    maxBudget: null,
    availability: [],
    teachingStyles: [],
  };
}
