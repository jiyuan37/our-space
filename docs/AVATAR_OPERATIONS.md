# AVATAR-01 运行与验证

最后更新：2026-09-06

## 当前完成程度

最新状态以 [HTTP200解析与源图保存修复记录](./AVATAR_PARSER_REPAIR_2026-09-06.md) 为准。上一轮额外获批1次已返回HTTP200后处理失败、没有可恢复输出，不能当成真实视觉验收通过。本轮仅离线修复，0次真实调用；必须全套适用检查后再请求新1次授权。

本地账户/数据库/存储已在那次请求前配置，由用户本人注册；实际HTTP结果未混入fixture。以下流程保持，source保存政策由DEC-062更新：有效模型JPEG/PNG先私密落盘，再做显示图规范化；FAILED且有source时本人可以预览但不能确认，24h/取消删除。原自拍仍不落盘。

## 进入与实际操作

1. 保留现有注册/登录、创建或加入 Space，进入 `/home`。无 final 时有「创建我的像素形象」，已有 final 时有「更换形象」；都指向 `/avatar`。入口非阻断，不分配示例人物。
2. 选择本人 JPEG/PNG/WebP，在本机预览，阅读单用途处理说明并同意。实际生成未启用时有明确提示，仍能预览、退出、使用 Home，不发照片。
3. 启用且获授权后，点击「生成一张候选」；每次一张。正在生成可取消，刷新仅查询同一任务，不重复派发。
4. 生成成功先持久保存私密 candidate，返回稳定任务身份及本人预览入口。页面显示放大与手机 60px 预览，刷新仍能恢复这张候选。
5. 勾选「我选择这个形象作为我的角色」并点击「就用这个」后才更新正式身份。Home 使用 final，Partner 刷新后可见；登出再登录仍保持。英文按钮为 “Use this character”。
6. 「重新生成」先撤销并删除旧候选，保留当前本地照片，由用户再次点击生成；不自动付费调用。取消回 Home。生成失败、未确认、取消或确认失败均保留已有身份；替换成功后清理旧图。

## Provider 配置与当前禁止调用状态

统一 `AvatarGenerationProvider` 抽象保留，正式 runtime 当前仅选 `cloudflare-flux-klein`，对应 `@cf/black-forest-labs/flux-2-klein-4b`。SDXL adapter 和无网络单元测试保留，不进入当前产品 runtime，不自动 fallback。

配置放在项目本地 `.env.local`，只在服务端读取；不要将秘密放进聊天、提交或日志：

| 变量                                             | 用途                                                                             |
| ------------------------------------------------ | -------------------------------------------------------------------------------- |
| `AVATAR_PROVIDER`                                | 当前唯一产品路径：`cloudflare-flux-klein`                                        |
| `AVATAR_EXTERNAL_REQUESTS_ENABLED`               | 默认 false；当前必须保持关闭。政策批准与本次请求授权分开；后续明确授权后才可启用 |
| `AVATAR_EXTERNAL_PROCESSING_APPROVED`            | 精确匹配 `avatar-cloudflare-v1`；不匹配时绝不派发                                |
| `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` | 目标账户及仅所需 Workers AI 权限；密钥仅服务端                                   |
| `CLOUDFLARE_WORKERS_PLAN`                        | 实际确认 Free 账户后填 `free`；这是声明，不是 API 账单核验                       |
| `AVATAR_STORAGE_DIR`                             | 私密持久绝对目录，不在 public；部署者必须排除备份                                |

额外真实请求前已配置本机正式数据库、FLUX选择、私密持久目录与Time Machine排除；常驻应用真实生成开关仍关闭。密钥未改变、未输出。不要复用旧的一次性smoke脚本绕过新授权；具体本轮migration/验证状态见修复记录。

下一次真实验收开始前，可按已批准范围完成数据库 migration、私密持久目录配置并选择 FLUX；这些是部署准备，不额外发送照片。不得靠开启测试 provider 为真实用户伪造 AI 形象。

2026-09-05 已核对的官方依据（本轮没有为诊断追加模型请求）：

