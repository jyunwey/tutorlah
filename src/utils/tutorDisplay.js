// Display helpers shared by the tutor cards (FR-008)
// and the Tutor Profile page (FR-013).

// Only seeded demo tutors have a rating (Refined FR-008).
// Tutors who registered themselves have none and show as "New tutor".
export function hasRating(tutor) {
  return typeof tutor.rating === "number";
}

// Initials avatar replaces the profile photo.
export function getInitials(tutor) {
  return tutor.firstName[0] + tutor.lastName[0];
}

// e.g. "Ex-MOE Teacher | 6 years experience".
// Both fields are optional, so show whichever the tutor has filled in.
export function formatCredentials(tutor) {
  const { qualification, yearsOfExperience } = tutor;
  const parts = [];

  if (qualification) {
    parts.push(qualification);
  }

  if (typeof yearsOfExperience === "number") {
    parts.push(
      `${yearsOfExperience} ${yearsOfExperience === 1 ? "year" : "years"} experience`
    );
  }

  return parts.join(" | ");
}
