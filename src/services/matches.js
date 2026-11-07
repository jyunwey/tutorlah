import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../firebase.js";

// FR-009 and FR-016: requests the signed-in user sent, so Apply buttons
// can show "Applied".
export async function fetchSentRequests() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in first.");
  }

  const requestsQuery = query(
    collection(db, "matches"),
    where("senderId", "==", user.uid)
  );

  const snapshot = await getDocs(requestsQuery);

  return snapshot.docs.map((matchDoc) => ({
    id: matchDoc.id,
    ...matchDoc.data(),
  }));
}

// Every request or match between the signed-in student and one tutor,
// whoever sent it. Tutor Profile uses it so a student doesn't send a
// second request to a tutor who already applied to them or matched
// with them (FR-022).
export async function fetchMatchesWithTutor(tutorId) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in first.");
  }

  const matchesQuery = query(
    collection(db, "matches"),
    where("studentId", "==", user.uid),
    where("tutorId", "==", tutorId)
  );

  const snapshot = await getDocs(matchesQuery);

  return snapshot.docs.map((matchDoc) => ({
    id: matchDoc.id,
    ...matchDoc.data(),
  }));
}

export async function requestTutor(tutor, studentAccount) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in before applying.");
  }

  if (studentAccount?.role !== "student") {
    throw new Error("Only students or parents can request tutors.");
  }

  if (!studentAccount.onboardingComplete) {
    throw new Error("Please complete your profile before applying.");
  }

  if (!tutor?.id || tutor.id === user.uid) {
    throw new Error("Invalid tutor selection.");
  }

  const matchId = `${user.uid}_${tutor.id}`;
  const matchRef = doc(db, "matches", matchId);

  await setDoc(matchRef, {
    status: "pending",
    senderId: user.uid,
    recipientId: tutor.id,
    studentId: user.uid,
    tutorId: tutor.id,
    studentFirstName: studentAccount.firstName,
    studentLastName: studentAccount.lastName,
    tutorFirstName: tutor.firstName,
    tutorLastName: tutor.lastName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return matchId;
}

// FR-021: Tutor applies for an assignment
export async function requestAssignment(assignment, tutorAccount) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in before applying.");
  }

  if (tutorAccount?.role !== "tutor") {
    throw new Error("Only tutors can apply for assignments.");
  }

  if (!tutorAccount.onboardingComplete) {
    throw new Error("Please complete your profile before applying.");
  }

  if (!assignment?.id || !assignment?.studentId) {
    throw new Error("Invalid assignment.");
  }

  if (assignment.studentId === user.uid) {
    throw new Error("You cannot apply to your own assignment.");
  }

  const matchId = `${assignment.id}_${user.uid}`;
  const matchRef = doc(db, "matches", matchId);

  await setDoc(matchRef, {
    status: "pending",
    senderId: user.uid,
    recipientId: assignment.studentId,
    studentId: assignment.studentId,
    tutorId: user.uid,
    assignmentId: assignment.id,
    tutorFirstName: tutorAccount.firstName,
    tutorLastName: tutorAccount.lastName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return matchId;
}

// FR-022: requests sent to me that I haven't answered yet, kept up to
// date as they arrive or change. Returns a function that stops listening.
// Sorted on the page instead of here, so Firestore needs no extra index.
export function listenToIncomingRequests(userId, onChange, onError) {
  const requestsQuery = query(
    collection(db, "matches"),
    where("recipientId", "==", userId),
    where("status", "==", "pending")
  );

  return onSnapshot(
    requestsQuery,
    (snapshot) => {
      onChange(
        snapshot.docs.map((matchDoc) => ({
          id: matchDoc.id,
          ...matchDoc.data({ serverTimestamps: "estimate" }),
        }))
      );
    },
    onError
  );
}

// FR-022: Accept turns the request into a match, so it moves to All Matches.
// A student accepting a tutor's application (FR-016) also adds their own
// name, because the tutor couldn't see it when applying (docs/data-model.md).
export async function acceptMatchRequest(matchId, account) {
  const changes = {
    status: "accepted",
    updatedAt: serverTimestamp(),
  };

  if (account.role === "student") {
    changes.studentFirstName = account.firstName;
    changes.studentLastName = account.lastName;
  }

  await updateDoc(doc(db, "matches", matchId), changes);
}

// FR-022: Reject keeps the document with status "rejected" instead of
// deleting it, so the sender's button stays "Applied" and the same
// request can't be sent again.
export async function rejectMatchRequest(matchId) {
  await updateDoc(doc(db, "matches", matchId), {
    status: "rejected",
    updatedAt: serverTimestamp(),
  });
}
