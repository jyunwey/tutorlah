// Display helpers for the My Matches page (FR-021 to FR-024).

// Firestore returns Timestamps; the sample data uses plain Dates.
export function toDate(value) {
  if (!value) {
    return null;
  }

  return typeof value.toDate === "function" ? value.toDate() : new Date(value);
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
  return `${person.firstName} ${person.lastName}`;
}

export function getRoleLabel(role) {
  return role === "tutor" ? "Tutor" : "Student / Parent";
}

// e.g. "2:24 PM".
export function formatTime(value) {
  return toDate(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// e.g. "3 Nov".
export function formatDate(value) {
  return toDate(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

// Match list times: "2:24 PM" today, "Yesterday", otherwise "3 Nov".
export function formatListTime(value) {
  const date = toDate(value);
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
