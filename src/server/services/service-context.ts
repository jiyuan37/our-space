import type { Prisma, PrismaClient } from "@prisma/client";

export type DatabaseClient = PrismaClient | Prisma.TransactionClient;

export type ServiceContext = Readonly<{
  db: DatabaseClient;
  actorUserId: string;
}>;

/**
 * Service 是权限、业务规则和事务的唯一归属层。
 * Server Actions 与 Route Handlers 只能构造上下文、校验传输格式并映射结果。
 */
export function createServiceContext(
  db: DatabaseClient,
  actorUserId: string,
): ServiceContext {
  return { db, actorUserId };
}
