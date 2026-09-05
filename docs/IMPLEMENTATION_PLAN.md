# Our Space — 实施计划

最后更新：2026-09-05

## 状态

**当前工作包：AVATAR-01 正式实现；本地应用流程已实现，2 次真实服务调用已执行，仍缺候选人工质量确认。用户已确认视觉，不再风格冻结或比较方案。**

Phase 3 implementation 已完成并通过 Final Review。

阶段 0、Phase 1 已完成，Phase 1 已通过最终 Review。Phase 2 已实施，在首次 Final Review 后完成 Repair，并通过 Closure Review。Phase 3 前置 UI/UX Review、Design Decision Closure、implementation、Independent Final Review 与 Final Polish Patch 已完成，设计基线记录于 [`PHASE_3_DESIGN.md`](./PHASE_3_DESIGN.md)，实施与 Review 证据记录于 [`PHASE_3_REVIEW.md`](./PHASE_3_REVIEW.md)。Phase 4 尚未开始，也未获得批准。

## AVATAR-01 当前实施 checklist

- [x] 完整读取规格/决策并核对实际 Git，保留 Phase 1–3 基础与用户改动。
- [x] 将本轮范围限定为自拍头像闭环，非阻断 Home 创建/更换入口。
- [x] 可替换 provider；按用户反馈取消 OpenAI 付费接入，接 Cloudflare SDXL-Lightning img2img 和显式 FLUX.2 klein 4B adapter。
- [x] 照片服务端格式/内容/大小验证、EXIF 清除、不落原照；候选私密、到期/取消清理、本人确认与替换版本。
- [x] Resident/MediaAsset 复用、最小新增 migration、正式 Home 最终头像及成员读取权限。
- [x] 数据库防重复/限额，失败和取消保持旧头像；中英文、手机和键盘流程。
- [x] 受控 provider 自动测试及认证/邀请/Presence 回归；运行证据见 AVATAR_OPERATIONS.md。
- [x] 用户提供 Cloudflare 关键配置与明确授权；本轮上限为 2 次请求，已经用完。样本 2 未找到，只用已授权样本 1；账户 Free 是配置声明，未核验账单。
- [x] 有限真实服务调用：SDXL-Lightning 400 / 3030；FLUX.2 klein 200，实际图像规范化通过；共 2 次，无重试。
- [ ] 人工相似度、画风与候选确认：本次输出在内存校验后释放，未保留人工验收资源。后续须另行授权请求，不能超出本轮上限。
- [ ] 真实用户照片生成、本人确认与重新登录/Partner 读取的真实生成闭环验收。当前不能声明 AVATAR-01 完成。

本轮完成可独立验证的代码后正常提交/push，并停止等待上述具体条件，不自动开始地图、定位、ANIMATION-01 或 Phase 4。

## 单一事实来源

[`OUR_SPACE_MASTER_SPEC.md`](./OUR_SPACE_MASTER_SPEC.md) 是产品范围、语言、领域规则、技术方向和验收标准的单一事实来源。如果本计划与 Master Spec 冲突，应以 Master Spec 为准，并修正本计划。

## 阶段 0 开始时的历史仓库基线

阶段 0 开始规划时，仓库中仅包含：

- `OUR_SPACE_MASTER_SPEC.md`

当时没有应用脚手架、依赖清单、数据库 Schema、测试配置、CI 配置、环境变量示例或仓库专用的 `AGENTS.md`。该描述只保留为历史基线；当前仓库已经完成 Phase 1 基础设施。

## 交付原则

- 只构建 Master Spec 规定的 MVP。
- 所有面向用户的回复、工程文档、计划、报告和说明均使用简体中文；技术标识符、路径、命令和第三方原始错误信息保持原文，英文错误日志后附中文解释。
- 优先保证正确性、隐私、清晰度、可访问性和情感上的平静。
- 将业务规则和授权放在服务端/服务层。
- 默认使用 Server Components；仅在交互确有需要时引入 Client Components。
- 选定后统一使用一种变更边界（Server Actions 或 route handlers）。
- 保持六个产品领域实体不变：Space、Resident、Presence、LifePoint、Response 和 SharedMoment。
- User、Session、Invitation、MediaAsset 和 AuditLog 仅作为支撑性基础设施。
- `AVATAR-01`、`ANIMATION-01` 与 `MAP-01` 是 2026-09-04 确认的必做产品交付，不得被静默删除、降级为字段/普通 Presence 展示或放入无期限 optional backlog；详细边界见 `AVATAR_AND_MAP_SPEC.md`。
- 每个阶段完成并验证后，才能开始下一阶段。
- 阶段开始、完成或发生实质变更时更新本文件。

