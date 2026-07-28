# Our Space — 决策日志

本文档是只追加、不删除的架构与产品决策记录。绝不能删除以前的决策。如果决策发生变化，应新增一条决策来取代旧决策。

## 决策状态词汇

- **已接受** — 除非被新决策取代，否则具有约束力。
- **提议中** — 预期采用的实施选择，等待实施批准或验证。
- **待决定** — 信息不足；必须在受影响的工作开始前解决。
- **已取代** — 为保留历史而继续存在，但已由后续决策替代。

## DEC-001 — Master Spec 是单一事实来源

- 日期：2026-07-28
- 状态：已接受
- 决策：`OUR_SPACE_MASTER_SPEC.md` 决定产品范围、术语、领域规则、技术栈、实施顺序和验收标准。辅助计划可以澄清实现方式，但不能覆盖 Master Spec。
- 理由：用户已明确指定其为单一事实来源。
- 考虑过的替代方案：
  - 将规划文档视为同等要求 — 拒绝，因为规划文档可能发生偏移。
  - 根据常见社交应用模式推断额外功能 — 拒绝，因为 Master Spec 明确禁止范围扩张。

## DEC-002 — 严格保留六个核心产品领域实体

- 日期：2026-07-28
- 状态：已接受
- 决策：核心领域保持为 Space、Resident、Presence、LifePoint、Response 和 SharedMoment。不得创建核心 Memory 实体。User、Session、Invitation、MediaAsset 和 AuditLog 只能作为支撑性基础设施存在。
- 理由：这一区分是明确且核心的产品规则：时刻被捕捉，记忆会生长。
- 考虑过的替代方案：
  - 增加 Memory 表 — 被 Master Spec 明确拒绝。
  - 将 Resident 合并进 User — 拒绝，因为 Resident 具有 Space 专属身份及未来扩展性。

## DEC-003 — 获得批准前不实施应用

- 日期：2026-07-28
- 状态：已接受
- 决策：本轮规划仅创建文档。应用脚手架、源代码、Schema、migration、依赖清单和配置都必须等待用户明确批准。
- 理由：用户明确要求实施前先审查并制定计划。
- 考虑过的替代方案：
  - 规划同时创建项目脚手架 — 拒绝，因为脚手架也属于应用实施。

## DEC-004 — 阶段顺序遵循 Master Spec

- 日期：2026-07-28
- 状态：已接受
- 决策：按基础设施 → 身份认证与 Space → 核心 Home → Life Points → Responses 与 Shared Moments → Visit → 质量的顺序实施；规划作为阶段 0 跟踪。
- 理由：该顺序遵循规定的实施流程，并尊重技术依赖关系。
- 考虑过的替代方案：
  - 先于数据/安全基础构建 UI 原型 — 拒绝，因为隐私和业务规则是基础。
  - 按其他顺序构建纵向切片 — 未采用，因为 Master Spec 已提供明确顺序。

## DEC-005 — 隐私和授权是服务端不变量

- 日期：2026-07-28
- 状态：已接受
- 决策：包括媒体访问在内，每个 Space 范围的读写都必须在服务端/服务层验证当前 User 的 Resident 成员资格及适用 visibility。客户端隐藏仅作为补充。
- 理由：Space 内容是私密的，且 Master Spec 明确要求服务端授权。
- 考虑过的替代方案：
  - 只使用页面级路由守卫 — 拒绝，因为直接 operation 和媒体可能绕过页面。
  - 只在 UI 过滤 visibility — 拒绝，因为不安全。

## DEC-006 — SharedMoment 创建使用事务服务逻辑和数据库唯一约束

- 日期：2026-07-28
- 状态：提议中
- 决策：Response 创建和第一个 SharedMoment 创建将在同一个事务内完成。通过 `SharedMoment.lifePointId` 的唯一约束，保证并发情况下的幂等性。
- 理由：仅靠服务检查会产生竞态条件；业务规则要求每个 LifePoint 恰好只有一个 SharedMoment。
- 考虑过的替代方案：
  - 不设唯一约束，仅先检查再创建 — 拒绝，因为并发时可能重复创建。
  - 后台异步创建 — 拒绝，因为增加了不必要的复杂度且即时一致性更弱。

## DEC-007 — 移除采用软删除并保留关联内容

