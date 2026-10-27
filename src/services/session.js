import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase.js";

export async function getCurrentRole() {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return null;
  const snapshot = await getDoc(doc(db, "users", user.uid));
  return snapshot.exists() ? snapshot.data().role || null : null;
}
