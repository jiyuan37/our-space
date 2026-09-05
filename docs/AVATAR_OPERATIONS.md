# AVATAR-01 运行与验证

最后更新：2026-09-05

## 当前完成程度

正式应用已接入头像创建入口、上传验证、可替换 Cloudflare provider、私密候选、本人确认、持久 Resident 绑定及同 Space ACTIVE Resident 最终头像读取。2026-09-05 后续获批并实际执行 **2/2 次真实 smoke**：SDXL-Lightning 返回 HTTP 400 / 3030；FLUX.2 klein 4B 返回 HTTP 200、1024px JPEG，经过实际规范化代码得到 256px 透明 PNG。没有自动重试或第三次请求。

**AVATAR-01 仍未完成**：本次仅验证内存中的生成/格式处理，输出已释放，没有保留候选做人工相似度、画风或最终身份确认；不能将技术请求成功表述为完整闭环。详见 [真实 smoke 记录](./AVATAR_SMOKE_2026-09-05.md)。

用户已批准大头像素风和本轮正式实现，并明确暂不批准 OpenAI 付费接入。不再风格比较、冻结或伦敦背景调整；ANIMATION-01 和 MAP-01 生产接入继续保留为后续必交付。

## 实际操作

1. 按 README 配置 Node.js 22、PostgreSQL、Auth；运行 `npm ci`、`npm run prisma:generate`、`npm run db:migrate:deploy` 和 `npm run dev`。
2. 保留现有注册/登录/创建或加入 Space，进入 `/home`。本人没有头像时显示「创建我的像素形象」，有头像时显示「更换形象」。不强制完成，不分配小林/小雨等示例人物。
3. `/avatar` 选择本人 JPEG/PNG/WebP，在本机预览。服务未配置时有明确说明，不能生成，仍能返回 Home。
4. 服务已配置后阅读单用途处理说明，勾选同意再点击生成。每次一张候选，不暗中凑多图；正在生成可取消，刷新读取同一任务而非再派发。
5. 只本人能看候选；以放大与手机 60px 预览检查，然后勾选角色并「确认并使用」。完成后正式 Home 使用私密资源；登出再登录持久，另一位有效 Resident 刷新后可见。
6. 不满意时「重新生成」先删除旧候选，保留本地所选照片，再由本人点击生成。失败可重试或退出；取消/失败/未确认不更换已有头像。确认请求重复到达不会再次覆盖新版本。

## Cloudflare 配置与免费边界

在项目本地 `.env.local` 配置，密钥不要发到聊天、日志或提交：

