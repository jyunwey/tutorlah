import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase.js";

let finishedAccount = null;

export async function getCurrentAccount() {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return null;
  if (finishedAccount?.id === user.uid) return finishedAccount;

  const snapshot = await getDoc(doc(db, "users", user.uid));
  if (!snapshot.exists()) return null;

  const account = { id: snapshot.id, ...snapshot.data() };
  if (account.onboardingComplete) finishedAccount = account;
  return account;
}

export async function getCurrentRole() {
  const account = await getCurrentAccount();
  return account?.role || null;
}
