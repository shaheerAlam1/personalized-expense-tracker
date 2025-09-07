import type { NextAuthOptions } from "next-auth"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { compare } from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().toLowerCase().trim()
        const password = credentials?.password?.toString()
        if (!email || !password) return null
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user?.passwordHash) return null
        const ok = await compare(password, user.passwordHash)
        if (!ok) return null
        return { id: user.id, name: user.name ?? null, email: user.email ?? null, image: user.image ?? null }
      },
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) (session.user as { id: string }).id = (user as { id: string }).id
      return session
    },
  },
  events: {
    async signIn({ user }) {
      try {
        const count = await prisma.membership.count({ where: { userId: user.id } })
        if (count === 0) {
          await prisma.group.create({
            data: {
              name: "My Group",
              currency: process.env.CURRENCY || "PKR",
              memberships: { create: { userId: user.id, role: "OWNER" } },
            },
          })
        }
      } catch {
        // best-effort, ignore errors to not block login
      }
    },
  },
}
