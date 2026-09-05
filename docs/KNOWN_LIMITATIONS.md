# Our Space — 已知限制

最后更新：2026-09-05

本文档记录有意设置的 MVP 边界、尚未解决的实现细节、技术债务和未来改进。本文档不授权实施 Master Spec 范围外的功能。

## 当前仓库限制

- Phase 3 implementation 已完成并通过 Final Review；Phase 4 尚未开始，也未获得批准。
- `/home` 已承载 Quiet Home 与 Presence；`/space` 继续作为次级 Invitation/account management 边界。
- 尚未实现 Life Point、Response、Shared Moment、Visit、Memory 或 Phase 4 media workflow。
- AVATAR-01 账户、私密生成/确认、持久身份及正式 Home 集成已写入；真实 Cloudflare 调用及相似度/画风未验证，闭环仍未完成。ANIMATION-01 和 MAP-01 生产未实现；三者保持必交付。
- locale preference 使用浏览器 HttpOnly cookie 持久化，不跨浏览器或设备同步；Phase 3 不为此增加数据库字段。
- 尚无 seed data 或 demo account；这两项属于后续阶段。
- Playwright 已配置 desktop Google Chrome 与 Pixel 7；本轮在独立 PostgreSQL 16.15 测试数据库 18/18 通过，头像为受控 provider，另覆盖 375px 视口。Safari 与 Firefox 尚未纳入当前自动化矩阵。
- 当前主机没有 Docker CLI，因此无法实际执行 `docker compose config` 或容器启动；`docker-compose.yml` 已通过 YAML 解析验证，clean migration 已在本机 PostgreSQL 16.15 全新数据库中以 2/2 通过。
- 本地 `MemoryRateLimiter` 只适合单进程开发与测试；多实例 production 必须替换为共享存储 adapter。
- Password reset、email verification 与 production email delivery 不属于 Phase 2，尚未实现。

## AVATAR-01 当前具体缺口

- 当前无 Cloudflare 账户配置及明确授权照片，真实服务调用为 0。SDXL 照片身份保持、FLUX 请求兼容性及模型生成质量尚未用真实响应验证；不能声称与批准画风一致或像本人已通过。
- `CLOUDFLARE_WORKERS_PLAN=free` 是部署者声明，不是账单 API 核验；必须实际确认 Free 账户。Workers Free 日额度共享给账户其他应用，不能保证所有请求可用；不自动付费/换模型。
- 透明背景采用受控色背景、边缘连通去色、64px 最近邻再放大及输出验证；不合格输出拒绝，不保证所有 AI 图片天然有效或可动画化。当前资源是基础身份，无动作层/骨骼。
- 私密本地存储需要持久卷、排除备份，并保证清理常驻运行；无共享文件卷的多实例部署不受支持。过期立即拒绝访问，物理删除在运行中定时处理；停机、I/O 失败存在补扫延迟，具体见 DEC-059。
- 真实用户数据库/部署尚未配置；新 migration 只在隔离测试数据库应用。未做 Safari/Firefox 或真实 Cloudflare production smoke。
- Cloudflare 声明未经同意不训练，但具体逐项保留、删除时限及处理地域未确认；本应用取消不撤回服务已收到的请求。不能承诺外部零保留。
- 自动测试 fixture 仅 `development` 且显式隔离 `_test` 数据库启用，页面明确标识；不能进入 production 或给真实用户充当 AI 成果。

## 有意排除在 MVP 之外

- 公开 profile 或公开内容。
- follower、公开 reaction、热度计数或推荐 feed。
- streak、排名、engagement score、游戏化或操纵性通知。
- chat room、输入状态、在线/离线状态、last-seen 状态或未读 badge。
- dating 功能。
- 两名以上有效 Resident。
- 家庭扩展、儿童、remembered resident 或 pet account。
- push notification。
- 原生移动应用仍未获范围批准；完整后台位置目标需要修订此排除项，不能用 Web/PWA 冒充满足。
- 订阅、广告或行为定向。
- AVATAR-01 明确范围之外的高级 AI 生成、AI 陪伴、关系推断，或将 Space 数据发送给外部 AI provider。AVATAR-01 的产品目标不构成外部处理授权。
- 复杂 memory 算法或单独的 Memory 实体。
- 高级关系时间标签；Visit 只使用简单日期分组。
- 除可扩展 design token 结构以外的 dark mode。
- 完整音频录制/上传；除非以后批准其实现足够直接，否则 audio 只保留为类型化扩展点。

