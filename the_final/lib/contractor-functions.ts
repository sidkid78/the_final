import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./config"
import type { ContractorProfile } from "@/lib/user"

// NOTE: getContractorProfile has been moved to server-admin-functions.ts
// This file contains only client-safe functions that use the client SDK

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
