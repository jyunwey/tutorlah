import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const STUDENT = "student1";
const TUTOR = "tutor1";
const OUTSIDER = "student2";
const NEW_USER = "student3";
const ASSIGNMENT = "assignment1";
const DIRECT_ID = `${STUDENT}_${TUTOR}`;
const APPLICATION_ID = `${ASSIGNMENT}_${TUTOR}`;

let testEnv;

const db = (uid) => testEnv.authenticatedContext(uid).firestore();

function directRequest(overrides = {}) {
  return {
    status: "pending",
    senderId: STUDENT,
    recipientId: TUTOR,
    studentId: STUDENT,
    tutorId: TUTOR,
    studentFirstName: "Jane",
    studentLastName: "Tan",
    tutorFirstName: "Rachel",
    tutorLastName: "Lim",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

function application(overrides = {}) {
  return {
    status: "pending",
    senderId: TUTOR,
    recipientId: STUDENT,
    studentId: STUDENT,
    tutorId: TUTOR,
    assignmentId: ASSIGNMENT,
    tutorFirstName: "Rachel",
    tutorLastName: "Lim",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

async function seed(extra = async () => {}) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const admin = context.firestore();
    const user = (role, onboardingComplete) => ({
      role,
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      onboardingComplete,
    });
    await setDoc(doc(admin, "users", STUDENT), user("student", true));
    await setDoc(doc(admin, "users", OUTSIDER), user("student", true));
    await setDoc(doc(admin, "users", NEW_USER), user("student", false));
    await setDoc(doc(admin, "users", TUTOR), user("tutor", true));
    await setDoc(doc(admin, "tutorProfiles", TUTOR), {
      firstName: "Rachel",
      lastName: "Lim",
    });
    await setDoc(doc(admin, "assignments", ASSIGNMENT), {
      studentId: STUDENT,
      status: "open",
    });
    await extra(admin);
  });
}

async function seedMatch(id, data) {
  await seed(async (admin) => {
    await setDoc(doc(admin, "matches", id), data);
  });
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-tutorlah",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv.cleanup();
});

describe("creating requests (FR-009, FR-016)", () => {
  test("a student can request a tutor", async () => {
    await seed();
    await assertSucceeds(
      setDoc(doc(db(STUDENT), "matches", DIRECT_ID), directRequest())
    );
  });

  test("a tutor can apply for an open assignment", async () => {
    await seed();
    await assertSucceeds(
      setDoc(doc(db(TUTOR), "matches", APPLICATION_ID), application())
    );
  });

  test("a request must use the fixed document ID", async () => {
    await seed();
    await assertFails(
      setDoc(doc(db(STUDENT), "matches", "anything"), directRequest())
    );
  });

  test("nobody can send a request as someone else", async () => {
    await seed();
    await assertFails(
      setDoc(doc(db(OUTSIDER), "matches", DIRECT_ID), directRequest())
    );
  });

  test("a student cannot apply for an assignment", async () => {
    await seed();
    await assertFails(
      setDoc(
        doc(db(OUTSIDER), "matches", `${ASSIGNMENT}_${OUTSIDER}`),
        application({ senderId: OUTSIDER, tutorId: OUTSIDER })
      )
    );
  });

  test("a tutor cannot send an application to someone who didn't post the assignment", async () => {
    await seed();
    await assertFails(
      setDoc(
        doc(db(TUTOR), "matches", APPLICATION_ID),
        application({ recipientId: OUTSIDER, studentId: OUTSIDER })
      )
    );
  });

  test("a tutor cannot apply for a closed assignment", async () => {
    await seed(async (admin) => {
      await setDoc(doc(admin, "assignments", ASSIGNMENT), {
        studentId: STUDENT,
        status: "matched",
      });
    });
    await assertFails(
      setDoc(doc(db(TUTOR), "matches", APPLICATION_ID), application())
    );
  });

  test("a user without a finished profile cannot send a request", async () => {
    await seed();
    await assertFails(
      setDoc(
        doc(db(NEW_USER), "matches", `${NEW_USER}_${TUTOR}`),
        directRequest({ senderId: NEW_USER, studentId: NEW_USER })
      )
    );
  });

  test("a student's request can say which subject and level they want", async () => {
    await seed();
    await assertSucceeds(
      setDoc(
        doc(db(STUDENT), "matches", DIRECT_ID),
        directRequest({ subject: "Mathematics, Physics", level: "Secondary" })
      )
    );
  });

  test("the subject and level must be short text", async () => {
    await seed();
    await assertFails(
      setDoc(
        doc(db(STUDENT), "matches", DIRECT_ID),
        directRequest({ subject: 42 })
      )
    );
    await assertFails(
      setDoc(
        doc(db(STUDENT), "matches", DIRECT_ID),
        directRequest({ level: "x".repeat(51) })
      )
    );
  });

  test("a request cannot start as accepted or carry extra fields", async () => {
    await seed();
    await assertFails(
      setDoc(
        doc(db(STUDENT), "matches", DIRECT_ID),
        directRequest({ status: "accepted" })
      )
    );
    await assertFails(
      setDoc(
        doc(db(STUDENT), "matches", DIRECT_ID),
        directRequest({ lastMessage: { text: "hi" } })
      )
    );
  });

  test("the same request cannot be sent twice", async () => {
    await seedMatch(DIRECT_ID, directRequest({ status: "rejected" }));
    await assertFails(
      setDoc(doc(db(STUDENT), "matches", DIRECT_ID), directRequest())
    );
  });
});

