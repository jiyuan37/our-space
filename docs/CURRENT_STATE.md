# Our Space — 当前状态

最后更新：2026-07-28

最后验证日期：2026-07-28

## 当前 Phase

- 当前 Phase：Phase 2 — 身份认证与 Space。
- 当前状态：Phase 2 已完成实施与本地验证，等待最终 Review。
- 实际项目根目录：`/Users/yuan/Desktop/our-space`
- 下一项是否已获批准：否。
- **Phase 3 尚未获得批准，不得开始。**

## Git 连续性

- 远程仓库：`https://github.khoury.northeastern.edu/liujiyuan/our-space.git`
- 仓库可见性：Private
- 默认分支：`main`
- Phase 1 最后验证代码提交：`1d277064a27ab29105e890bcf0f2373ac3b42196`
- 后续文档连续性提交：`49eadaa1bdf40925cd7bfbf1c30565dab427841e`；该提交只更新文档，不改变 Phase 1 代码验证基线。
- 同步状态：当前本地 `main` 与 `origin/main` 同步。
- 核对证据：`git fetch --prune origin` 成功；`git rev-list --left-right --count main...origin/main` 返回 `0 0`。
- 安全要求：若实际 Git 状态与本节不一致，必须停止并报告；不得自行 force push、reset 或覆盖远程历史。
- 秘密管理：不得记录密码、Token、SSH 私钥或任何环境变量秘密。

## 已完成内容

- Next.js 15、React 19、严格模式 TypeScript 和 Tailwind CSS 4 基础工程。
- PostgreSQL 16、Prisma Schema 和首个 migration。
- Space 与 Resident 生命周期字段和数据库完整性约束。
- 可复现 Docker Compose PostgreSQL 开发配置。
- Zod 环境变量验证和 `.env.example`。
- 基础 Design Tokens、最小应用 Shell、Domain Errors 和 Service 层约定。
- Vitest、Testing Library 和 Playwright 配置。
- 应用工程已从误用的 `docs` 目录迁移到真实项目根目录；旧 `node_modules`、`.next` 和测试生成目录未移动。
- 根目录 `AGENTS.md` 与 Phase 连续性文档。
- Phase 1 已通过最终 Review。
- Credentials/JWT session、email 规范化、Argon2id、Space/OWNER Resident 事务、Invitation lifecycle、授权、限流和真实数据库/E2E 已实施。

## 尚未完成内容

- Phase 3 及后续功能：Home、Presence、Life Point、Response、Shared Moment、Visit 和 Settings。
- 尚未选择或安装与当前运行时兼容的精确 Auth.js/NextAuth 和 Argon2id package 版本；必须在 Phase 2 获准后依据官方文档与 package metadata 验证，且不得无证据采用 prerelease。
- 现有 Invitation Schema 仍使用 `token` 字段，尚未实施 token hash 命名、单一有效 `PENDING` Invitation 和 `acceptedAt` 生命周期约束；这些属于未来获批 Phase 2 migration。
- 实际浏览器 E2E 尚不属于本轮强制执行项；本轮只要求 `test:e2e:list`。

## 数据库与 migration 状态

- Provider：PostgreSQL 16。
- Migration：`20260728060000_foundation`。
- Migration 文件在目录修正中只移动、未修改、未重新生成。
- 目录修正前曾在全新 PostgreSQL 16.14 数据库成功应用。
- 目录修正后已从真实项目根目录再次在全新 PostgreSQL 16.14 数据库成功执行 `prisma migrate deploy`；只发现并应用 `20260728060000_foundation`。
- Migration SHA-256：`69a9a905bc0d713a9fb57bf68a7aaaf436899c83472a207313708874df0df20f`。

## 验证状态

| 检查                        | 当前状态                                            |
| --------------------------- | --------------------------------------------------- |
| `npm ci`                    | 通过；安装 467 个 package                           |
| `npm run prisma:generate`   | 通过；Prisma Client 6.19.3                          |
| `npm run prisma:validate`   | 通过                                                |
| `npm run lint`              | 通过；0 warning                                     |
| `npm run typecheck`         | 通过                                                |
| `npm test`                  | 通过；4 个测试文件、8 个测试                        |
| `npm run format:check`      | 通过                                                |
| `npm run test:e2e:list`     | 通过；2 个项目测试                                  |
| 实际浏览器 E2E              | 未运行；本轮不要求                                  |
| `npm run build`             | 通过；Next.js 15.5.22 production build              |
| `npm run db:migrate:deploy` | 通过；全新 PostgreSQL 16.14 数据库成功应用 1 项迁移 |
| `npm audit --omit=dev`      | 通过；0 vulnerabilities                             |

## 当前阻塞与已知限制

- 当前主机未提供 Docker CLI，需要使用一次性 PostgreSQL 16 进程验证 clean migration；Docker Compose 真实启动 smoke test 仍需在具备 Docker 的主机完成。
- 当前主机默认 `node` 为 `v24.15.0`，不是项目要求的 Node.js 22；本轮使用隔离的 Node.js `v22.23.1` 完成验证，未安装系统级软件。开发者进入仓库后应运行 `nvm use`。
- Playwright 浏览器尚未下载，因此不运行实际浏览器 E2E。
- 其他限制与技术债见 [`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md)。
