import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Timestamp,
  arrayUnion,
  writeBatch,
} from "firebase/firestore"
import { db } from "./config"
import type { Lead, LeadStatus, Quote, LeadNotification } from "@/lib/lead"

// Lead Functions
export async function createLead(
  leadData: Omit<Lead, "id" | "createdAt" | "updatedAt" | "matchedContractors" | "status">,
): Promise<string> {
  const leadRef = doc(collection(db, "leads"))

  const lead = {
    ...leadData,
    matchedContractors: [],
    status: "pending" as LeadStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  }

  await setDoc(leadRef, lead)
  return leadRef.id
}

export async function getLead(leadId: string): Promise<Lead | null> {
  const leadDoc = await getDoc(doc(db, "leads", leadId))

  if (!leadDoc.exists()) return null

  const data = leadDoc.data()
  return {
    id: leadDoc.id,
    ...data,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    expiresAt: data.expiresAt ? (data.expiresAt as Timestamp).toDate() : undefined,
  } as Lead
}

export async function getHomeownerLeads(homeownerId: string): Promise<Lead[]> {
  const leadsRef = collection(db, "leads")
  const q = query(leadsRef, where("homeownerId", "==", homeownerId), orderBy("createdAt", "desc"))

  const snapshot = await getDocs(q)
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

export async function getContractorLeads(contractorId: string): Promise<Lead[]> {
  const leadsRef = collection(db, "leads")
  const q = query(
    leadsRef,
    where("matchedContractors", "array-contains", contractorId),
    where("status", "in", ["matched", "quoted"]),
    orderBy("createdAt", "desc"),
  )

  const snapshot = await getDocs(q)
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

export async function updateLeadStatus(leadId: string, status: LeadStatus): Promise<void> {
  await updateDoc(doc(db, "leads", leadId), {
    status,
    updatedAt: serverTimestamp(),
  })
}

export async function addMatchedContractor(leadId: string, contractorId: string): Promise<void> {
  await updateDoc(doc(db, "leads", leadId), {
    matchedContractors: arrayUnion(contractorId),
    status: "matched",
    updatedAt: serverTimestamp(),
  })
}

// Quote Functions
export async function createQuote(
  quoteData: Omit<Quote, "id" | "createdAt" | "updatedAt" | "status">,
): Promise<string> {
  const quoteRef = doc(collection(db, "quotes"))

  const quote = {
    ...quoteData,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(quoteRef, quote)

  // Update lead status
  await updateDoc(doc(db, "leads", quoteData.leadId), {
    status: "quoted",
    updatedAt: serverTimestamp(),
  })

  return quoteRef.id
}

export async function getQuote(quoteId: string): Promise<Quote | null> {
  const quoteDoc = await getDoc(doc(db, "quotes", quoteId))

  if (!quoteDoc.exists()) return null

  const data = quoteDoc.data()
  return {
    id: quoteDoc.id,
    ...data,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    validUntil: (data.validUntil as Timestamp)?.toDate() || new Date(),
  } as Quote
}

export async function getLeadQuotes(leadId: string): Promise<Quote[]> {
  const quotesRef = collection(db, "quotes")
  const q = query(quotesRef, where("leadId", "==", leadId), orderBy("createdAt", "desc"))

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      validUntil: (data.validUntil as Timestamp)?.toDate() || new Date(),
    } as Quote
  })
}

export async function getContractorQuotes(contractorId: string): Promise<Quote[]> {
  const quotesRef = collection(db, "quotes")
  const q = query(quotesRef, where("contractorId", "==", contractorId), orderBy("createdAt", "desc"))

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      validUntil: (data.validUntil as Timestamp)?.toDate() || new Date(),
    } as Quote
  })
}

export async function updateQuoteStatus(quoteId: string, status: Quote["status"]): Promise<void> {
  await updateDoc(doc(db, "quotes", quoteId), {
    status,
    updatedAt: serverTimestamp(),
  })
}

export async function acceptQuote(quoteId: string, leadId: string): Promise<void> {
  const batch = writeBatch(db)

  // Update the accepted quote
  batch.update(doc(db, "quotes", quoteId), {
    status: "accepted",
    updatedAt: serverTimestamp(),
  })

  // Update lead status
  batch.update(doc(db, "leads", leadId), {
    status: "accepted",
    updatedAt: serverTimestamp(),
  })

  // Reject other quotes for this lead
  const otherQuotes = await getDocs(query(collection(db, "quotes"), where("leadId", "==", leadId)))

  otherQuotes.docs.forEach((quoteDoc) => {
    if (quoteDoc.id !== quoteId && quoteDoc.data().status === "pending") {
      batch.update(quoteDoc.ref, {
        status: "rejected",
        updatedAt: serverTimestamp(),
      })
    }
  })

  await batch.commit()
}

// Notification Functions
export async function createNotification(
  notification: Omit<LeadNotification, "id" | "createdAt" | "read">,
): Promise<void> {
  const notifRef = doc(collection(db, "notifications"))
  await setDoc(notifRef, {
    ...notification,
    read: false,
    createdAt: serverTimestamp(),
  })
}

export async function getContractorNotifications(contractorId: string): Promise<LeadNotification[]> {
  const notifsRef = collection(db, "notifications")
  const q = query(notifsRef, where("contractorId", "==", contractorId), orderBy("createdAt", "desc"))

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    } as LeadNotification
  })
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, "notifications", notificationId), {
    read: true,
  })
}
