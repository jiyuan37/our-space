# Our Space — 卡通身份、状态动画与地图核心要求

最后更新：2026-09-04

## 权威边界与当前状态

本文档细化 [`OUR_SPACE_MASTER_SPEC.md`](./OUR_SPACE_MASTER_SPEC.md) 中 2026-09-04 新增的“卡通身份、状态动画与地图要求修订”，不是第二套产品事实来源。发生冲突时以 Master Spec 为准，并同步修正本文件。

- 产品目标：**已确认，属于必须交付的核心要求。**
- 详细交互、数据、安全与技术规格：**待收口。**
- 实施排期：**仅有依赖顺序提议，尚未获批。**
- 功能实施：**尚未开始，也未获得授权。**
- Phase 1–3 的既有实现与验收继续有效；本次需求修订不追溯改写其历史结论。
- 本文件不授权修改应用代码、Schema、migration、依赖或调用任何 AI / map provider。

“已确认要求”“设计已收口”“实施已批准”“验证已完成”是四种不同状态，后续文档与报告不得混用。

## 不变的产品基础

- 核心产品实体仍严格限定为 Space、Resident、Presence、LifePoint、Response 和 SharedMoment；不新增核心 Memory、Avatar 或 Map 实体。
- Quiet Home 继续保持平静、温暖、私密；地图不得把 Home 变成 dashboard、feed 或监控面板。
- 默认 locale 为 `zh-CN`，完整支持 `en-US`，URL 与 Invitation callback 保持语言无关。
- Presence 继续可选、由用户主动更新、无催促和无监控，并遵循 viewer-local-day freshness。
- LifePoint → Response → SharedMoment → Visit 的完整闭环继续属于必做范围。
- LifePoint 继续不强制 location；地图需求不改变这条规则。

## AVATAR-01 — 持久的卡通视觉身份

### 当前状态与授权

- 需求状态：**产品目标已确认。**
- 设计状态：**待收口。**
- 实施状态：**未实施。**
- 实施授权：**未获得。**

### 用户期望流程

```text
自拍或选择上传自己的照片
→ AI 生成卡通候选
→ 用户选择、调整或重新生成
→ 用户明确确认满意的最终形象
→ 后续持续使用这一已确认的角色身份
```

注册后或首次进入 Space 时，应显著引导用户创建卡通身份；不能仅把入口藏在低频 Settings 深处。

### 交付结果

- Resident 拥有由本人明确确认、后续持续复用的卡通视觉身份。
- 候选生成、选择、调整或重新生成与最终确认形成完整流程。
- 后续状态动画基于同一个已确认角色，不重新发明身份不一致的人物。
- 现有 `avatarUrl` 字段或一张静态图片只能作为数据/展示基础，不能单独证明 AVATAR-01 已完成。

### 依赖

- 自拍/上传入口与知情同意设计。
- 图片 MIME、大小、内容检查、metadata、授权读取与存储抽象。
- 原图、候选和最终生成资源的数据分类、访问权限、保留与删除规则。
- AI processing 边界、provider 评估及失败/撤回行为的明确批准。
- 与 Resident 生命周期、Space 私密授权和双语 Accessibility 文案的衔接。

### 尚未决定

- 创建身份是否阻断进入 Home。
- 是否必须上传真人照片，以及拒绝上传时的替代路径。
- 生成失败、用户不满意、稍后再做或撤回时如何继续。
- 候选数量、可调整范围与重新生成限制。
- 2D / 3D、图片 / rig / sprite 等表现与技术格式。
- 数据模型、保存期限、删除传播和跨 Space / lifecycle 行为。
- AI provider、部署方式与是否允许外部处理。

### 建议验收证据

- 新 User 与既有 User 均能发现创建入口，并可完成候选生成、选择/调整/重试与明确确认。
- 确认后在规定界面稳定复用同一 Resident 身份；重新登录和双语切换不改变身份。
- 未确认候选不会被误当作最终身份；另一名 Resident 和无关 User 不能修改或越权读取资源。
- 上传、生成失败、拒绝/撤回、删除与 provider 错误路径按获批规则通过测试。
- mobile、desktop、keyboard、screen reader、alt/fallback 与 reduced-motion 相关体验有可复验证据。

