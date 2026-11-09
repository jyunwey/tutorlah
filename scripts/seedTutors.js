// Seeds sample tutors (Sprint 1 setup task: "Seed tutor data").
//
// Run with: npm run seed:tutors
//
// The Firestore rules only let a tutor write their own profile, so each seeded
// tutor is a real account: the script signs up (or signs in) as the tutor, then
// writes their users/{uid} and tutorProfiles/{uid} documents.
// Re-running is safe: existing accounts are reused and their profiles updated.
//
// Set SEED_TUTOR_PASSWORD in the environment before running this script. Never
// commit the value or print it. These accounts can log in during a local demo.

import process from "node:process";

import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  terminate,
  updateDoc,
} from "firebase/firestore";

import { firebaseConfig } from "../src/firebaseConfig.js";

const SEED_TUTOR_PASSWORD = process.env.SEED_TUTOR_PASSWORD;

if (!SEED_TUTOR_PASSWORD) {
  console.error(
    "SEED_TUTOR_PASSWORD is required. Set it in your environment before seeding tutors.",
  );
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Values must match the filter options in src/constants/tutorFilters.js.
const TUTORS = [
  {
    email: "rachel.lim@tutorlah.test",
    firstName: "Rachel",
    lastName: "Lim",
    subjects: ["Mathematics", "Physics"],
    levels: ["Secondary", "Junior College"],
    location: "East",
    hourlyRate: 45,
    availability: ["Weekday Evening", "Weekend"],
    teachingStyles: ["Exam-focused", "Concept-focused"],
    lessonModes: ["In-person", "Online"],
    qualification: "Ex-MOE Teacher",
    yearsOfExperience: 6,
    rating: 4.8,
    bio: "Former MOE teacher with 6 years of experience preparing students for O and A Levels.",
  },
  {
    email: "daniel.ng@tutorlah.test",
    firstName: "Daniel",
    lastName: "Ng",
    subjects: ["English"],
    levels: ["Primary", "Secondary"],
    location: "Central",
    hourlyRate: 30,
    availability: ["Weekday Afternoon"],
    teachingStyles: ["Patient", "Visual / Interactive"],
    lessonModes: ["Online"],
    qualification: "NUS Undergraduate",
    yearsOfExperience: 2,
    rating: 4.5,
    bio: "NUS English Literature undergraduate who makes comprehension and composition fun.",
  },
  {
    email: "priya.kumar@tutorlah.test",
    firstName: "Priya",
    lastName: "Kumar",
    subjects: ["Chemistry", "Biology"],
    levels: ["Junior College"],
    location: "Central",
    hourlyRate: 60,
    availability: ["Weekend"],
    teachingStyles: ["Concept-focused"],
    lessonModes: ["In-person"],
    qualification: "NTU Graduate",
    yearsOfExperience: 8,
    rating: 4.9,
    bio: "Full-time tutor specialising in H2 Chemistry and Biology.",
  },
  {
    email: "weijie.tan@tutorlah.test",
    firstName: "Wei Jie",
    lastName: "Tan",
    subjects: ["Mathematics", "Science"],
    levels: ["Primary"],
    location: "North",
    hourlyRate: 25,
    availability: ["Weekday Afternoon", "Weekday Evening"],
    teachingStyles: ["Patient", "Visual / Interactive"],
    lessonModes: ["In-person"],
    qualification: "Polytechnic Graduate",
    yearsOfExperience: 3,
    rating: 4.3,
    bio: "Polytechnic graduate who helps primary school students build strong foundations.",
  },
  {
    email: "aisyah.rahman@tutorlah.test",
    firstName: "Nur Aisyah",
    lastName: "Rahman",
    subjects: ["English", "Science"],
    levels: ["Primary", "Secondary"],
    location: "West",
    hourlyRate: 35,
    availability: ["Weekday Morning", "Weekend"],
    teachingStyles: ["Visual / Interactive"],
    lessonModes: ["In-person", "Online"],
    qualification: "NIE-trained Teacher",
    yearsOfExperience: 5,
    rating: 4.6,
    bio: "Uses hands-on activities and real-life examples to explain concepts.",
  },
  {
    email: "marcus.lee@tutorlah.test",
    firstName: "Marcus",
    lastName: "Lee",
    subjects: ["Chinese"],
    levels: ["Primary", "Secondary"],
    location: "South",
    hourlyRate: 40,
    availability: ["Weekday Evening"],
    teachingStyles: ["Exam-focused", "Patient"],
    lessonModes: ["In-person", "Online"],
    qualification: "SMU Graduate",
    yearsOfExperience: 4,
    rating: 4.7,
    bio: "Specialises in PSLE and O Level Chinese oral and composition.",
  },
];

async function signUpOrSignIn(email) {
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      SEED_TUTOR_PASSWORD,
    );
    return credential.user;
  } catch (error) {
    if (error.code !== "auth/email-already-in-use") {
      throw error;
    }

    const credential = await signInWithEmailAndPassword(
      auth,
      email,
      SEED_TUTOR_PASSWORD,
    );
    return credential.user;
  }
}

// Same fields as registerUser() in src/services/auth.js.
async function ensureUserDoc(user, firstName, lastName) {
  const userRef = doc(db, "users", user.uid);

  if ((await getDoc(userRef)).exists()) {
    return;
  }

  await setDoc(userRef, {
    role: "tutor",
    firstName,
    lastName,
    email: user.email,
    onboardingComplete: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(userRef, {
    onboardingComplete: true,
    updatedAt: serverTimestamp(),
  });
}

async function saveTutorProfile(uid, profile) {
  const profileRef = doc(db, "tutorProfiles", uid);

  if ((await getDoc(profileRef)).exists()) {
    // Ratings are fixed illustrative seed data. Re-running the seed may
    // refresh profile details, but must not overwrite an existing rating.
    const profileUpdates = Object.fromEntries(
      Object.entries(profile).filter(([field]) => field !== "rating"),
    );

    await updateDoc(profileRef, {
      ...profileUpdates,
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(profileRef, {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

for (const { email, ...profile } of TUTORS) {
  const user = await signUpOrSignIn(email);

  await ensureUserDoc(user, profile.firstName, profile.lastName);
  await saveTutorProfile(user.uid, profile);
  await signOut(auth);

  console.log(`Seeded ${email} (tutorProfiles/${user.uid})`);
}

await terminate(db);
process.exit(0);
