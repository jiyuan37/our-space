# 变更日志

所有重要项目变更均按时间顺序和语义化版本记录于此。可运行应用出现后，项目采用 [Semantic Versioning](https://semver.org/)；`0.0.x` 条目用于记录实施前规划。

## [未发布]

### Phase 2

- 实现 Credentials 注册/登录/登出、最小 JWT session 与受保护路由。
- 实现 Space 与 OWNER Resident 原子创建、单一 ACTIVE Space 和两名 ACTIVE Resident 上限。
- 实现 Invitation token hash、创建、preview、撤销、过期、email 限制与 Serializable 接受。
- 添加 Argon2id、email 规范化、可替换 RateLimiter、类型化错误及温暖响应式 Phase 2 UI 基础组件。
- 新增 `20260728170000_phase_2_invitations` migration；foundation migration 未修改。

### 修正

- 将误建于 `docs` 的应用代码、数据库、测试和工程配置迁移到真实项目根目录，删除旧生成目录，并保留首个 migration 内容不变。
- 修正 README 与格式化配置中的相对路径。
- 统一 Node.js 22 LTS、`@types/node` 22.x、`.nvmrc` 和 `package.json` engines 约定。
- 以 DEC-030 修正 DEC-023 中关于 `mediaUrl` 持久化字段的不准确表述。
- 从真实项目根目录以 Node.js 22.23.1 完成可复现安装、全部代码质量检查、production build、production dependency audit 和全新 PostgreSQL 16.14 migration deploy。

### 新增

- 添加根目录 `AGENTS.md`，规定新 Codex 会话的读取顺序、Phase 授权边界、证据要求和简体中文规则。
- 添加 `docs/CURRENT_STATE.md` 和 `docs/PHASE_1_REVIEW.md`，记录可由仓库验证的当前状态与 Phase 1 Review 证据。
- 添加 Git 连续性检查规则，要求新会话核对 remote、工作树、分支、最新提交和本地/远程 ahead/behind；状态不一致时停止，禁止自行改写历史。

### Review

- Phase 1 已通过最终 Review。
- Phase 1 最后验证代码提交为 `1d277064a27ab29105e890bcf0f2373ac3b42196`。
- 后续 `49eadaa1bdf40925cd7bfbf1c30565dab427841e` 只包含 Git 连续性文档更新，不改变 Phase 1 代码验证基线。

### 架构决策（尚未实施）

- 完成 Phase 2 的 Credentials/JWT session、email 规范化、Argon2id 密码、Invitation token hash 与生命周期、Serializable 事务、transport/授权、CSRF/cookie、RateLimiter 和真实 PostgreSQL/E2E 测试拓扑决策。
- 上述条目只记录 Phase 2 开始前的架构与安全边界，不代表任何功能、Schema、migration、依赖或测试已经实施。

### 后续

- Phase 2 尚未开始，尚未获得功能实施批准。

## [0.1.0] — 2026-07-28

### 完成阶段

- 完成 Phase 1 — 基础设施。

### 新增

- 初始化 Next.js 15、React 19、严格模式 TypeScript 和 Tailwind CSS 4 应用。
- 添加 ESLint、Prettier、Vitest、Testing Library 和 Playwright 配置。
- 添加响应式、可访问且不展示无效 Settings 入口的最小应用 Shell。
- 添加 spacing、radius、shadow、typography、surface、text、border、accent、danger 和 motion Design Tokens。
- 添加 Zod 服务端环境变量验证、`.env.example` 和中文本地开发说明。
- 添加 PostgreSQL 16 Docker Compose 环境及独立测试数据库初始化脚本。
- 添加 Prisma Schema、Prisma Client 配置和首个 PostgreSQL migration。
- 添加 User、Space、Resident、Presence、LifePoint、Response、SharedMoment、Invitation 和 MediaAsset 数据模型。
- 添加 Space `ACTIVE`/`ARCHIVED` 与 Resident `ACTIVE`/`LEFT` 生命周期字段、CHECK constraint 和 partial unique index。
- 添加类型化 Domain Errors、ServiceContext 和中文 Service 层约定。
- 添加 4 个测试文件，共 8 个 unit/component tests，以及 2 个 Playwright 项目配置。
- 添加 production dependency 安全 override：`postcss@8.5.23` 和 `sharp@0.35.3`。

### 验证

- `lint`、`typecheck`、unit tests、Prisma validation、clean PostgreSQL 16.14 migration、production build 和 production dependency audit 全部通过。
- Docker Compose YAML 静态解析和 Playwright 测试枚举通过。

### 架构

- 已认证应用变更默认使用 Server Actions；Auth.js、受保护媒体读取和文件上传使用 Route Handlers。
- 所有权限、业务规则和事务保留在 Service 层。
- 双人 MVP 中 `SHARED_WITH_RESIDENT` 与 `SHARED_WITH_HOME` 使用相同读取对象，但数据库继续保留两个值。
- Response 图片明确保留在 MVP 范围内。
- Space/Resident 生命周期采用状态转换，不级联删除共同内容。

## [0.0.1] — 2026-07-28

### 新增

- 完成阶段 0 的仓库检查和完整 Master Spec 审查。
- 添加包含验证和退出标准、具备阶段依赖关系的详细实施计划。
- 添加只追加、不删除的架构与产品决策日志。
- 添加已知限制清单，覆盖 MVP 排除项、简化项、尚未解决的技术细节和未来扩展点。
- 添加本变更日志。
- 将简体中文确立为后续对话、工程文档、计划、报告和说明的固定语言，并保留技术标识符与第三方原始输出。

### 变更

- 将现有 `IMPLEMENTATION_PLAN.md`、`DECISIONS.md`、`KNOWN_LIMITATIONS.md` 和 `CHANGELOG.md` 从英文完整转换为简体中文，保持原有技术含义、阶段结构、任务状态和决策记录不变。

### 已记录

- 将 `OUR_SPACE_MASTER_SPEC.md` 确立为单一事实来源。
- 记录规划基线中仓库尚无任何应用实施。
- 记录必须在用户明确批准后才能开始应用实施。
