# Our Space — Phase 3 设计基线

最后更新：2026-09-03

## 状态与权威边界

- Phase 3 前置 UI/UX Review 已完成。
- Phase 3 Design Direction 已完成收口。
- Phase 3 尚未实施，尚未获得 implementation 批准。
- 本文件是 Phase 3 设计宪法、视觉方向、Presence 体验、i18n 边界和 UI Review blocker 的集中记录。
- [`OUR_SPACE_MASTER_SPEC.md`](./OUR_SPACE_MASTER_SPEC.md) 始终是最高产品约束；如本文件与 Master Spec 冲突，以 Master Spec 为准。
- 长期稳定的产品与架构决定同时记录于 [`DECISIONS.md`](./DECISIONS.md)；本文件负责集中保存可执行的设计规则，避免把所有视觉细节拆成独立 DEC。

本文件不授权实施 Phase 3，也不授权修改应用代码、测试、dependencies、Prisma Schema 或 migration。

## 核心方向

Phase 3 正式采用：

> Direction A — Quiet Home / 安静的家

吸收 Direction B 的少量 editorial / paper-like 排版气质，以及 Direction C 的少量空间感与柔和 motion；B、C 不再作为并行视觉方案。

核心定义：

- Home 是一个共同存在的地方，不是内容容器。
- Presence 是 Resident 自愿留下的一句此刻，不是实时状态。
- Silence 是正常、完整、无需解释的状态。
- Motion 用于软化变化，不用于制造活跃。
- Privacy 让人感到被容纳，而不是被安全机制包围。

## Phase 3 Design Constitution

1. Home 是一个地方，不是一条 Feed。
2. Space 名称和两位 Resident 先于内容存在。
3. 安静必须看起来是有意设计的。
4. 用户什么都不做时，Home 仍然完整。
5. Presence 永远可选。
6. Presence 可以被注意，绝不能索取注意。
7. 两位 Resident 的身份权重平等。
8. Partner 可在阅读顺序上优先，但不能形成“监视对方”的视觉结构。
9. 只有自己的 Presence 可以编辑。
10. Presence 属于“此刻 / 今天”，不是活动追踪。
11. 新的一天开始后，旧 Presence 不再作为当前状态展示。
12. 旧 Presence 不展示精确 age、last seen 或更新时间压力。
13. Presence 过期后自然回归 Quiet State，而不是形成历史时间线。
14. 爱意不使用红点、未读数、倒计时或 streak 表达。
15. 不展示尚未真正可用的 navigation 或 placeholder 页面。
16. Phase 3 Home 不采用 Card Grid。
17. 留白属于结构，不是缺少内容。
18. Accent 用于方向与操作，不用于制造兴奋。
19. Motion 用于柔化状态变化，不争夺注意力。
20. Reduced Motion 是正式体验。
21. Privacy should feel like a door, not a lock.
22. Home 不展示关系指标、技术字段或行为监控。
23. Mobile 首屏必须完成核心情绪表达。
24. Phase 4+ 内容在真正实现前保持不存在。

Presence 的核心时间约束：

> Presence belongs to today. When today passes, silence returns.

正式中文表达：

> Presence 属于今天。今天过去后，空间自然回到安静。

## Home

Home 的第一感受是：

> 我回到了我们的地方。

而不是：

> 我来查看今天有什么更新。

Phase 3 Home 的主要信息层级：

1. Space identity。
2. Resident A 与 Resident B。
3. 两位 Resident 当天可选的 Presence。
4. Quiet State。
5. 自己的轻量 Presence 编辑入口。

Partner 可以在阅读顺序上略微优先，但两位 Resident 的身份权重必须平等；自己的 Presence 同样展示，避免把 Home 设计成观察 Partner 的状态面板。

Phase 3 不提前显示或伪造：

- Life Points。
- Response。
- Shared Moments。
- Visit 内容。
- Memory。
- `Leave a little` 的 disabled action。

不得用空 tab、空 Card、disabled control 或 placeholder page 暗示尚未实现的后续功能。可以在布局结构中为未来内容保留自然延展空间，但页面上不得出现不可用 UI。

## Presence

Presence 的正式定义：

> Resident 自愿留在共同空间中的一句“此刻的我”。

Presence 不是：

- online status。
- activity tracker。
- location tracker。
- last seen。
- productivity status。
- relationship signal。

Phase 3 首版规则：

- UI 默认只暴露 `shortText`。
- 不因为 Schema 已存在 `mood` / `context` 就制造复杂编辑表单。
- 自己可以编辑自己的 Presence；Partner 不可编辑。
- 编辑入口需要可发现且克制，不得依赖只有视觉含义的 icon。
- 默认采用 inline editing，不使用沉重的 Modal 流程。
- Mobile keyboard 场景可以扩大贴合内容的编辑区域，但编辑始终保持轻量。
- 不显示精确更新时间，也不显示“多久没更新”。
- 不提醒 Partner 更新，不提供“催一下”。
- 用户可以主动清除 Presence，让 Home 回到 Quiet State。
- Presence icon 只能用于身份或内容辅助，不得采用在线绿点、离线点或活动指示器。