| 变量                                  | 用途                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID`               | 目标 Cloudflare 账户 ID                                                 |
| `CLOUDFLARE_API_TOKEN`                | 仅目标账户所需 Workers AI 权限，服务端使用                              |
| `CLOUDFLARE_WORKERS_PLAN`             | 实际核实账户为 Workers Free 后填 `free`；代码只读取声明，不查询账单计划 |
| `AVATAR_PROVIDER`                     | 首先 `cloudflare-sdxl-lightning`；后备显式设 `cloudflare-flux-klein`    |
| `AVATAR_EXTERNAL_PROCESSING_APPROVED` | 本轮头像单用途边界确认后填 `avatar-cloudflare-v1`                       |
| `AVATAR_STORAGE_DIR`                  | 私密持久绝对目录，不在 public；文件 0600、目录 0700，必须排除备份       |

缺少配置默认不派发。不得在付费账户上声称代码保证免费；用户尚未批准付费。如果改计划/计费/外发范围，需要相应明确授权。当前 Cloudflare 账户、Token、Free 声明、SDXL provider 与处理同意配置已存在；本轮未修改用户 `.env.local`。`AVATAR_STORAGE_DIR` 未配置，正式持久部署仍需落实私密卷/不备份规则；账户实际账单计划未通过 API 核验。

2026-09-05 查阅官方当前资料：

- [SDXL-Lightning](https://developers.cloudflare.com/workers-ai/models/stable-diffusion-xl-lightning/)：支持 `image` / `image_b64`、strength、guidance 等图像输入；Beta，模型页列每 step $0.00。本实现 1024×1024、4 steps、strength 0.65、guidance 7.5。本轮一次真实请求返回 400 / 3030，原因未确诊；不能宣称该路径已可用。
- [FLUX.2 klein 4B](https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/)：支持图像编辑/multipart；计量价每 512px 输入 tile $0.000059、输出 tile $0.000287。[Cloudflare 编辑示例](https://developers.cloudflare.com/changelog/post/2026-01-28-flux-2-klein-9b-workers-ai/)说明 `input_image_0` 等参数及小于 512px 输入；本实现照片缩至 480px、不额外外发参考图。4B adapter 已用一次真实响应验证接口和输出规范化；相似度/画风未验收。
- [Workers AI 定价](https://developers.cloudflare.com/workers-ai/platform/pricing/)：Workers Free 每日 10,000 Neurons；Free 额度耗尽请求失败，Paid 可计超额。账户其他应用共享额度，无法保证本应用可用次数；不自动升级/后备付费。
- [数据规则](https://developers.cloudflare.com/workers-ai/platform/data-usage/)：Cloudflare 声明未经同意不将内容用于训练或改进服务，不给其他客户使用。未确认逐项保留/删除时限和固定处理地域，不承诺零保留或即时服务侧删除。
- [REST 接入](https://developers.cloudflare.com/workers-ai/get-started/rest-api/)：目标账户与 API Token 由部署者配置，不提交密钥。

单次生成最多 150 秒、一次派发；数据库短事务锁实现跨进程请求 UUID 幂等与滚动 24 小时每人 3 次、全站 20 次；失败/取消不退次数，避免绕过。客户端断网先查询原任务，不自动重发。基础 HTTP 操作仍复用既有限流 adapter。

## 图片与身份生命周期

服务端验证 5 MB、JPEG/PNG/WebP 实际解码与 MIME 一致、单帧、至少 128px、最多 2000 万像素；旋转方向后去 EXIF、最长边缩至 1024px。原始照片不写磁盘/数据库，派发仅本人照片与固定头像提示；FLUX 也只发送本人照片和固定提示，不附带额外风格参考图。不发送姓名、Presence、位置、伴侣、生活记录或 Space 数据，不接 AI Gateway、R2/KV 日志缓存。

模型输出需是有效 1024px 单帧图，去除边缘连通的指定色背景，规范至 64×64 逻辑像素、透明 PNG，并最近邻放大到 256px。不合格透明边缘/尺寸/可见区域拒绝，不把任意图强行当作头像。基础图无奶茶/书本。规范化不保证相似度，不保证可拆层/骨骼动画；风格策略 `avatar-cloudflare-v1` 对应 `pixel-big-head-b6fe15a-v1`。

复用 Resident/MediaAsset，加支撑性 AvatarGeneration，不新增产品核心实体。任务记录 PENDING → READY → CONFIRMED 或 FAILED/CANCELLED。只有本人确认事务更新 `avatarMediaAssetId` 与 `avatarVersion`；确认前检查创建时版本，缺失文件拒绝替换。当前确认任务及资源持续保留，替换后旧文件删除，旧无资源任务与失败/取消元数据 7 天清理。

| 内容       | 读取                                | 保存与清理                                                             |
| ---------- | ----------------------------------- | ---------------------------------------------------------------------- |
| 原照       | 浏览器本地预览、服务端请求内存      | 应用不落盘；请求结束释放，不能撤回已发给 provider 的输入               |
| 未确认候选 | 仅本人且当前 ACTIVE membership      | 最长 24 小时，过期立即拒绝读取/确认；取消撤销读取并删除文件            |
| 最终图     | 本人及同 Space 当前 ACTIVE Resident | 私密持久保存至替换；离开/归档后不能继续通过该 Space 读取               |
| 孤儿文件   | 没有可读数据库授权                  | 启动/每 60 秒补扫创建超过 1 小时的孤儿；包括写文件后事务失败或删除失败 |

清理使用常驻 Node 定时器：在线时最多一个扫描间隔后物理清理到期候选；停机期间不承诺物理删除，启动补扫，读取授权仍按过期时间即时拒绝。需持续运行的 Node 主机、私密持久卷，并由部署者落实**不备份应用图片目录**；当前仓库无部署备份配置，不能声称这一操作已在外部主机验证。多实例必须共享私密卷，否则不支持。确认/取消文件删除失败会显示错误，资源读取已撤销，孤儿扫描补偿。

所有图片通过验证 session/成员关系的 `/api/avatar/assets/[id]`，响应 private/no-store；不放公共静态目录，不生成 bearer URL，不下发服务密钥。取消墓碑让先取消后到达的上传不派发；已经派发的结果迟到时丢弃删除。

## 自动验证与实际截图

自动测试无需外部服务；不使用用户照片、不重复请求付费模型。必须给出独立 `TEST_DATABASE_URL`；Vitest 文件串行执行，避免共享测试库互相清理。新增 migration `20260905130000_avatar_identity`，不修改旧 migration。

```bash
npm run prisma:generate
npm run prisma:validate
npm run db:migrate:deploy
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run format:check
npm audit --omit=dev
git diff --check
```

Playwright 通过 `development` + `AVATAR_E2E_FIXTURE=true` + DATABASE_URL 等于显式 `_test` TEST_DATABASE_URL 才启用 fixture，页面明确显示「自动测试模式 · 候选为受控测试素材，不是 AI 生成」。production 永远不能选 fixture；不要为真实用户开启。测试输出目录由 `AVATAR_EVIDENCE_DIR` 设置，生成截图来自实际页面和真实数据库，不是另画效果图。应停止其他占用 3000 的开发服务后运行，使 Playwright 使用其配置的测试服务。

本轮验证环境为 Node 22.22.2、PostgreSQL 16.15、新建独立测试数据库，3/3 migrations 已应用。本轮最终结果：

| 检查                                        | 实际结果                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `npm test`                                  | 23 files / 102 tests 全通过；其中真实数据库集成 26 项，无 required skip                                |
| `npm run test:e2e`                          | desktop Chrome / mobile Chrome 18/18；包含旧认证、Invitation callback、Presence 回归与头像闭环受控测试 |
| `npm run build`                             | 通过；正式 `/avatar`、3 个头像 API route 及既有页面均构建成功                                          |
| `npm run lint` / `npm run typecheck`        | 通过                                                                                                   |
| Prisma generate / validate / migrate status | 通过；独立 PostgreSQL 3/3 migrations，旧 migration 内容未变                                            |
| `npm audit --omit=dev`                      | 0 vulnerabilities                                                                                      |
| format / diff 检查                          | 通过；最终提交前复核                                                                                   |
| production 实际页面检查                     | 1280px / 375px、本地预览零上传、无 fixture/生成按钮、英文切换与取消、0 page errors                     |
| 真实照片/AI 服务                            | 后续已执行 2 次；1 次 400、1 次 200 并通过规范化。未验证相似度与画风，详见真实 smoke 记录              |

初轮失败是新增浏览器测试误把登出落点写为 `/login`（实际既有行为为 `/welcome`）、未限定错误提示和语言按钮真实可访问名称；修正测试后 18/18 通过。另修正 SQL advisory lock 返回类型、Node-only 清理导入、断网查询超时及组件测试 DOM 隔离。未调整原有认证/邀请/Presence 产品语义。

本轮截图位于仓库外：`/Users/yuan/.codex/visualizations/2026/09/05/01a06f69-36dd-7ce0-bada-87b2bbbfd321/avatar-product/`。

- `production-desktop-home-entry.png` / `production-mobile-home-entry.png`：实际 production 构建、未配置 provider 的非阻断 Home 入口。
- `production-desktop-unconfigured.png` / `production-mobile-unconfigured.png`：实际 production 构建的本地色块测试预览，无上传和生成；`production-check.json` 记录断言。
- `chromium-entry.png` / `mobile-chrome-entry.png`：实际创建页（手机视口 375×812）。
- `chromium-candidate-fixture.png` / `mobile-chrome-candidate-fixture.png`：受控候选、正常显示尺寸与确认。
- `chromium-home-confirmed-fixture.png` / `mobile-chrome-home-confirmed-fixture.png`：测试账户正式 Home 最终资源显示。
- `chromium-replace-en.png` / `mobile-chrome-replace-en.png`：英文更换页。
- `chromium-failure.png` / `mobile-chrome-failure.png`：错误后可重试/退出。

上述人物全部为自动测试 fixture，不是本人照片 AI 成果。原型人物代码未分配给真实账户。

## 本轮真实 smoke 的上限与剩余工作

用户明确授权最多 2 次真实请求，已全部用完；只使用实际存在的样本 1，指定样本 2 未找到。照片去 EXIF、最长边不超过 1024px，FLUX 再缩至 480px；原照未持久化入应用，未输出照片/base64/凭据/私密资源地址。额外风格图外发被自动审核拒绝后已从实际 provider 删除，拒绝本身未派发请求。

本轮成功返回的是临时内存输出，已释放，没有建立真实用户最终身份，也未提供效果图。后续需要用户另行授权生成并在私密候选流程中人工查看、确认，才能继续验证相似度、批准画风和真实生成后的身份闭环；不得借此自动追加请求。已有受控测试的持久性/权限证据仍有效，但不能替代这一缺口。
