import { z } from "zod";

const serverEnvSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_URL: z.string().url("APP_URL 必须是有效 URL"),
    NEXTAUTH_URL: z.string().url("NEXTAUTH_URL 必须是有效 URL").optional(),
    AUTH_SECRET: z
      .string()
      .min(32, "AUTH_SECRET 至少需要 32 个字符")
      .optional(),
    TRUST_PROXY: z.enum(["true", "false"]).default("false"),
    DATABASE_URL: z
      .string()
      .url("DATABASE_URL 必须是有效的 PostgreSQL 连接 URL")
      .refine(
        (value) =>
          value.startsWith("postgresql://") || value.startsWith("postgres://"),
        "DATABASE_URL 必须使用 postgresql:// 或 postgres://",
      ),
    TEST_DATABASE_URL: z
      .string()
      .url("TEST_DATABASE_URL 必须是有效的 PostgreSQL 连接 URL")
      .refine(
        (value) =>
          value.startsWith("postgresql://") || value.startsWith("postgres://"),
        "TEST_DATABASE_URL 必须使用 postgresql:// 或 postgres://",
      )
      .optional(),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV === "production" && !value.AUTH_SECRET) {
      context.addIssue({
        code: "custom",
        path: ["AUTH_SECRET"],
        message: "production 必须配置 AUTH_SECRET",
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export class EnvironmentValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`环境变量验证失败：\n- ${issues.join("\n- ")}`);
    this.name = "EnvironmentValidationError";
    this.issues = issues;
  }
}

export function validateServerEnv(
  source: Record<string, string | undefined> = process.env,
): ServerEnv {
  const result = serverEnvSchema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`,
    );
    throw new EnvironmentValidationError(issues);
  }

  return result.data;
}