## Presence freshness

Presence 只属于查看者的当前本地日历日。

- 使用客户端 / 浏览器本地时区判断当前日。
- 时间戳继续按既有规则以 UTC 存储；本决定不修改 Schema。
- 跨入新的一天后，旧 Presence 不再作为当前 Presence 展示。
- 不显示“X 小时前”“昨天留下”“先前留下”或任何 exact age。
- Home 自然回到 Quiet State。
- Presence 不形成历史时间线，也不承担 Memory 职责。
- 本阶段不为 User 或 Resident 新增 timezone 数据库字段。

具体客户端时区传递、hydration 一致性和日界线测试方案留待获批的 Phase 3 implementation design，但不得改变上述产品语义。

## Quiet State 与首次共同进入

Quiet State 是正常 Home 状态，不是错误或空数据状态。

必须满足：

- 保留 Space identity 与真实 Resident 身份。
- 不显示 `No data`、`No posts`、空列表框或失败式插图。
- 没有 Presence 时，不显示“未设置”或完成提示。
- 两个人当天都没有任何行为时，Home 仍保持完整构图与正常留白。
- 长期没有 Presence 不触发提醒、颜色变化或关系暗示。

Invitation 完成后的第一次共同进入，可以出现一次非常轻的：

> 欢迎回家。

或同等克制文案。不得加入 onboarding flow、checklist、progress bar、tutorial carousel、强制 Presence、“完成空间”或“还差几步”。如果用户不做任何操作，Home 仍然完整。

## Navigation

Phase 3 正式采用：

> Single Home + secondary Space/account menu

规则：

- Header 只承载 Space identity 与克制的 Space/account menu。
- 不增加只有一个有效 destination 的 bottom navigation。
- 不展示 empty Life Point、Visit、Shared Moment 或 Settings tab。
- 不展示 disabled future navigation。
- 现有真实可用的 Space、Invitation 与 account 操作可以进入次级菜单或现有管理边界。
- 未来页面真正可用后，再按 Master Spec 的完整 IA 演化导航。

## i18n 产品决定

Phase 3 正式支持：

- 默认语言：简体中文 `zh-CN`。
- 第二语言：English `en-US`。
- 首发 UI：中文优先。
- 用户可以切换语言，选择需要持久化。
- 首次选择可以参考浏览器语言，但产品正式 fallback 始终为 `zh-CN`。

Phase 3 Application Shell 必须建立正式的双语 i18n architecture。所有用户可见产品文案必须进入统一 locale resources，组件中不得散落硬编码产品文案。

统一 locale 层至少覆盖：

- 页面、menu 与 navigation 文案。
- 表单 label、helper text 与 validation/error 文案。
- Auth 与 Invitation 错误展示。
- Quiet State 与 Presence UI。
- `aria-label` 与 screen-reader-only 文案。
- success/error announcement。
- 日期、时间与数字 formatter。

中英文不要求逐字翻译，但必须保持相同产品意图和情绪强度。例如：

- 中文：`今天这里很安静。`
- English：`It’s quiet here today.`

中文文案必须自然、克制、温暖、生活化，不过度煽情、不过度可爱，也不制造关系压力。

## i18n 路由与数据边界

现有 private/authenticated URL 保持语言无关，不引入 locale path prefix。例如不得改成：

```text
/zh-CN/space
/en-US/space
/zh-CN/invite/[token]
```

必须保留 Phase 2 已验证的 Invitation callback 语义：

```text
/invite/[token]
→ login/register
→ /invite/[token]
```

语言状态通过 locale provider、cookie 或等价 app-layer mechanism 管理；具体 library 在 Phase 3 implementation design 中选择，本次不安装或实现。

Phase 3 i18n 不得：

- 新增第七个核心实体。
- 改变六个核心实体模型。
- 为核心对象增加不必要 locale 字段。
- 为语言切换修改 Prisma Schema。

如果未来需要跨设备同步语言 preference，必须作为 supporting preference 单独审查；它不属于本次数据库范围。

## 中文产品文案

避免：

- “宝宝”。
- “亲密值”或“爱情值”。
- “今日任务”或“连续陪伴”。
- “快去回应 TA”或“TA 在等你”。
- “已经 X 天没有互动”。
- “打卡”“解锁”“成就”或“奖励”。

文案必须邀请但不催促，说明但不监控，温暖但不替用户定义关系。

## Visual Direction

### Color

- 主背景采用 warm white / cream，避免纯冷白。
- Accent 保持低饱和，只用于方向、操作、focus 辅助和少量身份强调。
- 不大量使用情侣粉或爱心红。
- Danger 只用于真实错误和 destructive action。
- Phase 3 light mode first；Dark Mode 不是本阶段必需交付。

### Typography

- 正文优先可靠的 system / humanist sans。
- Serif 只能极少量用于 Space 名称或情绪标题。
- 不引入版权来源不明确或难维护的字体。
- 数字不得成为视觉核心。
- Direction B 的 editorial 气质通过层级、行宽和节奏表达，不通过装饰性字体堆叠表达。

