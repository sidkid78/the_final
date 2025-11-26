import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "./config"
import type { ContractorProfile } from "@/lib/user"
import type { Lead } from "@/lib/lead"
import { addMatchedContractor, createNotification } from "./lead-functions"

interface ContractorMatch {
  contractor: ContractorProfile
  score: number
  matchReasons: string[]
}

export async function findMatchingContractors(lead: Lead): Promise<ContractorMatch[]> {
  // Get all verified contractors
  const contractorsRef = collection(db, "users")
  const q = query(
    contractorsRef,
    where("role", "==", "contractor"),
    where("verified", "==", true),
    where("stripeOnboardingComplete", "==", true),
  )

  const snapshot = await getDocs(q)
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
        area.toLowerCase().includes(lead.address.city.toLowerCase()),
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
          service.toLowerCase().includes(type.toLowerCase()) || type.toLowerCase().includes(service.toLowerCase()),
      ),
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

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score)

  // Return top 5 matches
  return matches.slice(0, 5)
}

export async function matchLeadToContractors(lead: Lead): Promise<string[]> {
  const matches = await findMatchingContractors(lead)
  const matchedIds: string[] = []

  for (const match of matches) {
    await addMatchedContractor(lead.id, match.contractor.uid)
    matchedIds.push(match.contractor.uid)

    // Create notification for contractor
    await createNotification({
      leadId: lead.id,
      contractorId: match.contractor.uid,
      type: "new_lead",
    })
  }

  return matchedIds
}
