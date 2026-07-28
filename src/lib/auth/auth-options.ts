import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { AuthService } from "@/server/services/auth-service";
import { getClientIp } from "@/lib/http/client-ip";
import { rateLimiter } from "@/server/rate-limit/default-limiter";
import {
  enforceRateLimit,
  privateBucket,
} from "@/server/rate-limit/rate-limiter";
import { normalizeEmail } from "@/lib/validation/email";

const credentialsSchema = z.object({ email: z.string(), password: z.string() });

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        try {
          const email = normalizeEmail(parsed.data.email);
          const headers = {
            get: (name: string) => {
              const value = request.headers?.[name];
              return Array.isArray(value)
                ? (value[0] ?? null)
                : (value ?? null);
            },
          };
          await enforceRateLimit(rateLimiter, {
            key: privateBucket("login-email", email),
            limit: 10,
            windowMs: 15 * 60_000,
          });
          await enforceRateLimit(rateLimiter, {
            key: privateBucket("login-ip", getClientIp(headers)),
            limit: 50,
            windowMs: 15 * 60_000,
          });
          const user = await new AuthService(prisma).verifyCredentials(
            parsed.data,
          );
          return { id: user.id, email: user.email, name: user.name };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      session.user = {
        userId: token.userId,
        email: token.email,
        name: token.name,
      };
      return session;
    },
  },
};
