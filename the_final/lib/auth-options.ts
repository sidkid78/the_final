import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { getAdminAuth, getAdminDb } from "@/lib/admin"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Firebase",
      credentials: {
        idToken: { label: "ID Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) return null

        try {
          const adminAuth = getAdminAuth()
          const decodedToken = await adminAuth.verifyIdToken(credentials.idToken)

          const adminDb = getAdminDb()
          const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get()
          const userData = userDoc.data()

          console.log("--- AUTH DEBUG ---")
          console.log("UID:", decodedToken.uid)
          console.log("Firestore Doc Exists:", userDoc.exists)
          console.log("Role in Firestore:", userData?.role)
          console.log("------------------")

          return {
            id: decodedToken.uid,
            email: decodedToken.email || "",
            name: decodedToken.name || userData?.displayName || "",
            image: decodedToken.picture || userData?.photoURL || "",
            role: userData?.role || "homeowner",
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}