## 依赖关系图

```text
阶段 0：规划
  └─ 阶段 1：基础设施
       └─ 阶段 2：身份认证与 Space
            └─ 阶段 3：核心 Home
                 └─ 阶段 4：Life Points
                      └─ 阶段 5：Responses 与 Shared Moments
                           └─ 阶段 6：Visit
                                └─ 阶段 7：质量与交付
```

授权、验证、可访问性、响应式体验、类型化错误、隐私和测试属于横切工作：在对应功能阶段开始，并在阶段 7 再次全面审查。

## 阶段 0 — 规格审查与规划

状态：已完成。

依赖：无。

交付物：

- [x] 检查仓库。
- [x] 完整阅读 Master Spec。
- [x] 总结产品、范围、领域模型和架构。
- [x] 识别缺失的技术细节及需要解决的假设。
- [x] 创建 `IMPLEMENTATION_PLAN.md`。
- [x] 创建 `DECISIONS.md`。
- [x] 创建 `KNOWN_LIMITATIONS.md`。
- [x] 创建 `CHANGELOG.md`。
- [x] 在编写应用代码前获得批准。

退出标准：

- 规划文档已经存在，并覆盖完整的 Master Spec。
- 所有开放技术细节均清晰可见，且没有暗中改变产品范围。
- 用户已经批准开始实施。

## 阶段 1 — 基础设施

状态：**已完成并通过最终 Review**

依赖：阶段 0 获得批准。

完成情况：

- [x] 使用 React 和严格模式 TypeScript 初始化 Next.js 15 App Router 项目。
- [x] 确定受支持的 Node.js 和包管理器版本。
- [x] 配置 Tailwind CSS、ESLint、Prettier、路径别名和环境变量验证。
- [x] 配置 PostgreSQL 和 Prisma；创建初始 Schema 和 migration。
- [x] 建模 User、Invitation 和 MediaAsset 等必要支撑记录，不增加新的产品领域实体。
- [x] 在 Schema 中建立 Space 和 Resident 生命周期基础：
  - Space 可区分启用状态与归档状态；
  - Resident 可区分活跃状态与已离开状态；
  - 离开或归档操作只改变生命周期状态，不静默删除共同生活内容；
  - 最终字段、约束与理由记录在 `DECISIONS.md`。
- [x] 添加以下约束和索引：
  - 在服务/事务层强制执行 Space 最大人数和有效成员限制；
  - MVP 中每个 User 只能属于一个有效 Space；
  - 每个 Resident 只有一条 Presence；
  - 每个 LifePoint 只有一个 SharedMoment；
  - Invitation token 唯一；
  - 支持 Home/Visit 的排序和 Space 范围查询。
- [x] Schema 使用 Prisma/PostgreSQL DateTime 作为 UTC 应用时间基础；用户本地时区格式化工具在实际展示日期的 Phase 3/6 实施，避免提前引入未使用抽象。
- [x] 添加以 Docker Compose 为首选方式的可复现 PostgreSQL 16 开发环境，同时允许通过 `DATABASE_URL` 连接自行管理的 PostgreSQL。
- [x] 创建 spacing、radius、shadow、typography、surface、text、border、accent、danger 和 motion 等基础 Design Tokens。
- [x] 配置 Vitest、Testing Library 和 Playwright。
- [x] 添加 `.env.example` 和初始配置说明。
- [x] 定义类型化 Domain Errors 以及统一的 code/status/message 约定。
- [x] 建立基础 Service 约定，确保后续权限验证和业务规则不进入 React 组件。
- [x] 建立最小应用 Shell，但不展示尚不可用的 Settings 导航入口。
- [x] 记录默认使用 Server Actions 处理已认证应用变更，仅在 Auth.js、受保护媒体读取和文件上传等天然需要 HTTP 边界时使用 Route Handlers。
- [x] 明确双人 MVP 的 LifePoint visibility 行为，同时保留 `SHARED_WITH_RESIDENT` 与 `SHARED_WITH_HOME` 两个数据库值。
- [x] 将 Response 图片确认为 MVP 范围，不得静默延期。
- [x] 将误建于 `docs` 的应用、数据库、测试和工程配置安全迁移到真实项目根目录 `/Users/yuan/Desktop/our-space`，并保持 migration 内容不变。
- [x] 添加根目录 `AGENTS.md`、`docs/CURRENT_STATE.md` 和 `docs/PHASE_1_REVIEW.md`，建立跨会话连续性约定。
- [x] 统一 `.nvmrc`、`package.json`、README 和 `@types/node` 的 Node.js 22 LTS 约定。