- 日期：2026-07-28
- 状态：提议中
- 决策：从 Home 移除 LifePoint 时，将其状态设为 `REMOVED`，而不是硬删除。关联的 Responses 和 SharedMoment 记录继续保留。被移除内容对 owner/Resident 的具体可见性必须在阶段 4 前最终确定。
- 理由：Master Spec 规定移除不能静默销毁关联内容，并建议适当采用软删除。
- 考虑过的替代方案：
  - 级联硬删除 — 因违反保留规则而拒绝。
  - 在 Home 中继续显示已移除内容 — 拒绝，因为 “Remove from Home” 必须实际生效。

## DEC-008 — 以 UTC 存储，并按查看者时区分组

- 日期：2026-07-28
- 状态：提议中
- 决策：时间戳以 UTC 持久化。使用明确的查看者时区计算 Home/Visit 的时间区间；在已记录规则下，可回退到浏览器报告的时区。按 `occurredAt` 分组，没有该值时回退到 `createdAt`。
- 理由：这遵循明确的业务规则，同时避免分组依赖服务器时区。
- 考虑过的替代方案：
  - 按服务器时区分组 — 拒绝，因为结果会随部署环境改变。
  - 存储本地时间戳 — 拒绝，因为存在歧义且违反 Master Spec。

## DEC-009 — 本地媒体使用 adapter，绝不暴露文件系统路径

- 日期：2026-07-28
- 状态：提议中
- 决策：媒体元数据存入 `MediaAsset`；二进制内容通过存储接口访问。本地 adapter 使用生成的 opaque key，下载通过受授权保护的边界提供。adapter 可替换为 S3-compatible storage。
- 理由：Master Spec 要求本地开发存储、未来可替换，并且不得暴露内部存储路径。
- 考虑过的替代方案：
  - 将二进制内容存入 PostgreSQL — 拒绝，因为与要求的存储抽象不一致。
  - 将上传文件直接放入公开静态目录 — 拒绝，因为会削弱授权。

## DEC-010 — Home 和 Visit 是有限、有序的体验

- 日期：2026-07-28
- 状态：已接受
- 决策：Home 返回少量、有限的内容，并通过 Visit 访问更早的 Shared Moment。两个界面都不使用无限滚动、未读计数、engagement 排序或 “feed” 产品模型。
- 理由：产品的 North Star 是平静的陪伴感，而不是 engagement。
- 考虑过的替代方案：
  - 无限时间线 feed — 被 Master Spec 拒绝。
  - 算法排序 — 因超出范围且违背产品原则而拒绝。

## DEC-011 — 必须一次选定变更传输方式并保持一致

- 日期：2026-07-28
- 状态：待决定
- 待决定事项：选择 Server Actions 或 route handlers 作为第一方 Web 变更操作的主要边界，同时保留 Master Spec 列出的 operation 边界。
- 理由：Master Spec 允许二选一，但明确要求不能无理由混用。
- 考虑过的替代方案：
  - Server Actions — 客户端样板代码较少，与 App Router 集成自然；需要明确 CSRF/origin、错误和测试约定。
  - route handlers — HTTP contract 清晰，便于 E2E/API 测试；会增加 request/response 样板代码。
  - 无结构混用 — 拒绝。
- 解决期限：阶段 1，在实施功能变更操作前。

## DEC-012 — 身份认证和 session 细节需要具体设计

- 日期：2026-07-28
- 状态：待决定
- 待决定事项：选择 Auth.js session strategy、adapter 结构、密码哈希算法/参数、email 规范化规则、session 生命周期和本地 MVP 注册验证策略。
- 理由：技术栈指定了 Auth.js 和安全哈希，但没有规定这些安全敏感细节。
- 考虑过的替代方案：
  - database sessions 与 JWT sessions。
  - Argon2id 与 bcrypt-compatible hashing。
  - 本地注册立即生效与 email 验证（email 发送不在 MVP 范围内）。
- 解决期限：阶段 1/阶段 2 初期。

## DEC-013 — 数据库和测试环境拓扑需要选择

- 日期：2026-07-28
- 状态：待决定
- 待决定事项：定义受支持的 PostgreSQL 版本、本地供应方式、隔离测试数据库策略、migration reset 规则，以及 Playwright server/database 编排方式。
- 理由：PostgreSQL 是强制要求，但可复现的本地和 CI 拓扑尚未定义。
- 考虑过的替代方案：
  - 开发者自行安装 PostgreSQL。
  - 使用 Docker Compose 提供 PostgreSQL。
  - 集成测试使用 Testcontainers。
