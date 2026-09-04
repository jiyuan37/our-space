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

## DEC-032 — Phase 2 使用 Credentials 与最小 JWT session

- 日期：2026-07-28
- 状态：已接受，取代 DEC-012 中认证与 session strategy 的待决定部分；尚未实施
- 决策：
  - MVP 使用 email/password Credentials 认证。
  - 注册、密码 hash 和密码验证逻辑位于 Service 层，不直接写入 React 组件或 Auth.js callback。
  - Auth.js 只负责登录、登出、session cookie 和认证边界，并使用 JWT session；Phase 2 不新增数据库 Session 表，除非实施前的官方兼容性证据表明当前组合必须使用。
  - session/JWT 只保存最低限度身份字段：`userId`、`email` 和 `name`。不得包含 `passwordHash`、Invitation token、Life Point 或其他 Space 内容、完整 Prisma User 对象。
  - 实施前必须依据官方文档和 package metadata，验证与 Next.js 15、React 19、Node.js 22 的兼容性，并锁定精确 Auth.js/NextAuth 版本。
  - 没有明确兼容性证据时不得采用 beta、alpha 或 RC 版本。本轮不选择或安装依赖。
- 理由：Credentials 满足本地可运行 MVP；最小 JWT 避免增加 Session 表，同时限制 cookie/JWT 中的敏感数据和过期数据。将凭据规则保留在 Service 层可独立测试并防止 callback 成为业务层。
- 考虑过的替代方案：
  - database session — 当前 MVP 不采用，因为会新增 Session 持久化和清理复杂度；若官方兼容性证据要求，必须追加新决策。
  - 在 Auth.js callback 中直接查询和验证密码 — 拒绝，因为会把业务规则耦合到 transport/auth adapter。
  - 未经验证使用 prerelease — 拒绝，因为当前运行时组合需要可复现的稳定兼容证据。

## DEC-033 — Email 规范化与账户错误披露

- 日期：2026-07-28
- 状态：已接受，取代 DEC-012 中 email 和本地注册策略的待决定部分；尚未实施
- 决策：
  - email 通过格式验证后执行 `trim` 和小写规范化；唯一性检查、登录查询和数据库持久化统一使用规范化值。
  - MVP 注册完成后立即可登录，不实现虚假的 email verification 流程。生产 email verification 作为后续扩展；在真正发送前，UI 不得声称已发送验证邮件。
  - 登录失败统一返回平静的通用错误，不披露 email 是否存在。注册时重复 email 可以返回明确错误，但不得泄露额外账户信息。
  - 不得记录原始密码、密码 hash 内容或认证秘密。
- 理由：单一规范化路径避免大小写和空白产生重复账户；登录错误最小披露可降低账户枚举风险，同时注册冲突仍需提供可操作反馈。
- 考虑过的替代方案：
  - 保留用户输入的 email 大小写 — 拒绝，因为会使唯一性和登录查询不一致。
  - MVP 伪造 email verification — 拒绝，因为没有真实发送和验证能力。
  - 登录时区分“账户不存在”和“密码错误” — 拒绝，因为会披露账户存在性。

## DEC-034 — 密码使用服务端 Argon2id 与长度型策略

- 日期：2026-07-28
- 状态：已接受，取代 DEC-012 中密码算法的待决定部分；尚未实施
- 决策：
  - 密码使用 Argon2id，hash 与验证只能在服务端 Service 层完成。
  - 密码最短 15 个字符、最长 128 个字符；不强制数字、大写字母或特殊符号组合。
  - 支持密码管理器粘贴和 Unicode，不静默截断密码。
  - Argon2id hash 参数必须在 Phase 2 实施时集中配置、依据目标运行环境校准并记录；不得散落硬编码。
  - `passwordHash` 不得返回客户端，也不得写入普通日志、错误消息或 telemetry。
  - 环境变量和配置不得包含真实示例密码。
- 理由：长密码和 Argon2id 提供现代抗离线破解能力，同时避免复杂字符规则降低可用性；明确最大长度可控制资源消耗。
- 考虑过的替代方案：
  - bcrypt-compatible hashing — 未采用，因为 Argon2id 更符合本项目的新实现安全基线。
  - 强制字符类别 — 拒绝，因为会妨碍密码管理器和 passphrase，安全收益有限。
  - 静默截断超长密码 — 拒绝，因为会制造不可见的认证行为和碰撞风险。

## DEC-035 — Invitation 使用原始链接 token 与数据库 token hash

