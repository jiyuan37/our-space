# Our Space — 当前状态

最后更新：2026-09-05

## 当前 Phase

- 当前工作包：AVATAR-01 — 自拍生成、用户确认与持久卡通身份；用户已明确批准正式实现，Phase 1–3 基础保留。
- 当前状态：**AVATAR-01 产品流程已实现到真实视觉验收前一步；等待用户授权 1 次最终 FLUX candidate generation。不是 fully validated，画风/相似度尚未验收。**
- Phase 3 implementation 已完成并通过 Final Review；本轮不重做历史验收。
- 实际项目根目录：`/Users/yuan/Desktop/our-space`。
- 最新授权仅执行 AVATAR-01；允许相关 Schema、正式 Home、配置、测试与文档改动，并在检查后正常提交/push。地图生产接入、定位和 ANIMATION-01 不在本轮范围。
- Phase 2 已完成并通过最终 Review；Phase 3 前置 UI/UX Review、Design Decision Closure、implementation、Independent Final Review 与 Final Polish Patch 均已完成。
- **Phase 4 尚未开始，也未获得批准。**

## AVATAR-01 私密候选闭环（本轮最新状态）

- 实际起点 `7228b8f8ba41cb94d809f013beead5b31e6f478f`，main、干净工作树、origin/main 同步 0/0，远程未变；不使用旧视觉提交重置代码。
- 本轮真实外部调用 **0 次**。此前 2/2 已用完；FLUX.2 klein 4B 是唯一已有真实成功证据的 provider candidate，不能据此判断画风。SDXL 400 / 3030 保留为 provider-specific unresolved issue，不重试、不阻塞。
- `/avatar` 上传、本地预览、同意、生成、私密候选、勾选并「就用这个」、正式 Home/Resident 显示、Partner 授权和重新登录持久闭环；受控测试不冒充真实 AI。
- 候选以任务 UUID 为稳定身份，经独立 candidate route 仅本人读取；确认事务清空 candidate 指针并切换 Resident/final 指针，原候选地址随即失效。最终资源只允许同 Space ACTIVE Resident。
- 保存 256px 透明显示图及 1024px 模型生成源图，记录 model/policy/style/baseAvatarVersion；原自拍仍不落盘。取消/过期清理两份资源，替换先验证新文件再原子切换，提交后清理旧文件；失败不毁旧身份。
- 新增 `20260905180000_avatar_candidate_source`，独立 PostgreSQL 测试库 4/4 migrations；不修改已应用 migration，不操作真实账户数据库。
- `AVATAR_PROVIDER=cloudflare-flux-klein`；真实请求还需 `AVATAR_EXTERNAL_REQUESTS_ENABLED=true`，默认关闭，本轮保持关闭；不修改用户 `.env.local`。处理政策开关不能代替请求授权。部署持久私密卷及排除备份仍需配置，不能冒充已部署。
- 本轮 23 files / 109 tests（31 项真实 PostgreSQL 集成）、18/18 双端 E2E、build、typecheck/lint、production audit 0、format/diff 检查通过。验证结果、截图与复现见 [AVATAR_OPERATIONS.md](./AVATAR_OPERATIONS.md)。本轮提交信息 `feat: complete private avatar candidate flow`，包含本节的完整 hash 以 Git 定位；正常提交/push 后目标干净 main、0/0，最终实际证据见交付报告。
- 下一次唯一真实操作：用户另行授权后，仅 photo-1、仅 1 次 FLUX，通过正式产品保存候选并让本人打开预览、确认或拒绝。不得运行只在内存校验后丢弃的旧 smoke harness。停止于此，不进入 MAP-01 / ANIMATION-01。

## AVATAR-01 上轮实现结果（2026-09-05，配置更新见下节）

