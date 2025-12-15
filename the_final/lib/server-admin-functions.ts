import { getAdminDb } from "@/lib/admin"
import type { Assessment } from "@/lib/assessment"
import type { Lead, LeadStatus, LeadNotification } from "@/lib/lead"
import type { ContractorProfile } from "@/lib/user"
import { Timestamp, FieldValue } from "firebase-admin/firestore"

function convertAssessmentData(docId: string, data: any): Assessment {
  return {
    id: docId,
    ...data,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined,
    rooms: Array.isArray(data.rooms)
      ? data.rooms.map((room: any) => ({
        ...room,
        analyzedAt: room.analyzedAt instanceof Timestamp ? room.analyzedAt.toDate() : new Date(room.analyzedAt || Date.now()),
      }))
      : [],
  } as Assessment
}

// --- Contractor Profile Functions (Admin SDK) ---

export async function getContractorProfile(uid: string): Promise<ContractorProfile | null> {
  const db = getAdminDb()
  const userDoc = await db.collection("users").doc(uid).get()

  if (!userDoc.exists) return null

  const data = userDoc.data()
  if (!data || data.role !== "contractor") return null

  return {
    uid: userDoc.id,
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  } as ContractorProfile
}

export async function updateStripeAccountId(uid: string, stripeAccountId: string): Promise<void> {
  const db = getAdminDb()
  await db.collection("users").doc(uid).update({
    stripeAccountId,
    updatedAt: FieldValue.serverTimestamp(),
  })
}

export async function markStripeOnboardingComplete(uid: string): Promise<void> {
  const db = getAdminDb()
  await db.collection("users").doc(uid).update({
    stripeOnboardingComplete: true,
    updatedAt: FieldValue.serverTimestamp(),
  })
}

export async function getAssessmentsForUser(userId: string): Promise<Assessment[]> {
  const db = getAdminDb()
  const snapshot = await db
    .collection("assessments")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get()

  return snapshot.docs.map((doc) => convertAssessmentData(doc.id, doc.data()))
}

export async function getAssessmentById(assessmentId: string): Promise<Assessment | null> {
  const db = getAdminDb()
  const docSnapshot = await db.collection("assessments").doc(assessmentId).get()

  if (!docSnapshot.exists) {
    return null
  }

  const data = docSnapshot.data()
  if (!data) return null

  return convertAssessmentData(docSnapshot.id, data)
}

// --- Lead Functions (Admin SDK) ---

