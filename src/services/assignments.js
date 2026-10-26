import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'

import {
  auth,
  db,
} from '../firebase.js'

export async function createAssignment({
  subject,
  level,
  location,
  learningMode,
  minimumRate,
  maximumRate,
  preferredDay,
  preferredTimeSlot,
  teachingStyle,
  additionalDetails,
}) {
  const user = auth.currentUser

  if (!user) {
    const error = new Error(
      'You must be signed in to post an assignment.'
    )

    error.code = 'auth/no-current-user'
    throw error
  }

  const assignment = {
    studentId: user.uid,
    subject,
    level,
    location,
    learningMode,
    minimumRate: Number(minimumRate),
    maximumRate: Number(maximumRate),
    preferredDay,
    preferredTimeSlot,
    teachingStyle,
    additionalDetails: additionalDetails.trim(),
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const documentReference = await addDoc(
    collection(db, 'assignments'),
    assignment
  )

  return documentReference.id
}

export async function fetchAssignments() {
  const assignmentsQuery = query(
    collection(db, 'assignments'),
    where('status', '==', 'open')
  )

  const snapshot = await getDocs(assignmentsQuery)

  const assignments = snapshot.docs.map(
    (assignmentDocument) => ({
      id: assignmentDocument.id,
      ...assignmentDocument.data(),
    })
  )

  return assignments.sort((firstAssignment, secondAssignment) => {
    const firstCreatedAt =
      firstAssignment.createdAt?.toMillis?.() ?? 0

    const secondCreatedAt =
      secondAssignment.createdAt?.toMillis?.() ?? 0

    return secondCreatedAt - firstCreatedAt
  })
}