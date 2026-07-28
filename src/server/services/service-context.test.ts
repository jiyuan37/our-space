import type { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { createServiceContext } from "@/server/services/service-context";

describe("createServiceContext", () => {
  it("将数据库入口和当前 User 固定在 Service 上下文中", () => {
    const db = {} as PrismaClient;
    const context = createServiceContext(db, "user_1");

    expect(context).toEqual({
      db,
      actorUserId: "user_1",
    });
  });
});
