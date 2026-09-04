# Our Space — Phase 3 Implementation Evidence

最后更新：2026-09-03

## 状态

**Phase 3 implementation 已完成，等待独立 Phase 3 Final Review。**

本文档只记录 implementation scope 与可复验证据，不自行给出 Final Review `PASS`，也不授权开始 Phase 4。

## 已实现范围

- Application Shell、Quiet Home、Space identity、两名 ACTIVE Resident presentation。
- Single Home + secondary Space/account menu；Phase 2 Invitation/account management 仍可访问。
- Presence `shortText` display、本人 inline update/upsert、显式 clear 与 Quiet State。
- 查看者浏览器本地日历日 freshness；跨日不展示旧 Presence、不展示 exact age、不删除数据库记录。
- typed `zh-CN` / `en-US` i18n、`zh-CN` fallback、HttpOnly cookie persistence、locale-independent URL，以及 Auth/Invitation/Space/error/Accessibility/formatter 统一 locale layer。
- desktop/mobile responsive、44px touch targets、visible focus、semantic headings/landmarks、ARIA live announcement、browser back editor close 与 reduced-motion。

未实施 Life Point、Response、Shared Moment、Visit、Memory、AI、notification 或 Phase 4 media workflow。Phase 3 未修改 Prisma Schema，未新增 migration 或核心实体。

## Presence 与安全边界

- `HomeService` 只查询当前 User 的 ACTIVE Resident 与 ACTIVE Space，返回最多两名 Resident 的有限 typed view model。
- `PresenceService` 从 session User 重新解析当前 ACTIVE Resident；mutation API 不接受目标 Resident identity，不能修改 Partner 或跨 Space Presence。
- 输入在服务端 trim；纯空白按 clear 处理；长度集中限制为 120 Unicode code points。
- `updatedAt` 保持 UTC 数据语义；浏览器纯函数按 viewer local calendar day 决定 presentation。Server/hydration 初始帧不渲染 Presence text，避免旧内容闪现。

## 数据库证据

- Provider：PostgreSQL 16.15（Homebrew）。
- 使用全新独立 Phase 3 测试数据库，不复用开发数据库。
- 现有 `20260728060000_foundation` 与 `20260728170000_phase_2_invitations`：2/2 成功应用。
- Phase 3 database integration：15/15，通过 own update/upsert、Partner/cross-membership 拒绝、clear、ACTIVE lifecycle、Home 安全模型与旧记录保留。
- No Phase 3 migration required.

## 自动验证

| 检查                       | 结果                                        |
| -------------------------- | ------------------------------------------- |
| Node / npm                 | Node `v22.22.2`；npm `10.9.7`               |
| `npm ci`                   | 通过；487 packages                          |
| Prisma generate / validate | Prisma Client `6.19.3`；Schema valid        |
| Vitest                     | 19 files / 73 tests，通过；无 required skip |
| PostgreSQL integration     | 15/15                                       |
| Playwright list / run      | 3 files、2 projects、10/10                  |
| Desktop Chrome             | 5/5                                         |
| Pixel 7 / mobile Chrome    | 5/5                                         |
| lint / typecheck / format  | 全部通过                                    |
| production build           | 通过；`/home` 为 server-rendered route      |
| `npm audit --omit=dev`     | 0 vulnerabilities                           |
| `git diff --check`         | 通过                                        |

E2E 覆盖 Quiet Home、两名 Resident、Presence edit/view/Partner non-editability/clear、`zh-CN` default、`en-US` switch/reload persistence、locale-independent URL，以及 Phase 2 Invitation callback、protected route、third Resident rejection 与 non-OWNER regression。

## 视觉验证

实际浏览器检查覆盖：

- 中文 desktop Quiet Home。
- 中文 375px mobile Quiet Home 与 inline editor。
- 中文 mobile Presence saved state。
- 英文 desktop Presence 与 inline editor。
- secondary Space/account menu。

检查结果：Home 以留白、排版、分隔线与单一编辑 surface 表达共同空间，不是 Feed、Dashboard 或 account Card Grid；两位 Resident 身份权重平等，Partner 自然优先；Quiet State 视觉完整。375px 无横向溢出，关键可见操作达到 44px，英文布局未破坏，浏览器控制台无 error/warning。

## 当前边界

- locale preference 为浏览器级 cookie，不跨设备同步；这是 Phase 3 的明确 app-layer 边界。
- 自动浏览器矩阵为 Desktop Chrome 与 Pixel 7/mobile Chrome；Safari、Firefox 与更广设备矩阵尚未验证。
- 本机没有 Docker CLI；clean migration 与 integration 使用本机独立 PostgreSQL 16.15 数据库完成。
- 完整开发依赖 audit 仍有既有工具链的 2 个 high advisory；它们不在 production graph，`npm audit --omit=dev` 为 0。

## Phase Boundary

Phase 3 implementation 已完成，等待独立 Final Review。

Phase 4 尚未开始，也未获得批准。
