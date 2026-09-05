# AVATAR-01 有限真实 smoke 记录

日期：2026-09-05；实现起点 `7c96e3f98c4cee4d712f04148caf9ffa2f19f9aa`。

用户明确批准本轮最多 2 次真实 Cloudflare Workers AI 请求，仅限本人照片进行头像效果测试。已使用 2 次，不再派发。关键账户配置存在，Workers Free 为用户本地声明；未读取/输出密钥，未查询实际账单计划。`AVATAR_STORAGE_DIR` 未配置，未修改 `.env.local`。

## 实际结果

| 序号 | 输入                                      | 模型                   | 实际响应                              | 结论                                                                      |
| ---- | ----------------------------------------- | ---------------------- | ------------------------------------- | ------------------------------------------------------------------------- |
| 1    | 授权样本 1，去 EXIF、最长边 647px         | SDXL-Lightning img2img | HTTP 400，Cloudflare 3030，约 0.74 秒 | 没有图片；原因未确诊，不代表模型已可用或人物一致性不够                    |
| 2    | 同一授权样本，去 EXIF、再缩至最长边 480px | FLUX.2 klein 4B        | HTTP 200，1024×1024 JPEG，约 13.29 秒 | 实际 `normalizeCandidate` 通过，得到 256×256 透明 PNG；不等于人工风格验收 |

样本 2 在指定位置未找到，没有改用其他照片。首次拟发的 FLUX 操作因含额外原创风格参考图被自动审核拒绝，未派发；移除该图并通过白名单测试后才实际执行第 2 次。真实请求累计严格为 2。

执行复用仓库实际 `CloudflareAvatarProvider`、`normalizeSelfie` 与 `normalizeCandidate`，临时 harness 有持久请求计数和每轮一次 fetch 防线；没有复制固定测试图片作为真实响应。SDXL 采用既有图像参数；FLUX multipart 只有 `prompt`、`width`、`height`、`input_image_0`。模型接口依据 [SDXL 官方文档](https://developers.cloudflare.com/workers-ai/models/stable-diffusion-xl-lightning/) 与 [Cloudflare FLUX multipart 说明](https://developers.cloudflare.com/changelog/post/2026-01-28-flux-2-klein-9b-workers-ai/) 核对。官方文档声明能力不能替代此次实际响应结果。

## 隐私与未完成项

- 原照片只读，不写应用存储；没有记录照片内容/base64、Token、姓名、Presence、位置、伴侣内容或私密资源地址。
- 所有输出仅在内存中解码、规范化、校验后释放，没有保留候选或图片报告。因此本次不能提供效果预览，也不能声称像本人、清楚表情、批准像素风已经验收。
- 没有将任何真实照片结果绑定正式 Resident；此前受控测试的持久性、本人确认和 Partner 授权证据仍有效，但不替代真实生成后的人工确认。
- 本轮额度已用完。要继续效果验收，需用户另行授权请求，并使用私密临时候选完成查看和明确确认；不得默认为第三次请求已获批准。
- SDXL 的 400 / 3030 原因尚未确诊，不能静默标为成功。FLUX 此次接口及规范化成功；没有足够证据证明稳定性或更高人物相似度。
- AVATAR-01 仍未完成；ANIMATION-01、MAP-01 生产接入和定位没有新增实施。

## 本轮检查

本轮新运行：provider 输入白名单测试 4/4；完整自动测试 23 files / 102 tests（含 26 项真实数据库集成）全部通过；lint、typecheck、production build、format 与 diff 检查通过；`npm audit --omit=dev` 为 0 vulnerabilities。所有自动验证显式关闭真实外发。没有重跑与本次载荷收窄无关的完整 E2E；上一轮 18/18 仅作为历史回归证据。