- 解决期限：阶段 1。

## DEC-014 — 图片上传策略需要具体限制

- 日期：2026-07-28
- 状态：待决定
- 待决定事项：规定允许的图片 MIME type、最大上传大小/尺寸、内容嗅探策略、metadata 处理、图片处理策略，以及保留/清理行为。
- 理由：Master Spec 要求验证 MIME type 和大小，但没有提供具体限制。
- 考虑过的替代方案：
  - 仅 JPEG/PNG/WebP，与同时支持 GIF/HEIC。
  - 只保存原图，与生成标准化 derivative。
- 解决期限：阶段 1 完成设计；阶段 4 强制实施。

## DEC-015 — Response 图片属于可选的 MVP 边界

- 日期：2026-07-28
- 状态：待决定
- 待决定事项：确定 MVP 是否实施可选图片 Response，或仅将其保留为类型化扩展点。
- 理由：Response 定义列出了可选图片，但规定的 “Receive” 流程只强制要求文本、Received 和 Hold for later。
- 考虑过的替代方案：
  - 实现一个可选 Response 图片。
  - 延后 Response 图片 UI，但保留兼容的 Schema/服务类型。
- 解决期限：阶段 5 前。

## DEC-016 — Space 离开/删除生命周期语义需要定义

- 日期：2026-07-28
- 状态：待决定
- 待决定事项：定义 owner 转移、单一 Resident 离开、Space 删除、Invitation 处理、数据保留、重新加入，以及何为 “有效” Resident。
- 理由：Master Spec 要求明确确认，但没有定义生命周期和保留行为。
- 考虑过的替代方案：
  - 软停用 Resident 和 Space。
  - owner 离开前必须转移所有权。
  - 在另一名 Resident 离开前禁止 owner 离开。
- 解决期限：阶段 1 完成数据模型基础；阶段 7 前确定用户行为。

## DEC-017 — Visibility 语义需要明确的访问矩阵

- 日期：2026-07-28
- 状态：待决定
- 待决定事项：定义 `SHARED_WITH_RESIDENT` 与 `SHARED_WITH_HOME` 的行为差异，包括详情访问、Home 是否展示、Response 资格，以及 visibility 变更是否影响已有 SharedMoment。
- 理由：两个 enum value 都存在，但只有 private 与 shared 的区别得到了完整描述。
- 考虑过的替代方案：
  - `SHARED_WITH_RESIDENT`：可通过直接详情/Visit 访问，但不在 Home 展示。
  - MVP 中将两个 shared value 视为相同 — 更简单，但会使二者的区分失去意义。
- 解决期限：阶段 4 前。

## DEC-018 — Visit tracking 不能变成监视

- 日期：2026-07-28
- 状态：提议中
- 决策：`lastVisitedAt` 和 `visitCount` 是 SharedMoment 的聚合保存/重访元数据。UI 不展示按 Resident 区分的查看历史、精确活动、“seen by” 或 engagement 指标。
- 理由：Schema 要求重访追踪，但产品禁止类似监视的状态与评分。
- 考虑过的替代方案：
  - 按 Resident 保存 visit 记录 — MVP 中拒绝，除非未来为正确性所必需。
  - 展示 visit count — 因属于 engagement signal 而拒绝。

## DEC-019 — 项目对外沟通与工程文档统一使用简体中文

- 日期：2026-07-28
- 状态：已接受
- 决策：本项目所有面向用户的对话回复、实施计划、进度总结、架构说明、风险说明、测试结果和最终报告均使用简体中文。`IMPLEMENTATION_PLAN.md`、`DECISIONS.md`、`KNOWN_LIMITATIONS.md`、`CHANGELOG.md`、`README.md`、架构说明和 API 文档均使用简体中文撰写与维护。代码注释和面向开发者的错误说明优先使用简体中文。代码变量名、函数名、类名、类型名、文件名、目录名、API 路径、数据库字段名、技术名称、终端命令，以及编译器和第三方工具返回的原始错误信息不强制翻译；展示英文错误日志时，在原文后提供中文原因说明和处理结果。
- 理由：用户明确要求将简体中文作为整个项目后续工作的固定语言规则，同时保留技术标识符和原始工具输出的准确性。
- 考虑过的替代方案：
  - 工程文档继续使用英文 — 拒绝，因为不符合固定语言要求。
  - 强制翻译所有技术标识符和原始日志 — 拒绝，因为会降低可检索性、准确性和调试效率。