### Surface

Home 不是一堆 Cards。

允许明确 surface 的情况：

- Presence 编辑表单。
- 错误与保存状态。
- 必须建立清晰边界的管理操作。

其他区域优先使用留白、typography、alignment、subtle divider 和克制的 tonal surface。禁止 Card Grid、heavy shadow、glassmorphism、excessive blur 和 gradient overload。

### Spacing 与页面深度

- Mobile 使用稳定 gutters、足够的垂直呼吸和不小于 44px 的 touch target。
- 首屏优先完成 Space、两位 Resident、Presence / Quiet State 的情绪表达。
- Desktop 核心 Home 区域保持克制行宽；额外宽度用于留白，不用于增加模块密度。
- 页面深度主要来自信息层级和少量 tonal surface，不依赖阴影堆叠。

### Design Tokens

实施时必须集中管理：

```text
background
surface
text-primary
text-secondary
border
accent
danger
focus
radius
spacing
shadow
motion-duration
motion-easing
content-width
```

Token 使用语义命名；颜色、间距、圆角、阴影、动画时长和内容宽度不得散落硬编码在组件中，也不得为每个组件制造无必要的专属 token。

## Motion

建议实施基线：

```text
direct interaction: ~180–240ms
Presence transition: ~180–220ms
larger region/page transition: ~320–420ms
```

最终值必须进入 centralized motion tokens。

Presence 保存时：

- 保持原位置。
- 平滑替换文本。
- 必要时显示轻量 pending / saved 状态。
- 使用 `aria-live="polite"` 提供非打断式 announcement。

Optimistic UI 可以实现，但不是绝对要求。如果它显著增加状态复杂度或 rollback 风险，优先采用短暂、稳定的 pending state。丝滑不能以可靠性为代价。

禁止 confetti、bounce feedback、pulse、flashing、attention-seeking spring 和 reward animation。

`prefers-reduced-motion` 必须获得完整支持；Reduced Motion 是正式体验，不是功能降级。

## Mobile 与 responsive

- 以约 375px mobile viewport 为设计基线，同时验证 Pixel 7、常见 iPhone viewport 和 desktop。
- Touch target 不小于 44px。
- 关键操作支持单手触达并遵守 safe area。
- Presence 编辑必须正确处理 mobile keyboard，不遮挡输入、保存或取消。
- Android back 在编辑展开时应先退出编辑状态，不应意外离开 Home。
- 输入字号不得触发 iPhone 非预期页面缩放。
- Phase 3 Home 不应产生内容型长滚动。
- Desktop 不得只是放大的 Mobile；两位 Resident 可以横向组织，但语义与键盘顺序必须一致。

## Accessibility

Phase 3 必须覆盖：

- keyboard navigation 与 visible focus。
- semantic headings、Resident 分组和 landmark。
- screen reader labels 与有意义的 avatar fallback。
- sufficient contrast。
- reduced motion。
- 不小于 44px 的 touch target。
- 可见 form label、helper、错误关联与 pending 状态。
- 不仅依赖颜色表达错误或状态。
- `aria-live="polite"` success announcement 与适当的 error alert。

不得向 screen reader 宣布不存在的 online、offline、last seen 或 activity state。

## Privacy-as-UI

正式采用：

> Privacy should feel like a door, not a lock.

Phase 3 不得：

- 到处显示 lock icon。
- 持续显示 security banner。
- 在 Home 显示 email、internal ID 或 OWNER role。
- 显示 last seen、查看次数、行为追踪或技术授权状态。

只有真实边界才展示隐私或安全 UI，例如 Invitation、Leaving Space、destructive action 和未来 visibility choice。

目标是 safe without feeling surveilled，private without feeling defensive。

## Phase 3 UI Review blockers

以下任一模式出现，都应阻止 Phase 3 UI Review 通过：

- Feed 或 infinite scrolling。
- Instagram card stack。
- chat clone。
- dashboard tiles。
- gamification、streak、badges 或 reward。
- unread pressure 或 red dots for affection。
- last seen、online state 或 typing indicator。
- relationship metrics 或 engagement metrics。
- reminder pressure 或 notification-style pulsing。
- 大量 glass、gradients、blur 或 heavy shadow。
- 模板化情侣粉色、爱心或过度可爱文案。
- Resident account cards 或 Card Grid。
- empty future tabs 或 disabled future navigation。
- exact Presence age。
- 大量 Skeleton。
- `No data`、`No posts`、“提醒 TA”或“TA 正在等你”。

## Phase 边界

Phase 3 前置设计已经完成并收口，但 Phase 3 尚未开始。

获得用户明确 implementation 批准前，不得：

- 实现 AppShell、Home、Presence 或 i18n。
- 修改应用代码、测试、dependencies、Prisma Schema 或 migration。
- 创建 Life Point、Response、Shared Moment、Visit 或任何 Phase 4+ 功能。