## ANIMATION-01 — 同一角色的状态动画

### 当前状态与授权

- 需求状态：**产品目标已确认。**
- 设计状态：**待收口。**
- 实施状态：**未实施。**
- 实施授权：**未获得。**

### 用户期望流程

```text
Resident 已确认卡通身份
→ Resident 主动留下当前 Presence / 状态
→ 同一个角色呈现相应动作或表情
→ Presence 失效或清除后停止表达为当前活动
```

### 交付结果

- 状态通过已确认的同一角色呈现动作或表情，而不是每次生成一个新人物。
- 动画表达用户主动留下的状态，不表达实时定位、在线状态、后台行为监控或系统情绪推断。
- 动态展示具备 reduced-motion 和等价静态状态；关闭动画不能丢失必要语义。
- 只交付静态头像不能证明 ANIMATION-01 已完成。

### 依赖

- AVATAR-01 已有稳定、可复用且经用户确认的角色身份。
- 状态词汇、动作库、状态到动作/表情的映射与失败 fallback 已完成设计收口。
- Presence viewer-local-day freshness、clear 行为与 animation lifecycle 一致。
- 性能预算、资源授权、Accessibility 与 reduced-motion 验收方案。

### 尚未决定

- 动作库和状态词汇的具体范围。
- 状态映射由用户直接选择、系统基于用户输入映射，还是二者结合。
- 动画技术、资产格式、生成/渲染方式和 provider。
- 用户是否需要逐次确认动作，以及角色调整如何影响既有动画。
- Presence 过期、切换、失败和网络不可用时的具体视觉过渡。

### 建议验收证据

- 多种获批状态均保持同一角色身份，可由用户理解并与 Presence 语义一致。
- 清除或跨过 viewer-local-day 后，不再把旧动作表现为当前状态。
- 不从设备传感器、位置、在线活动或背景行为推断状态。
- reduced-motion、静态 fallback、keyboard/screen reader 文案、mobile/desktop 和性能均通过验证。
- 无 streak、奖励、等级、装扮经济、催促或每日更新压力。

## MAP-01 — 地图与标记／状态点

### 当前状态与授权

- 需求状态：**产品目标已确认。**
- 设计状态：**待收口。**
- 实施状态：**未实施。**
- 实施授权：**未获得。**

### 用户期望流程

```text
Resident 进入共同空间
→ 看见作为核心空间表达的地图
→ 理解地图上的标记／状态点属于谁、代表什么
→ 在获批的 Home、Presence、LifePoint、SharedMoment 流程中查看或进入相关内容
```

具体入口、导航和内容关系必须在设计阶段确认，不能由上述流程预设。

### 交付结果

- 地图与其标记／状态点成为清晰可发现的核心空间表达，而不是被无限期延期的边缘附加页。
- 各类标记具有明确、可区分、可访问的语义与生命周期。
- 地图不自动等于真实地理位置，也不引入后台持续定位。
- Presence 当前状态与 LifePoint 生活记录保持概念区分；不得把所有状态点直接等同于 LifePoint。
- 只在普通 Home 中展示 Presence，不能证明 MAP-01 已完成。

### 依赖

- 真实地理地图、抽象共同生活地图或混合表达的产品选择。
- 地图与 Home / navigation 的信息架构收口。
- Resident、Presence、LifePoint、SharedMoment 各自是否以及如何出现的语义模型。
- 标记类型、创建/变化/消失条件、权限、空态与时间语义。
- 如需地理数据，必须先完成精度、来源、同意、权限、保留、删除与反监控规则。
- map provider、离线/fallback、成本、可访问性和隐私评估。

### 尚未决定

- 地图属于真实地理、抽象空间，还是二者结合。
- 地图与 Quiet Home 的结构关系，以及是否需要独立 destination。
- 每类 marker / status point 的含义与生命周期。
- 是否允许 User 主动添加地理位置；若允许，其精度与默认可见性。
- 聚合、缩放、搜索、路线或地理编码是否存在于产品范围。
- provider、地图数据来源、缓存与离线策略。

