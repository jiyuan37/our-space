# AVATAR-01 HTTP 200 后处理修复

## 范围与证据边界

起点 `710440ef1df28c44755850bf1eab780c06da98c9`，main、工作树干净、origin/main 为 0/0；不 reset、不覆盖用户修改。本轮只修头像本地解析/解码/规范化/私密保存，真实 Cloudflare AI 调用 **0 次**，不读取或处理用户自拍，不重测模型，不推进地图或动作系统。

此前额外获批的 1 次请求已经使用：本地 ledger 记录 `externalCalls=1`、`httpStatus=200`、`AVATAR_GENERATION_FAILED`，数据库任务 FAILED，candidate/source 均为空，私密图片目录无可恢复文件。此前最初 2 次 smoke 和这次 1 次分别计数，都已用完。

HTTP 200 只证实收到成功 HTTP 响应。旧代码把响应解析、图像解码和规范化问题都归到同一个公开错误，且没有保留失败响应/有效源图，因此**无法事后确诊那一次触发的是哪条分支**。不得编造“已确定是 JPEG 当 PNG”或“已确定是缺少 result”。

## 官方 schema 核对（2026-09-06）

- [FLUX.2 klein 4B 模型输出](https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/)：模型输出对象包含 Base64 `image` 字符串，不是必须为 raw PNG。
- [Cloudflare REST ai/run](https://developers.cloudflare.com/api/resources/ai/methods/run/)：REST 返回可带 `result` 包装。不能仅照模型 binding 的直接返回形状解析 REST。
- [Cloudflare 4B 发布说明](https://developers.cloudflare.com/changelog/product-group/developer-platform/13/)：multipart reference 输入命名 `input_image_0` 等，参考图必须小于 512×512。这里只用用户本人一张照片；固定 prompt 和输出尺寸不含 Space 数据。

当前解析支持 `application/json`（含 charset 与 +json 类型）下的 `{image: base64}` 和 `{success: true, result: {image: base64}}`，拒绝显式错误 envelope、缺失字段与非法 Base64。明确标记 image/png、image/jpeg 或 octet-stream 的二进制输出另走 magic 判断；不把 HTML/未知类型当图，不从任意嵌套字段猜图片。

## 确认的本地缺陷与修复层

| 层                  | 旧实现证据                                                                                              | 修复                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| response parse      | 已支持 result.image，但只支持这一形状，未根据 Content-Type 分流；Buffer.from(base64) 可静默忽略非法字符 | 独立纯解析器，直接 image / result.image、严格标准 Base64 与长度/体积校验                      |
| image decode        | 没有独立的 magic/全图解码错误阶段                                                                       | 真实 JPEG/PNG magic 决定 MIME，Sharp 完整解码排除截断/损坏和其他格式                          |
| input preprocess    | 原代码已经缩到480px，不能说一直把1024px交给FLUX                                                         | 独立 FLUX 函数，方向修正、去 EXIF、不放大小图、宽高均严格<512；覆盖方图/横图/竖图             |
| normalize / persist | normalizeCandidate、normalizeGeneratedSource 完成后才写文件；任一步失败都没有私密持久输出               | 有效生成图先保存私密 source 并提交数据库关联，再规范化及保存256px显示图；后两步失败保留source |
| diagnostics         | 所有错误只剩 AVATAR_GENERATION_FAILED                                                                   | 内部阶段写入 AvatarGeneration.failureStage，仅固定码日志，公开错误仍安全本地化                |

这次可确定的**结果丢失根因是规范化在前、持久化在后的顺序缺陷**；解析兼容性和解码验证也有可离线复现的缺口。上次具体触发层仍不可追溯；本轮不以 fixture 猜测真实图的内容或风格。

阶段包括 `PROVIDER_RESPONSE_PARSE_FAILED`、`PROVIDER_IMAGE_DECODE_FAILED`、`AVATAR_IMAGE_NORMALIZE_FAILED`；另区分请求、输入处理、源图写入、显示图写入和进程中断。不把 provider 错误正文、base64、密钥、私密资源 URL 或文件路径放进错误和日志。

## 先持久源图的生命周期

- `sourceMediaAssetId` 复用现有支撑模型，不增加核心实体；仅新增可空 failureStage migration `20260906090000_avatar_failure_stage`。
- 原自拍仍不进入应用存储。保存的是 provider 解出的有效生成 JPEG/PNG，保留实际编码和 MIME，供恢复诊断；源文件不是强制 PNG，不能因 JPEG 而硬解码为 PNG。应用同时保留 model/style/baseAvatarVersion。
- 正常成功仍要求1024×1024生成源，产出64px逻辑栅格、256px透明PNG显示图；当前不降低透明边缘/像素验收标准。有效但不符合显示规范的生成图保留为失败结果，不作为最终头像。
- 生成图全图解码通过后先写私密文件并提交 source 引用，再进入规范化。规范化或显示图保存失败时任务 FAILED + source，可由本人在 /avatar 重新打开。页面明确说明暂不能设为正式形象，没有「就用这个」按钮；Service 同样拒绝确认。
- failed source、ready display 都必须通过本人 ACTIVE membership 和未过期检查。Partner/无关用户/未登录不可读取失败结果；final route 不能读 source。
- 候选最多24h，取消或到期删除source与display；进程在source提交后中断，4分钟后转失败保留本人预览至原24h期限。当前最终头像保持不变。物理磁盘或数据库不可用仍可能阻止首次持久化，会记录独立保存失败阶段，不能承诺存储故障时也可交付图片。
- 正常确认事务、旧头像失败保护、幂等与每日限额仍保持。失败任务已有source时，必须先查看/取消，不能悄悄累计无限候选。

## 离线验证与截图

自动测试完全不调用真实 provider。纯解析测试从 Sharp 合成的有效 JPEG/PNG 构建官方 JSON shape；浏览器测试 provider 在内存构造 Cloudflare-like HTTP 200 Response，实际经过 parse→decode→正式Service→私密source→normalize→256pxdisplay→DB持久→候选API→页面预览。

新增覆盖 valid result.image、直接 image、missing image、invalid base64、PNG/JPEG magic、corrupt/unsupported bytes、不同Content-Type、5类输入尺寸、稳定阶段码、规范化失败源图恢复、显示保存失败、进程中断、过期和取消。使用独立 PostgreSQL 测试库，保留 Auth/Invitation/Space/Presence/i18n 回归。

| 检查               | 本轮结果                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| Vitest             | 25 files / 142 tests 全通过，无 skip；其中 36 项真实 PostgreSQL 集成                               |
| Playwright         | desktop / mobile Chrome 20/20；受控 HTTP 200 fixture，包含正常与失败源图预览、中英文及既有流程回归 |
| Build              | production build 通过                                                                              |
| typecheck / lint   | 通过                                                                                               |
| Prisma             | generate / validate 通过；独立测试库和本机正式账户库均 5/5 migrations，只新增可空 failureStage     |
| Production audit   | npm audit --omit=dev：0 vulnerabilities                                                            |
| Format / diff      | 提交前检查通过                                                                                     |
| 真实 Cloudflare AI | 0 次；请求开关保持 false                                                                           |

最后一次完整 Vitest 为 2026-09-06 13:59:36 本机时间，显式设置独立 TEST_DATABASE_URL，142/142。此前一次重跑遗漏该变量导致 36 项集成跳过，已纠正并完整重跑，不把跳过算通过。测试未修改真实账户库；本机正式库仅部署可空字段 migration。production server 已恢复于 127.0.0.1:3000，未混入 fixture。

复现命令沿用 AVATAR_OPERATIONS；务必显式设置独立 TEST_DATABASE_URL，再运行 npm test。E2E 使用测试数据库及受控 provider，真实生成开关关闭。

截图目录（仓库外）为 `/Users/yuan/.codex/visualizations/2026/09/05/01a06f69-36dd-7ce0-bada-87b2bbbfd321/avatar-parser-offline/`。`*-candidate-fixture.png` 为正常候选，`*-saved-source-offline-fixture.png` 为规范化失败但已保存源图的实际页面；均明确标为自动测试素材，不能当成上次 Cloudflare 结果。真实用户失败任务没有被替换或填入 fixture。

## 后续单次真实验收

只有上述离线链路、浏览器、build、typecheck、lint、format、production audit 与 diff 检查通过后，才请求新的1次授权。不能自行执行。下一次仍仅 photo-1，使用已登录本人的Resident，生成后从实际私密候选页面查看；确认由用户决定。FLUX 风格与相似度仍未验收，SDXL 400/3030 仍为未决记录。
