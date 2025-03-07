export interface Incident {
  id: string
  title: string
  description: string
  type: string
  status: string
  latitude: number
  longitude: number
  address: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
  userId: string
  user?: {
    id: string
    name: string
    email: string
  }
}

// Extend next-auth types
import "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    role: string
  }

  interface Session {
    user: User & {
      id: string
      role: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
  }
}

