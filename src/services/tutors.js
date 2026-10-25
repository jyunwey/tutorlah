import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebase.js";

// Loads public tutor info for Find Tutors (FR-008).
// Fields are listed under tutorProfiles in docs/data-model.md.
export async function fetchTutors() {
  const snapshot = await getDocs(
    collection(db, "tutorProfiles")
  );

  return snapshot.docs.map((tutorDoc) => ({
    id: tutorDoc.id,
    ...tutorDoc.data(),
  }));
}

// Loads one tutor for the Tutor Profile page (FR-013).
// Returns null if there is no tutor with this ID.
export async function fetchTutor(tutorId) {
  const snapshot = await getDoc(
    doc(db, "tutorProfiles", tutorId)
  );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}
