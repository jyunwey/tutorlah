// Display helpers for the My Matches page (FR-021 to FR-024).

// Firestore returns Timestamps. Local pending writes can temporarily be null,
// and older/malformed documents may contain another value, so callers always
// receive either a valid Date or null.
export function toDate(value) {
  if (value === null || value === undefined) {
    return null;
  }

  try {
    const date = typeof value.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);

    return date instanceof Date && Number.isFinite(date.getTime()) ? date : null;
  } catch {
    return null;
  }
}

// The other person in a match, from the names copied onto the
// `matches` document (see docs/data-model.md).
export function getOtherUser(match, myId) {
  if (match.tutorId === myId) {
    return {
      id: match.studentId,
      firstName: match.studentFirstName ?? "",
      lastName: match.studentLastName ?? "",
      role: "student",
    };
  }

  return {
    id: match.tutorId,
    firstName: match.tutorFirstName,
    lastName: match.tutorLastName,
    role: "tutor",
  };
}

export function getFullName(person) {
  return [person.firstName, person.lastName].filter(Boolean).join(" ");
}

export function getRoleLabel(role) {
  return role === "tutor" ? "Tutor" : "Student / Parent";
}

// e.g. "2:24 PM".
export function formatTime(value) {
  const date = toDate(value);
  if (!date) return "";

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// e.g. "3 Nov".
export function formatDate(value) {
  const date = toDate(value);
  if (!date) return "";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

// Match list times: "2:24 PM" today, "Yesterday", otherwise "3 Nov".
export function formatListTime(value) {
  const date = toDate(value);
  if (!date) return "";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return formatTime(date);
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return formatDate(date);
}

export function getLessonLabel(match) {
  return [match.subject, match.level].filter(Boolean).join(" · ");
}
