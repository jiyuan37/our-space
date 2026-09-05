# Our Space — 当前状态

最后更新：2026-09-04

## 当前 Phase

- 当前 Phase：Phase 3 — Core Home / Presence 已完成；当前没有获批实施中的 Phase。
- 当前状态：**具体规格与隔离原型已完成，等待用户确认视觉和实现方案。**
- Phase 3 implementation 已完成并通过 Final Review；本轮不重做历史验收。
- 实际项目根目录：`/Users/yuan/Desktop/our-space`。
- 本轮具体规格、可行性研究、隔离原型与提交/push 已获批准；下一项生产实施尚未获批。
- Phase 2 已完成并通过最终 Review；Phase 3 前置 UI/UX Review、Design Decision Closure、implementation、Independent Final Review 与 Final Polish Patch 均已完成。
- **Phase 4 尚未开始，也未获得批准。**

## Git 连续性

- 正式远程仓库：`https://github.com/jiyuan37/our-space.git`。
- `origin` 与 `public` 当前都指向该仓库；remote 名称整理不属于 Phase 2 Repair。
- 默认分支：`main`。
- Phase 1 最后验证代码提交：`1d277064a27ab29105e890bcf0f2373ac3b42196`。
- Phase 2 实施基线：`f2e8f518db8516a33abfac32ce7aa73d354347b5`。
- Phase 2 最终通过提交：`0c37e4acfbce8775a22bc5d7bf4feea1433048c5`。
- Phase 3 实施基线：`7f3f2708434de7eac193b826096ac9e4dfefcffb`。
- Phase 3 implementation 提交：`8d45341fc9ab47e4493b86bb240e8773ec8c3dce`。
- 最新代码验证基线：`ab18b49c0e27ff1903604d1263bc45d956b8ff34`（`fix: polish phase 3 accessibility and state`）。
- 卡通身份/动画/地图文档同步开始时已成功执行 `git fetch origin`；HEAD 为上述代码验证基线，`main...origin/main` 为 `0 0`，工作树干净。

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

## Phase 3 已实现能力

- `/home` protected route、有限有序 `HomeViewModel`、Space identity 与两位 ACTIVE Resident presentation。
- Quiet Home / 安静的家、Single Home + secondary Space/account menu，以及保留可访问的 Phase 2 Space/Invitation 管理能力。
- Presence `shortText` 读取、本人 inline update/upsert、显式 clear、120 Unicode 字符服务端 validation 与 typed Action state。
- freshness 以查看者浏览器本地日历日为 presentation boundary；初始 hydration 不渲染 Presence 文本，跨日自然回到 Quiet State，数据库旧记录不被自动删除。
- typed `zh-CN` / `en-US` locale resources、`zh-CN` fallback、HttpOnly cookie persistence、locale-independent URL，以及 Auth、Invitation、Space、error、Accessibility 与 formatter 的统一本地化。
- warm cream、克制 surface、semantic design tokens、responsive 双人布局、44px 操作目标、visible focus、live announcement 与 reduced-motion。
- Final Polish 已关闭 Independent Final Review 的 6 项非阻塞 MINOR：muted text AA contrast、inline secondary link touch target、Presence error description、语义 announcement、一次性 welcome query 与计划状态漂移。

## 已确认但尚未实施的产品要求

- `AVATAR-01`：Resident 必须能通过自拍/上传、AI 卡通候选生成、选择/调整或重试、明确确认建立持久卡通身份；入口需在注册后或首次进入时显著可见。
- `ANIMATION-01`：用户主动留下状态后，必须由同一个已确认角色表达动作或表情；不能以静态头像或身份漂移的重复生成人物代替。
- `MAP-01`：地图与 marker/status point 是核心空间表达，不能被降级为可无限延期的边缘附加页。
- 三项方向进一步明确，具体规则及隔离原型见 AVATAR_AND_MAP_SPEC.md；provider、同意/lifecycle、后台客户端与生产 Phase 排期仍待批准。
- 地图已确认对应真实世界并作为未来 Home 主体；这不授权持续定位。Presence 与 LifePoint 保持概念区分，LifePoint 不强制 location。
- Avatar 目标不自动授权外部 AI 处理；自拍、原图、Presence 或 Space 内容不得在未获专项批准前发送给外部 provider。
- 详细状态、依赖、未决问题和验收目标见 `docs/AVATAR_AND_MAP_SPEC.md`；六个核心实体和已完成 Phase 1–3 的验收保持不变。

## 尚未开始

- Phase 4 及后续功能：Life Point、Response、Shared Moment、Visit、Memory 与 media workflow。
- AVATAR-01、ANIMATION-01 与 MAP-01 implementation。
- Seed data 与 demo account 属于后续阶段。

## Phase 3 已收口的设计基线

