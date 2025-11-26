import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  Timestamp,
  getCountFromServer,
} from "firebase/firestore"
import { db } from "./config"
import type { AnyUserProfile, ContractorProfile } from "@/lib/user"
import type { Lead } from "@/lib/lead"

export interface AdminStats {
  totalUsers: number
  totalHomeowners: number
  totalContractors: number
  verifiedContractors: number
  pendingVerifications: number
  totalLeads: number
  activeLeads: number
  completedLeads: number
  totalRevenue: number
}

export async function getAdminStats(): Promise<AdminStats> {
  const usersRef = collection(db, "users")
  const leadsRef = collection(db, "leads")

  // Get user counts
  const totalUsersSnap = await getCountFromServer(usersRef)
  const homeownersSnap = await getCountFromServer(query(usersRef, where("role", "==", "homeowner")))
  const contractorsSnap = await getCountFromServer(query(usersRef, where("role", "==", "contractor")))
  const verifiedSnap = await getCountFromServer(
    query(usersRef, where("role", "==", "contractor"), where("verified", "==", true)),
  )
  const pendingSnap = await getCountFromServer(
    query(usersRef, where("role", "==", "contractor"), where("verified", "==", false)),
  )

  // Get lead counts
  const totalLeadsSnap = await getCountFromServer(leadsRef)
  const activeLeadsSnap = await getCountFromServer(
    query(leadsRef, where("status", "in", ["pending", "matched", "quoted"])),
  )
  const completedLeadsSnap = await getCountFromServer(query(leadsRef, where("status", "==", "completed")))

  // Calculate revenue from completed leads (simplified)
  const completedLeads = await getDocs(query(leadsRef, where("status", "==", "completed")))
  let totalRevenue = 0
  completedLeads.forEach((doc) => {
    const data = doc.data()
    if (data.acceptedQuote?.totalPrice) {
      // Platform takes 10% commission
      totalRevenue += data.acceptedQuote.totalPrice * 0.1
    }
  })

  return {
    totalUsers: totalUsersSnap.data().count,
    totalHomeowners: homeownersSnap.data().count,
    totalContractors: contractorsSnap.data().count,
    verifiedContractors: verifiedSnap.data().count,
    pendingVerifications: pendingSnap.data().count,
    totalLeads: totalLeadsSnap.data().count,
    activeLeads: activeLeadsSnap.data().count,
    completedLeads: completedLeadsSnap.data().count,
    totalRevenue,
  }
}

export async function getAllUsers(roleFilter?: string, limitCount = 50): Promise<AnyUserProfile[]> {
  const usersRef = collection(db, "users")
  let q = query(usersRef, orderBy("createdAt", "desc"), limit(limitCount))

  if (roleFilter && roleFilter !== "all") {
    q = query(usersRef, where("role", "==", roleFilter), orderBy("createdAt", "desc"), limit(limitCount))
  }

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      ...data,
      uid: doc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as AnyUserProfile
  })
}

export async function getPendingContractors(): Promise<ContractorProfile[]> {
  const usersRef = collection(db, "users")
  const q = query(
    usersRef,
    where("role", "==", "contractor"),
    where("verified", "==", false),
    orderBy("createdAt", "desc"),
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      ...data,
      uid: doc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as ContractorProfile
  })
}

export async function verifyContractor(contractorId: string): Promise<void> {
  const userRef = doc(db, "users", contractorId)
  await updateDoc(userRef, {
    verified: true,
    updatedAt: Timestamp.now(),
  })
}

export async function suspendUser(userId: string, suspended: boolean): Promise<void> {
  const userRef = doc(db, "users", userId)
  await updateDoc(userRef, {
    suspended,
    updatedAt: Timestamp.now(),
  })
}

export async function getAllLeads(statusFilter?: string, limitCount = 50): Promise<Lead[]> {
  const leadsRef = collection(db, "leads")
  let q = query(leadsRef, orderBy("createdAt", "desc"), limit(limitCount))

  if (statusFilter && statusFilter !== "all") {
    q = query(leadsRef, where("status", "==", statusFilter), orderBy("createdAt", "desc"), limit(limitCount))
  }

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Lead
  })
}

export async function getRecentActivity(limitCount = 20): Promise<
  {
    type: string
    message: string
    timestamp: Date
    userId?: string
  }[]
> {
  // Get recent users
  const usersRef = collection(db, "users")
  const recentUsers = await getDocs(query(usersRef, orderBy("createdAt", "desc"), limit(limitCount / 2)))

  // Get recent leads
  const leadsRef = collection(db, "leads")
  const recentLeads = await getDocs(query(leadsRef, orderBy("createdAt", "desc"), limit(limitCount / 2)))

  const activity: { type: string; message: string; timestamp: Date; userId?: string }[] = []

  recentUsers.forEach((doc) => {
    const data = doc.data()
    activity.push({
      type: "user_joined",
      message: `${data.displayName || data.email} joined as ${data.role}`,
      timestamp: data.createdAt?.toDate() || new Date(),
      userId: doc.id,
    })
  })

  recentLeads.forEach((doc) => {
    const data = doc.data()
    activity.push({
      type: "lead_created",
      message: `New lead created: ${data.title || "Untitled"}`,
      timestamp: data.createdAt?.toDate() || new Date(),
    })
  })

  // Sort by timestamp descending
  activity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return activity.slice(0, limitCount)
}
