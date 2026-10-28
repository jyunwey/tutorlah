import {
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase.js";

const STUDENT_FIELDS = [
  "phone",
  "location",
  "level",
  "subjects",
  "lessonModes",
  "availability",
  "teachingStyles",
  "budgetMin",
  "budgetMax",
];

const TUTOR_PROFILE_FIELDS = [
  "location",
  "subjects",
  "levels",
  "hourlyRate",
  "availability",
  "teachingStyles",
  "lessonModes",
  "qualification",
  "yearsOfExperience",
  "bio",
];

const NAME_FIELDS = ["firstName", "lastName"];

function pick(values, fields) {
  return Object.fromEntries(
    fields.filter((field) => field in values).map((field) => [field, values[field]]),
  );
}

export async function createProfile(uid, account, values) {
  const userRef = doc(db, "users", uid);

  if (account.role !== "tutor") {
    await updateDoc(userRef, {
      ...pick(values, STUDENT_FIELDS),
      onboardingComplete: true,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const batch = writeBatch(db);
  batch.set(doc(db, "tutorProfiles", uid), {
    ...pick(values, TUTOR_PROFILE_FIELDS),
    firstName: account.firstName,
    lastName: account.lastName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.update(userRef, {
    phone: values.phone ?? "",
    onboardingComplete: true,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function updateProfile(uid, account, values, hasTutorProfile) {
  const userRef = doc(db, "users", uid);

  const names = pick(values, NAME_FIELDS);

  if (account.role !== "tutor") {
    await updateDoc(userRef, {
      ...names,
      ...pick(values, STUDENT_FIELDS),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const batch = writeBatch(db);
  const tutorRef = doc(db, "tutorProfiles", uid);
  if (hasTutorProfile) {
    batch.update(tutorRef, {
      ...pick(values, TUTOR_PROFILE_FIELDS),
      ...names,
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(tutorRef, {
      ...pick(values, TUTOR_PROFILE_FIELDS),
      firstName: account.firstName,
      lastName: account.lastName,
      ...names,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  batch.update(userRef, {
    ...names,
    phone: values.phone ?? "",
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}
