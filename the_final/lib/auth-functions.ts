import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  type User,
} from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "./config"
import type { UserRole, AnyUserProfile } from "@/lib/user"

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  role: UserRole = "homeowner",
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  await updateProfile(user, { displayName })

  // Create user profile in Firestore
  // Cast role to specific type to satisfy TypeScript, or use generic user profile base
  const baseProfile = {
    uid: user.uid,
    email: user.email!,
    displayName,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // We construct the full object based on role
  let userProfile: Partial<AnyUserProfile> = { ...baseProfile }

  if (role === "contractor") {
    userProfile = {
      ...baseProfile,
      role: "contractor",
      stripeOnboardingComplete: false,
      verified: false,
      serviceAreas: [],
      services: [],
    }
  } else if (role === "admin") {
     userProfile = {
      ...baseProfile,
      role: "admin",
      permissions: []
    }
  }

  await setDoc(doc(db, "users", user.uid), {
    ...userProfile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await sendEmailVerification(user)

  return user
}

export async function signIn(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

export async function getUserProfile(uid: string) {
  const userDoc = await getDoc(doc(db, "users", uid))
  if (userDoc.exists()) {
    return userDoc.data()
  }
  return null
}

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}