- 已批准视觉参考及实际起点：`b6fe15a8c11270d3c1568f7f40af08484ce71fd3`。起点 main、工作树干净；fetch 后 main...origin/main 为 0/0，remote 与下文一致。未 reset、覆盖用户修改或强制推送。
- 正式 `/home` 非阻断创建/更换入口、`/avatar` 本地预览/知情同意/真实任务状态/本人选择确认/重试/取消；中文默认、完整英文。
- `AvatarGenerationProvider` 可替换；Cloudflare SDXL-Lightning img2img 优先，FLUX.2 klein 4B 仅显式配置后备测试，不自动切换。不接 OpenAI，不自动付费。
- `Resident.avatarMediaAssetId` / `avatarVersion` 与支撑性 `AvatarGeneration` 记录；候选与最终图私密存储，只有本人确认才更新正式身份；原照不落盘。
- 同 Space ACTIVE Resident 只能读取最终图；失败/取消不替换旧身份。服务端共享数据库防重复派发和滚动 24 小时 3 次/人、20 次/全站限额。
- 新 migration `20260905130000_avatar_identity` 已在独立 PostgreSQL 测试库应用；既有 migrations 未修改。当前没有头像服务所需的本地配置，未迁移真实用户数据库、未配置 Cloudflare 凭据、未调用真实图片服务。
- 自动测试使用明确标注的受控 fixture 与合成色块输入，仅证明应用流程，不证明 AI 生成或像本人。真实测试等待最多 2 张明确授权照片及 Cloudflare Free 配置；详情见 [AVATAR_OPERATIONS.md](./AVATAR_OPERATIONS.md)。
- 本轮验证：23 files / 102 tests、26 项数据库集成、18/18 双端 E2E、production build、lint/typecheck、3/3 migrations、production audit 0、格式/diff 检查通过；production 双端未配置状态零上传，截图及命令见运行说明。ANIMATION-01、MAP-01 生产功能及 Phase 4 均未完成，仍为必交付目标。
- 本轮提交信息 `feat: add private avatar generation and confirmation`；完整 hash 由 `git log -1 --format='%H %s'` 定位，避免自引用。提交/push 后目标 main、干净工作树、0/0；实际结果在最终交付报告记录，下轮仍须 fetch 核验。

## AVATAR-01 有限真实 smoke（上一轮历史）

- 起点 `7c96e3f98c4cee4d712f04148caf9ffa2f19f9aa`；main、干净，fetch 后与 origin/main 为 0/0，remote 未变。
- 用户已补齐 Cloudflare 关键配置并授权本轮最多 2 次；实际 2 次已用完，禁止追加。仅样本 1 存在，样本 2 未找到；原自拍未复制到应用存储。
- SDXL-Lightning：HTTP 400 / 3030，无图片；未确诊原因、未重试。FLUX.2 klein 4B：HTTP 200，1024px JPEG，实际去背景/像素规范化校验通过。
- 已从 provider 与双语说明删除额外风格参考图外发，仅本人照片＋固定提示；测试白名单防止增加图片。自动审核拒绝的那次操作未派发，仍共 2 次。
- 本次 smoke 输出仅在内存校验后释放，没有保留候选给用户人工确认；未验证像本人程度/批准画风，也未把真实照片结果绑定正式 Resident。AVATAR-01 仍未完成，不能以 HTTP 成功替代完整验收。
- 本轮证据、后续所缺条件与检查见 AVATAR_SMOKE_2026-09-05.md。`AVATAR_STORAGE_DIR` 尚未配置；本轮不改用户 `.env.local`。
- 本轮提交信息 `fix: narrow avatar inputs and record live smoke`，以包含本节的提交完整 hash 定位，目标正常推送后 main、干净、0/0；实际 Git 结果在交付中报告。

## Git 连续性

- 正式远程仓库：`https://github.com/jiyuan37/our-space.git`。
- `origin` 与 `public` 当前都指向该仓库；remote 名称整理不属于 Phase 2 Repair。
- 默认分支：`main`。
- Phase 1 最后验证代码提交：`1d277064a27ab29105e890bcf0f2373ac3b42196`。
- Phase 2 实施基线：`f2e8f518db8516a33abfac32ce7aa73d354347b5`。
- Phase 2 最终通过提交：`0c37e4acfbce8775a22bc5d7bf4feea1433048c5`。
- Phase 3 实施基线：`7f3f2708434de7eac193b826096ac9e4dfefcffb`。
- Phase 3 implementation 提交：`8d45341fc9ab47e4493b86bb240e8773ec8c3dce`。
- Phase 3 历史代码验证基线：`ab18b49c0e27ff1903604d1263bc45d956b8ff34`（`fix: polish phase 3 accessibility and state`）。
- 卡通身份/动画/地图文档同步开始时已成功执行 `git fetch origin`；HEAD 为上述代码验证基线，`main...origin/main` 为 `0 0`，工作树干净。

## Phase 2 已实现能力

- Credentials 注册、登录、登出和最小 JWT session。
- Email 规范化和 Argon2id 密码 hash/verify。
- `/space` protected route。
- Space 与 OWNER Resident 原子创建，以及单一 ACTIVE Space 数据库保护。
- Invitation token hash、创建、preview、撤销、过期、email 限制和 Serializable 接受。
- 双维度 RateLimiter、typed domain errors 和 Phase 2 响应式表单 UI。

## 本轮 Repair 已完成