## DEC-020 — Phase 1 获准实施并严格止步于基础设施

- 日期：2026-07-28
- 状态：已接受
- 决策：阶段 0 已获批准。当前只实施 Phase 1，包括项目工具链、数据库 Schema 与首个 migration、环境验证、PostgreSQL 本地环境、Design Tokens、最小 Shell、测试框架、Domain Errors、Service 约定、`.env.example` 和初始开发说明。Phase 1 完成后立即停止，不实施认证、Space 创建、Invitation、Home、Life Point 或任何 Phase 2 及后续功能。
- 理由：用户明确批准实施计划，同时规定了本轮边界和停止点。
- 考虑过的替代方案：
  - 连续进入 Phase 2 — 拒绝，因为违反明确停止要求。
  - 只创建脚手架而不建立 Schema 和验证能力 — 拒绝，因为不足以满足 Phase 1 退出标准。

## DEC-021 — Space 与 Resident 使用显式生命周期状态并保留共同内容

- 日期：2026-07-28
- 状态：已接受
- 决策：
  - Space 使用 `SpaceStatus`，值为 `ACTIVE` 和 `ARCHIVED`；字段为 `status`、`archivedAt` 和可选 `archivedByUserId`。
  - Resident 使用 `ResidentStatus`，值为 `ACTIVE` 和 `LEFT`；字段为 `status` 和 `leftAt`。
  - `Space.status` 与 `Resident.status` 默认分别为 `ACTIVE`。
  - 归档 Space 或离开 Space 只能更新生命周期状态与对应时间戳，不得级联删除 LifePoint、Response、SharedMoment 或 MediaAsset。
  - 归档后的 Space 不接受新内容或新 Invitation；读取和恢复策略在实现对应功能前进一步定义。
  - `LEFT` Resident 不再计入两名活跃 Resident 上限，也不能执行新的 Space 变更操作；其历史署名和共同内容继续保留。
  - MVP 中通过 PostgreSQL partial unique index 保证一个 User 最多只有一条 `ACTIVE` Resident 记录；每个 Space 最多两名活跃 Resident 仍由事务化 Service 规则强制执行。
- 理由：显式生命周期避免用删除表达离开或停用，并保护共同生活内容的连续性；状态字段也为未来恢复和多 Space 支持留下清晰边界。
- 考虑过的替代方案：
  - 使用 `deletedAt` 表示所有生命周期 — 拒绝，因为“离开”“归档”和“删除”语义不同。
  - 硬删除 Space 或 Resident — 拒绝，因为会破坏历史署名、关联完整性和共同内容。
  - 只用 nullable 时间戳推断状态 — 拒绝，因为查询和状态转换不够明确。

## DEC-022 — 已认证应用变更默认使用 Server Actions

- 日期：2026-07-28
- 状态：已接受，并取代 DEC-011 的待决定状态
- 决策：已认证应用功能的数据修改默认使用 Server Actions。只有功能天然需要 HTTP 边界时才使用 Route Handlers，当前明确包括 Auth.js、受保护媒体读取和文件上传。Server Actions 与 Route Handlers 都只能作为 transport/controller 边界；权限验证、输入验证后的业务规则、事务和领域错误必须保留在 Service 层。
- 理由：Server Actions 与 Next.js App Router 的第一方表单和服务端交互自然集成，同时保留少数需要标准 HTTP 行为的端点。统一将业务规则放入 Service 层可避免传输层分裂导致逻辑重复。
- 考虑过的替代方案：
  - 所有功能都使用 Route Handlers — 未采用，因为会为第一方应用变更增加不必要的 HTTP 样板。
  - 在 Server Actions 中直接实现业务规则 — 拒绝，因为会降低复用性、测试性和授权一致性。
  - 任意混用两种模式 — 拒绝。

## DEC-023 — Response 图片支持属于 MVP

- 日期：2026-07-28
- 状态：已接受，并取代 DEC-015 的待决定状态
- 决策：Response 图片支持保留在 MVP 范围内。Schema 保留 `mediaUrl` 和 `IMAGE` 类型能力；功能必须在 Phase 5 实施，除非 Master Spec 后续被明确修改，不得静默延期、删除或降级为仅类型扩展点。
- 理由：用户对 Master Spec 中的可选图片能力作出了明确范围裁定。
- 考虑过的替代方案：
  - 只保留 Schema 而不实现 UI/Service — 拒绝，因为构成静默延期。
  - 将图片 Response 移至 MVP 之后 — 拒绝，除非获得明确范围变更。