验证：

- [x] 从真实项目根目录以 Node.js 22.23.1 重新运行并通过 `npm ci`、Prisma generate/validation、typecheck、lint、unit tests、format check、Playwright 枚举、production build、clean migration 和 production dependency audit。
- [x] 缺少必需环境变量时，环境验证测试能以中文清晰失败。
- [x] Docker Compose 配置通过 YAML 静态验证；当前主机没有 Docker CLI，因此未执行容器启动测试。

退出标准：

- [x] lockfile、环境示例、migration、测试与启动文档齐全，且已从真实项目根目录验证全新安装、配置、迁移、测试与 production build。
- [x] 基础性决策已记录到 `DECISIONS.md`。

## 阶段 2 — 身份认证与 Space

状态：**已完成并通过最终 Review。**

依赖：阶段 1。

已实施的安全与架构约束：

- Credentials email/password 认证；Auth.js 管理登录、登出、session cookie 和认证边界，使用最小身份字段的 JWT session。
- email 统一规范化后持久化和查询；MVP 注册后立即可登录，不伪装 email verification。
- 密码使用服务端 Argon2id，长度为 15–128 个字符，不使用组合字符规则或静默截断。
- Invitation 原始 token 只出现在复制链接中，数据库只保存 SHA-256 hash；默认 7 天过期，同一 ACTIVE Space 同时只允许一个有效 `PENDING` Invitation。
- Space/OWNER Resident 创建与 Invitation 接受分别使用事务；接受流程使用 PostgreSQL `Serializable` 和有限冲突重试。
- Server Actions、Route Handlers、origin/cookie、ACTIVE Resident/OWNER 授权和客户端 view model 已遵循 DEC-037/DEC-038。
- Phase 2 已定义可替换 RateLimiter，并按 DEC-039 的账户与 IP 双维度默认策略执行。
- 数据库集成测试已使用独立真实 PostgreSQL 并应用正式 migration；Phase 2 退出前已运行真实浏览器 E2E。
- Auth.js/NextAuth 与 Argon2id package 已依据兼容性证据锁定精确版本，并通过实际验证。

完成工作：

- [x] 使用安全密码哈希实现凭据注册与登录。
- [x] 配置 Auth.js session 和受保护的应用路由。
- [x] 实现 Space 创建，以及事务性的 owner Resident 创建。
- [x] 在保持 Schema 可扩展的同时，强制 MVP 中每个 User 只能加入一个有效 Space。
- [x] 实现安全的 Invitation 创建、查询、撤销/过期处理和事务性接受流程。
- [x] 处理 token 过期、已撤销、已接受、Space 已满、已是 Resident，以及成员资格冲突等情况。
- [x] 接受邀请前展示邀请者身份和 Space 名称。
- [x] 添加平静、面向用户的错误映射。
- [x] 为身份认证和邀请操作添加双维度 RateLimiter。
- [x] 保留安全的站内 Invitation callback，并拒绝外部 callback/open redirect。
- [x] 添加 Space 创建、Invitation 创建/接受、Space 已满拒绝、成员资格、lifecycle 和 authorization 服务测试。

验证：

- [x] PostgreSQL 16.15 全新数据库成功应用 2/2 正式 migrations。
- [x] 14 个 Vitest 文件共 50 个测试全部通过，其中 Phase 2 database integration 10/10，无 required database test skip。
- [x] 并发创建与接受验证通过；最大 ACTIVE Resident 为 2，超过 2 人的 Space 为 0。
- [x] desktop Chrome 与 Pixel 7 的完整真实 Playwright E2E 6/6 通过，覆盖 callback、两名 Resident、第三人 Space full 拒绝和非 OWNER 拒绝。
- [x] Prisma generate/validate、lint、typecheck、format check、production build、Argon2id smoke、`git diff --check` 全部通过。
- [x] `npm audit --omit=dev` 为 0 vulnerabilities。