export async function createLeadAdmin(
  leadData: Omit<Lead, "id" | "createdAt" | "updatedAt" | "matchedContractors" | "status" | "expiresAt" | "price" | "purchasedBy">
): Promise<string> {
  const db = getAdminDb()
  const leadRef = db.collection("leads").doc()

  const lead = {
    ...leadData,
    matchedContractors: [],
    status: "pending",
    price: 2500, // Default price: $25 in cents
    purchasedBy: [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  }

  await leadRef.set(lead)
  return leadRef.id
}

export async function getLeadAdmin(leadId: string): Promise<Lead | null> {
  const db = getAdminDb()
  const leadDoc = await db.collection("leads").doc(leadId).get()

  if (!leadDoc.exists) return null

  const data = leadDoc.data()
  if (!data) return null

  return {
    id: leadDoc.id,
    ...data,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    expiresAt: data.expiresAt ? (data.expiresAt as Timestamp).toDate() : undefined,
  } as Lead
}

interface ContractorMatch {
  contractor: ContractorProfile
  score: number
  matchReasons: string[]
}

export async function matchLeadToContractorsAdmin(lead: Lead): Promise<string[]> {
  const db = getAdminDb()

  // 1. Find Matching Contractors
  // Get all verified contractors
  const snapshot = await db.collection("users")
    .where("role", "==", "contractor")
    .where("verified", "==", true)
    .where("stripeOnboardingComplete", "==", true)
    .get()

  const contractors = snapshot.docs.map((doc) => ({
    uid: doc.id,
    ...doc.data(),
  })) as ContractorProfile[]

  // Score each contractor
  const matches: ContractorMatch[] = []

  for (const contractor of contractors) {
    let score = 0
    const matchReasons: string[] = []

    // Check service area match (by ZIP code)
    if (contractor.serviceAreas.includes(lead.address.zip)) {
      score += 40
      matchReasons.push("Serves your area")
    } else {
      // Check if any service area is in the same city/state
      const cityMatch = contractor.serviceAreas.some((area) =>
        area.toLowerCase().includes(lead.address.city.toLowerCase())
      )
      if (cityMatch) {
        score += 20
        matchReasons.push("Serves nearby areas")
      }
    }

    // Check service type match
    const serviceMatches = lead.projectType.filter((type) =>
      contractor.services.some(
        (service) =>
          service.toLowerCase().includes(type.toLowerCase()) || type.toLowerCase().includes(service.toLowerCase())
      )
    )

    if (serviceMatches.length > 0) {
      score += 30 * (serviceMatches.length / lead.projectType.length)
      matchReasons.push(`Specializes in ${serviceMatches.join(", ")}`)
    }

    // Rating bonus
    if (contractor.rating && contractor.rating >= 4.5) {
      score += 15
      matchReasons.push("Highly rated")
    } else if (contractor.rating && contractor.rating >= 4.0) {
      score += 10
      matchReasons.push("Well reviewed")
    }

    // Review count bonus
    if (contractor.reviewCount && contractor.reviewCount >= 10) {
      score += 10
      matchReasons.push("Experienced")
    }

    // Only include contractors with a minimum score
    if (score >= 30 && matchReasons.length > 0) {
      matches.push({
        contractor,
        score,
        matchReasons,
      })
    }
  }

  // Sort by score descending and take top 5
  matches.sort((a, b) => b.score - a.score)
  const topMatches = matches.slice(0, 5)
  const matchedIds: string[] = []

  // 2. Update Lead and Notify Contractors
  const batch = db.batch()

  for (const match of topMatches) {
    matchedIds.push(match.contractor.uid)

    // Create notification
    const notifRef = db.collection("notifications").doc()
    batch.set(notifRef, {
      leadId: lead.id,
      contractorId: match.contractor.uid,
      type: "new_lead",
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    })
  }

  // Update lead with matched contractors
  if (matchedIds.length > 0) {
    const leadRef = db.collection("leads").doc(lead.id)
    batch.update(leadRef, {
      matchedContractors: FieldValue.arrayUnion(...matchedIds),
      status: "matched",
      updatedAt: FieldValue.serverTimestamp()
    })
  }

  await batch.commit()

  return matchedIds
}

export async function getLeadQuotesAdmin(leadId: string): Promise<import("@/lib/lead").Quote[]> {
  const db = getAdminDb()
  const snapshot = await db
    .collection("quotes")
    .where("leadId", "==", leadId)
    .orderBy("createdAt", "desc")
    .get()

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      validUntil: (data.validUntil as Timestamp)?.toDate() || new Date(),
    } as import("@/lib/lead").Quote
  })
}

export async function getHomeownerLeadsAdmin(homeownerId: string): Promise<Lead[]> {
  const db = getAdminDb()
  const snapshot = await db
    .collection("leads")
    .where("homeownerId", "==", homeownerId)
    .orderBy("createdAt", "desc")
    .get()

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      expiresAt: data.expiresAt ? (data.expiresAt as Timestamp).toDate() : undefined,
    } as Lead
  })
}

export async function getContractorLeadsAdmin(contractorId: string): Promise<Lead[]> {
  const db = getAdminDb()
  const snapshot = await db
    .collection("leads")
    .where("matchedContractors", "array-contains", contractorId)
    .where("status", "in", ["matched", "quoted"])
    .orderBy("createdAt", "desc")
    .get()

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      expiresAt: data.expiresAt ? (data.expiresAt as Timestamp).toDate() : undefined,
    } as Lead
  })
}