## DEC-024 — 双人 MVP 中两个共享 visibility 值使用相同读取对象

- 日期：2026-07-28
- 状态：已接受，并取代 DEC-017 的待决定状态
- 决策：在只有两名 Resident 的 MVP 中，`SHARED_WITH_RESIDENT` 与 `SHARED_WITH_HOME` 都允许 LifePoint owner 以外的另一名活跃 Resident 读取并回应，因此实际读取对象相同。数据库继续保留两个值，为未来多人家庭空间区分定向共享与公共 Home 展示提供结构。MVP 面向用户的隐私界面只提供清晰的“仅自己”和“我们”语义，默认“我们”写入 `SHARED_WITH_HOME`，不向用户暴露当前无实际受众差异的技术选项。
- 理由：这既保留 Master Spec 的未来扩展结构，又避免双人场景中出现两个效果相同、令人困惑的隐私选项。
- 考虑过的替代方案：
  - 删除 `SHARED_WITH_RESIDENT` — 拒绝，因为会破坏规定的领域结构和未来扩展点。
  - 在 MVP UI 同时展示两个共享选项 — 拒绝，因为实际受众相同，会造成错误的隐私预期。
  - 让 `SHARED_WITH_RESIDENT` 不出现在 Home — 未采用，因为用户已明确允许两者在当前 MVP 中具有相同实际读取对象。

## DEC-025 — 不展示不可用的 Settings 导航

- 日期：2026-07-28
- 状态：已接受
- 决策：Settings 导航只有在至少存在一个真实可用、可访问且具备正确保存行为的基础 Settings 页面时才展示。在此之前，最小 Shell 不显示 Settings 入口。
- 理由：不可用导航会制造虚假承诺并破坏基础体验。
- 考虑过的替代方案：
  - 展示 disabled Settings — 拒绝，因为仍然形成无效入口。
  - 展示 placeholder 页面 — 拒绝，因为不是真实可用功能。

## DEC-026 — PostgreSQL 16 通过 Docker Compose 优先提供

- 日期：2026-07-28
- 状态：已接受，并取代 DEC-013 中本地供应方式的待决定部分
- 决策：项目提供 Docker Compose 配置，以 PostgreSQL 16 作为可复现的首选本地数据库环境，包含健康检查和持久化 volume。应用始终通过 `DATABASE_URL` 连接数据库，因此开发者也可绕过 Docker Compose，连接自行管理的兼容 PostgreSQL 实例。测试使用独立的 `TEST_DATABASE_URL`，避免污染开发数据。
- 理由：Docker Compose 提供一致、低摩擦的本地环境，同时环境变量保留开发者自主管理数据库的能力。
- 考虑过的替代方案：
  - 强制开发者自行安装 PostgreSQL — 拒绝，因为复现性较差。
  - 只允许 Docker Compose — 拒绝，因为会排除已有本地或远程数据库的开发者。
  - 在 Phase 1 引入 Testcontainers — 暂不采用，避免在当前 MVP 基础阶段增加额外运行时复杂度。

## DEC-027 — Phase 1 锁定运行时与基础依赖版本

- 日期：2026-07-28
- 状态：已接受
- 决策：本地推荐 Node.js 22 LTS，`package.json` 最低要求为 Node.js 20.9；应用锁定 Next.js 15.5.22、React 19.2.3、Tailwind CSS 4.3.3、Prisma 6.19.3 和 PostgreSQL 16。npm 使用精确版本与 `package-lock.json` 保证可复现安装。为修复 Next.js 15 依赖树中的已知生产漏洞，使用 npm `overrides` 将 `postcss` 固定为 8.5.23、`sharp` 固定为 0.35.3，并通过 production build 与 `npm audit --omit=dev` 验证。
- 理由：精确版本与 lockfile 降低环境漂移；保留 Next.js 15 满足 Master Spec，同时用兼容的新版本传递依赖消除已知生产风险。
- 考虑过的替代方案：
  - 使用浮动 `latest` — 拒绝，因为不可复现且可能跨越 Master Spec 指定的主版本。
  - 使用 `npm audit fix --force` 建议的 Next.js 9.3.3 — 拒绝，因为属于破坏性降级且违反技术栈要求。
  - 忽略生产依赖 advisory — 拒绝。

