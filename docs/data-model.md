# TutorLah Data Model

This document describes how TutorLah stores data in **Firebase** (Authentication + Cloud Firestore).
It is the single reference for collection names, field names, types, and relationships, so that
every part of the app reads and writes data the same way.

> **Status legend**
> - ✅ **Implemented** — already written by code in `src/`
> - 📝 **Proposed** — planned; field names may change. Update this doc when it's implemented.

---

## Overview

```
Firebase Auth user (uid)
        │ 1:1
        ▼
users/{uid}  (private)
   │ role = "student"          │ role = "tutor"
   │                           │ 1:1, same uid
   │ 1:N                       ▼
   ▼                     tutorProfiles/{uid}  (public)
assignments/{id}
   (posted by student)
                         matches/{id}  (student ↔ tutor)
                            └── messages/{id}
```

| Collection      | Doc ID              | Status         | Readable by           | Purpose                                         |
| --------------- | ------------------- | -------------- | --------------------- | ----------------------------------------------- |
| `users`         | Firebase Auth `uid` | ✅ Implemented | Owner only            | Private account details + role                  |
| `tutorProfiles` | Tutor's `uid`       | ✅ Implemented | Any signed-in user    | Public tutor info shown on Find Tutors          |
| `assignments`   | auto-ID             | ✅ Implemented | Any signed-in user    | A tuition request posted by a student           |
| `matches`       | Fixed ID (see below) | ✅ Implemented | The two users in it   | A request between a student and a tutor; becomes a match when accepted |
| `matches/{id}/messages` | auto-ID     | ✅ Implemented | The two users in it   | Chat messages between matched users             |

### Public vs private data (NFR-007)

Firestore security rules allow or block access to **whole documents**, not single fields. So
contact details (email, phone) live only in the private `users/{uid}` document, and anything
other users need to see lives in a separate public document such as `tutorProfiles/{uid}`.
Never put contact details in a public collection.

---

## Firebase Authentication

Auth holds credentials only (email, password hash, `emailVerified`). App-specific data lives in
Firestore under `users/{uid}`, using the same `uid` as the document ID.

- Emails are **trimmed and lowercased** before sign-up, login and password reset.
- Passwords need **at least 8 characters, 1 uppercase letter and 1 special character** (FR-002, client-side check).
- A verification email is sent right after registration.

---

## `users/{uid}` ✅

**Private.** Only the owner can read or write it.

Created in `registerUser()` ([src/services/auth.js](../src/services/auth.js)) immediately after the
Auth account is created.

| Field                | Type        | Required | Notes                                               |
| -------------------- | ----------- | -------- | --------------------------------------------------- |
| `role`               | string      | yes      | `"student"` or `"tutor"`; cannot change after sign-up |
| `firstName`          | string      | yes      | Trimmed, non-empty                                  |
| `lastName`           | string      | yes      | Trimmed, non-empty                                  |
| `email`              | string      | yes      | Lowercased; copied from the Auth user               |
| `onboardingComplete` | boolean     | yes      | `false` on sign-up; set `true` after profile setup  |
| `createdAt`          | timestamp   | yes      | `serverTimestamp()`                                 |
| `updatedAt`          | timestamp   | yes      | `serverTimestamp()`; update on every write          |

Example:

```json
{
  "role": "student",
  "firstName": "Jane",
  "lastName": "Tan",
  "email": "jane.tan@example.com",
  "onboardingComplete": false,
  "createdAt": "<server timestamp>",
  "updatedAt": "<server timestamp>"
}
```

### Profile fields 📝

Filled in on Create Profile and changed on My Profile (FR-025, FR-026). All are optional in the
rules, because a new account has none of them until Create Profile is saved.

| Field            | Type      | Role    | Notes                                                 |
| ---------------- | --------- | ------- | ----------------------------------------------------- |
| `phone`          | string    | both    | Optional; contact detail, so private. Max 20 characters |
| `location`       | string    | student | One value from `LOCATIONS`. Tutors keep theirs in `tutorProfiles` |
| `level`          | string    | student | One `value` from `LEVELS`                             |
| `subjects`       | string[]  | student | Values from `SUBJECTS`                                |
| `lessonModes`    | string[]  | student | `"In-person"` and/or `"Online"` (`LESSON_MODES`)      |
| `availability`   | string[]  | student | Values from `AVAILABILITY`; may be empty              |
| `teachingStyles` | string[]  | student | Values from `TEACHING_STYLES`; may be empty           |
| `budgetMin`      | number    | student | SGD per hour, 20 to 100                               |
| `budgetMax`      | number    | student | SGD per hour, 20 to 100, not below `budgetMin`        |

