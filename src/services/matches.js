import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
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