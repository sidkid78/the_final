// List all users
import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { config } from "dotenv"

config({ path: ".env.local" })

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "")
    .replace(/\\n/g, "\n")
    .replace(/^"|"$/g, "")

initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
})

const db = getFirestore()
const snapshot = await db.collection("users").get()

console.log(`\nFound ${snapshot.docs.length} users:\n`)

snapshot.docs.forEach(doc => {
    const data = doc.data()
    console.log(`UID: ${doc.id}`)
    console.log(`  Email: ${data.email}`)
    console.log(`  Role: ${data.role}`)
    console.log(`  Verified: ${data.verified || false}`)
    if (data.role === "contractor") {
        console.log(`  Stripe Onboarding: ${data.stripeOnboardingComplete || false}`)
    }
    console.log("")
})
