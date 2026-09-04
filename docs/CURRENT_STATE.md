# Our Space — 当前状态

最后更新：2026-09-03

## 当前 Phase

- 当前 Phase：Phase 2 — 已完成并通过最终 Review。
- 当前状态：**Phase 2 Closure Review 已通过，结论为 `PASS`。**
- 实际项目根目录：`/Users/yuan/Desktop/our-space`。
- 下一项是否已获批准：否。
- Phase 3 前置 UI/UX Review 已完成，Design Direction 已完成收口。
- **Phase 3 尚未开始，尚未获得 implementation 批准。**

## Git 连续性

- 正式远程仓库：`https://github.com/jiyuan37/our-space.git`。
- `origin` 与 `public` 当前都指向该仓库；remote 名称整理不属于 Phase 2 Repair。
- 默认分支：`main`。
- Phase 1 最后验证代码提交：`1d277064a27ab29105e890bcf0f2373ac3b42196`。
- Phase 2 实施基线：`f2e8f518db8516a33abfac32ce7aa73d354347b5`。
- Phase 2 最终通过提交：`0c37e4acfbce8775a22bc5d7bf4feea1433048c5`。
- Phase 2 Closure Review 开始时已成功执行 `git fetch origin`；`main...origin/main` 为 `0 0`，工作树干净。

## Phase 2 已实现能力

- Credentials 注册、登录、登出和最小 JWT session。
- Email 规范化和 Argon2id 密码 hash/verify。
- `/space` protected route。
- Space 与 OWNER Resident 原子创建，以及单一 ACTIVE Space 数据库保护。
- Invitation token hash、创建、preview、撤销、过期、email 限制和 Serializable 接受。
- 双维度 RateLimiter、typed domain errors 和 Phase 2 响应式表单 UI。

## 本轮 Repair 已完成

- 修正 Invitation create/preview/accept 与 login/register 的 RateLimiter 入口接线。
- NextAuth Credentials 将 rate limit 映射为可识别的安全错误码，同时保留统一 invalid credentials 行为。
- Invitation 登录/注册 callback 使用仅允许站内相对路径的 sanitizer。
- Space 并发创建的 ACTIVE Resident `P2002` 映射为 `ActiveSpaceAlreadyExistsError`。
- revoke 等 Server Action 统一返回平静的 typed error view model。
- 无 `TEST_DATABASE_URL` 时 integration suite 可明确 skip，不再在 module load 崩溃。
- 扩充 Auth、Space、Invitation lifecycle、authorization、preview 和 concurrency integration tests。
- 扩充 desktop Chrome 与 Pixel 7 E2E，包括 callback、两名 Resident、第三人拒绝和非 OWNER 拒绝。
- 修复 E2E 登录 helper 未等待 Credentials response 的同步缺口，并收窄 Space full alert locator；未改变认证、callback 或限流产品逻辑。
- Production dependency override 锁定 `deepmerge-ts@8.0.2` 与 `nanoid@3.3.18`；`npm audit --omit=dev` 当前为 0。

## 尚未开始

- Phase 3 及后续功能：Home、Presence、Life Point、Response、Shared Moment、Visit 和 Settings。
- Phase 3 i18n architecture 尚未实现；现有 Phase 2 UI 仍不代表最终 `zh-CN` / `en-US` 产品文案边界。
- Seed data 与 demo account 属于后续阶段。

## Phase 3 已收口的设计基线

- 正式采用 Direction A — Quiet Home / 安静的家；完整规则记录于 `docs/PHASE_3_DESIGN.md`。
- Home 是共同存在的地方，不是 Feed、Dashboard 或内容容器；Silence 是完整状态。
- Phase 3 使用 Single Home + secondary Space/account menu，不展示未来空 tab、disabled navigation 或 Phase 4+ placeholder。
- Presence 首版只暴露 `shortText`，使用 inline editing；它可选、可清除，不是在线、位置、活动或关系状态。
- Presence 只属于查看者的当前浏览器本地日历日；跨日后旧 Presence 不再展示，Home 回到 Quiet State，不新增 timezone 字段。
- 默认 locale 为 `zh-CN`，同时支持 `en-US`；Phase 3 必须建立统一 i18n architecture，现有 authenticated/private URL 与 Invitation callback 保持语言无关。
- Design Constitution、视觉、motion、mobile、Accessibility、Privacy-as-UI 和 Review blocker 见 `docs/PHASE_3_DESIGN.md`；长期决策见 DEC-044 至 DEC-046。
- 本节只记录实施前设计决定，不构成 Phase 3 implementation 批准。

## Migration 状态

- Provider：PostgreSQL 16。
- Foundation migration：`20260728060000_foundation`。
- Phase 2 migration：`20260728170000_phase_2_invitations`。
- Foundation migration SHA-256：`69a9a905bc0d713a9fb57bf68a7aaaf436899c83472a207313708874df0df20f`。
- Repair 未修改 Prisma Schema 或任何 migration。

## 当前验证状态

| 检查                                        | 当前结果                                    |
| ------------------------------------------- | ------------------------------------------- |
| Node.js                                     | `v22.22.2`                                  |
| `npm ci`                                    | 通过；安全 override 已实际安装              |
| `npm run prisma:generate`                   | 通过；Prisma Client 6.19.3                  |
| `npm run prisma:validate`                   | 通过                                        |
| `npm run lint`                              | 通过                                        |
| `npm run typecheck`                         | 通过                                        |
| `npm test`                                  | 通过；14 files / 50 tests，无 required skip |
| Phase 2 database integration                | 通过；10/10                                 |
| `npm audit --omit=dev`                      | 通过；0 vulnerabilities                     |
| Argon2id smoke                              | 通过；2/2                                   |
| PostgreSQL integration / clean migration    | PostgreSQL 16.15；2/2 migrations            |
| concurrency                                 | 最大 ACTIVE Resident = 2；违规 Space = 0    |
| 真实 E2E                                    | 通过；desktop Chrome + Pixel 7，6/6         |
| `npm run build`                             | 通过                                        |
| `npm run format:check` / `git diff --check` | 通过                                        |

## 安全要求

- 不得使用 `DATABASE_URL` 代替独立 `TEST_DATABASE_URL`。
- 不得记录密码、Invitation raw token、hash、认证 secret 或数据库凭据。
- Phase 2 已完成并通过最终 Review；Phase 3 前置设计已收口；本状态不构成 Phase 3 implementation 批准。
