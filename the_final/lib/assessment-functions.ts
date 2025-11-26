import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import { db } from "./config"
import type { Assessment, AssessmentStatus, RoomAssessment } from "@/lib/assessment"

export async function createAssessment(userId: string): Promise<string> {
  const assessmentRef = doc(collection(db, "assessments"))

  const assessment: Omit<Assessment, "id" | "createdAt" | "updatedAt"> & {
    createdAt: ReturnType<typeof serverTimestamp>
    updatedAt: ReturnType<typeof serverTimestamp>
  } = {
    userId,
    status: "uploading",
    rooms: [],
    totalEstimate: { min: 0, max: 0 },
    overallScore: 0,
    summary: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(assessmentRef, assessment)
  return assessmentRef.id
}

export async function getAssessment(assessmentId: string): Promise<Assessment | null> {
  const assessmentRef = doc(db, "assessments", assessmentId)
  const assessmentDoc = await getDoc(assessmentRef)

  if (!assessmentDoc.exists()) return null

  const data = assessmentDoc.data()
  return {
    id: assessmentDoc.id,
    ...data,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined,
  } as Assessment
}

export async function getUserAssessments(userId: string): Promise<Assessment[]> {
  const assessmentsRef = collection(db, "assessments")
  const q = query(assessmentsRef, where("userId", "==", userId), orderBy("createdAt", "desc"))

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined,
    } as Assessment
  })
}

export async function updateAssessmentStatus(assessmentId: string, status: AssessmentStatus): Promise<void> {
  const assessmentRef = doc(db, "assessments", assessmentId)
  await updateDoc(assessmentRef, {
    status,
    updatedAt: serverTimestamp(),
    ...(status === "complete" ? { completedAt: serverTimestamp() } : {}),
  })
}

export async function addRoomToAssessment(
  assessmentId: string,
  room: Omit<RoomAssessment, "analyzedAt"> & { analyzedAt: ReturnType<typeof serverTimestamp> },
): Promise<void> {
  const assessmentRef = doc(db, "assessments", assessmentId)
  const assessmentDoc = await getDoc(assessmentRef)

  if (!assessmentDoc.exists()) throw new Error("Assessment not found")

  const currentRooms = assessmentDoc.data().rooms || []

  await updateDoc(assessmentRef, {
    rooms: [...currentRooms, room],
    updatedAt: serverTimestamp(),
  })
}

export async function updateAssessmentResults(
  assessmentId: string,
  results: {
    rooms: RoomAssessment[]
    totalEstimate: { min: number; max: number }
    overallScore: number
    summary: string
  },
): Promise<void> {
  const assessmentRef = doc(db, "assessments", assessmentId)
  await updateDoc(assessmentRef, {
    ...results,
    status: "complete",
    updatedAt: serverTimestamp(),
    completedAt: serverTimestamp(),
  })
}

export async function deleteAssessment(assessmentId: string): Promise<void> {
  const assessmentRef = doc(db, "assessments", assessmentId)
  await deleteDoc(assessmentRef)
}
