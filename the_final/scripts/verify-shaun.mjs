// Verify contractor by email
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
const email = "shaun@yourhomease.com"

console.log(`Looking for user: ${email}`)

const snapshot = await db.collection("users").where("email", "==", email).get()

if (snapshot.empty) {
    console.log(`❌ No user found with email: ${email}`)
} else {
    const doc = snapshot.docs[0]
    const data = doc.data()

    console.log(`\n✅ Found user:`)
    console.log(`   UID: ${doc.id}`)
    console.log(`   Email: ${data.email}`)
    console.log(`   Role: ${data.role}`)
    console.log(`   Verified (before): ${data.verified || false}`)

    // Verify the contractor
    await db.collection("users").doc(doc.id).update({
        verified: true,
        updatedAt: new Date()
    })

    console.log(`\n✅ User verified successfully!`)
    console.log(`   Verified (after): true`)

    if (data.role === "contractor") {
        console.log(`\n📋 Contractor Status:`)
        console.log(`   Stripe Onboarding Complete: ${data.stripeOnboardingComplete || false}`)
        if (!data.stripeOnboardingComplete) {
            console.log(`   ⚠️  Still needs to complete Stripe onboarding to receive leads`)
        } else {
            console.log(`   ✅ Ready to receive leads!`)
        }
    }
}