退出标准：

- [x] 两个已认证 User 可以安全地成为同一个私密 Space 中的两名 Resident。
- [x] Repair 后 Closure Review 结论为 `PASS`，Phase 2 已完成并通过最终 Review。
- [x] Phase 2 收口后停止；不得自行进入 Phase 3。

## 阶段 3 — 核心 Home 与 Presence

状态：**implementation 已完成并通过 Final Review。**

依赖：阶段 2。

正式设计基线：

- 采用 Direction A — Quiet Home / 安静的家；完整 Design Constitution、视觉规则与 Review blocker 见 `PHASE_3_DESIGN.md`。
- Presence belongs to today. When today passes, silence returns.
- 默认 locale 为 `zh-CN`，同时支持 `en-US`；authenticated/private URL 保持语言无关。

完成工作：

- [x] 构建响应式认证后 `AppShell`、克制 Header、主内容区，以及 Single Home + secondary Space/account menu。
- [x] 不增加单 destination bottom navigation，不展示 Visit、Settings、Phase 4+ action 或 placeholder page。
- [x] 实现有限、有序、经 ACTIVE membership 过滤的 typed Home query 与最小 view model。
- [x] 展示 Space identity、两名 Resident 与当天可选 Presence，不提供 online/last-seen/exact age 或关系压力信息。
- [x] Presence 首版只暴露 `shortText`，使用 inline editing，允许本人 update/upsert 与 clear；服务端集中执行 trim 与 120 Unicode 字符限制。
- [x] 使用查看者浏览器本地日历日判断 freshness；跨日后不展示旧 Presence，不删除数据库记录，不新增 timezone 字段。
- [x] 实现首次进入轻量 “Welcome Home” 与完整 Quiet State。
- [x] 建立 typed `zh-CN` / `en-US` i18n、HttpOnly locale cookie、统一 error/accessibility/formatter 资源与语言无关 URL。
- [x] 扩展 Quiet Home semantic design tokens、responsive layout、visible focus、44px 触控目标、live announcement 与 reduced-motion。
- [x] 添加 Presence Action/Service、freshness、Quiet Home、i18n、真实 PostgreSQL 与 desktop/mobile E2E 测试。

验证：

- [x] 19 个 Vitest files / 76 tests 全通过，其中真实 PostgreSQL integration 15/15。
- [x] PostgreSQL 16.15 全新数据库成功应用现有 2/2 migrations；Phase 3 无 Schema change、无新 migration。
- [x] Playwright 12/12：desktop Chrome 6/6、Pixel 7 6/6，覆盖 Quiet Home、Presence、i18n、一次性 welcome query、44px secondary link 与 Phase 2 regression。
- [x] 实际浏览器检查中文/英文、Quiet/Presence/edit、desktop/375px mobile；无横向溢出，控制台无 error/warning。
- [x] Node 22 `npm ci`、Prisma generate/validate、lint、typecheck、format check、production build、production audit 与 `git diff --check` 通过。

退出标准：

- [x] 两名 Resident 均可在移动端和桌面端以 `zh-CN` 或 `en-US` 查看 Quiet Home，并在不产生义务或监控感的前提下更新、清除自己的当天 Presence。
- [x] Independent Final Review：`PASS WITH NON-BLOCKING FINDINGS`；6 项 MINOR 已由 Final Polish Patch 全部关闭，无需再次 Review。

## 阶段 4 — Life Points 与媒体

状态：未开始，也未获得批准。

依赖：阶段 3。

计划工作：

- 实现 “Leave a little” composer，支持文本、一个可选图片或二者组合。
- 实现 `occurredAt`，并将默认 visibility 设为 `SHARED_WITH_HOME`。
- 实现 `PRIVATE`、`SHARED_WITH_RESIDENT` 和 `SHARED_WITH_HOME` 的授权语义。
- 通过存储抽象实现本地图片上传。
- 验证文件 MIME type、可行时验证解码后内容、文件大小、所有权和安全生成的 storage key。
- 通过受授权保护的边界提供媒体，且不暴露内部路径。
- 实现 Life Point 卡片、详情页、编辑/visibility 更新和软移除。
- 明确定义已移除 Life Point 关联内容的处理行为，避免静默销毁。
- 添加平静的放置/打开动效，并支持 reduced-motion。
- 为创建、验证、隐私、visibility、所有权和移除添加服务与 UI 测试。