- 日期：2026-07-28
- 状态：已接受，补充 Invitation 生命周期；尚未实施
- 决策：
  - 只有 Space 的 `ACTIVE` `OWNER` Resident 可以创建或撤销 Invitation。
  - token 由至少 32 个加密安全随机字节生成并编码为 URL-safe 字符串。复制链接使用原始 token；数据库只保存原始 token 的 SHA-256 hash，不保存可直接使用的 token。
  - Invitation 默认有效期为 7 天。每个 `ACTIVE` Space 同时只允许一个有效的 `PENDING` Invitation；创建新 Invitation 时，旧的有效 pending Invitation 必须在同一事务中变为 `REVOKED`。
  - MVP 不发送真实邮件，只生成可复制邀请链接。如果 Invitation 指定 email，接受邀请的登录账户必须匹配其规范化 email。
  - `expiresAt` 是过期判断的事实来源；读取或接受过期 Invitation 时可将状态更新为 `EXPIRED`，不引入后台定时任务。
  - Invitation preview 只展示 Space 名称、邀请者 display name 和是否仍可接受；不得展示其他 Resident 详情、Presence、Life Point 或任何 Space 内容。
  - `acceptedAt` 只有在状态为 `ACCEPTED` 时才允许非空。
  - 当前 Schema 的 `token` 命名和约束不满足上述最终设计。未来获批 Phase 2 必须通过新 migration 引入 token hash 语义、单一有效 pending 和 `acceptedAt` 生命周期约束；不得修改 Phase 1 migration。
- 理由：原始 bearer token 只出现一次可降低数据库泄漏后的直接邀请接管风险；短期有效、单一 pending 和最小 preview 可减少攻击面和隐私披露。
- 考虑过的替代方案：
  - 数据库存储原始 token — 拒绝，因为数据库读取权限将等同于邀请使用权限。
  - 同一 Space 保留多个有效 pending Invitation — 拒绝，因为 MVP 只邀请一位 Resident，会增加撤销和并发语义。
  - 后台任务统一过期 — 未采用，因为 `expiresAt` 可在访问时可靠判定，MVP 不需要调度基础设施。

## DEC-036 — Space 创建与 Invitation 接受使用 Serializable 事务

- 日期：2026-07-28
- 状态：已接受；尚未实施
- 决策：
  - Space 创建和 `OWNER` Resident 创建必须位于同一数据库事务。
  - Invitation 接受必须位于单一 PostgreSQL `Serializable` 事务，并在事务内重新检查：Invitation 存在、token hash 匹配、状态为 `PENDING`、未过期、指定 email 匹配、Space 为 `ACTIVE`、User 没有其他 `ACTIVE` Resident、Space 的 `ACTIVE` Resident 少于两人，以及 User 尚不是该 Space 的 Resident。
  - 只有全部检查通过后，才能创建或按既定生命周期规则恢复 Resident、将 Invitation 更新为 `ACCEPTED` 并设置 `acceptedAt`。
  - 可识别的序列化冲突进行有限重试，默认最多执行 3 次总尝试；不得无限重试或重试非瞬时领域错误。
  - 数据库约束与事务化 Service 共同维护不变量；并发接受绝不能使 `ACTIVE` Resident 超过两人。
- 理由：事务内重查与 Serializable 隔离可以关闭 Invitation 状态、Space 容量和 User active residency 之间的竞态窗口。
- 考虑过的替代方案：
  - 事务外先检查再写入 — 拒绝，因为并发接受可能突破两人上限。
  - 只依赖应用锁 — 拒绝，因为多进程和生产部署下不可靠。
  - 无限重试 — 拒绝，因为会掩盖持续冲突并消耗资源。

## DEC-037 — Transport 入口保持薄层并逐操作授权

- 日期：2026-07-28
- 状态：已接受，补充 DEC-005 与 DEC-022；尚未实施
- 决策：
  - 已认证应用的一方写操作继续默认使用 Server Actions。Auth.js、Invitation URL preview、认证 callback，以及其他天然需要 HTTP 语义的边界可以使用 Route Handlers。
  - transport 层只负责读取请求、Zod 验证、获取 session、调用 Service，以及将 typed domain error 映射为用户可理解的结果。
  - 所有业务规则、权限、事务和成员资格验证位于 Service 层。每个 Server Action 都视为可直接访问的入口，不能只依赖页面重定向或客户端隐藏。
  - 每次 Space 读写都在服务端重新验证 `ACTIVE` Resident；OWNER 专属操作额外验证 `Resident.role`。
  - 不得在没有明确需求时配置跨域 `allowedOrigins`。
  - 不得把 Prisma 原始对象返回客户端；`passwordHash`、token hash 和内部审计字段不得出现在客户端 view model。
