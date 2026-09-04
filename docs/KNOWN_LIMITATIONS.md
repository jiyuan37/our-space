# Our Space — 已知限制

最后更新：2026-09-03

本文档记录有意设置的 MVP 边界、尚未解决的实现细节、技术债务和未来改进。本文档不授权实施 Master Spec 范围外的功能。

## 当前仓库限制

- Phase 3 implementation 已完成，等待独立 Final Review；Phase 4 尚未开始，也未获得批准。
- `/home` 已承载 Quiet Home 与 Presence；`/space` 继续作为次级 Invitation/account management 边界。
- 尚未实现 Life Point、Response、Shared Moment、Visit、Memory 或 Phase 4 media workflow。
- locale preference 使用浏览器 HttpOnly cookie 持久化，不跨浏览器或设备同步；Phase 3 不为此增加数据库字段。
- 尚无 seed data 或 demo account；这两项属于后续阶段。
- Playwright 已配置 desktop Google Chrome 与 Pixel 7；Phase 3 完整真实 E2E 在独立 PostgreSQL 16.15 测试数据库上以 10/10 通过。Safari 与 Firefox 尚未纳入当前自动化矩阵。
- 当前主机没有 Docker CLI，因此无法实际执行 `docker compose config` 或容器启动；`docker-compose.yml` 已通过 YAML 解析验证，clean migration 已在本机 PostgreSQL 16.15 全新数据库中以 2/2 通过。
- 本地 `MemoryRateLimiter` 只适合单进程开发与测试；多实例 production 必须替换为共享存储 adapter。
- Password reset、email verification 与 production email delivery 不属于 Phase 2，尚未实现。

## 有意排除在 MVP 之外

- 公开 profile 或公开内容。
- follower、公开 reaction、热度计数或推荐 feed。
- streak、排名、engagement score、游戏化或操纵性通知。
- chat room、输入状态、在线/离线状态、last-seen 状态或未读 badge。
- dating 功能。
- 两名以上有效 Resident。
- 家庭扩展、儿童、remembered resident 或 pet account。
- push notification。
- 原生移动应用。
- 订阅、广告或行为定向。
- 高级 AI 生成、AI 陪伴、关系推断，或将 Space 数据发送给外部 AI provider。
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

## 尚未解决的技术细节

以下缺口必须在受影响阶段开始前于 `DECISIONS.md` 中解决：

- 本地 Docker Compose 运行仍需在具备 Docker CLI 的主机上做一次 smoke test。
- 上传 MIME allowlist、字节/尺寸限制、内容检查、metadata 策略、转换和孤立文件清理。
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

本节不构成 Phase 3 Final Review 结论，也不授权开始 Phase 4。

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
