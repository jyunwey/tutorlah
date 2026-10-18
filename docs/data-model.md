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
assignments/{id} ◄──── matches/{id}
   (posted by student)    (tutor ↔ assignment)
```

| Collection      | Doc ID              | Status         | Readable by           | Purpose                                         |
| --------------- | ------------------- | -------------- | --------------------- | ----------------------------------------------- |
| `users`         | Firebase Auth `uid` | ✅ Implemented | Owner only            | Private account details + role                  |
| `tutorProfiles` | Tutor's `uid`       | ✅ Implemented | Any signed-in user    | Public tutor info shown on Find Tutors          |
| `assignments`   | auto-ID             | 📝 Proposed    | Any signed-in user    | A tuition request posted by a student           |
| `matches`       | auto-ID             | 📝 Proposed    | The two users in it   | A tutor's application to / pairing with an assignment |

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
- Passwords must be **at least 8 characters** (client-side check).
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

### Proposed profile fields 📝

Filled in on the profile page (FR-025, FR-026).

| Field         | Type       | Role    | Notes                                         |
| ------------- | ---------- | ------- | --------------------------------------------- |
| `phone`       | string     | both    | Optional; contact detail, so private          |
| `level`       | string     | student | e.g. `"Secondary"`                            |

Tutors' teaching details go in `tutorProfiles`, not here.

The `users` rules only allow the fields in the first table, and only `firstName`, `lastName`,
`onboardingComplete` and `updatedAt` can change after sign-up. Adding these profile fields
needs a matching change to the `users` rules in [firestore.rules](../firestore.rules).

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
| `levels`         | string[]  | yes      | Values from `LEVELS`                                     |
| `location`       | string    | yes      | One value from `LOCATIONS`                               |
| `hourlyRate`     | number    | yes      | SGD per hour                                             |
| `availability`   | string[]  | yes      | Values from `AVAILABILITY`                               |
| `teachingStyles` | string[]  | yes      | Values from `TEACHING_STYLES`                            |
| `rating`         | number    | yes      | Seeded value (0–5), since reviews are not implemented    |
| `bio`            | string    | no       | Shown in the About tab of the Tutor Profile (FR-013)     |
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
  "rating": 4.8,
  "bio": "Former MOE teacher with 6 years of experience.",
  "createdAt": "<server timestamp>",
  "updatedAt": "<server timestamp>"
}
```

---

## `assignments/{assignmentId}` 📝

A tuition request created by a student. Readable by any signed-in user; only the student who
posted it can edit or delete it.

| Field        | Type      | Notes                                              |
| ------------ | --------- | -------------------------------------------------- |
| `studentId`  | string    | → `users/{uid}` where `role == "student"`          |
| `subject`    | string    | e.g. `"Mathematics"`                               |
| `level`      | string    | e.g. `"Secondary"`                                 |
| `budget`     | number    | Max SGD per hour                                   |
| `location`   | string    | Area or `"Online"`                                 |
| `schedule`   | string    | Free text for now, e.g. `"Weekday evenings"`       |
| `status`     | string    | `"open"` → `"matched"` → `"closed"`                |
| `createdAt`  | timestamp |                                                    |
| `updatedAt`  | timestamp |                                                    |

## `matches/{matchId}` 📝

Links a tutor to an assignment. A tutor applying creates a `pending` match; the student accepts
or rejects it. Only the two users in the match can read or write it (Sprint 2).

| Field          | Type      | Notes                                           |
| -------------- | --------- | ----------------------------------------------- |
| `assignmentId` | string    | → `assignments/{id}`                            |
| `studentId`    | string    | Copied from the assignment, so it can be queried without a join |
| `tutorId`      | string    | → `users/{uid}` where `role == "tutor"`         |
| `status`       | string    | `"pending"` → `"accepted"` or `"rejected"`      |
| `message`      | string    | Optional note from the tutor                    |
| `createdAt`    | timestamp |                                                 |
| `updatedAt`    | timestamp |                                                 |

---

## Conventions

- **Field names** and **collection names** use `camelCase`. Collection names are plural.
- **References** between documents are stored as plain string IDs (e.g. `studentId`), not
  Firestore `DocumentReference`s.
- **Timestamps** always use `serverTimestamp()`, never the client clock.
- **Enums** (`role`, `status`) are lowercase strings, and only the values listed here are allowed.
- **Denormalisation**: Firestore has no joins, so a few fields are copied (e.g. `studentId` on
  `matches`, names on `tutorProfiles`) so that common queries can run as a single query.

## Security rules

The rules are in [firestore.rules](../firestore.rules). Summary:

- `users`: only the owner can read or write; only the listed fields are allowed; `role`,
  `email` and `createdAt` cannot change after sign-up.
- `tutorProfiles`: any signed-in user can read; only a tutor can create or edit their own;
  only the listed fields are allowed.
- `assignments`: any signed-in user can read; only a student can create one, with
  `studentId == request.auth.uid`; only that student can edit or delete it.
- `matches` and messages: to be added in Sprint 2 (only the two users involved).

Once deployed, any collection without a rule is blocked, so add a rule before using a new one.