- 理由：薄 transport 和逐操作授权可使 Server Action、Route Handler 与未来调用方共享一致的安全规则，并避免页面守卫成为唯一防线。
- 考虑过的替代方案：
  - 在各 Action/Handler 重复业务规则 — 拒绝，因为容易产生授权漂移。
  - 只在布局或 middleware 检查成员资格 — 拒绝，因为直接入口仍可被调用。
  - 默认放宽跨域 origin — 拒绝，因为当前没有跨域产品需求。

## DEC-038 — Same-origin、CSRF 与认证 Cookie 策略

- 日期：2026-07-28
- 状态：已接受，取代认证 CSRF/origin 的待决定部分；尚未实施
- 决策：
  - Server Actions 优先使用框架提供的 same-origin 保护。
  - 需要 Route Handler 的状态修改操作必须验证适用的 origin、session 和请求方法。
  - 认证 cookie 在实施时必须设置 `HttpOnly`、`SameSite=Lax` 或更严格，并在 production 环境设置 `Secure`。
  - 不自行创建可由 JavaScript 读取的长期认证 token。
  - 不得在 URL query、日志或错误消息中泄露 session token、Invitation 原始 token 或环境变量秘密。
  - 如果未来部署使用可信反向代理或确需跨 origin，必须通过新决策明确允许，不得默认放宽。
- 理由：same-origin、cookie 属性和显式 Route Handler 校验共同缩小 CSRF 与 token 泄漏面，同时避免提前引入无需求的跨域配置。
- 考虑过的替代方案：
  - 所有状态修改只依赖 cookie 而不校验 origin/method — 拒绝，因为 Route Handler 需要明确请求边界。
  - 将长期 token 存入可由 JavaScript 读取的存储 — 拒绝，因为会扩大 XSS 后果。
  - 全局允许跨域 — 拒绝，因为当前产品没有该需求。

## DEC-039 — Phase 2 使用可替换的双维度 RateLimiter

- 日期：2026-07-28
- 状态：已接受；尚未实施
- 决策：
  - Phase 2 定义可替换的 `RateLimiter` 接口；本地开发可使用进程内 adapter，生产环境必须可替换为共享存储 adapter。
  - 默认限制：
    - 登录：每个规范化 email 最多 10 次/15 分钟；
    - 登录：每个 IP 最多 50 次/15 分钟；
    - 注册：每个 IP 最多 5 次/小时；
    - Invitation 创建：每个 User 最多 10 次/小时；
    - Invitation preview/accept：每个 IP 最多 30 次/15 分钟。
  - 账户维度与 IP 维度分别限制，不得只使用组合 key。
  - 限流失败使用 typed domain error，并映射为 HTTP 429 或等价 Action 结果；用户文案保持平静，不展示 bucket、计数或防护策略。
  - 不把 IP 地址或认证标识写入普通应用日志。本轮不实现 RateLimiter。
- 理由：账户和网络来源分别限制可同时缓解定向撞库与广泛滥用；adapter 边界允许本地简单运行并为多实例生产部署保留正确实现。
- 考虑过的替代方案：
  - 只按 email 与 IP 的组合 key 限制 — 拒绝，因为攻击者可轮换其中一个维度。
  - 生产继续使用进程内 adapter — 拒绝，因为多实例间不共享计数。
  - 在错误中展示精确计数 — 拒绝，因为会泄露防护策略且不符合平静文案。

## DEC-040 — Phase 2 使用独立真实 PostgreSQL 与真实浏览器 E2E

- 日期：2026-07-28
- 状态：已接受，补充 DEC-026 并取代测试拓扑的待决定部分；尚未实施
- 决策：
  - 数据库集成测试必须使用独立 `TEST_DATABASE_URL`，不得复用开发数据库；测试前应用正式 migration。
  - 事务、约束和并发规则必须使用真实 PostgreSQL，不能只使用 Prisma mock。
  - 数据库集成测试默认串行运行，除非已经实现并证明安全的独立数据库隔离；每个测试必须可靠清理数据或使用隔离事务策略。
  - Phase 2 必须覆盖注册、登录、受保护路由、Space/OWNER Resident 原子创建、Invitation 创建/preview/接受、过期/撤销/已接受状态、email 不匹配、User 已有 ACTIVE Space、Space 已满、非 OWNER 创建 Invitation、并发接受不超过两名 ACTIVE Resident，以及未授权用户不能读取 Space 数据。
  - Phase 2 退出前必须运行真实浏览器 E2E，不得只枚举 Playwright 测试。
