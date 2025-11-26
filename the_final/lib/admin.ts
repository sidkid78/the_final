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
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

    console.log("--- ADMIN SDK INIT ---")
    console.log("Project ID:", projectId)
    console.log("Client Email:", clientEmail)
    console.log("Private Key exists:", !!privateKey)
    if (privateKey) {
      console.log("Key Start:", privateKey.substring(0, 50))
    }
    console.log("----------------------")

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Missing Firebase Admin credentials in environment variables")
    }

    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
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
