// TEMPORARY sample data so the My Matches skeleton can be seen before
// requests and matches are saved in Firestore (FR-009, FR-016).
// Delete this file once MyMatchesView loads real data.
//
// Each sample uses the same fields as a `matches` document in
// docs/data-model.md, with its messages in a separate list.

const PEOPLE = {
  chloe: { id: "sample-chloe", firstName: "Chloe", lastName: "Lim" },
  daniel: { id: "sample-daniel", firstName: "Daniel", lastName: "Tan" },
  rachel: { id: "sample-rachel", firstName: "Rachel", lastName: "Wong" },
  marcus: { id: "sample-marcus", firstName: "Marcus", lastName: "Lee" },
  aisyah: { id: "sample-aisyah", firstName: "Aisyah", lastName: "Rahman" },
  sarah: { id: "sample-sarah", firstName: "Sarah", lastName: "Ng" },
  ethan: { id: "sample-ethan", firstName: "Ethan", lastName: "Koh" },
  priya: { id: "sample-priya", firstName: "Priya", lastName: "Nair" },
};

// Each line says whether the student or the tutor wrote it, so the same
// chat reads correctly whichever role is signed in.
const CHATS = {
  chloe: [
    ["student", 14, "Hi! I'm a Secondary 3 student looking for help with A-Math. Are you available on Wednesdays, 7–9pm?"],
    ["tutor", 12, "Hi! Yes, I'm available at that timing. What topics would you like to focus on?"],
    ["student", 9, "I'm struggling with quadratic functions and indices. Could we focus on those?"],
    ["tutor", 7, "Sure, that works for me. We can start with a trial lesson this Wednesday. I'll send you the details."],
    ["student", 2, "Great! See you this Wednesday. Thank you!"],
  ],
  daniel: [
    ["tutor", 185, "Here are the practice papers for next week."],
    ["student", 180, "Thanks for the materials!"],
  ],
  rachel: [
    ["student", 60 * 24 + 30, "Can we move Saturday's lesson to 10am?"],
    ["tutor", 60 * 24 + 20, "Ok noted, thanks!"],
  ],
  marcus: [["tutor", 60 * 24 * 3, "No problem, see you next week!"]],
  aisyah: [["tutor", 60 * 24 * 5, "Sure, I can help with that."]],
};

// Requests waiting for my answer, and how many days ago they were sent.
const PENDING = [
  ["sarah", 1],
  ["ethan", 3],
  ["priya", 8],
];

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

// A `matches` document between me and one sample person.
// In the samples, the other person always sent the request.
function createMatchDoc(account, myId, person, status, createdAt) {
  const iAmTutor = account.role === "tutor";
  const me = { id: myId, firstName: account.firstName, lastName: account.lastName };
  const student = iAmTutor ? person : me;
  const tutor = iAmTutor ? me : person;

  return {
    id: `match-${person.id}`,
    status,
    senderId: person.id,
    recipientId: myId,
    studentId: student.id,
    tutorId: tutor.id,
    studentFirstName: student.firstName,
    studentLastName: student.lastName,
    tutorFirstName: tutor.firstName,
    tutorLastName: tutor.lastName,
    lastMessage: null,
    createdAt,
    updatedAt: createdAt,
  };
}

export function createSampleData(account, myId) {
  const matches = [];
  const messagesByMatch = {};

  for (const [key, lines] of Object.entries(CHATS)) {
    const person = PEOPLE[key];
    const match = createMatchDoc(account, myId, person, "accepted", minutesAgo(60 * 24 * 14));
    const messages = lines.map(([from, minutes, text], index) => ({
      id: `${key}-${index}`,
      senderId: from === account.role ? myId : person.id,
      text,
      sentAt: minutesAgo(minutes),
    }));
    const { text, senderId, sentAt } = messages[messages.length - 1];

    match.lastMessage = { text, senderId, sentAt };
    matches.push(match);
    messagesByMatch[match.id] = messages;
  }

  for (const [key, days] of PENDING) {
    matches.push(
      createMatchDoc(account, myId, PEOPLE[key], "pending", minutesAgo(60 * 24 * days))
    );
  }

  return { matches, messagesByMatch };
}
