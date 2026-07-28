import { Prisma } from "@prisma/client";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/validation/email";
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
} from "@/server/errors/domain-error";
import type { DatabaseClient } from "@/server/services/service-context";

export type SafeUser = Readonly<{ id: string; email: string; name: string }>;

export class AuthService {
  constructor(private readonly db: DatabaseClient) {}

  async register(input: {
    email: string;
    password: string;
    name: string;
  }): Promise<SafeUser> {
    const email = normalizeEmail(input.email);
    const name = input.name.trim();
    const passwordHash = await hashPassword(input.password);
    try {
      return await this.db.user.create({
        data: { email, name, passwordHash },
        select: { id: true, email: true, name: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new EmailAlreadyRegisteredError();
      }
      throw error;
    }
  }

  async verifyCredentials(input: {
    email: string;
    password: string;
  }): Promise<SafeUser> {
    const email = normalizeEmail(input.email);
    const user = await this.db.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true },
    });
    if (
      !user?.passwordHash ||
      !(await verifyPassword(user.passwordHash, input.password))
    ) {
      throw new InvalidCredentialsError();
    }
    return { id: user.id, email: user.email, name: user.name };
  }
}
