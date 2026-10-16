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
users/{uid} ──────────────┐
   │ role = "student"     │ role = "tutor"
   │                      │
   │ 1:N                  │ 1:N
   ▼                      ▼
assignments/{id} ◄──── matches/{id}
   (posted by student)    (tutor ↔ assignment)
```

| Collection     | Doc ID           | Status         | Purpose                                         |
| -------------- | ---------------- | -------------- | ----------------------------------------------- |
| `users`        | Firebase Auth `uid` | ✅ Implemented | Profile + role for every registered account     |
| `assignments`  | auto-ID          | 📝 Proposed    | A tuition request posted by a student           |
| `matches`      | auto-ID          | 📝 Proposed    | A tutor's application to / pairing with an assignment |

---

## Firebase Authentication

Auth holds credentials only (email, password hash, `emailVerified`). App-specific data lives in
Firestore under `users/{uid}`, using the same `uid` as the document ID.

- Emails are **trimmed and lowercased** before sign-up, login and password reset.
- Passwords must be **at least 8 characters** (client-side check).
- A verification email is sent right after registration.

---

## `users/{uid}` ✅

Created in `registerUser()` ([src/services/auth.js](../src/services/auth.js)) immediately after the
Auth account is created.

| Field                | Type        | Required | Notes                                               |
| -------------------- | ----------- | -------- | --------------------------------------------------- |
| `role`               | string      | yes      | `"student"` or `"tutor"`                            |
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

### Proposed onboarding fields 📝

Filled in during onboarding, before `onboardingComplete` becomes `true`.

| Field         | Type       | Role    | Notes                                         |
| ------------- | ---------- | ------- | --------------------------------------------- |
| `phone`       | string     | both    | Optional                                      |
| `level`       | string     | student | e.g. `"Sec 3"`, `"JC 1"`                      |
| `subjects`    | string[]   | tutor   | Subjects the tutor can teach                  |
| `levels`      | string[]   | tutor   | Levels the tutor can teach                    |
| `hourlyRate`  | number     | tutor   | SGD per hour                                  |
| `bio`         | string     | tutor   | Short description                             |

---

## `assignments/{assignmentId}` 📝

A tuition request created by a student.

| Field        | Type      | Notes                                              |
| ------------ | --------- | -------------------------------------------------- |
| `studentId`  | string    | → `users/{uid}` where `role == "student"`          |
| `subject`    | string    | e.g. `"A-Math"`                                    |
| `level`      | string    | e.g. `"Sec 4"`                                     |
| `budget`     | number    | Max SGD per hour                                   |
| `location`   | string    | Area or `"online"`                                 |
| `schedule`   | string    | Free text for now, e.g. `"Weekday evenings"`       |
| `status`     | string    | `"open"` → `"matched"` → `"closed"`                |
| `createdAt`  | timestamp |                                                    |
| `updatedAt`  | timestamp |                                                    |

## `matches/{matchId}` 📝

Links a tutor to an assignment. A tutor applying creates a `pending` match; the student accepts
or rejects it.

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

- **Field names** use `camelCase`. **Collection names** are plural and lowercase.
- **References** between documents are stored as plain string IDs (e.g. `studentId`), not
  Firestore `DocumentReference`s.
- **Timestamps** always use `serverTimestamp()`, never the client clock.
- **Enums** (`role`, `status`) are lowercase strings, and only the values listed here are allowed.
- **Denormalisation**: Firestore has no joins, so a few fields are copied (e.g. `studentId` on
  `matches`) so that common queries can run as a single query.

## Security rules (intent)

To be enforced in `firestore.rules`:

- A user can read and write only their own `users/{uid}` document and cannot change their `role`
  after it is created.
- Only students can create `assignments`, and only with `studentId == request.auth.uid`.
- Only tutors can create `matches`. Only the assignment's student can change a match's `status`.
