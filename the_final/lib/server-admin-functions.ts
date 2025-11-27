import { getAdminDb } from "@/lib/admin"
import type { Assessment } from "@/lib/assessment"
import { Timestamp } from "firebase-admin/firestore"

export async function getAssessmentsForUser(userId: string): Promise<Assessment[]> {
  const db = getAdminDb()
  const snapshot = await db
    .collection("assessments")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get()

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

export async function getAssessmentById(assessmentId: string): Promise<Assessment | null> {
  const db = getAdminDb()
  const docSnapshot = await db.collection("assessments").doc(assessmentId).get()

  if (!docSnapshot.exists) {
    return null
  }

  const data = docSnapshot.data()
  if (!data) return null

  return {
    id: docSnapshot.id,
    ...data,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined,
  } as Assessment
}
