# Our Space — 实施计划

最后更新：2026-07-28

## 状态

**当前状态：阶段 2 — 已完成实施，等待最终 Review**

阶段 0、Phase 1 功能范围及其收尾修正已完成，Phase 1 已通过最终 Review。当前只完成 Phase 2 开始前的架构与安全决策收口，不进入 Phase 2 功能实施。Phase 2 尚未获得明确实施批准。

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

状态：**已完成实施，等待最终 Review。**

依赖：阶段 1。

已决策但尚未实施的安全与架构约束：

- Credentials email/password 认证；Auth.js 管理登录、登出、session cookie 和认证边界，使用最小身份字段的 JWT session。
- email 统一规范化后持久化和查询；MVP 注册后立即可登录，不伪装 email verification。
- 密码使用服务端 Argon2id，长度为 15–128 个字符，不使用组合字符规则或静默截断。
- Invitation 原始 token 只出现在复制链接中，数据库只保存 SHA-256 hash；默认 7 天过期，同一 ACTIVE Space 同时只允许一个有效 `PENDING` Invitation。
- Space/OWNER Resident 创建与 Invitation 接受分别使用事务；接受流程使用 PostgreSQL `Serializable` 和有限冲突重试。
- Server Actions、Route Handlers、origin/cookie、ACTIVE Resident/OWNER 授权和客户端 view model 必须遵循 DEC-037/DEC-038。
- Phase 2 必须定义可替换 RateLimiter，并按 DEC-039 的账户与 IP 双维度默认策略执行。
- 数据库集成测试必须使用独立真实 PostgreSQL，应用正式 migration；Phase 2 退出前必须运行真实浏览器 E2E。
- 精确 Auth.js/NextAuth 与 Argon2id package 版本必须在实施前依据官方兼容性证据锁定；本轮不安装依赖。

完成工作：

- [x] 使用安全密码哈希实现凭据注册与登录。
- [x] 配置 Auth.js session 和受保护的应用路由。
- [x] 实现 Space 创建，以及事务性的 owner Resident 创建。
- 在保持 Schema 可扩展的同时，强制 MVP 中每个 User 只能加入一个有效 Space。
- [x] 实现安全的 Invitation 创建、查询、撤销/过期处理和事务性接受流程。
- 处理 token 过期、已撤销、已接受、Space 已满、已是 Resident，以及成员资格冲突等情况。
- 接受邀请前展示邀请者身份和 Space 名称。
- 添加平静、面向用户的错误映射。
- 为身份认证和邀请操作添加限流 hook。
- 添加 Space 创建、Invitation 创建/接受、Space 已满拒绝和成员资格规则的服务测试。

验证：

- 注册、登录、受保护路由、Space 创建和两人加入流程均可运行。
- 并发接受 Invitation 不会使有效 Resident 超过两人。
- 未授权用户无法读取 Space 数据或邀请中的私密数据。

退出标准：

- 两个已认证 User 可以安全地成为同一个私密 Space 中的两名 Resident。

## 阶段 3 — 核心 Home 与 Presence

状态：未开始。

依赖：阶段 2。

计划工作：

- 构建响应式认证后 `AppShell`、Header、主内容区、创建操作和移动端底部导航。
- 实现 Home、Visit 和 Settings 导航。
- 实现有限、有类型的 Home 查询和 view model。
- 展示两名 Resident 及其可选 Presence，不提供在线状态、last-seen、输入状态或紧迫提示。
- 实现手动编辑 Presence 和平静的未设置状态。
- 实现 “Welcome Home”、首次进入和安静 Home 状态。
- 建立可访问的焦点、语义、标签、触控目标和 reduced-motion 基础能力。
- 为 Presence 更新、成员资格检查、Home 过滤和安静状态添加服务/UI 测试。

验证：

- Home 能在大约三秒内传达谁在这里、最近发生了什么，以及如何留下内容。
- 空白或不活跃的 Home 感觉是有意为之，且绝不使用 “No posts yet”。
- Home 结果有限、有序，并经过隐私过滤。

退出标准：

- 两名 Resident 均可在移动端和桌面端查看 Home，并更新自己的 Presence。

## 阶段 4 — Life Points 与媒体

状态：未开始。

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