Tutors' teaching details go in `tutorProfiles`, not here. Create Profile writes the profile
fields and sets `onboardingComplete` to `true` in the same batch.

After sign-up, the `users` rules let the owner change the names, `onboardingComplete`,
`updatedAt` and the fields above. `role`, `email` and `createdAt` still cannot change.

---

## `tutorProfiles/{uid}` ✅

**Public** to any signed-in user. Only the tutor can create or edit their own profile.
Read by Find Tutors ([src/services/tutors.js](../src/services/tutors.js)). No contact details.

The document ID is the tutor's `uid`, so it links 1:1 to `users/{uid}`. Seeded tutors are
created by [scripts/seedTutors.js](../scripts/seedTutors.js) as real tutor accounts
(`@tutorlah.test` emails), so they have a `users` document too and can log in.

| Field            | Type      | Required | Notes                                                    |
| ---------------- | --------- | -------- | -------------------------------------------------------- |
| `firstName`      | string    | yes      | Copied from `users/{uid}`                                |
| `lastName`       | string    | yes      | Copied from `users/{uid}`                                |
| `subjects`       | string[]  | yes      | Values from `SUBJECTS` in `src/constants/tutorFilters.js` |
| `levels`         | string[]  | yes      | `value`s from `LEVELS` (e.g. `"Secondary"`)              |
| `location`       | string    | yes      | One value from `LOCATIONS`                               |
| `hourlyRate`     | number    | yes      | SGD per hour                                             |
| `availability`   | string[]  | yes      | Values from `AVAILABILITY`                               |
| `teachingStyles` | string[]  | yes      | Values from `TEACHING_STYLES`                            |
| `rating`         | number    | no       | Not used. The app no longer shows ratings, since reviews are not implemented. Older seeded `@tutorlah.test` profiles may still have this field; the rules allow it only on those accounts. |
| `bio`            | string    | no       | Shown in the About tab of the Tutor Profile (FR-013)     |
| `qualification`  | string    | no       | Short, e.g. `"Ex-MOE Teacher"`, `"NUS Graduate"` (FR-008) |
| `yearsOfExperience` | number | no       | Shown as "6 years experience" on the tutor card (FR-008) |
| `lessonModes`    | string[]  | no       | `"In-person"` and/or `"Online"`, from Create Profile (FR-026) |
| `createdAt`      | timestamp | yes      | `serverTimestamp()`                                      |
| `updatedAt`      | timestamp | yes      | `serverTimestamp()`                                      |

Example:

```json
{
  "firstName": "Rachel",
  "lastName": "Lim",
  "subjects": ["Mathematics", "Physics"],
  "levels": ["Secondary", "Junior College"],
  "location": "East",
  "hourlyRate": 45,
  "availability": ["Weekday evenings", "Weekends"],
  "teachingStyles": ["Exam-focused", "Structured"],
  "bio": "Former MOE teacher with 6 years of experience.",
  "qualification": "Ex-MOE Teacher",
  "yearsOfExperience": 6,
  "createdAt": "<server timestamp>",
  "updatedAt": "<server timestamp>"
}
```

---

## `assignments/{assignmentId}` ✅

A tuition request created by a student. Readable by any signed-in user; only the student who
posted it can edit or delete it.

