# Our Space — Codex 仓库规则

本文件适用于整个仓库。所有会话必须以仓库文件和可复现证据为准。

## 修改前必读

每个新的 Codex 会话在修改任何代码前，必须依次完整读取：

1. `docs/OUR_SPACE_MASTER_SPEC.md`
2. `docs/AVATAR_AND_MAP_SPEC.md`
3. `docs/CURRENT_STATE.md`
4. `docs/IMPLEMENTATION_PLAN.md`
5. `docs/DECISIONS.md`
6. `docs/KNOWN_LIMITATIONS.md`
7. `docs/CHANGELOG.md`

不得依赖旧聊天记录覆盖仓库中的事实；如聊天内容与仓库证据冲突，先停止并明确报告差异。

## Git 连续性检查

每个新的 Codex 会话在修改任何代码前，必须从项目根目录依次运行：

```bash
git remote -v
git status --short
git branch --show-current
git log -1 --oneline
git rev-list --left-right --count main...origin/main
```

必须将命令结果与 `docs/CURRENT_STATE.md` 记录的远程仓库、默认分支、最后验证提交和同步状态进行核对；ahead/behind 必须符合文档记录。

- 如果实际 Git 状态与 `docs/CURRENT_STATE.md` 不一致，必须立即停止并向用户报告差异。
- 未经用户明确批准，不得执行 force push、reset、覆盖远程历史或其他可能丢失提交的操作。
- 不得在仓库文档、提交、日志或用户可见输出中记录密码、Token、SSH 私钥或任何环境变量秘密。

## Phase 与范围

- 一次只执行一个已经获得用户明确批准的 Phase。
- 未经批准不得进入下一 Phase。
- 不得增加新的核心产品实体。
- 不得静默删除、延期、缩减或降级 Master Spec 中的 MVP 功能。
- 涉及产品范围、后续规划、Resident identity、avatar、状态动画、地图、marker 或 status point 的任务，必须同时核对 `docs/AVATAR_AND_MAP_SPEC.md`。
- `AVATAR-01`、`ANIMATION-01` 与 `MAP-01` 是已确认必做产品目标；不得静默删除、降级为可选装饰或无限期延期。
- 数据库已有 `avatarUrl` 或页面显示普通静态头像，不等于卡通身份创建系统或同角色状态动画已经完成。
- 普通 Presence 文本/列表不等于地图或地图状态点已经完成；Presence 与 LifePoint 的概念不得混淆。
- 必须区分并明确标注“产品要求已确认”“详细设计已收口”“实施已批准”“验证已完成”；前一状态不得被表述为后一状态。
- 缺少关键规格时，报告具体缺口并停止受影响的实施判断，不得从旧聊天记忆猜测 provider、2D/3D、地图语义、位置权限、数据保存或删除规则。
- 不得自行安装系统级软件；如完成任务确实需要系统级软件，必须停止并请求用户批准。

## 证据与语言

- 所有重要声明必须提供文件、命令、测试结果或 Git 证据。
- 所有用户可见回复和工程文档使用简体中文。
- 代码标识符、文件名、目录名、数据库字段、API 路径、技术名称、终端命令和第三方工具原始输出保持技术原文。
- 展示英文错误日志时保留原文，并在其后提供中文原因与处理结果。
