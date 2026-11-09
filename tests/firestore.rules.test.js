import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteField,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

const STUDENT = "student1";
const TUTOR = "tutor1";
const OUTSIDER = "student2";
const NEW_USER = "student3";
const ASSIGNMENT = "assignment1";
const DIRECT_ID = `${STUDENT}_${TUTOR}`;
const APPLICATION_ID = `${ASSIGNMENT}_${TUTOR}`;
const SEEDED_TUTOR_EMAILS = [
  "rachel.lim@tutorlah.test",
  "daniel.ng@tutorlah.test",
  "priya.kumar@tutorlah.test",
  "weijie.tan@tutorlah.test",
  "aisyah.rahman@tutorlah.test",
  "marcus.lee@tutorlah.test",
];

let testEnv;

const db = (uid) => testEnv.authenticatedContext(uid).firestore();
const dbWithEmail = (uid, email) =>
  testEnv.authenticatedContext(uid, { email }).firestore();

function tutorProfile(overrides = {}) {
  return {
    firstName: "Rachel",
    lastName: "Lim",
    subjects: ["Mathematics"],
    levels: ["Secondary"],
    location: "East",
    hourlyRate: 45,
    availability: ["Weekend"],
    teachingStyles: ["Patient"],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

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
    const user = (role, onboardingComplete, firstName, lastName) => ({
      role,
      firstName,
      lastName,
      email: "test@example.com",
      onboardingComplete,
    });
    await setDoc(doc(admin, "users", STUDENT), user("student", true, "Jane", "Tan"));
    await setDoc(doc(admin, "users", OUTSIDER), user("student", true, "Alex", "Ong"));
    await setDoc(doc(admin, "users", NEW_USER), user("student", false, "New", "User"));
    await setDoc(doc(admin, "users", TUTOR), user("tutor", true, "Rachel", "Lim"));
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

describe("tutor rating safety", () => {
  test("an ordinary tutor cannot create a profile with a rating", async () => {
    await seed(async (admin) => {
      await deleteDoc(doc(admin, "tutorProfiles", TUTOR));
    });

    await assertFails(
      setDoc(
        doc(db(TUTOR), "tutorProfiles", TUTOR),
        tutorProfile({ rating: 4.8 }),
      ),
    );
  });

  test("the exact approved seed accounts can create a valid illustrative rating", async () => {
    await seed(async (admin) => {
      await deleteDoc(doc(admin, "tutorProfiles", TUTOR));
    });

    for (const email of SEEDED_TUTOR_EMAILS) {
      const seededDb = dbWithEmail(TUTOR, email);
      const profileRef = doc(seededDb, "tutorProfiles", TUTOR);

      await assertSucceeds(setDoc(profileRef, tutorProfile({ rating: 4.8 })));
      await assertSucceeds(deleteDoc(profileRef));
    }
  });

  test("a made-up tutorlah.test account cannot create a rated profile", async () => {
    await seed(async (admin) => {
      await deleteDoc(doc(admin, "tutorProfiles", TUTOR));
    });

    await assertFails(
      setDoc(
        doc(
          dbWithEmail(TUTOR, "made.up@tutorlah.test"),
          "tutorProfiles",
          TUTOR,
        ),
        tutorProfile({ rating: 4.8 }),
      ),
    );
  });

  test("a seeded rating must be a number greater than zero and at most five", async () => {
    await seed(async (admin) => {
      await deleteDoc(doc(admin, "tutorProfiles", TUTOR));
    });
    const seededDb = dbWithEmail(TUTOR, SEEDED_TUTOR_EMAILS[0]);

    for (const rating of [0, -1, 5.1, "4.8"]) {
      await assertFails(
        setDoc(doc(seededDb, "tutorProfiles", TUTOR), tutorProfile({ rating })),
      );
    }
  });

  test("a newly registered tutor can create an unrated profile", async () => {
    await seed(async (admin) => {
      await deleteDoc(doc(admin, "tutorProfiles", TUTOR));
    });

    await assertSucceeds(
      setDoc(doc(db(TUTOR), "tutorProfiles", TUTOR), tutorProfile()),
    );
  });

  test("profile updates cannot change or remove an existing seeded rating", async () => {
    await seed(async (admin) => {
      await setDoc(
        doc(admin, "tutorProfiles", TUTOR),
        tutorProfile({ rating: 4.8 }),
      );
    });
    const seededDb = dbWithEmail(TUTOR, SEEDED_TUTOR_EMAILS[0]);

    await assertFails(
      updateDoc(doc(seededDb, "tutorProfiles", TUTOR), {
        rating: 4.9,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(seededDb, "tutorProfiles", TUTOR), {
        rating: deleteField(),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      updateDoc(doc(seededDb, "tutorProfiles", TUTOR), {
        location: "West",
        updatedAt: serverTimestamp(),
      }),
    );

    const snapshot = await getDoc(doc(seededDb, "tutorProfiles", TUTOR));
    assert.equal(snapshot.data().rating, 4.8);
  });

  test("a profile update cannot add a rating", async () => {
    await seed(async (admin) => {
      await setDoc(doc(admin, "tutorProfiles", TUTOR), tutorProfile());
    });

    await assertFails(
      updateDoc(doc(db(TUTOR), "tutorProfiles", TUTOR), {
        rating: 4.8,
        updatedAt: serverTimestamp(),
      }),
    );
  });
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

  test("copied student and tutor names must match authoritative profiles", async () => {
    await seed();
    await assertFails(
      setDoc(
        doc(db(STUDENT), "matches", DIRECT_ID),
        directRequest({ studentFirstName: "Imposter" })
      )
    );
    await assertFails(
      setDoc(
        doc(db(STUDENT), "matches", DIRECT_ID),
        directRequest({ tutorLastName: "Imposter" })
      )
    );
    await assertFails(
      setDoc(
        doc(db(TUTOR), "matches", APPLICATION_ID),
        application({ tutorFirstName: "Imposter" })
      )
    );
  });

  test("a tutor application cannot supply the student's private name", async () => {
    await seed();
    await assertFails(
      setDoc(
        doc(db(TUTOR), "matches", APPLICATION_ID),
        application({ studentFirstName: "Jane", studentLastName: "Tan" })
      )
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

  test("a student cannot add a spoofed name while accepting", async () => {
    await seedMatch(APPLICATION_ID, application());
    await assertFails(
      updateDoc(doc(db(STUDENT), "matches", APPLICATION_ID), {
        status: "accepted",
        studentFirstName: "Imposter",
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
  const messages = (uid) =>
    collection(db(uid), "matches", DIRECT_ID, "messages");

  async function sendMessage(
    uid,
    messageId,
    { senderId = uid, text = "Hello!", previewText = text } = {}
  ) {
    const database = db(uid);
    const batch = writeBatch(database);
    const messageRef = doc(database, "matches", DIRECT_ID, "messages", messageId);
    const sentAt = serverTimestamp();

    batch.set(messageRef, { senderId, text, sentAt });
    batch.update(doc(database, "matches", DIRECT_ID), {
      lastMessage: {
        messageId,
        senderId,
        text: previewText,
        sentAt,
      },
      updatedAt: serverTimestamp(),
    });

    return batch.commit();
  }

  test("both users in an accepted match can send and read messages", async () => {
    await seedMatch(DIRECT_ID, directRequest({ status: "accepted" }));
    await assertSucceeds(sendMessage(STUDENT, "m1"));
    await assertSucceeds(sendMessage(TUTOR, "m2"));
    await assertSucceeds(getDocs(messages(STUDENT)));
    await assertSucceeds(getDocs(messages(TUTOR)));
  });

  test("nobody can chat before the request is accepted", async () => {
    await seedMatch(DIRECT_ID, directRequest());
    await assertFails(sendMessage(STUDENT, "m1"));
    await assertFails(getDocs(messages(TUTOR)));
  });

  test("users outside the match cannot read or send messages", async () => {
    await seedMatch(DIRECT_ID, directRequest({ status: "accepted" }));
    await assertFails(getDocs(messages(OUTSIDER)));
    await assertFails(sendMessage(OUTSIDER, "m1"));
  });

  test("a message must be from the signed-in user and contain 1 to 1000 non-whitespace characters", async () => {
    await seedMatch(DIRECT_ID, directRequest({ status: "accepted" }));
    await assertFails(sendMessage(STUDENT, "wrong-sender", { senderId: TUTOR }));
    await assertFails(sendMessage(STUDENT, "empty", { text: "" }));
    await assertFails(sendMessage(STUDENT, "spaces", { text: "   " }));
    await assertFails(sendMessage(STUDENT, "too-long", { text: "a".repeat(1001) }));
  });

  test("the message and latest-message preview must be committed together and agree", async () => {
    await seedMatch(DIRECT_ID, directRequest({ status: "accepted" }));
    await assertFails(
      setDoc(doc(messages(STUDENT), "standalone"), {
        senderId: STUDENT,
        text: "Hidden message",
        sentAt: serverTimestamp(),
      })
    );
    await assertFails(
      updateDoc(doc(db(STUDENT), "matches", DIRECT_ID), {
        lastMessage: {
          messageId: "missing",
          senderId: STUDENT,
          text: "Forged preview",
          sentAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      })
    );
    await assertFails(
      sendMessage(STUDENT, "mismatch", { text: "Message", previewText: "Different" })
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
});

describe("assignment lifecycle", () => {
  const validAssignment = (overrides = {}) => ({
    studentId: STUDENT,
    subject: "Mathematics",
    level: "Secondary",
    location: "East",
    learningMode: "Either",
    minimumRate: 30,
    maximumRate: 50,
    preferredDay: "Saturday",
    preferredTimeSlot: "10:00-12:00",
    teachingStyle: "Patient",
    additionalDetails: "Exam preparation",
    status: "open",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  async function seedAssignment(overrides = {}) {
    await seed(async (admin) => {
      await setDoc(
        doc(admin, "assignments", ASSIGNMENT),
        validAssignment(overrides)
      );
    });
  }

  test("the owner can archive an open assignment", async () => {
    await seedAssignment();
    await assertSucceeds(
      updateDoc(doc(db(STUDENT), "assignments", ASSIGNMENT), {
        status: "closed",
        updatedAt: serverTimestamp(),
      })
    );
  });

  test("assignment details and ownership are immutable after posting", async () => {
    await seedAssignment();
    await assertFails(
      updateDoc(doc(db(STUDENT), "assignments", ASSIGNMENT), {
        subject: "Physics",
        updatedAt: serverTimestamp(),
      })
    );
    await assertFails(
      updateDoc(doc(db(STUDENT), "assignments", ASSIGNMENT), {
        studentId: OUTSIDER,
        updatedAt: serverTimestamp(),
      })
    );
  });

  test("outsiders, reopening and destructive deletion are denied", async () => {
    await seedAssignment({ status: "closed" });
    await assertFails(
      updateDoc(doc(db(OUTSIDER), "assignments", ASSIGNMENT), {
        status: "open",
        updatedAt: serverTimestamp(),
      })
    );
    await assertFails(
      updateDoc(doc(db(STUDENT), "assignments", ASSIGNMENT), {
        status: "open",
        updatedAt: serverTimestamp(),
      })
    );
    await assertFails(deleteDoc(doc(db(STUDENT), "assignments", ASSIGNMENT)));
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