| Field                 | Type      | Required | Notes                                      |
| --------------------- | --------- | -------- | ------------------------------------------ |
| `studentId`           | string    | yes      | Firebase UID of the student/parent         |
| `subject`             | string    | yes      | Subject requested                          |
| `level`               | string    | yes      | Academic level                             |
| `location`            | string    | yes      | Preferred area in Singapore                |
| `learningMode`        | string    | yes      | `"In-person"`, `"Online"` or `"Either"`     |
| `minimumRate`         | number    | yes      | Minimum hourly rate in SGD                 |
| `maximumRate`         | number    | yes      | Maximum hourly rate in SGD                 |
| `preferredDay`        | string    | no       | Monday to Sunday, or an empty string       |
| `preferredTimeSlot`   | string    | no       | Normalised two-hour slot, or empty string  |
| `teachingStyle`       | string    | yes      | Selected style or `"No preference"`        |
| `additionalDetails`   | string    | no       | Extra information supplied by the student |
| `status`              | string    | yes      | `"open"` initially                         |
| `createdAt`           | timestamp | yes      | Firestore server timestamp                 |
| `updatedAt`           | timestamp | yes      | Firestore server timestamp                 |

---

## `matches/{matchId}` ✅

One document per request between a student/parent and a tutor. It starts as a **request**
(`"pending"`) and becomes a **match** when the person who received it accepts (FR-022).
Only the two users in it can read it.

There are two ways a request is created:

| How                                                  | Requirement | Sender  | Recipient                 | Document ID                |
| ---------------------------------------------------- | ----------- | ------- | ------------------------- | -------------------------- |
| Student clicks Apply on a tutor card or Tutor Profile | FR-009     | student | tutor                     | `{studentId}_{tutorId}`    |
| Tutor clicks Apply on an assignment                  | FR-016      | tutor   | student who posted it     | `{assignmentId}_{tutorId}` |

The document ID is fixed, not auto-generated, so the same person can't apply twice: a second
Apply would try to overwrite the first, and the rules only let the recipient change a request.

| Field              | Type      | Required | Notes                                                        |
| ------------------ | --------- | -------- | ------------------------------------------------------------ |
| `status`           | string    | yes      | `"pending"` → `"accepted"` or `"rejected"`. Only the recipient can change it |
| `senderId`         | string    | yes      | UID of who clicked Apply; must be the signed-in user          |
| `recipientId`      | string    | yes      | UID of who receives the request                              |
| `studentId`        | string    | yes      | UID of the student/parent (the sender or the recipient)      |
| `tutorId`          | string    | yes      | UID of the tutor (the sender or the recipient)               |
| `assignmentId`     | string    | FR-016 only | → `assignments/{id}`; not set for FR-009 requests         |
| `subject`          | string    | FR-009 only | The subjects the student wants, e.g. `"Mathematics, Physics"`, copied from their profile (ones this tutor teaches first). Shown in the tutor's Requests tab. FR-016 uses the assignment's subject instead |
| `level`            | string    | FR-009 only | The student's academic level, e.g. `"Secondary"`. Shown with `subject` |
| `tutorFirstName`   | string    | yes      | Copied from `tutorProfiles/{tutorId}` (FR-009) or the tutor's own account (FR-016) |
| `tutorLastName`    | string    | yes      | As above                                                     |
| `studentFirstName` | string    | see note | Copied from the student's own account                       |
| `studentLastName`  | string    | see note | As above                                                     |
| `lastMessage`      | map       | no       | `{ text, senderId, sentAt }` of the newest message; set when a message is sent. Used to sort All Matches and show the preview (FR-023) |
| `readAt`           | map       | no       | `{ [uid]: timestamp }`: when each user last read the chat. A message shows two ticks once the other person's time is after it was sent, one tick before (FR-024) |
| `createdAt`        | timestamp | yes      | `serverTimestamp()`; shown as the request date               |
| `updatedAt`        | timestamp | yes      | `serverTimestamp()`; update on every write                   |

**Why the names are copied here:** users can't read each other's `users` documents (NFR-007),
so My Matches can't look names up later. The student's name is added by the student: when they
send the request (FR-009), or when they accept a tutor's application (FR-016), because the
tutor applying can't see it.

**What each page reads:**

- **Apply buttons (FR-009, FR-016):** `senderId == myUid`. Any request in the list shows that
  card's button as "Applied". It can't be a `getDoc` of the fixed ID: before you apply, the
  document doesn't exist, and the rules deny reading a missing document.
- **Tutor Profile (FR-009, FR-022):** `studentId == myUid` and `tutorId == tutorUid`, which also
  finds requests the tutor sent. If they are matched, or the tutor applied to the student's
  assignment, the page links to My Matches instead of showing Apply.
