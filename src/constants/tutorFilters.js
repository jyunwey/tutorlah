// Options for the Find Tutors filters (FR-010).
// TODO: align these lists with the midterm proposal / prototype.

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
  "Weekday mornings",
  "Weekday afternoons",
  "Weekday evenings",
  "Weekends",
];

export const TEACHING_STYLES = [
  "Patient",
  "Exam-focused",
  "Interactive",
  "Structured",
];

// An empty value means "no filter applied".
export function createEmptyFilters() {
  return {
    subject: "",
    level: "",
    location: "",
    maxBudget: null,
    availability: "",
    teachingStyle: "",
  };
}
