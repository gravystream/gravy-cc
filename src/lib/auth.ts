import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
 
export const authOptions: any = {
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
 
        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });
 
        if (!user || !user.passwordHash) return null;
 
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
 
        if (!isValid) return null;
 
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, account }: any) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
 
        if (account?.provider === "google") {
          const [creatorProfile, brandProfile] = await Promise.all([
            db.creatorProfile.findUnique({ where: { userId: user.id! } }),
            db.brandProfile.findUnique({ where: { userId: user.id! } }),
          ]);
          token.needsOnboarding = !creatorProfile && !brandProfile;
        } else {
          token.needsOnboarding = false;
        }
      }
 
      if (trigger === "update") {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          include: {
            creatorProfile: true,
            brandProfile: true,
          },
        });
 
        if (dbUser) {
          token.role = dbUser.role;
          token.needsOnboarding = !dbUser.creatorProfile && !dbUser.brandProfile;
        }
      }
 
      return token;
    },
    async session({ session, token }: any) {
      if (token && session.user) {
        (session.user as { role?: unknown; id?: unknown; needsOnboarding?: unknown }).role = token.role;
        (session.user as { role?: unknown; id?: unknown; needsOnboarding?: unknown }).id = token.id;
        (session.user as { role?: unknown; id?: unknown; needsOnboarding?: unknown }).needsOnboarding = token.needsOnboarding;
      }
      return session;
    },
  },
};
 
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