- **Requests tab (FR-022):** `recipientId == myUid` and `status == "pending"`.
- **All Matches tab (FR-023):** `studentId == myUid` (students) or `tutorId == myUid` (tutors),
  and `status == "accepted"`. Sorted by `lastMessage.sentAt`, newest first.
- **Reject (FR-022):** sets `status` to `"rejected"`, so it leaves the Requests tab. The sender's
  button stays "Applied", so they can't send the same request again.

Example (FR-009, after the tutor accepted and the student sent a message):

```json
{
  "status": "accepted",
  "senderId": "studentUid123",
  "recipientId": "tutorUid456",
  "studentId": "studentUid123",
  "tutorId": "tutorUid456",
  "studentFirstName": "Jane",
  "studentLastName": "Tan",
  "tutorFirstName": "Rachel",
  "tutorLastName": "Lim",
  "lastMessage": {
    "text": "Great! See you this Wednesday.",
    "senderId": "studentUid123",
    "sentAt": "<server timestamp>"
  },
  "createdAt": "<server timestamp>",
  "updatedAt": "<server timestamp>"
}
```

### `matches/{matchId}/messages/{messageId}` ✅

Chat messages (FR-024). Only the two users in the match can read or send them, and only once
the match is `"accepted"` (story 33). Sending a message also updates `lastMessage` and
`updatedAt` on the match, in the same batch. Messages can't be edited or deleted.

The open chat listens to `matches/{matchId}/messages` ordered by `sentAt`, oldest first, so new
messages from either person appear without refreshing.

| Field      | Type      | Required | Notes                                        |
| ---------- | --------- | -------- | -------------------------------------------- |
| `senderId` | string    | yes      | Must be the signed-in user                   |
| `text`     | string    | yes      | 1 to 1000 characters; no attachments         |
| `sentAt`   | timestamp | yes      | `serverTimestamp()`                          |

---

## Conventions

- **Field names** and **collection names** use `camelCase`. Collection names are plural.
- **References** between documents are stored as plain string IDs (e.g. `studentId`), not
  Firestore `DocumentReference`s.
- **Timestamps** always use `serverTimestamp()`, never the client clock.
- **Enums** (`role`, `status`) are lowercase strings, and only the values listed here are allowed.
- **Denormalisation**: Firestore has no joins, so a few fields are copied (e.g. names on
  `tutorProfiles` and `matches`) so that common queries can run as a single query.

## Security rules

The rules are in [firestore.rules](../firestore.rules). Summary:

- `users`: only the owner can read or write; only the listed fields are allowed; `role`,
  `email` and `createdAt` cannot change after sign-up; profile fields are type-checked.
- `tutorProfiles`: any signed-in user can read; only a tutor can create or edit their own;
  only the listed fields are allowed.
- `assignments`: any signed-in user can read; only a student can create one, with
  `studentId == request.auth.uid`; only that student can edit or delete it.
- `matches` (NFR-006/007): only the student and tutor in it can read it, and queries must filter
  on `senderId`, `recipientId`, `studentId` or `tutorId` equal to the signed-in user. Only a user
  with a finished profile can send a request, as `"pending"`, using the fixed document ID and only
  the fields listed above. A direct request (FR-009) must come from a student to a tutor who has a
  `tutorProfiles` document. An application (FR-016) must come from a tutor, for an `"open"`
  assignment, sent to the student who posted it. Only the recipient can accept or reject, once;
  only the student can add the student names, when accepting. Once accepted, either user can
  update `lastMessage` and `updatedAt`, or set their own time in `readAt` (to now), and nothing
  else. Nobody can delete a request.
- `matches/{id}/messages` (NFR-006/007): only the two users in an `"accepted"` match can read or
  send messages. A message has only `senderId` (the signed-in user), `text` (1 to 1000
  characters) and `sentAt` (`serverTimestamp()`), and cannot be edited or deleted.

`npm run test:rules` checks these rules in the Firestore emulator
([tests/firestore.rules.test.js](../tests/firestore.rules.test.js)). It needs Java 21 or newer.

Once deployed, any collection without a rule is blocked, so add a rule before using a new one.