- 修正 Invitation create/preview/accept 与 login/register 的 RateLimiter 入口接线。
- NextAuth Credentials 将 rate limit 映射为可识别的安全错误码，同时保留统一 invalid credentials 行为。
- Invitation 登录/注册 callback 使用仅允许站内相对路径的 sanitizer。
- Space 并发创建的 ACTIVE Resident `P2002` 映射为 `ActiveSpaceAlreadyExistsError`。
- revoke 等 Server Action 统一返回平静的 typed error view model。
- 无 `TEST_DATABASE_URL` 时 integration suite 可明确 skip，不再在 module load 崩溃。
- 扩充 Auth、Space、Invitation lifecycle、authorization、preview 和 concurrency integration tests。
- 扩充 desktop Chrome 与 Pixel 7 E2E，包括 callback、两名 Resident、第三人拒绝和非 OWNER 拒绝。
- 修复 E2E 登录 helper 未等待 Credentials response 的同步缺口，并收窄 Space full alert locator；未改变认证、callback 或限流产品逻辑。
- Production dependency override 锁定 `deepmerge-ts@8.0.2` 与 `nanoid@3.3.18`；`npm audit --omit=dev` 当前为 0。

## Phase 3 已实现能力

- `/home` protected route、有限有序 `HomeViewModel`、Space identity 与两位 ACTIVE Resident presentation。
- Quiet Home / 安静的家、Single Home + secondary Space/account menu，以及保留可访问的 Phase 2 Space/Invitation 管理能力。
- Presence `shortText` 读取、本人 inline update/upsert、显式 clear、120 Unicode 字符服务端 validation 与 typed Action state。
- freshness 以查看者浏览器本地日历日为 presentation boundary；初始 hydration 不渲染 Presence 文本，跨日自然回到 Quiet State，数据库旧记录不被自动删除。
- typed `zh-CN` / `en-US` locale resources、`zh-CN` fallback、HttpOnly cookie persistence、locale-independent URL，以及 Auth、Invitation、Space、error、Accessibility 与 formatter 的统一本地化。
- warm cream、克制 surface、semantic design tokens、responsive 双人布局、44px 操作目标、visible focus、live announcement 与 reduced-motion。
- Final Polish 已关闭 Independent Final Review 的 6 项非阻塞 MINOR：muted text AA contrast、inline secondary link touch target、Presence error description、语义 announcement、一次性 welcome query 与计划状态漂移。

## 必交付产品要求（当前进度见上文）

- `AVATAR-01`：Resident 必须能通过自拍/上传、AI 卡通候选生成、选择/调整或重试、明确确认建立持久卡通身份；入口需在注册后或首次进入时显著可见。
- `ANIMATION-01`：用户主动留下状态后，必须由同一个已确认角色表达动作或表情；不能以静态头像或身份漂移的重复生成人物代替。
- `MAP-01`：地图与 marker/status point 是核心空间表达，不能被降级为可无限延期的边缘附加页。
- 三项方向进一步明确，具体规则及隔离原型见 AVATAR_AND_MAP_SPEC.md；AVATAR-01 采用本轮明确批准的 Cloudflare 免费路线与单用途处理边界；后台客户端与后续生产安排仍需相应授权。
- 地图已确认对应真实世界并作为未来 Home 主体；这不授权持续定位。Presence 与 LifePoint 保持概念区分，LifePoint 不强制 location。
- Avatar 目标不自动授权外部 AI 处理；自拍、原图、Presence 或 Space 内容不得在未获专项批准前发送给外部 provider。
- 详细状态、依赖、未决问题和验收目标见 `docs/AVATAR_AND_MAP_SPEC.md`；六个核心实体和已完成 Phase 1–3 的验收保持不变。

## 尚未开始

- Phase 4 及后续功能：Life Point、Response、Shared Moment、Visit、Memory 与 media workflow。
- ANIMATION-01 与 MAP-01 生产 implementation；AVATAR-01 正在实施与验证，不得列为尚未开始。
- Seed data 与 demo account 属于后续阶段。

## Phase 3 已收口的设计基线

