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
import type { UserRole, HomeownerProfile, ContractorProfile } from "@/lib/user"

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
  const userProfile: Partial<HomeownerProfile | ContractorProfile> = {
    uid: user.uid,
    email: user.email!,
    displayName,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  if (role === "contractor") {
    ;(userProfile as Partial<ContractorProfile>).stripeOnboardingComplete = false
    ;(userProfile as Partial<ContractorProfile>).verified = false
    ;(userProfile as Partial<ContractorProfile>).serviceAreas = []
    ;(userProfile as Partial<ContractorProfile>).services = []
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
