import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { auth, db } from "../firebase.js";

// Same limit as the message box and firestore.rules.
const MAX_MESSAGE_LENGTH = 1000;

// FR-024: the messages in one match, oldest first, kept up to date as
// either person sends one. Returns a function that stops listening.
export function listenToMessages(matchId, onChange, onError) {
  const messagesQuery = query(
    collection(db, "matches", matchId, "messages"),
    orderBy("sentAt")
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      onChange(
        snapshot.docs.map((messageDoc) => ({
          id: messageDoc.id,
          ...messageDoc.data({ serverTimestamps: "estimate" }),
        }))
      );
    },
    onError
  );
}

// FR-024: saves the message and updates the match's lastMessage together,
// so All Matches shows the new preview and moves the chat to the top.
// The message appears on screen straight away, before the save finishes.
export async function sendChatMessage(matchId, text) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in first.");
  }

  const messageText = text.trim();

  if (!messageText || messageText.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Messages must be 1 to ${MAX_MESSAGE_LENGTH} characters.`);
  }

  const matchRef = doc(db, "matches", matchId);
  const messageRef = doc(collection(matchRef, "messages"));
  const batch = writeBatch(db);

  batch.set(messageRef, {
    senderId: user.uid,
    text: messageText,
    sentAt: serverTimestamp(),
  });

  batch.update(matchRef, {
    lastMessage: {
      text: messageText,
      senderId: user.uid,
      sentAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}
