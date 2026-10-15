import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase.js";

export async function registerUser({
  email,
  password,
  firstName,
  lastName,
  role,
}) {
  const cleanEmail =
    email.trim().toLowerCase();

  const cleanFirstName =
    firstName.trim();

  const cleanLastName =
    lastName.trim();

  if (!cleanFirstName) {
    throw new Error(
      "First name is required."
    );
  }

  if (!cleanLastName) {
    throw new Error(
      "Last name is required."
    );
  }

  if (!cleanEmail) {
    throw new Error(
      "Email is required."
    );
  }

  if (password.length < 8) {
    throw new Error(
      "Password must contain at least 8 characters."
    );
  }

  if (!["student", "tutor"].includes(role)) {
    throw new Error(
      "Please select student or tutor."
    );
  }

  const credential =
    await createUserWithEmailAndPassword(
      auth,
      cleanEmail,
      password
    );

  const user = credential.user;

  await setDoc(
    doc(db, "users", user.uid),
    {
      role,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      email: user.email,
      onboardingComplete: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );

  await sendEmailVerification(user);

  return user;
}

export async function loginUser(
  email,
  password
) {
  const credential =
    await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password
    );

  return credential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(
    auth,
    email.trim().toLowerCase()
  );
}

export function observeCurrentUser(callback) {
  return onAuthStateChanged(
    auth,
    callback
  );
}