describe("reading requests and matches (FR-021 to FR-023)", () => {
  test("both users in a request can read it, nobody else can", async () => {
    await seedMatch(DIRECT_ID, directRequest());
    await assertSucceeds(getDoc(doc(db(STUDENT), "matches", DIRECT_ID)));
    await assertSucceeds(getDoc(doc(db(TUTOR), "matches", DIRECT_ID)));
    await assertFails(getDoc(doc(db(OUTSIDER), "matches", DIRECT_ID)));
    await assertFails(
      getDoc(
        doc(testEnv.unauthenticatedContext().firestore(), "matches", DIRECT_ID)
      )
    );
  });

  test("the queries the app runs are allowed", async () => {
    await seedMatch(DIRECT_ID, directRequest());
    const matches = (uid) => collection(db(uid), "matches");
    await assertSucceeds(
      getDocs(query(matches(STUDENT), where("senderId", "==", STUDENT)))
    );
    await assertSucceeds(
      getDocs(
        query(
          matches(TUTOR),
          where("recipientId", "==", TUTOR),
          where("status", "==", "pending")
        )
      )
    );
    await assertSucceeds(
      getDocs(
        query(
          matches(TUTOR),
          where("tutorId", "==", TUTOR),
          where("status", "==", "accepted")
        )
      )
    );
    await assertSucceeds(
      getDocs(
        query(
          matches(STUDENT),
          where("studentId", "==", STUDENT),
          where("tutorId", "==", TUTOR)
        )
      )
    );
  });

  test("reading every request, or someone else's, is blocked", async () => {
    await seedMatch(DIRECT_ID, directRequest());
    await assertFails(getDocs(collection(db(OUTSIDER), "matches")));
    await assertFails(
      getDocs(
        query(
          collection(db(OUTSIDER), "matches"),
          where("tutorId", "==", TUTOR)
        )
      )
    );
  });
});

describe("accepting and rejecting (FR-022)", () => {
  test("the recipient can accept or reject", async () => {
    await seedMatch(DIRECT_ID, directRequest());
    await assertSucceeds(
      updateDoc(doc(db(TUTOR), "matches", DIRECT_ID), {
        status: "accepted",
        updatedAt: serverTimestamp(),
      })
    );
    await seedMatch(DIRECT_ID, directRequest());
    await assertSucceeds(
      updateDoc(doc(db(TUTOR), "matches", DIRECT_ID), {
        status: "rejected",
        updatedAt: serverTimestamp(),
      })
    );
  });

  test("the sender cannot accept their own request", async () => {
    await seedMatch(DIRECT_ID, directRequest());
    await assertFails(
      updateDoc(doc(db(STUDENT), "matches", DIRECT_ID), {
        status: "accepted",
        updatedAt: serverTimestamp(),
      })
    );
  });

  test("an answered request cannot be answered again", async () => {
    await seedMatch(DIRECT_ID, directRequest({ status: "rejected" }));
    await assertFails(
      updateDoc(doc(db(TUTOR), "matches", DIRECT_ID), {
        status: "accepted",
        updatedAt: serverTimestamp(),
      })
    );
  });

  test("accepting cannot change who is in the match", async () => {
    await seedMatch(DIRECT_ID, directRequest());
    await assertFails(
      updateDoc(doc(db(TUTOR), "matches", DIRECT_ID), {
        status: "accepted",
        studentId: OUTSIDER,
        updatedAt: serverTimestamp(),
      })
    );
  });

  test("a student accepting an application adds their own name", async () => {
    await seedMatch(APPLICATION_ID, application());
    await assertSucceeds(
      updateDoc(doc(db(STUDENT), "matches", APPLICATION_ID), {
        status: "accepted",
        studentFirstName: "Jane",
        studentLastName: "Tan",
        updatedAt: serverTimestamp(),
      })
    );
  });

  test("a tutor cannot change the student's name", async () => {
    await seedMatch(DIRECT_ID, directRequest());
    await assertFails(
      updateDoc(doc(db(TUTOR), "matches", DIRECT_ID), {
        status: "accepted",
        studentFirstName: "Someone",
        updatedAt: serverTimestamp(),
      })
    );
  });

  test("nobody can delete a request", async () => {
    await seedMatch(DIRECT_ID, directRequest());
    await assertFails(deleteDoc(doc(db(STUDENT), "matches", DIRECT_ID)));
    await assertFails(deleteDoc(doc(db(TUTOR), "matches", DIRECT_ID)));
  });
});