### 建议验收证据

- 用户能在 mobile 与 desktop 清楚发现地图，并理解获批标记类型的含义和归属。
- Presence、LifePoint 与 SharedMoment 的视觉/辅助技术语义不混淆，LifePoint 不被强制填写 location。
- 没有授权的 User 无法读取 Space 地图或标记数据；私密 LifePoint 不泄露到另一名 Resident 的地图。
- 若存在地理数据，权限拒绝、撤回、删除、精度和 provider failure 均有测试；不存在后台持续定位或 last-seen 推断。
- keyboard、screen reader、非视觉替代、contrast、touch target、reduced-motion 与 responsive 验证通过。

## 与六个核心实体的关系

| 核心实体     | 已确认关系                                                                      | 尚未决定且不得猜测                                         |
| ------------ | ------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Space        | 所有身份、动画、地图与标记都受 Space 私密边界约束                               | 多 Space 复用、Space 归档后的资源保留与地图行为            |
| Resident     | 卡通身份是 Resident 的持续视觉表达                                              | 最终字段、supporting record、版本与跨 lifecycle 行为       |
| Presence     | 可驱动同一角色的当前状态动画；仍是自愿、非监控且遵循 viewer-local-day freshness | 状态词汇、映射方法、具体视觉过渡                           |
| LifePoint    | 未来可能按获批语义出现在地图；仍不强制 location                                 | 是否出现、何种 marker、非地理 LifePoint 如何表达           |
| Response     | 继续承担接住 LifePoint 的领域语义                                               | 是否以及如何改变地图标记，不能预先等同于动画或 marker 状态 |
| SharedMoment | 未来可能按获批语义成为可重访的地图内容                                          | 出现条件、时间表达、与 Visit 的导航关系                    |

Avatar asset、animation asset、map data 或 marker representation 如需持久化，只能作为上述六个实体的属性、关系或支撑性基础设施设计；不得据此增加新的核心产品实体。

## 隐私、AI 与外部处理授权条件

### 当前有效边界

- AVATAR-01 允许未来设计“自拍/上传照片 → AI 生成候选”的产品流程，但**不自动授权**向外部 provider 发送任何数据。
- 在新的外部处理例外获得批准前，自拍、原图、生成资源、Presence 和共同生活内容都不得发送到外部 AI 服务。
- 即使以后批准 avatar-specific 外部处理，也不得把 Presence、LifePoint、Response、SharedMoment、Space 内容或关系数据作为隐含输入。
- 地图要求不构成位置权限或后台持续定位授权。

### 实施前必须批准

- 可能被处理的最小输入范围，以及是否确需外部 provider。
- provider 身份、处理地域、传输、保留、训练使用、subprocessor 与删除能力。
- 上传/发送前的清晰知情同意及撤回方式。
- 原图、候选、最终资源和派生 metadata 的保存位置、期限、访问权限与删除传播。
- 生成失败、不满意、拒绝上传、稍后处理或撤回后的非欺骗性继续路径。
- 安全审查、儿童/敏感内容边界、日志与 observability 的数据最小化。

## 建议依赖顺序（不是已批准排期）

1. 分别收口 AVATAR-01、ANIMATION-01、MAP-01 的产品语义、安全条件与验收计划。
2. 先完成 AVATAR-01 所需的 consent、media/privacy 与稳定角色身份设计，再申请头像 implementation Phase。
3. ANIMATION-01 在稳定角色身份和状态映射获批后实施；不能用一次性生成图片替代。
4. MAP-01 的语义与信息架构设计应尽早开始；其集成实现需与 Phase 4–6 中实际存在的 LifePoint、SharedMoment、Visit 能力协调，但不能因此无限期延期。
5. 每条轨道分别取得实施批准并完成验证；不能因为共享 media、animation 或 map 技术而自动扩大相邻 Phase 授权。

任何具体 Phase 归属、provider、2D/3D 方案或保存期限都只是待决事项；在用户明确批准前不得写成既定排期或实现决定。