验证：

- Resident 可以创建和查看包含文本及/或一个图片的 Life Point。
- 私密 Life Point 绝不会对另一名 Resident 展示。
- 未授权用户无法取得 Life Point 内容或媒体。

退出标准：

- Life Point 创建与详情流程符合 Master Spec 的隐私和情感设计规则。

## 阶段 5 — Responses 与 Shared Moments

状态：未开始。

依赖：阶段 4。

计划工作：

- 实现短文本、`RECEIVED` 和 `HOLD_FOR_LATER` Response。
- 按 `DECISIONS.md` 中记录的 MVP 解释控制可选 Response 图片的范围。
- 禁止对自己的 Life Point 作出 Response，也不支持嵌套回复。
- 当另一名 Resident 首次回应时，在同一事务中创建 Response 和 SharedMoment。
- 通过数据库唯一约束和事务安全的服务逻辑，保证 SharedMoment 创建幂等。
- 实现 Life Point response state 和 Shared Moment 详情体验。
- 将原始 Life Point 与 Responses 一并展示，但不重复存储 Life Point 内容。
- 添加克制的回应完成动效和温暖、非游戏化的文案。
- 添加自我回应拒绝、Response 创建、授权和并发/幂等 SharedMoment 创建测试。

验证：

- 另一名 Resident 的有效 Response 只会创建一个 SharedMoment。
- 重复或并发 Response 不会创建重复 SharedMoment。
- 不引入 reaction counter、公开 thread 或回应压力。

退出标准：

- 完整的 Life Point → Response → SharedMoment 领域状态转换可以安全运行。

## 阶段 6 — Visit 与重访追踪

状态：未开始。

依赖：阶段 5。

计划工作：

- 在 “Visit” 下实现有限的 Shared Moment 历史记录。
- 按 `occurredAt` 分组；没有该值时回退到 `createdAt`，分组包括：
  - Today
  - This Week
  - Earlier This Month
  - Last Month
  - Earlier
- 时间戳以 UTC 存储，并按查看者本地时区显示日期。
- 实现 Shared Moment 详情以及方便返回 Home 的路径。
- 通过经过授权且并发安全的操作记录 `lastVisitedAt` 并递增 `visitCount`。
- visit 元数据仅用于保存/重访行为，绝不用于关系评分或施加压力。
- 添加分组边界、时区行为、授权和 visit tracking 测试。

验证：

- 两名 Resident 均可重访自己有权访问的 Shared Moment。
- 重复/并发请求下 visit tracking 正确，且不会作为 engagement UI 展示。

退出标准：

- 使用简单日期分组完成 “Return to the Past” 流程。

## 阶段 7 — 质量、设置、种子数据与交付

状态：未开始。

依赖：阶段 1–6。

计划工作：

- 实现 MVP 所需的基础账户、Space 和隐私设置。
- 在生命周期语义确定后，实现需要确认的离开/删除操作。
- 完成页面、actions/handlers、媒体和 view model 的授权与数据泄漏审查。
- 依据 Master Spec 基线完成可访问性审查。
- 完成响应式和动效细节打磨。
- 添加普通、有人情味的种子数据：两个 User、一个 Space、两个 Resident、两条 Presence、若干 Life Point 和 Response，以及至少两个 Shared Moment。
- 添加规定的端到端流程和未授权访问覆盖。
- 创建 README、架构说明、operation/API 文档、本地配置说明和示例账户文档。
- 对齐并更新所有规划文档。
- 执行全新的 checkout 验证。

最终必需验证：

- `lint`
- `typecheck`
- 单元/服务测试
- 组件测试
- 端到端测试
- production build
- 全新数据库 migration 和 seed
- 移动端与桌面端手工 smoke test

退出标准：

- Master Spec 中 Definition of Done 的每一项都有可验证证据。
- 所有已完成阶段均已记录到 `CHANGELOG.md`。
- 所有剩余的有意省略项和技术债务均已记录到 `KNOWN_LIMITATIONS.md`。

## 已确认必做的新产品交付轨道

