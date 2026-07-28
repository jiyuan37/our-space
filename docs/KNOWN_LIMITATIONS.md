# Our Space — 已知限制

最后更新：2026-07-28

本文档记录有意设置的 MVP 边界、尚未解决的实现细节、技术债务和未来改进。本文档不授权实施 Master Spec 范围外的功能。

## 当前仓库限制

- 当前完成 Phase 2；认证后 `/space` 是明确的过渡体验，不是 Phase 3 Home。
- 尚未实现 Home、Presence 编辑、Life Point、Response、Shared Moment、Visit 或 Settings。
- 尚无 seed data 或 demo account；这两项属于后续阶段。
- Playwright 已配置并成功枚举桌面端与移动端测试，但本轮未下载浏览器或运行实际浏览器 E2E；Phase 1 的强制验证范围只要求 unit tests。
- 当前主机没有 Docker CLI，因此无法实际执行 `docker compose config` 或容器启动；`docker-compose.yml` 已通过 YAML 解析验证，clean migration 则已在一次性 PostgreSQL 16.14 全新数据库中实际通过。
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
- 查看者时区的来源，以及两名 Resident 时区不同或旅行时的行为。
- Visit counter 的并发语义，以及作者自己的重访是否采用相同计数方式。
- 纯文本及未来 rich content 的内容清理策略。
- 如果包含 AuditLog，其范围和保留策略。
- Home 结果数量限制，以及时间戳相同时的确定性排序。
- 支持的浏览器/设备矩阵和具体可访问性审查工具。
- 部署与 CI/CD 平台；MVP 只强制要求可在本地运行。

## 已决策、尚未实施

以下原开放问题已由 DEC-032 至 DEC-040 收口，但这不构成 Phase 2 实施授权：

- Credentials email/password 与最小身份字段 JWT session 已确定；Auth.js/NextAuth 精确稳定版本仍须在获批实施前依据官方兼容性证据锁定。
- email 的 `trim`、小写规范化、统一查询/持久化和错误披露策略已确定。
- Argon2id、服务端 hash、15–128 字符长度范围及密码日志/客户端边界已确定；具体 hash 参数和精确 package 版本须在实施时集中配置并记录。
- Invitation 的 OWNER 权限、随机 token、SHA-256 hash 存储、7 天有效期、单一 pending、预览最小披露和按需过期策略已确定。
- 现有 Schema 尚未实现 `tokenHash` 命名、单一有效 `PENDING` Invitation 和 `acceptedAt` 生命周期数据库约束；需要在获批 Phase 2 中创建新的 migration，不得修改已有 migration。
- Space/OWNER Resident 原子创建、Invitation 接受的 PostgreSQL `Serializable` 事务、事务内重查和有限序列化冲突重试已确定。
- Server Actions/Route Handlers 职责、ACTIVE Resident/OWNER 服务端授权、客户端 view model 最小化、CSRF/origin 和认证 cookie 策略已确定。
- RateLimiter 接口、开发/生产 adapter 边界、账户与 IP 双维度默认限制和 typed domain error 已确定，但尚未实现生产共享存储 adapter。
- 独立 `TEST_DATABASE_URL`、真实 PostgreSQL、正式 migration、串行数据库集成测试和 Phase 2 真实浏览器 E2E 要求已确定；目前不存在 Phase 2 测试实现或结果。

本节及其他开放事项只描述未来实施边界，不授权开始 Phase 2，也不授权修改 Schema、依赖或应用代码。

## 需要关注的预期技术债务

开发过程中，本节必须记录任何刻意接受的折中。目前已知：

- 完整 `npm audit` 在 ESLint 开发依赖链中报告 9 个 high severity advisory，来源是旧版 `minimatch`/`brace-expansion` 的潜在 DoS。该依赖只在本地 lint 中处理仓库维护者控制的路径 pattern，不进入 production bundle；`npm audit --omit=dev` 为 0。强制修复会破坏 Next.js 15 的 ESLint 插件兼容性，应在兼容上游版本发布后升级。
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
