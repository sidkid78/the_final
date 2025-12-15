import { initializeApp, getApps, cert, type App } from "firebase-admin/app"
import { getAuth, type Auth } from "firebase-admin/auth"
import { getFirestore, type Firestore } from "firebase-admin/firestore"

let adminApp: App
let adminAuth: Auth
let adminDb: Firestore

function initAdmin() {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    // Handle Vercel/Env newlines and potential surrounding quotes
    const rawKey = process.env.FIREBASE_PRIVATE_KEY || ""

    let privateKey = rawKey
      .replace(/\\n/g, "\n") // Replace literal \n with newlines
      .replace(/^"|"$/g, "") // Remove surrounding quotes if present

    console.log("--- ADMIN SDK INIT ---")
    console.log("Project ID:", projectId)
    console.log("Client Email:", clientEmail)
    console.log("Key Length:", privateKey.length)

    // Basic PEM validation
    if (!privateKey.includes("-----BEGIN PRIVATE KEY-----") || !privateKey.includes("-----END PRIVATE KEY-----")) {
      console.error("ERROR: Private Key is missing PEM headers")
    }

    if (privateKey.length < 100) {
      console.error("ERROR: Private Key is too short, likely invalid or empty")
    }

    console.log("----------------------")

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Missing Firebase Admin credentials in environment variables")
    }

    try {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      })
    } catch (error) {
      console.error("Firebase Admin Initialization Error:", error)
      throw error
    }
  } else {
    adminApp = getApps()[0]
  }

  adminAuth = getAuth(adminApp)
  adminDb = getFirestore(adminApp)

  return { adminApp, adminAuth, adminDb }
}

export function getAdminAuth(): Auth {
  if (!adminAuth) initAdmin()
  return adminAuth
}

export function getAdminDb(): Firestore {
  if (!adminDb) initAdmin()
  return adminDb
}
