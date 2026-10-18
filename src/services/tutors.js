import {
  collection,
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
