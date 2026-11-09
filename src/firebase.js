import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";            // add
import { getFirestore } from "firebase/firestore";  // add
import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
getAnalytics(app);
export const auth = getAuth(app);                    // Firebase Authentication (login, sign-up, password reset)
export const db = getFirestore(app);                 // Firestore database (see docs/data-model.md)