- 正式采用 Direction A — Quiet Home / 安静的家；完整规则记录于 `docs/PHASE_3_DESIGN.md`。
- Home 是共同存在的地方，不是 Feed、Dashboard 或内容容器；Silence 是完整状态。
- Phase 3 使用 Single Home + secondary Space/account menu，不展示未来空 tab、disabled navigation 或 Phase 4+ placeholder。
- Presence 首版只暴露 `shortText`，使用 inline editing；它可选、可清除，不是在线、位置、活动或关系状态。
- Presence 只属于查看者的当前浏览器本地日历日；跨日后旧 Presence 不再展示，Home 回到 Quiet State，不新增 timezone 字段。
- 默认 locale 为 `zh-CN`，同时支持 `en-US`；Phase 3 必须建立统一 i18n architecture，现有 authenticated/private URL 与 Invitation callback 保持语言无关。
- Design Constitution、视觉、motion、mobile、Accessibility、Privacy-as-UI 和 Review blocker 见 `docs/PHASE_3_DESIGN.md`；长期决策见 DEC-044 至 DEC-046。
- implementation evidence、Independent Final Review 结论与 Final Polish closure 见 `docs/PHASE_3_REVIEW.md`。

## Migration 状态

- Provider：PostgreSQL 16。
- Foundation migration：`20260728060000_foundation`。
- Phase 2 migration：`20260728170000_phase_2_invitations`。
- Foundation migration SHA-256：`69a9a905bc0d713a9fb57bf68a7aaaf436899c83472a207313708874df0df20f`。
- Phase 3 未修改 Prisma Schema 或任何 migration；全新测试数据库已成功应用现有 2/2 migrations。

## Phase 3 历史验证状态

以下结果来自上一轮在 `ab18b49c0e27ff1903604d1263bc45d956b8ff34` 完成的 Phase 3 Final Polish 验证。本次规格与隔离原型未重新运行应用测试矩阵，不得把这些结果表述为本轮新执行证据。

| 检查                                        | 当前结果                                    |
| ------------------------------------------- | ------------------------------------------- |
| Node.js                                     | `v22.22.2`                                  |
| `npm ci`                                    | 通过；安全 override 已实际安装              |
| `npm run prisma:generate`                   | 通过；Prisma Client 6.19.3                  |
| `npm run prisma:validate`                   | 通过                                        |
| `npm run lint`                              | 通过                                        |
| `npm run typecheck`                         | 通过                                        |
| `npm test`                                  | 通过；19 files / 76 tests，无 required skip |
| PostgreSQL database integration             | 通过；15/15                                 |
| `npm audit --omit=dev`                      | 通过；0 vulnerabilities                     |
| Argon2id smoke                              | 通过；2/2                                   |
| PostgreSQL integration / clean migration    | PostgreSQL 16.15；2/2 migrations            |
| concurrency                                 | 最大 ACTIVE Resident = 2；违规 Space = 0    |
| 真实 E2E                                    | 通过；desktop Chrome + Pixel 7，12/12       |
| `npm run build`                             | 通过                                        |
| `npm run format:check` / `git diff --check` | 通过                                        |

## 安全要求

- 不得使用 `DATABASE_URL` 代替独立 `TEST_DATABASE_URL`。
- 不得记录密码、Invitation raw token、hash、认证 secret 或数据库凭据。
- Phase 3 implementation 已完成并通过 Final Review；Phase 4 尚未开始，也未获得批准。

## 本轮真实世界像素地图规格与隔离原型

- 起始 HEAD：`241e4594d04d98ff05d6055c11639e92cd39ecc7`（`docs: record avatar and map product requirements`）。从项目根目录成功 fetch 后，main 与 origin/main 为 `0 0`，工作树干净；正式远程与上文一致。
- 本轮交付提交通过 `git log -1 --format='%H %s'` 定位，提交信息为 `design: specify and prototype pixel map home`；该提交包含本节，避免在自身内容中写入无法固定的自引用 hash。交付同步目标为干净工作树、`main...origin/main = 0 0`；最终实际 commit/push 证据在交付报告中记录，下轮仍须 fetch 并复查。
- 该历史原型轮次的应用验证基线为 `ab18b49c0e27ff1903604d1263bc45d956b8ff34`；当前验证以本文顶部 AVATAR-01 结果为准。
- 原型入口：`prototypes/map-home/index.html`；根目录运行 `node prototypes/map-home/serve.mjs`，浏览器打开 `http://127.0.0.1:4173`。仅本地静态文件，不接入生产 Service。
- 本轮原型验证：23/23 状态机测试、24 组 Chrome 浏览器检查；375×812 / 1280×850 双语布局和 >=44px 触控通过，文字对比度最低 5.20:1，运行时外部请求/真实定位调用/页面错误均为 0。
- 双端真实截图、独立断言、对比度及网络验证见 `prototypes/map-home/README.md` 与 `screenshots/verification.json`。
- 地理数据：公开伦敦南岸 OSM 街区；人物、Presence、生活内容和位置变化均为明确标注的合成示例。巴黎远距视图标记为未打包底图，不冒充真实地图。
- 修正 README 的过时 Phase 2 状态描述；Phase 3 Review 未改动，Design 仅附加后续演进引用。
- 当前 Web/PWA 不保证隐藏/锁屏/关闭后的持续采样；前台有限能力尚未生产实施，完整后台需批准原生范围与采集隐私方案。
- 具体规格与隔离原型已完成，等待用户确认视觉和实现方案。

