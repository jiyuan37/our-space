import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { AuthService } from "@/server/services/auth-service";
import { getClientIp } from "@/lib/http/client-ip";
import { rateLimiter } from "@/server/rate-limit/default-limiter";
import {
  enforceLoginRateLimits,
  type RateLimiter,
} from "@/server/rate-limit/rate-limiter";
import { normalizeEmail } from "@/lib/validation/email";
import {
  InvalidCredentialsError,
  RateLimitExceededError,
} from "@/server/errors/domain-error";
import {
  LOGIN_RATE_LIMIT_ERROR_CODE,
  LOGIN_UNAVAILABLE_ERROR_CODE,
} from "@/lib/auth/auth-error-codes";

const credentialsSchema = z.object({ email: z.string(), password: z.string() });

type CredentialRequest = {
  headers?: Record<string, string | string[] | undefined>;
};

type CredentialVerifier = {
  verifyCredentials(input: {
    email: string;
    password: string;
  }): Promise<{ id: string; email: string; name: string }>;
};

export function sessionUserFromToken(token: {
  userId: string;
  email: string;
  name: string;
}) {
  return { userId: token.userId, email: token.email, name: token.name };
}

export async function authorizeCredentials(
  credentials: Record<string, string> | undefined,
  request: CredentialRequest,
  dependencies: {
    limiter: RateLimiter;
    verifier: CredentialVerifier;
  } = {
    limiter: rateLimiter,
    verifier: new AuthService(prisma),
  },
) {
  const parsed = credentialsSchema.safeParse(credentials);
  if (!parsed.success) return null;

  try {
    const email = normalizeEmail(parsed.data.email);
    const requestHeaders = {
      get: (name: string) => {
        const value = request.headers?.[name];
        return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
      },
    };
    await enforceLoginRateLimits(
      dependencies.limiter,
      email,
      getClientIp(requestHeaders),
    );
    const user = await dependencies.verifier.verifyCredentials(parsed.data);
    return { id: user.id, email: user.email, name: user.name };
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      throw new Error(LOGIN_RATE_LIMIT_ERROR_CODE);
    }
    if (
      error instanceof InvalidCredentialsError ||
      error instanceof z.ZodError
    ) {
      return null;
    }
    throw new Error(LOGIN_UNAVAILABLE_ERROR_CODE);
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(credentials, request) {
        return authorizeCredentials(credentials, request);
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
      session.user = sessionUserFromToken(token);
      return session;
    },
  },
};
