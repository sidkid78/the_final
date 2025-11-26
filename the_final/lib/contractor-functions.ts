import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./config"
import type { ContractorProfile } from "@/lib/user"

export async function getContractorProfile(uid: string): Promise<ContractorProfile | null> {
  const userDoc = await getDoc(doc(db, "users", uid))

  if (!userDoc.exists()) return null

  const data = userDoc.data()
  if (data.role !== "contractor") return null

  return {
    uid: userDoc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as ContractorProfile
}

export async function updateContractorProfile(
  uid: string,
  updates: Partial<
    Pick<ContractorProfile, "companyName" | "licenseNumber" | "serviceAreas" | "services" | "phone" | "displayName">
  >,
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function updateStripeAccountId(uid: string, stripeAccountId: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    stripeAccountId,
    updatedAt: serverTimestamp(),
  })
}

export async function markStripeOnboardingComplete(uid: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    stripeOnboardingComplete: true,
    updatedAt: serverTimestamp(),
  })
}

export async function updateContractorVerification(uid: string, verified: boolean): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    verified,
    updatedAt: serverTimestamp(),
  })
}