- 正式采用 Direction A — Quiet Home / 安静的家；完整规则记录于 `docs/PHASE_3_DESIGN.md`。
- Home 是共同存在的地方，不是 Feed、Dashboard 或内容容器；Silence 是完整状态。
- Phase 3 使用 Single Home + secondary Space/account menu，不展示未来空 tab、disabled navigation 或 Phase 4+ placeholder。
- Presence 首版只暴露 `shortText`，使用 inline editing；它可选、可清除，不是在线、位置、活动或关系状态。
- Presence 只属于查看者的当前浏览器本地日历日；跨日后旧 Presence 不再展示，Home 回到 Quiet State，不新增 timezone 字段。
- 默认 locale 为 `zh-CN`，同时支持 `en-US`；Phase 3 必须建立统一 i18n architecture，现有 authenticated/private URL 与 Invitation callback 保持语言无关。
- Design Constitution、视觉、motion、mobile、Accessibility、Privacy-as-UI 和 Review blocker 见 `docs/PHASE_3_DESIGN.md`；长期决策见 DEC-044 至 DEC-046。
- implementation evidence、Independent Final Review 结论与 Final Polish closure 见 `docs/PHASE_3_REVIEW.md`。

## Migration 状态

- Provider：PostgreSQL 16。
- Foundation migration：`20260728060000_foundation`。
- Phase 2 migration：`20260728170000_phase_2_invitations`。
- Foundation migration SHA-256：`69a9a905bc0d713a9fb57bf68a7aaaf436899c83472a207313708874df0df20f`。
- Phase 3 未修改 Prisma Schema 或任何 migration；全新测试数据库已成功应用现有 2/2 migrations。

## 当前验证状态

以下结果来自上一轮在 `ab18b49c0e27ff1903604d1263bc45d956b8ff34` 完成的 Phase 3 Final Polish 验证。本次规格与隔离原型未重新运行应用测试矩阵，不得把这些结果表述为本轮新执行证据。

| 检查                                        | 当前结果                                    |
| ------------------------------------------- | ------------------------------------------- |
| Node.js                                     | `v22.22.2`                                  |
| `npm ci`                                    | 通过；安全 override 已实际安装              |
| `npm run prisma:generate`                   | 通过；Prisma Client 6.19.3                  |
| `npm run prisma:validate`                   | 通过                                        |
| `npm run lint`                              | 通过                                        |
| `npm run typecheck`                         | 通过                                        |
| `npm test`                                  | 通过；19 files / 76 tests，无 required skip |
| PostgreSQL database integration             | 通过；15/15                                 |
| `npm audit --omit=dev`                      | 通过；0 vulnerabilities                     |
| Argon2id smoke                              | 通过；2/2                                   |
| PostgreSQL integration / clean migration    | PostgreSQL 16.15；2/2 migrations            |
| concurrency                                 | 最大 ACTIVE Resident = 2；违规 Space = 0    |
| 真实 E2E                                    | 通过；desktop Chrome + Pixel 7，12/12       |
| `npm run build`                             | 通过                                        |
| `npm run format:check` / `git diff --check` | 通过                                        |

## 安全要求

- 不得使用 `DATABASE_URL` 代替独立 `TEST_DATABASE_URL`。
- 不得记录密码、Invitation raw token、hash、认证 secret 或数据库凭据。
- Phase 3 implementation 已完成并通过 Final Review；Phase 4 尚未开始，也未获得批准。

## 本轮真实世界像素地图规格与隔离原型

- 起始 HEAD：`241e4594d04d98ff05d6055c11639e92cd39ecc7`（`docs: record avatar and map product requirements`）。从项目根目录成功 fetch 后，main 与 origin/main 为 `0 0`，工作树干净；正式远程与上文一致。
- 本轮交付提交通过 `git log -1 --format='%H %s'` 定位，提交信息为 `design: specify and prototype pixel map home`；该提交包含本节，避免在自身内容中写入无法固定的自引用 hash。交付同步目标为干净工作树、`main...origin/main = 0 0`；最终实际 commit/push 证据在交付报告中记录，下轮仍须 fetch 并复查。
- 最近通过应用矩阵验证的代码基线仍为 `ab18b49c0e27ff1903604d1263bc45d956b8ff34`。
- 原型入口：`prototypes/map-home/index.html`；根目录运行 `node prototypes/map-home/serve.mjs`，浏览器打开 `http://127.0.0.1:4173`。仅本地静态文件，不接入生产 Service。
- 本轮原型验证：23/23 状态机测试、24 组 Chrome 浏览器检查；375×812 / 1280×850 双语布局和 >=44px 触控通过，文字对比度最低 5.20:1，运行时外部请求/真实定位调用/页面错误均为 0。
- 双端真实截图、独立断言、对比度及网络验证见 `prototypes/map-home/README.md` 与 `screenshots/verification.json`。
- 地理数据：公开伦敦南岸 OSM 街区；人物、Presence、生活内容和位置变化均为明确标注的合成示例。巴黎远距视图标记为未打包底图，不冒充真实地图。
- 修正 README 的过时 Phase 2 状态描述；Phase 3 Review 未改动，Design 仅附加后续演进引用。
- 当前 Web/PWA 不保证隐藏/锁屏/关闭后的持续采样；前台有限能力尚未生产实施，完整后台需批准原生范围与采集隐私方案。
- 具体规格与隔离原型已完成，等待用户确认视觉和实现方案。
