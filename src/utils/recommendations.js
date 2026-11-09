import { createEmptyFilters } from "../constants/tutorFilters.js";
import {
  buildCriteria,
  getAssignmentCompatibility,
  getCompatibility,
} from "./compatibility.js";

export const RECOMMENDATION_COUNT = 3;

export function recommendTutors(tutors, student) {
  const criteria = buildCriteria(createEmptyFilters(), student ?? {});

  return topScored(
    tutors.map((tutor) => ({
      item: tutor,
      compatibility: getCompatibility(tutor, criteria),
    })),
  );
}

export function recommendAssignments(assignments, tutorProfile) {
  if (!tutorProfile) {
    return [];
  }

  return topScored(
    assignments.map((assignment) => ({
      item: assignment,
      compatibility: getAssignmentCompatibility(tutorProfile, assignment),
    })),
  );
}

function topScored(scored) {
  return scored
    .map((entry, index) => ({ ...entry, index }))
    .sort((a, b) => scoreOf(b) - scoreOf(a) || a.index - b.index)
    .slice(0, RECOMMENDATION_COUNT)
    .map(({ item, compatibility }) => ({ item, compatibility }));
}

function scoreOf(entry) {
  return Number.isFinite(entry.compatibility) ? entry.compatibility : 0;
}