## MVP 简化

- 一个 User 只能属于一个有效 Space。
- 一个 Space 最多支持两名有效 Resident。
- 一个 Life Point 支持文本和最多一个可选图片。
- Life Point 不需要 title、tag、location 或完整叙事。
- Response 为浅层结构：没有嵌套回复、公开 comment 或 reaction count。
- Home 是有限而平静的内容集合；更早内容通过 Visit 访问。
- Shared Moment 时间分组为 Today、This Week、Earlier This Month、Last Month 和 Earlier。
- 本地开发媒体存储位于可替换的 adapter 之后。
- light mode 是首个支持的主题。
- Presence 是可选且手动更新的，不是实时状态。

## 已确认必做且尚未全部完成的能力

以下项目不得作为技术债、optional backlog 或“未来增强”无限期延期；它们的目标已确认，AVATAR-01 本轮已获授权并推进，真实服务验收仍待完成：

- `AVATAR-01`：自拍/上传 → 卡通候选 → 选择/调整或重新生成 → 明确确认 → 持续使用同一 Resident 角色。
- `ANIMATION-01`：基于同一已确认角色表达用户主动留下的当前状态，并提供 reduced-motion / 静态等价。
- `MAP-01`：地图与语义明确的 marker/status point 成为核心空间表达。

详细边界和当前授权状态见 `AVATAR_AND_MAP_SPEC.md`。现有 `avatarUrl`、静态头像、Presence 文本或 LifePoint 数据模型都不能单独证明上述能力已完成。

## 尚未解决的技术细节

以下缺口必须在受影响阶段开始前于 `DECISIONS.md` 中解决：

- 本地 Docker Compose 运行仍需在具备 Docker CLI 的主机上做一次 smoke test。
- 上传 MIME allowlist、字节/尺寸限制、内容检查、metadata 策略、转换和孤立文件清理。
- AVATAR-01 是否阻断 Home、是否必须使用真人照片，以及拒绝上传、生成失败、不满意、稍后处理和撤回时的继续路径。
- Avatar 原图、候选、最终资源和派生 metadata 的数据模型、访问权限、保存期限、删除传播与 Resident/Space lifecycle 行为。
- Avatar AI 是否需要外部 provider；如需要，provider、处理地域、同意、训练/保留/subprocessor、删除与日志最小化必须先获专项批准。
- ANIMATION-01 的状态词汇、动作库、映射方式、是否逐次确认、动画格式/技术、性能预算和失败 fallback。
- MAP-01 的真实地理与 Home 主体方向已确认，marker/回放语义已具体化；生产 provider、完整 lifecycle/权限实现与集成仍需批准。
- MAP-01 采用地理数据；生产精度、采集频率、显式同意、保留/删除、provider/fallback 与后台原生方案仍待批准。
- 另一名 Resident 回应后，Life Point 的编辑规则。
- 已被回应的 Life Point 后续改为 private 或被移除时，其可见性与重访行为。
- Space 的恢复、永久删除、owner 转移、重新加入和完整数据保留期限仍需在对应用户功能实施前定义；Phase 1 只确定 `ACTIVE`/`ARCHIVED` 与 `ACTIVE`/`LEFT` 生命周期基础。
- User 账户删除以及数据导出/保留行为。
- Presence freshness 已由 DEC-045 收口为查看者客户端/浏览器本地日历日，且不新增 timezone 数据库字段；Visit 分组中两名 Resident 时区不同或旅行时的更广泛行为仍待 Phase 6 前解决。
- Visit counter 的并发语义，以及作者自己的重访是否采用相同计数方式。
- 纯文本及未来 rich content 的内容清理策略。
- 如果包含 AuditLog，其范围和保留策略。
- Safari、Firefox 与更广设备矩阵的正式兼容性验证。
- 部署与 CI/CD 平台；MVP 只强制要求可在本地运行。

## Phase 2 与 Phase 3 已实施的决策

以下原开放问题已由 DEC-032 至 DEC-041 收口并在 Phase 2 实施：

