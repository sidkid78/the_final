import "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    role: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      role: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string
    role: string
  }
}
