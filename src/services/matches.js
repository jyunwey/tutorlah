import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../firebase.js";

// Check whether the user has already applied
export async function checkApplication(matchId) {
  const snapshot = await getDoc(
    doc(db, "matches", matchId)
  );

  return snapshot.exists();
}

// FR-009: Student/Parent requests a tutor
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

  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(matchRef);

    if (existing.exists()) {
      const error = new Error("You have already applied to this tutor.");
      error.code = "match/already-exists";
      throw error;
    }

    transaction.set(matchRef, {
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
