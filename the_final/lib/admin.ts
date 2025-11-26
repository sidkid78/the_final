import { initializeApp, getApps, cert, type App } from "firebase-admin/app"
import { getAuth, type Auth } from "firebase-admin/auth"
import { getFirestore, type Firestore } from "firebase-admin/firestore"

let adminApp: App
let adminAuth: Auth
let adminDb: Firestore

function initAdmin() {
  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
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