describe("messages (refined FR-024)", () => {
  const message = (senderId, text = "Hello!") => ({
    senderId,
    text,
    sentAt: serverTimestamp(),
  });
  const messages = (uid) =>
    collection(db(uid), "matches", DIRECT_ID, "messages");

  test("both users in an accepted match can send and read messages", async () => {
    await seedMatch(DIRECT_ID, directRequest({ status: "accepted" }));
    await assertSucceeds(addDoc(messages(STUDENT), message(STUDENT)));
    await assertSucceeds(addDoc(messages(TUTOR), message(TUTOR)));
    await assertSucceeds(getDocs(messages(STUDENT)));
    await assertSucceeds(getDocs(messages(TUTOR)));
  });

  test("nobody can chat before the request is accepted", async () => {
    await seedMatch(DIRECT_ID, directRequest());
    await assertFails(addDoc(messages(STUDENT), message(STUDENT)));
    await assertFails(getDocs(messages(TUTOR)));
  });

  test("users outside the match cannot read or send messages", async () => {
    await seedMatch(DIRECT_ID, directRequest({ status: "accepted" }));
    await assertFails(getDocs(messages(OUTSIDER)));
    await assertFails(addDoc(messages(OUTSIDER), message(OUTSIDER)));
  });

  test("a message must be from the signed-in user and 1 to 1000 characters", async () => {
    await seedMatch(DIRECT_ID, directRequest({ status: "accepted" }));
    await assertFails(addDoc(messages(STUDENT), message(TUTOR)));
    await assertFails(addDoc(messages(STUDENT), message(STUDENT, "")));
    await assertFails(
      addDoc(messages(STUDENT), message(STUDENT, "a".repeat(1001)))
    );
  });

  test("messages cannot be edited or deleted", async () => {
    await seedMatch(DIRECT_ID, directRequest({ status: "accepted" }));
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), "matches", DIRECT_ID, "messages", "m1"),
        { senderId: STUDENT, text: "Hi", sentAt: new Date() }
      );
    });
    const ref = doc(db(STUDENT), "matches", DIRECT_ID, "messages", "m1");
    await assertFails(updateDoc(ref, { text: "Changed" }));
    await assertFails(deleteDoc(ref));
  });

  test("either user can update the latest-message preview", async () => {
    await seedMatch(DIRECT_ID, directRequest({ status: "accepted" }));
    await assertSucceeds(
      updateDoc(doc(db(TUTOR), "matches", DIRECT_ID), {
        lastMessage: {
          text: "See you Wednesday",
          senderId: TUTOR,
          sentAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      })
    );
  });

  test("the preview cannot be set on a pending request or change the status", async () => {
    await seedMatch(DIRECT_ID, directRequest());
    const preview = {
      text: "Hi",
      senderId: STUDENT,
      sentAt: serverTimestamp(),
    };
    await assertFails(
      updateDoc(doc(db(STUDENT), "matches", DIRECT_ID), {
        lastMessage: preview,
        updatedAt: serverTimestamp(),
      })
    );
    await seedMatch(DIRECT_ID, directRequest({ status: "accepted" }));
    await assertFails(
      updateDoc(doc(db(STUDENT), "matches", DIRECT_ID), {
        status: "rejected",
        lastMessage: preview,
        updatedAt: serverTimestamp(),
      })
    );
  });
});

describe("read ticks (FR-024)", () => {
  test("each user can mark the chat as read for themselves only", async () => {
    await seedMatch(DIRECT_ID, directRequest({ status: "accepted" }));
    await assertSucceeds(
      updateDoc(doc(db(STUDENT), "matches", DIRECT_ID), {
        [`readAt.${STUDENT}`]: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
    await assertFails(
      updateDoc(doc(db(STUDENT), "matches", DIRECT_ID), {
        [`readAt.${TUTOR}`]: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  test("a pending request has no read ticks", async () => {
    await seedMatch(DIRECT_ID, directRequest());
    await assertFails(
      updateDoc(doc(db(TUTOR), "matches", DIRECT_ID), {
        [`readAt.${TUTOR}`]: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });
});