`AVATAR-01`、`ANIMATION-01`、`MAP-01` 均必交付。本轮确认真实地理地图、Home 主体、像素与柔和线条 Q 版、可信位置变化才回放。详细规格及子要求见 [AVATAR_AND_MAP_SPEC.md](./AVATAR_AND_MAP_SPEC.md)。原型时期只批准隔离验证；2026-09-05 用户批准 AVATAR-01 正式实现，最新授权与进度见本文顶部。

### 原型轮次历史 checklist

- [x] 完整阅读必读文档并核对 Git 基线。
- [x] 官方参考拆解及 Web/后台定位能力研究。
- [x] 真实公开 OSM 街区、原创示例角色、双语独立 HTML/CSS/JavaScript 原型。
- [x] 明确角色持续身份、Presence/位置分离、移动状态机、端点/采样区别、一次回放及无数据语义。
- [x] 独立状态机和浏览器断言、375×812 / 1280px 截图及文字对比度/触控验证；证据见原型 README。
- [x] 保留六实体与原 Phase 4–7 闭环；本轮完成后停止，不自动进入生产开发。

### 后续依赖顺序建议

1. P0：已完成；用户确认 `b6fe15a8c11270d3c1568f7f40af08484ce71fd3` 的具体视觉，不再重新比较。
2. P1：当前 AVATAR-01 已批准非阻断入口、Cloudflare 免费路线与头像专用隐私边界；账户流程和资源已实现，已执行 2 次真实请求，人工质量/最终确认仍待完成，不得自动追加请求。静态 fixture 不能顶替完整生成流程。
3. P2：生产真实地图渲染与角色定位；需要 provider/成本/隐私选择、稳定角色资源。生产 Home 切换单独批准。
4. P3：本人授权位置更新、样本质量、共享 epoch、访问/删除；完整后台体验需原生能力与原 MVP native 排除项的明确修订。Web 前台有限能力与后台目标分开验收。
5. P4：真实已记录变化回放；依赖 P1/P2/P3，不伪造路线；包括去重、缺口、长距、往返、撤销和 reduced-motion。
6. P5：原 Phase 4–6 LifePoint、Response（含图片）、幂等 SharedMoment、Visit 与地图结合；领域闭环和无地点 LifePoint 不能被视觉工作挤掉。
7. P6：原 Phase 7 Settings、privacy、seed、响应式与完整质量验收，覆盖三条必做轨道。

P 编号仅为建议工作包，不能等同于已批准 Phase。共享 media 基础不代表扩大自拍/AI 授权。每轮只执行一个获批 Phase，三条新轨道不得无限期延期；细化 Phase 编排由用户确认后记录。

### 尚待用户决定的实施门槛

- 头像：已决定本轮非阻断 Home、没有头像显示诚实默认；不分配示例角色。已完成本轮 2 次真实请求；人工候选验收尚缺新的明确调用授权与后续确认。
- AI：已批准头像专用 Cloudflare 免费路线；如需付费或扩大外发数据范围，须另行明确批准。数据政策未知项和部署约束见 AVATAR_OPERATIONS.md。
- 地图 provider：比较可自定义开放矢量方案与商业 SDK，明确维护/许可/成本及请求披露后选择。
- 定位精度/频率/保存与原生后台范围：建议最小必要精度、可暂停和短期窗口，具体数值经真机实验再批准；不得把 Web 页面一直打开视为完整目标。

## 必需的端到端验收流程

1. 新 User 注册。
2. User 创建 Space，并成为其 owner Resident。
3. owner 创建 Invitation。
4. 第二名 User 注册或登录并接受 Invitation。
5. 两名 Resident 均出现在 Home 中，并可管理各自的 Presence。
6. 第一名 Resident 创建一个共享 Life Point。
7. 第二名 Resident 查看并回应。
8. 系统只创建一个 SharedMoment。
9. 两名 Resident 均可在 Visit 中重访该 SharedMoment。
10. 无关的已认证 User 和未认证访问者均无法访问该 Space、Life Point、SharedMoment 或受保护媒体。

## 计划维护规则

- 实施过程中，任何时刻只能将一个阶段标记为 **当前**。
- 每个阶段完成时更新 checklist 和状态。
- 将已完成阶段记录到 `CHANGELOG.md`。
- 将重要架构/产品决策记录到 `DECISIONS.md`，绝不改写历史。
- 将有意延期的工作和新发现的技术债务移入 `KNOWN_LIMITATIONS.md`。
- 验证和退出标准未通过前，不得将阶段标记为完成。