- Credentials email/password、最小身份字段 JWT session 和 `next-auth@4.24.15` 已实施。
- email 的 `trim`、小写规范化、统一查询/持久化和错误披露策略已确定。
- Argon2id、服务端 hash、15–128 字符长度范围与集中参数已实施。
- Invitation 的 OWNER 权限、随机 token、SHA-256 hash 存储、7 天有效期、单一 pending、预览最小披露和按需过期策略已确定。
- `tokenHash`、单一 `PENDING` Invitation 和 `acceptedAt` lifecycle constraint 已通过 Phase 2 migration 实施。
- Space/OWNER Resident 原子创建、Invitation 接受的 PostgreSQL `Serializable` 事务、事务内重查和有限序列化冲突重试已确定。
- Server Actions/Route Handlers 职责、ACTIVE Resident/OWNER 服务端授权、客户端 view model 最小化、CSRF/origin 和认证 cookie 策略已确定。
- RateLimiter 接口、账户/IP 维度和 typed domain error 已实施；生产共享存储 adapter 仍是明确限制。
- 独立 `TEST_DATABASE_URL`、真实 PostgreSQL integration、并发测试和真实浏览器 E2E 已在 PostgreSQL 16.15 完成 Repair 验证。
- Quiet Home、viewer-local-day Presence freshness 与语言无关 `zh-CN` / `en-US` i18n 已按 DEC-044 至 DEC-047 实施。
- Home query 最多读取两名 ACTIVE Resident，并以 `joinedAt`、`id` 确定性排序；Presence 旧记录保留在数据库但不作为跨日 current state 展示。

Phase 3 Independent Final Review 结论与 Final Polish closure 记录于 `PHASE_3_REVIEW.md`；本节不授权开始 Phase 4。

## 需要关注的预期技术债务

开发过程中，本节必须记录任何刻意接受的折中。目前已知：

- 完整 `npm audit` 当前在开发工具链中报告 2 个 high severity advisory（`brace-expansion` 与 `js-yaml`）；二者不在 production dependency audit 中。`npm audit --omit=dev` 为 0，应在兼容的上游工具链版本发布后升级。
- 需要生产环境 adapter 的本地存储和限流。
- 只在隔离测试环境中绕过生产身份认证的测试 helper。
- 初始 allowlist 不接受的浏览器专有图片格式。
- 因数据语义未解决而延后的设置或生命周期操作。
- 某阶段内无法修正的可访问性或响应式问题。

技术债务不得包括核心流程中的 placeholder、弱化的授权、失败的检查或被静默删除的范围。

## 仅允许作为扩展点的未来改进

- S3-compatible media storage。
- 分布式限流。
- 一个 User 加入多个 Space。
- 更多 household participant 类型。
- audio Life Point。
- dark mode。
- 更丰富且保护隐私的日期标签。
- 用于 Invitation 的生产环境 email delivery。
- 不暴露关系内容的生产环境可观测性和运维审计工具。

这些改进不属于当前 MVP，未经范围决策不得实施。

## 本轮隔离原型的具体限制

- 具体规格与隔离原型已完成，等待用户确认视觉和实现方案。
- 仅公开伦敦南岸 OSM 小范围数据；河流/公园/道路/建筑保留坐标，简化层级，不是导航或测绘产品。巴黎场景明确无本地底图；无全球地图、搜索、地理编码或离线生产方案。
- 人物、Presence、生活记录、轨迹均为原创/合成示例；没有 AI、真人输入、地理权限、真实位置上传或生产保存。
- 8 帧步态与 3 秒回放、距离/精度/freshness 参数是打样值，未经过真实 GPS 校准。示例浏览器游标不是生产 auth/权限缓存实现；权限 epoch 和访问复查是后续安全契约。
- 当前 Web/PWA 隐藏/锁屏/关闭后的持续采样技术上不可保证；前台共享也尚未实现；完整后台定位需要额外原生范围、隐私和采集授权。三种情况不混写为“以后再说”。
- 本轮 Chrome 双端验证不覆盖 Safari/Firefox/真机电量、后台或 OS 授权矩阵；未重跑上一轮 76/15/12 应用矩阵。
- 地图颜色、角色资源技术、provider、AI/自拍 lifecycle、身份是否阻断 Home/照片替代，以及定位精度/频率/保存仍有明确批准门槛；见 AVATAR_AND_MAP_SPEC.md。
