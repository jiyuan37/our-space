# 变更日志

所有重要项目变更均按时间顺序和语义化版本记录于此。可运行应用出现后，项目采用 [Semantic Versioning](https://semver.org/)；`0.0.x` 条目用于记录实施前规划。

## [未发布]

### 像素地图 Home V2 背景精修（2026-09-05）

- 新增原创像素草地层次、圆润稀疏树冠、低频水纹、暖沙道路与奶咖/浅陶土建筑；优先精修角色附近公园/河岸，不复制商业游戏素材。
- 保留真实地理数据、现有头像/单一道具、布局和移动状态机；装饰避开道路、头像与关键信息，生产 `/home` 未修改。
- 23/23 状态机、30 组浏览器检查通过，加入双端装饰不遮人物断言；format 与 diff 检查通过。同视角桌面/375px before/after 和公园特写为实际浏览器截图，保存在仓库外，路径见原型 README。
- 真实头像生成与定位未实现，本轮背景视觉待用户确认。

### 像素地图 Home 原型 V2：头像优先与视觉降噪

- 重新绘制原创头肩头像、可辨表情和单一道具；手机 60px、桌面 76px。地理锚点、真实底图 JSON、移动状态机和一次回放语义保持不变。
- 去除大宣传板和常驻双人条，收敛控制与单一创建主操作；建筑/地面纹理、装饰树和次要道路降噪，地名避开头像。统一演示标注与 OSM 归因。
- 单一人物详情、手机底部 sheet、键盘/Escape/焦点返回、拖动防误开；移动不更换身份或道具，reduced-motion 与刷新不重播继续有效。
- 23/23 状态机、原有 24 组语义扩至 30 组 Chrome 浏览器检查通过；双端双语、44px、文字对比度最低 5.20:1，运行时外部请求/定位调用/页面错误均为 0。同区域同 scale 的 before/after、selected、英文、moving/settled 证据保存在仓库外，见原型 README。
- 本轮只改原型与三份相关文档；生产 `/home`、依赖、Schema、migration、正式测试和 Phase 3 Review 未修改。真实头像生成与定位未实现，V2 等待用户视觉确认。

### 真实世界像素地图 Home 具体规格与隔离原型

- 具体规格与隔离原型已完成，等待用户确认视觉和实现方案。
- 以 AVATAR-01.1–.3、ANIMATION-01.1–.3、MAP-01.1–.5 细化真实地理/地图 Home、像素与柔和线条 Q 版、持久身份、Presence/位置分离、可信变化状态机、去重/缺口/暂停/长距/往返与静态等价。
- 新增 prototypes/map-home/ 独立 HTML/CSS/JavaScript，使用有 ODbL 归因的公开伦敦 OSM 数据、两名原创 SVG 角色及合成位置变化；包含双语、13 场景、状态/内容面板和无地点时刻入口。
- 新增独立状态机/Chrome 浏览器断言、双端实际截图与对比度证据；详细结果见原型 README 和 verification.json。本轮不重跑、不重新宣称上一轮 76/15/12 应用测试。
- 完成官方参考拆解与 Web/后台定位能力研究，明确原生工作包与旧 MVP 排除项的批准冲突；没有创建原生工程。
- 按用户补充将真实底图转译为原创星露谷式像素水纹/草地/树冠/屋顶，保留坐标并明确装饰非真实 POI；追加 DEC-056。
- 追加 DEC-052–055，同步 Master Spec、计划、当前状态、限制和 Phase 3 Design 演进引用；修正 README 的过时状态，Phase 3 Review 未修改。
- 不修改生产 src/、测试、根依赖、配置、Schema、migration，不请求用户照片/定位，不接入付费 provider 或外部 AI。

### 卡通身份、状态动画与地图产品要求文档同步

- 将 `AVATAR-01` 持久卡通身份、`ANIMATION-01` 同角色状态动画与 `MAP-01` 地图/marker/status point 登记为已确认必做的产品目标；详细设计与实施均未获批准。
- 修订 Master Spec 的 MVP scope、Resident/avatar、首次进入、Home/navigation、AI/privacy、motion、实施顺序与 Definition of Done 条款，并明确这些是 2026-09-04 新增要求，不追溯改写 Phase 1–3 历史验收。
- 新增 `docs/AVATAR_AND_MAP_SPEC.md`，集中记录三项交付的用户流程、结果、依赖、未决条件、隐私授权与建议验收证据。
- 追加 DEC-048 至 DEC-051，确认持续身份、状态动画、地图核心地位及外部 AI 处理不自动获授权。
- 为后续计划新增三条可追踪交付轨道与依赖顺序提议；具体 Phase 归属不是已批准排期，原 Phase 4–7 必需功能保持不变。
- 更新 `AGENTS.md`、`CURRENT_STATE.md` 与 `KNOWN_LIMITATIONS.md`，防止后续会话把字段/静态头像当作身份系统完成、把 Presence 当作地图完成，或混淆需求确认、设计收口、实施批准与验证完成。
- 本次只修改需求、指引与计划文档，未修改应用、测试、Schema、migration、依赖或生成资源，也未重跑上一轮 Phase 3 应用测试矩阵。
- Phase 3 已完成并通过 Final Review；历史结论仍为 `PASS WITH NON-BLOCKING FINDINGS`。Phase 4、AVATAR-01、ANIMATION-01 与 MAP-01 implementation 均未开始、未获批准。

### Phase 3 Final Polish Patch

- Independent Final Review 结论保持为 `PASS WITH NON-BLOCKING FINDINGS`；6 项非阻塞 MINOR 已全部关闭，无需再次 Review。
- 将 `--text-muted` 调整为满足 WCAG AA 的安静色值，并统一 login、register 与 Invitation inline secondary link 的 44×44px 最小触控目标。
- 为 Presence validation error 增加稳定 `id`，让 textarea 只引用实际存在的 hint/error；保留 `role="alert"`。
- Presence live announcement 改为保存 `saved` / `cleared` 语义状态，并在渲染时使用当前 locale 翻译。
- `created=1` / `joined=1` welcome 只在成功后的首次进入显示，并用客户端 history replacement 将最终 URL 清理为 `/home`；reload 与 locale switch 不重复。
- 19 files / 76 Vitest tests（database integration 15/15）、Playwright desktop Chrome + Pixel 7 12/12、production build 与 `npm audit --omit=dev` 0 vulnerabilities 全通过。
- Phase 3 implementation 已完成并通过 Final Review；Phase 4 尚未开始，也未获得批准。

### Phase 3 Implementation

- 实现 Quiet Home `/home`、响应式 Application Shell、两名 Resident presentation、完整 Quiet State 与 Single Home + secondary Space/account menu。
- 实现 Presence `shortText` 读取、本人 inline update/upsert、显式 clear、120 Unicode 字符服务端 validation，以及仅由 session/ACTIVE Resident 推导修改对象的 Service/Server Action 边界。
- 将 freshness 抽为 viewer-local-calendar-day 纯 presentation rule；初始 hydration 不泄露旧文案，跨日不显示 precise age 且不自动删除数据库记录。
- 建立 typed `zh-CN` / `en-US` locale resources、`zh-CN` fallback、HttpOnly cookie persistence 与 locale-aware formatter；Auth、Invitation、Space、error 和 Accessibility 文案一并迁移，URL 与 Invitation callback 保持语言无关。
- 扩展 Quiet Home design tokens、desktop 双列/mobile 单列布局、44px 操作目标、visible focus、ARIA live announcement、浏览器返回键关闭 inline editor 与 reduced-motion。
- Phase 3 未修改 Prisma Schema、未新增 migration、未增加核心实体，也未提前实现 Life Point、Response、Shared Moment、Visit、Memory 或 media workflow。
- 在 PostgreSQL 16.15 全新数据库应用 2/2 migrations；Final Polish 后 19 files / 76 Vitest tests（database integration 15/15）、Playwright desktop Chrome + Pixel 7 12/12、production build 与 `npm audit --omit=dev` 0 vulnerabilities 全通过。
- 实际浏览器视觉检查覆盖中文/英文、Quiet/Presence/edit、desktop/375px mobile；Phase 3 implementation 已完成并通过 Final Review。

### Phase 3 Design Decision Closure

- 完成 Phase 3 前置 UI/UX Review 与 Design Direction 收口；该变更发生时 Phase 3 implementation 尚未开始、未获批准。
- 新增 `PHASE_3_DESIGN.md`，集中记录 Quiet Home / 安静的家、24 条 Design Constitution、Home/Presence/Quiet State、视觉、motion、mobile、Accessibility、Privacy-as-UI 与 UI Review blocker。
- 通过 DEC-044 正式采用 Quiet Home，并将 Phase 3 navigation 锁定为 Single Home + secondary Space/account menu，不展示未来空 tab、disabled navigation 或 Phase 4+ placeholder。
- 通过 DEC-045 锁定 Presence freshness：Presence 只属于查看者浏览器本地日历日，跨日后 Home 回到 Quiet State，不展示 exact age，不修改 Schema。
- 通过 DEC-046 锁定 `zh-CN` 默认、`en-US` 支持、完整 i18n architecture 与语言无关 authenticated/private URL；不改变 Invitation callback 路径，不新增 locale 数据库字段。
- 对齐 `IMPLEMENTATION_PLAN.md`、`CURRENT_STATE.md` 与 `KNOWN_LIMITATIONS.md`；本次仅修改 docs/Markdown，未实施 Home、Presence、i18n 或任何 Phase 3/4+ 代码。

### Phase 2 Repair

- 修正 Invitation create/accept RateLimiter 接线，并移除 create Space 对 Invitation bucket 的错误消耗。
- 将 NextAuth Credentials rate limit 与 invalid credentials 安全区分。
- 修复 Invitation 登录/注册 callback 回跳，并拒绝外部 callback/open redirect。
- 将 Space 并发创建的 ACTIVE Resident unique conflict 映射为 typed domain error。
- 统一 revoke 等 Server Action 错误映射，补齐 Phase 2 按钮 touch target。
- 修复无 `TEST_DATABASE_URL` 时 integration suite 初始化崩溃，并扩充 Auth、Space、Invitation lifecycle、authorization、preview 和 concurrency 测试。
- 扩充 desktop Chrome 与 Pixel 7 E2E，覆盖 callback、两名 Resident、第三人拒绝和非 OWNER 拒绝。
- 修复 E2E 登录 helper 未等待 Credentials response 的测试同步缺口，并将 Space full alert locator 收窄到业务错误；产品认证、callback 安全和 RateLimiter 行为未放宽。
- 使用精确 override `deepmerge-ts@8.0.2` 与 `nanoid@3.3.18` 修复 production advisory；`npm audit --omit=dev` 为 0。
- 在 PostgreSQL 16.15 全新数据库完成 2/2 migrations、10/10 database integration、真实并发上限验证、14 files / 50 tests、desktop Chrome 与 Pixel 7 E2E 6/6、production build 和完整质量矩阵。
- Phase 2 Repair 完成；Closure Review 已确认全部原 blocker / major 关闭。

### Phase 2 正式关闭

- Phase 2 — Authentication and Space 已完成并通过最终 Review；最终代码提交为 `0c37e4acfbce8775a22bc5d7bf4feea1433048c5`。
- 已完成 Credentials authentication、最小 JWT session、protected routes、Space + OWNER Resident 原子创建，以及 Invitation create/preview/revoke/accept lifecycle。
- Invitation 使用 token hashing，接受流程使用 PostgreSQL `Serializable` transaction；RateLimiter、站内 callback 与 open redirect 防护已验证。
- lifecycle/authorization tests、真实 PostgreSQL integration、concurrency、desktop Chrome 与 Pixel 7 E2E、production build 均通过；`npm audit --omit=dev` 为 0 vulnerabilities。
- Closure Review 结论为 `PASS`；该 Closure 发生时 Phase 3 尚未开始、尚未获得实施批准。

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

### Phase 2 前架构决策

- 在 Phase 2 开始前完成 Credentials/JWT session、email 规范化、Argon2id、Invitation lifecycle、Serializable 事务、transport/授权、CSRF/cookie、RateLimiter 和真实 PostgreSQL/E2E 测试拓扑决策；这些决策随后已在 Phase 2 实施。

### 后续

- Phase 4 尚未开始，也未获得批准。

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