## 隔离原型 V2：头像优先与视觉降噪

- 本轮起始 HEAD：`a335e858b11748531a9481726762c83aebdc0f16`，main，干净工作树；成功 `git fetch origin` 后 `main...origin/main = 0 0`，remote 与上文一致。
- 用户已批准仅修改 `prototypes/map-home/` 与 AVATAR_AND_MAP_SPEC 的迭代记录、本文和 CHANGELOG；验证后正常提交/push。提交信息为 `design: refine pixel map home avatar hierarchy`，以 `git log -1 --format='%H %s'` 定位本节所属提交，避免自引用 hash。交付同步目标：main、干净、0/0；实际完整 hash 与 push 结果在最终交付报告记录，下轮仍需 fetch 核对。
- 重绘原创头肩头像（手机 60px / 桌面 76px）、专注看书与奶茶道具；简化底图纹理、宣传浮层、重复定位入口和底部操作。真实地理 JSON 与移动状态机未改。
- 23/23 独立状态机；旧 24 组浏览器语义完整保留并扩至 30 组，通过双端双语、44px、移动停止/刷新不重播/静态等价、详情与焦点/拖动、0 外部请求/定位调用/页面错误。5 对文字色最低对比度 5.20:1。
- before/after 同视角截图、手机选中、英文、moving/settled 及验证报告默认仓库外；完整路径和复现命令见 `prototypes/map-home/README.md`。现有 tracked V1 截图保留，不提交新临时浏览器产物。
- 生产 `/home` 未修改；真实头像生成与定位未实现。本轮仅隔离原型 V2，等待用户视觉确认；Phase 4 和生产三项能力仍未批准，应用测试基线仍为 `ab18b49c0e27ff1903604d1263bc45d956b8ff34`。

## V2 背景精修（2026-09-05）

- 起始 HEAD：`a9cbcebbca5aaa2858634ce73e236600b580b031`；main、干净工作树，fetch 后与 origin/main 为 0/0，remote 未变。
- 按本轮授权精修原创草地、树冠、建筑配色、暖色道路与稀疏水纹；重点是两位角色附近的 Jubilee Gardens / 河岸。保留真实地理、avatar-first、单一道具和移动状态机，生产 `/home` 未修改。
- 23/23 状态机、30 组浏览器检查通过，增加双端双语的装饰可见/不遮人物断言；format 与 diff 检查通过。截图/报告在仓库外 `map-home-warm/`，完整路径及复现见原型 README。
- 本轮提交信息 `design: warm up pixel map background`，以 `git log -1 --format='%H %s'` 定位本节所属提交；交付同步目标为 main、干净工作树、0/0，完整 hash 和正常 push 结果在最终交付报告记录，下轮仍须 fetch 核对。
- 仍为隔离原型，等待用户视觉确认；真实头像生成与定位未实现，生产应用验证基线不变。

## 局部人物美术重绘（2026-09-05）

- 实际起始 HEAD：`b2d9b8f1f821cd123e3ba3704d0ae69f37904747`，main、干净工作树；fetch 后与 origin/main 为 0/0，remote 未变；未使用更早提交覆盖工作树。
- `characters.mjs` 在原画布内真正重画为宽圆大头角色，头部可见占比约 84.4% / 82.9%；保留长发/短发身份和单一书本/奶茶，表情分别为温和专注/放松微笑。背景、布局、marker 尺寸、地理锚点和移动状态机均不变。
- 新增实际代码预览脚本，输出旧/新并排、正常 60px 尺寸和 4× 最近邻细节；同视角手机 before/after 与比例测量证据位于仓库外，路径/复现见原型 README。
- 23/23 状态机测试、保留旧 30 组并扩为 31 组浏览器检查通过；格式与 diff 检查通过，外部请求/真实定位调用/页面错误均为 0。不是新 Phase，未做生产 Phase 3 全量 Review。
- 本轮提交信息 `design: redraw expressive big-head avatars`；用 `git log -1 --format='%H %s'` 定位本节所属提交，交付同步目标 main、干净工作树、0/0；完整 hash 与正常 push 结果在最终报告记录，下轮仍须 fetch 核对。
- 生产 `/home`、数据库、依赖、真实头像生成和定位功能未动。完成后停止，等待用户确认人物前后对照。
