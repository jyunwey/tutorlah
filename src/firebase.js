import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";            // add
import { getFirestore } from "firebase/firestore";  // add

const firebaseConfig = {
  apiKey: "AIzaSyDa-8rSUY4ZTq6vpYI_Q8nvB9oajnluM6k",
  authDomain: "tutorlah-24204.firebaseapp.com",
  projectId: "tutorlah-24204",
  storageBucket: "tutorlah-24204.firebasestorage.app",
  messagingSenderId: "63722348391",
  appId: "1:63722348391:web:a76bd97f72dee8e86219c2",
  measurementId: "G-D0G953SCBC"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);                    // Firebase Authentication (login, sign-up, password reset)
export const db = getFirestore(app);                 // Firestore database (users, assignments, matches)