- 理由：Phase 2 的关键风险集中在 PostgreSQL 事务、partial unique index、并发和浏览器 session/cookie 行为，mock 或测试枚举无法证明这些安全不变量。
- 考虑过的替代方案：
  - 复用开发数据库 — 拒绝，因为会污染或破坏开发数据。
  - 只使用 Prisma mock — 拒绝，因为无法验证数据库隔离、约束和序列化冲突。
  - 只运行 `playwright test --list` — Phase 1 可接受，但 Phase 2 退出时拒绝，因为无法验证真实认证流程。

## DEC-041 — Phase 2 锁定认证与密码依赖

- 日期：2026-07-28
- 状态：已接受
- 决策：精确锁定 `next-auth@4.24.15` 与 `argon2@0.45.1`。NextAuth v4 使用 Credentials provider、JWT session、`NEXTAUTH_URL` 和显式 `AUTH_SECRET`；Argon2id 集中使用 `memoryCost=19456`、`timeCost=2`、`parallelism=1`、`hashLength=32`。
- 理由：npm metadata 证明该版本支持 Next.js 15、React 19 与 Node.js 22；本机 Argon2 smoke test 和 production audit 通过。

## DEC-042 — NextAuth v4 Credentials 使用安全错误码表达限流

- 日期：2026-09-02
- 状态：已接受
- 决策：`next-auth@4.24.15` 的 Credentials callback 会把 `authorize()` 抛出的错误编码到 callback error，并返回 HTTP 401，不能由 provider callback 直接返回 429。Phase 2 因此让 invalid credentials 返回 `null`，让 rate limit 抛出固定的 `RATE_LIMIT_EXCEEDED` 安全错误码，并由 LoginForm 映射为平静文案。其他内部异常只映射为固定 `AUTHENTICATION_UNAVAILABLE`，不传输数据库错误或 stack。登录 email/IP bucket 在凭据查询前分别消耗。
- 理由：保持 NextAuth 自带 CSRF/session 流程，同时让 rate limit 与账户是否存在无关、与 invalid credentials 可区分，并避免泄露内部异常。

## DEC-043 — 使用精确 transitive override 修复 Phase 2 production advisory

- 日期：2026-09-02
- 状态：已接受
- 决策：保持 Next.js 15.5.22、Prisma 6.19.3、NextAuth 4.24.15 和 Argon2 0.45.1 不变；使用 npm override 将 PostCSS 的 `nanoid` 锁定为安全的同 major `3.3.18`，将 `@prisma/config` 的 `deepmerge-ts` 锁定为 `8.0.2`。后者保持 Prisma 使用的 `deepmerge` ESM export，并支持 Node.js 22。必须通过 Prisma generate/validate、clean migration、全部测试、production build 和 production audit 验证。
- 理由：避免 `npm audit fix --force` 所建议的不安全降级或跨 major Prisma 升级，同时消除 production dependency graph 中已确认的 high severity advisory。

## DEC-044 — Phase 3 采用 Quiet Home 设计方向

- 日期：2026-09-03
- 状态：已接受
- 决策：Phase 3 正式采用 Direction A — Quiet Home / 安静的家。Home 是一个共同存在的地方，不是内容容器；Space identity 与两位 Resident 先于内容存在；Silence 是正常、完整、无需解释的状态。吸收少量 editorial / paper-like 排版气质、空间感和柔和 motion，但不再并行推进其他视觉方向。Phase 3 使用 Single Home + secondary Space/account menu，不展示尚不可用的 bottom navigation、Visit、Settings、Phase 4+ action 或 placeholder page。完整 Design Constitution、视觉规则、Accessibility、Privacy-as-UI 和 UI Review blocker 集中记录在 `PHASE_3_DESIGN.md`。
- 理由：Quiet Home 最直接落实 Master Spec 的 “Build a home, not a feed”、Quiet reassurance 与 Silence is a valid state，同时可让 Phase 3 在没有 Life Point 等后续内容时仍形成完整体验。
- 考虑过的替代方案：
  - 同时保留三套并行视觉方向 — 拒绝，因为会在实施前留下相互竞争的结构和判断标准。
  - Card Grid 或 Dashboard — 拒绝，因为会将 Home 变成内容/状态容器。
  - 提前展示未来 navigation 与 disabled action — 拒绝，因为会制造虚假承诺，并违反 DEC-025。

## DEC-045 — Presence 只属于查看者的当前本地日历日

