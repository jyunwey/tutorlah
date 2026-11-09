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
      tieBreak: typeof tutor.rating === "number" ? tutor.rating : -1,
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
      tieBreak: assignment.createdAt?.toMillis?.() ?? 0,
    })),
  );
}

function topScored(scored) {
  return scored
    .filter(({ compatibility }) => compatibility > 0)
    .sort(
      (a, b) => b.compatibility - a.compatibility || b.tieBreak - a.tieBreak,
    )
    .slice(0, RECOMMENDATION_COUNT)
    .map(({ item, compatibility }) => ({ item, compatibility }));
}