- [FLUX.2 klein 4B](https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/) 与 [图像编辑示例](https://developers.cloudflare.com/changelog/post/2026-01-28-flux-2-klein-9b-workers-ai/)：multipart `input_image_0`；现有 adapter 发送 480px 本人照片、固定 prompt、1024px width/height，无额外参考图。
- [SDXL-Lightning](https://developers.cloudflare.com/workers-ai/models/stable-diffusion-xl-lightning/)：现有静态实现使用 img2img 参数；上轮 400/3030 未确诊，不能称可用。
- [Workers AI 价格](https://developers.cloudflare.com/workers-ai/platform/pricing/)：Free 额度共享于账户其他使用；Free 用完停止，不自动转 Paid。代码不核实实际账户账单，付费计划不在授权范围。
- [数据规则](https://developers.cloudflare.com/workers-ai/platform/data-usage/)：服务方声明未经同意不用于训练/改进；具体处理地域及逐项删除时限未确认，不承诺零保留或服务侧即时删除。

每个任务最多一次外部 dispatch、150 秒超时、不自动 retry。数据库短事务 advisory lock 与 UUID 幂等控制跨进程重复提交；滚动 24h 每人 3 次、全站 20 次，失败/取消不返还次数。断网只查询原任务。基础 HTTP 限流沿用既有 adapter。

## Candidate / final 架构和原子确认

仍使用 Resident、MediaAsset 与支撑性 AvatarGeneration，不新增核心实体。源图关联来自 migration `20260905180000_avatar_candidate_source`；本轮仅追加 `20260906090000_avatar_failure_stage` 可空诊断字段，不修改任何旧 migration。

| 状态/资源                              | 关联与权限                                                                                                               | 生命周期                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| PENDING                                | 任务 UUID、Resident、model、policy/style、baseAvatarVersion；本人查询                                                    | 4 分钟未完成转失败；不自动重发               |
| READY candidate                        | candidateMediaAssetId + sourceMediaAssetId；任务 UUID 为稳定预览身份                                                     | 最长 24h；取消/到期删除两图                  |
| CONFIRMED final                        | Resident.avatarMediaAssetId + avatarVersion；任务 confirmedMediaAssetId + sourceMediaAssetId，candidateMediaAssetId 清空 | 到替换为止私密保存；Partner 只能读当前 final |
| FAILED + source                        | 仅本人读取实际 JPEG/PNG 生成源图；不可确认，不共享                                                                       | 原 24h 期限或取消清理                        |
| EXPIRED / CANCELLED / FAILED 无 source | 无候选读取，资源引用清理                                                                                                 | 无资源元数据 7 天清理；有效 final 关联不删   |

有效生成source先写私密文件并提交MediaAsset/任务引用，再规范化和写256px显示图并转READY。规范化/第二文件失败保留source并记录阶段；本人可查看FAILED结果，但不可确认。源图首次持久化失败单独报告，不声称可查看；迟到取消结果不恢复候选。

候选 route `/api/avatar/candidates/[jobId]` 必须校验登录、本人 ACTIVE membership、READY 和未过期；Partner、无关用户不可访问。FAILED有source时，candidate route仅给本人返回其实际JPEG/PNG MIME，不能确认。最终 route `/api/avatar/assets/[assetId]` 只读同 Space 当前 ACTIVE Resident 的正式头像，不能读取候选或 source。两类地址独立；确认后原 candidate 地址失效，不能被当作永久 avatar URL。所有响应 private/no-store、nosniff，无 bearer 公开访问、无路径暴露。

确认在短数据库事务里读取自身候选、校验创建时身份版本及新文件可读，然后更新 Resident 指针/版本、final 指针并清空 candidate 指针。事务失败保留旧数据库引用与旧文件；事务提交后才删除旧 final 和 source 文件。重复确认幂等，不能重新覆盖较新版本。删除文件失败记录固定错误码，孤儿扫描补偿，不将已成功确认报告为失败。

上轮 source migration 将旧 CONFIRMED 的 candidate 指针迁移至 confirmed 指针，不动 Resident 指针或文件。旧资源没有高分辨率 source 时不凭空补造；本轮新增生成均保存两份资源。

## 图片边界与清理

- 上传在服务端真实解码，JPEG/PNG/WebP、MIME 一致、最多 5 MB、单帧、最少 128px、最多 2000 万像素；按方向旋转，去 EXIF，最长边不超过 1024px。FLUX 进一步缩至 480px。
- 原自拍仅浏览器预览和服务端请求内存，不写应用磁盘或数据库。仅本人处理后照片＋固定头像提示，不发送姓名、位置、Presence、Partner、生活记录或其他 Space 内容。不接 AI Gateway/R2/KV 缓存。
- 模型输出必须有效 1024px 单帧图。保留真实编码的 JPEG/PNG **生成源图**（目标1024px），同时按现有去背景/64px 逻辑像素规范化产生 256px 透明 PNG 显示图。source不是原自拍，也不是60px sprite；规范化失败时通过本人受权候选预览读取，不是公开下载。
- 不合格尺寸/透明边缘/可见区域拒绝，不保证每张 AI 输出像本人、符合风格、天然可拆层或骨骼动画。保留 model/style/version 及真实 source 是后续处理基础，不是 ANIMATION-01 实现。
- 私密目录 0700、文件 0600、不在 public。候选取消/过期两份同删；替换删除旧 final 和 source；确认后不无限保留 candidate 引用。
- `AvatarService.cleanup(now, residentId?)` 可独立调用/测试。读取本人任务、恢复候选和预览时 lazy cleanup，过期即拒绝读取/确认。现有常驻 Node 启动及每 60 秒批量扫描；超过 1 小时且无数据库引用的孤儿文件补删。
- 停机和 I/O 失败不承诺即时物理删除，恢复后补扫。部署需持久私密卷和排除图片备份，多实例需共享卷；仓库没有外部主机备份配置，不能声称已在部署中落实。应用错误日志仅固定错误码；Next 开发访问日志排除 /api/avatar 路径。无照片、base64、密钥或绝对存储路径日志。外部部署代理同样须排除头像 API 访问地址与请求体日志，仓库不代替部署配置。

## 上轮自动验证（最新数字见修复记录）

所有自动测试使用受控 provider/合成输入或 mock fetch；没有真实 Cloudflare 调用。测试只连接显式隔离的 `our_space_avatar_test` PostgreSQL，不使用真实账户库。Node 22.22.2、PostgreSQL 16.15、Prisma 6.19.3；测试库 4/4 migrations。

```bash
# TEST_DATABASE_URL 必须指向独立测试库；生成、迁移也只使用该测试库。
AVATAR_EXTERNAL_REQUESTS_ENABLED=false AVATAR_EXTERNAL_PROCESSING_APPROVED='' npm test
AVATAR_EXTERNAL_REQUESTS_ENABLED=false AVATAR_EXTERNAL_PROCESSING_APPROVED='' npm run test:e2e -- --reporter=line
npm run build
npm run lint
npm run typecheck
npm run prisma:validate
npm run format:check
npm audit --omit=dev
git diff --check
```

Playwright 只有 development + 显式 AVATAR_E2E_FIXTURE + DATABASE_URL 等于 `_test` TEST_DATABASE_URL 才使用 fixture；页面明确说明“自动测试模式”，production 不可启用。测试 webServer 强制关闭外部请求开关。所有 provider 单元测试 stub fetch，无秘密或照片输入。

测试证据覆盖：上传/EXIF/resize、provider 安全边界/失败、私密双图持久化、授权、过期、取消、确认/替换、第二文件失败保护、事务执行后回滚保护、并发去重/限额、Partner 仅可读 final、刷新/重新登录、双语手机键盘，以及既有 Auth/Invitation/Space/Presence/i18n 回归。精确结果在下节记录。

## 上轮截图与结果（最新截图见修复记录）

截图来自实际 `/avatar` 和 `/home`，全部为明确标注的受控测试头像，不是用户照片或 Cloudflare 成果。截图目录在仓库外：

`/Users/yuan/.codex/visualizations/2026/09/05/01a06f69-36dd-7ce0-bada-87b2bbbfd321/avatar-flow/`

- `chromium-candidate-fixture.png` / `mobile-chrome-candidate-fixture.png`：候选、正常手机尺寸与「就用这个」；桌面 1280×850、手机 375×812。
- `chromium-home-confirmed-fixture.png` / `mobile-chrome-home-confirmed-fixture.png`：确认后的正式 Home。
- `chromium-entry.png` / `mobile-chrome-entry.png`：创建入口。
- `chromium-local-preview.png` / `mobile-chrome-local-preview.png`：合成色块输入的本地预览。
- `chromium-replace-en.png` / `mobile-chrome-replace-en.png`：英文更换与原头像保留。
- `chromium-failure.png` / `mobile-chrome-failure.png`：错误反馈。

| 检查              | 本轮实际结果                                                                          |
| ----------------- | ------------------------------------------------------------------------------------- |
| Vitest            | 23 files、109/109 tests；其中真实 PostgreSQL 集成 31 项，无 required skip             |
| Playwright        | desktop / mobile Chrome 18/18；照片及头像均为受控 fixture；新增截图前图片实际加载断言 |
| Production build  | 通过；含 /avatar、独立 candidate route、final route 及既有页面                        |
| typecheck / lint  | 通过                                                                                  |
| Prisma            | generate / validate 通过，隔离测试库 4/4 migrations                                   |
| Production audit  | npm audit --omit=dev：0 vulnerabilities                                               |
| format / git diff | 通过，提交前复核                                                                      |
| 真实 Cloudflare   | 本轮 0 次；此前 2/2 已耗尽，未追加                                                    |

第一轮新增服务测试有 1 条仍期待旧版共用 URL 的断言，修正为独立 candidate/final 地址后全通过。首次桌面候选截图早于图片解码完成，已增加实际加载断言并重取；手机截图和交互权限原已通过。Node NO_COLOR/FORCE_COLOR 与 Next 开发跨来源提示为测试运行警告，不是请求失败；未改变 Auth/Invitation/Presence 的既有行为。

## 下一次唯一真实操作

**等待用户授权 1 次最终 FLUX candidate generation。** 仅使用用户明确指定的 photo-1.jpg；仅 1 次外部生成，不自动 retry；通过正式 authenticated 产品流程保存私密 candidate，给本人可实际打开的预览，再由本人「就用这个」或拒绝。不要使用旧的内存检查后丢弃 harness，也不能用本轮 fixture 顶替真实结果。

这一张用于本人判断相似度、已批准像素风、可爱程度和是否采用 FLUX。确认前不能共享为正式身份或宣告画风验收。没有新授权就不打开真实调用；本轮完成后停止。