- 日期：2026-09-03
- 状态：已接受
- 决策：Presence 是 Resident 自愿留在共同空间中的一句“此刻的我”，不是历史、活动追踪或实时在线状态。Phase 3 首版 UI 默认只暴露 `shortText`，允许本人编辑和主动清除，不因现有 `mood` / `context` 字段制造复杂表单。Presence 只在查看者客户端/浏览器本地日历日内作为当前 Presence 展示；跨日后 Home 自然回到 Quiet State，不显示 exact age、“X 小时前”“昨天留下”“先前留下”、last seen 或更新提醒。时间戳继续以 UTC 存储，本决定不增加 timezone 字段、不修改 Schema，也不创建新的核心实体。
- 理由：Presence 代表 “today's version” of a Resident。跨日后继续将活动短句作为当前事实会产生误导；把旧 Presence 变成历史又会侵入 Shared Moment / Memory 的生命周期，并带来监控压力。
- 考虑过的替代方案：
  - 永久展示最后一条 Presence — 拒绝，因为旧活动会被误读为当前状态。
  - 展示相对更新时间或“昨天留下” — 拒绝，因为会形成 last-seen 式压力和隐性时间线。
  - 为 User / Resident 新增 timezone 字段 — 当前 Phase 3 不采用，因为浏览器本地时区足以表达查看者的当天，且无需扩大数据模型。

## DEC-046 — Phase 3 建立 zh-CN / en-US i18n 且 URL 保持语言无关

- 日期：2026-09-03
- 状态：已接受
- 决策：Our Space 首发 UI 中文优先，默认 locale 为 `zh-CN`，第二 locale 为 `en-US`。Phase 3 Application Shell 必须建立正式、统一的双语 i18n architecture；所有用户可见文案、表单、validation/error、Auth/Invitation 错误、Quiet State、Presence、navigation、Accessibility announcement 和日期/时间/数字 formatter 都进入 locale 层，组件不得散落硬编码产品文案。用户可以切换语言且选择需要持久化；首次选择可以参考浏览器语言，正式 fallback 始终为 `zh-CN`。现有 authenticated/private URL 和 `/invite/[token]` callback 路径保持语言无关，不引入 locale path prefix。Phase 3 不为 locale 修改 Prisma Schema；具体 library 与 app-layer persistence mechanism 留待获批的 implementation design。
- 理由：双语属于 Phase 3 UI foundation；统一 locale 边界可以保持产品文案、错误与 Accessibility 体验一致。语言无关 URL 可避免扩大 middleware 与 Invitation callback 安全面，并保留 Phase 2 已验证的安全语义。
- 考虑过的替代方案：
  - 只支持简体中文 — 拒绝，因为正式产品决定要求同时支持 `en-US`。
  - 在组件中逐步硬编码两套文案 — 拒绝，因为会导致翻译、错误和 Accessibility 文案漂移。
  - 使用 `/zh-CN/...`、`/en-US/...` 路由前缀 — 拒绝，因为 private application 不需要 SEO locale URL，且会无必要地改变已验证的 callback 路径。
  - 立即新增数据库 language preference — 当前不采用；Phase 3 使用 cookie、provider 或等价 app-layer mechanism，不扩大核心数据模型。

## DEC-047 — Phase 3 使用 typed locale resources 与 HttpOnly cookie 持久化

- 日期：2026-09-03
- 状态：已接受并实施
- 决策：Phase 3 不新增 i18n dependency，使用仓库内 typed flat message resources 统一提供 `zh-CN` 与 `en-US` 文案；TypeScript 要求两套 locale 具有相同 key 集，未知 locale 和缺失错误 code 稳定回退到 `zh-CN` / `UNEXPECTED_ERROR`。Server Component 与 Client Component 共享同一 translator 和 `Intl` 日期/数字 formatter。用户明确选择写入一年有效、`HttpOnly`、`SameSite=Lax`、production `Secure` 的 `our-space-locale` cookie，并通过 root provider hydration；不读取 JavaScript storage、不增加 locale URL prefix、不修改 Prisma Schema。
- 理由：当前仅有两种 locale，轻量 typed resources 已能在编译与测试时发现 key 漂移，同时避免引入强制 locale routing 或不必要的依赖。HttpOnly app-layer cookie 可让 Server Component 首次响应直接使用正确 locale，并把 preference 与认证/业务数据分离。
- 考虑过的替代方案：
  - 新增通用 i18n library — 当前不采用，因为两种 flat locale 不需要额外运行时，且需避免路由与 hydration 复杂度。
  - `localStorage` persistence — 拒绝，因为 Server Component 首次响应无法读取，会造成 locale hydration 闪烁。
  - 数据库 preference — 拒绝，因为 Phase 3 不要求跨设备同步语言，且不应为 supporting preference 扩大 Schema。
