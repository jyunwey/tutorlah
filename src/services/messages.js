import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { auth, db } from "../firebase.js";

// Same limit as the message box and firestore.rules.
const MAX_MESSAGE_LENGTH = 1000;

// FR-024: the messages in one match, oldest first, kept up to date as
// either person sends one. Returns a function that stops listening.
// `isPending` is true until Firestore has saved the message, so the chat
// can show a clock instead of a tick.
export function listenToMessages(matchId, onChange, onError) {
  const messagesQuery = query(
    collection(db, "matches", matchId, "messages"),
    orderBy("sentAt")
  );

  return onSnapshot(
    messagesQuery,
    { includeMetadataChanges: true },
    (snapshot) => {
      onChange(
        snapshot.docs.map((messageDoc) => ({
          id: messageDoc.id,
          ...messageDoc.data({ serverTimestamps: "estimate" }),
          isPending: messageDoc.metadata.hasPendingWrites,
        }))
      );
    },
    onError
  );
}

// FR-024: records that the signed-in user has read the chat up to now.
// The other person's messages sent before this time show a double tick.
export async function markChatRead(matchId) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in first.");
  }

  await updateDoc(doc(db, "matches", matchId), {
    [`readAt.${user.uid}`]: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
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
      messageId: messageRef.id,
      text: messageText,
      senderId: user.uid,
      sentAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}