## DEC-028 — 媒体通过 MediaAsset 外键关联且初始 migration 强化数据完整性

- 日期：2026-07-28
- 状态：已接受
- 决策：LifePoint 和 Response 不存储可公开访问的内部路径，而通过可选且唯一的 `mediaAssetId` 关联 MediaAsset；后续 view model 中的 `mediaUrl` 由受保护读取边界生成。初始 PostgreSQL migration 除 Prisma 可表达的唯一约束、索引和外键外，还加入生命周期一致性、LifePoint 内容、Response payload、非负 visit count、正数媒体大小等 CHECK constraint，以及一个 User 只能拥有一条 `ACTIVE` Resident 记录的 partial unique index。所有核心内容关系使用 `RESTRICT`，不允许级联删除共同内容。
- 理由：MediaAsset 关系可以隐藏内部存储位置并统一授权；数据库约束为 Service 层规则提供最后一道一致性保护。
- 考虑过的替代方案：
  - 直接在 `mediaUrl` 存储本地路径 — 拒绝，因为可能泄露内部路径并绕过媒体授权。
  - 仅依赖 Service 验证所有不变量 — 拒绝，因为并发写入和未来维护脚本仍可能产生无效数据。

## DEC-029 — 应用工程以仓库根目录为唯一运行根目录

- 日期：2026-07-28
- 状态：已接受
- 决策：真实项目根目录固定为 `/Users/yuan/Desktop/our-space`。应用代码、Prisma、测试、工程配置、lockfile 和 README 位于仓库根目录；`docs` 只保留规格、计划、决策、状态、限制、变更日志和阶段 Review 文档。`src/server/services/README.md` 作为源码约定保留在对应源码目录。生成目录不得在目录修正中移动，必须在根目录通过可复现安装重新生成。
- 理由：工具命令、相对路径、Git 边界和新会话上下文必须共享同一个明确根目录；文档目录不应承担应用工作区职责。
- 考虑过的替代方案：
  - 继续将 `docs` 作为应用根目录 — 拒绝，因为与目标仓库结构和文档职责冲突。
  - 建立嵌套 workspace — 拒绝，因为 Phase 1 不需要 monorepo 或额外 workspace 复杂度。

## DEC-030 — 修正 DEC-023 的媒体字段表述

- 日期：2026-07-28
- 状态：已接受（修正 DEC-023 的字段描述，不改变其 MVP 范围决定）
- 决策：Response 图片仍属于 MVP。实际 Schema 中 Response 与 LifePoint 均通过可选的 `mediaAssetId` 关联 `MediaAsset`，不持久化面向客户端的 `mediaUrl`。未来客户端 view model 中的 `mediaUrl` 必须由受保护的媒体读取边界按授权生成。DEC-023 中“Schema 保留 `mediaUrl`”是不准确表述，以本决策和 DEC-028 为准；`ResponseType.IMAGE` 继续保留并须在 Phase 5 实施。
- 理由：持久化受保护媒体 URL 会混淆存储标识和授权读取地址；使用 `mediaAssetId` 可集中执行 Space 成员权限并避免暴露内部路径。
- 考虑过的替代方案：
  - 将 `mediaUrl` 加回数据库 — 拒绝，因为会复制可派生信息并增加授权绕过风险。
  - 删除 Response 图片 — 拒绝，因为未经 Master Spec 明确修改不得缩减 MVP。

## DEC-031 — Node.js 22 LTS 是唯一项目目标运行时

- 日期：2026-07-28
- 状态：已接受（收紧 DEC-027 的运行时范围）
- 决策：项目目标运行时统一为 Node.js 22 LTS。`.nvmrc` 保持 `22`，`package.json.engines.node` 使用 `>=22.0.0 <23.0.0`，README 要求 Node.js 22 LTS，`@types/node` 使用 22.x。验证命令必须在 Node.js 22 下执行；开发者本机默认 Node.js 版本可以不同，但进入仓库后应切换到 `.nvmrc` 指定版本。
- 理由：运行时、类型声明和文档一致可减少本地与 CI 差异；Node.js 22 是当前项目已选定的 LTS 基线。
- 考虑过的替代方案：
  - 继续允许 Node.js 20.9–24 — 拒绝，因为范围过宽且与 `@types/node`、实际验证版本不一致。
  - 升级到 Node.js 24 — 拒绝，因为本任务要求优先使用 Node.js 22 LTS，且无必要扩大 Phase 1 变更。
