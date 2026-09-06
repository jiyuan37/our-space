# AVATAR-01 已保存源图离线恢复与双参考输入

## 实际范围

起点 `f80b3e2bea0b36a180a81ef5e8976a4d9fa5eb51`，main、干净、origin/main 0/0，remote未变。本轮真实模型请求 **0 次**；只处理上一轮单次请求留下的私密生成 source。未自动确认或替换正式身份。新模型验收需用户看完离线结果后再另行授权，本轮不申请或派发。

## 已确诊的失败层

真实 source 为有效 1024×1024 opaque JPEG。旧解码与尺寸检查均通过，但去背景只匹配预设的紫红色通道范围；该 source 的近似纯色背景不匹配。旧算法实际删除 **0 像素**，64×64 栅格仍有4096个可见像素（旧上限3700），透明边缘比例0（要求>=0.8），故在图像规范化的背景/可见区域检查抛出 AVATAR_IMAGE_NORMALIZE_FAILED。不是 Cloudflare HTTP 错误，不是 JPEG 解码问题，也不是源图未持久化。

新算法在全分辨率统计边缘主色、限制色差分布，仅清除边缘连通背景；不预设 magenta hex 或色相。允许轻微 JPEG 噪声，对紧邻透明区域的混色边界做有残差上限的本地前景/alpha估计，避免直接收缩轮廓。内部脸部和封闭同色区域不参与去色；复杂背景、空白图或无法可靠分离时仍安全失败。此算法针对近似纯色背景，并不声称是任意照片的通用人物分割。

先去背景，再直接生成256px RGBA PNG；不再先压成64px、限64色来伪造像素风，以保留发丝、眼镜和表情。真正画风须由生成内容及用户验收决定。当前source中的明显颈部/普通肖像比例仍存在，离线处理不冒充风格重绘。本人页面实际对照中，封闭发丝缝隙仍有少量底色；算法保守保留封闭同色区域，避免误删角色内部细节，不声称任意背景分割完美。

## 当前真实结果

同一source离线恢复为READY候选，display为256×256透明PNG；最后一次统计透明像素35860/65536。原1024px source的SHA-256前后相同（报告不写资源路径或照片内容），原期限不变、正式头像引用/版本不变、confirmed=false。未使用固定素材顶替，未延长24h保留。

已在本人现有登录会话中实际打开并展开before/after，图片均加载成功，确认框未勾选；未将截图另存到公共目录。本人登录 `/avatar` 可查看 normalized candidate，展开「查看生成原图（规范化前）」查看同一源图。before/after均通过本人ACTIVE成员鉴权，Partner和未登录不可读取。确认仍需本人勾选并「就用这个」，本轮没有代点；画风尚未验收。取消和原24h到期仍删除source/display。

`renormalizeOwn` 仅恢复已有未确认资源，不接受自拍、不依赖provider、不新增生成任务、不增加外部dispatch。先保存新display，事务内重查候选/源图/成员/期限后切换；失败保持旧资源，成功后清理旧display。仅source与display读取被扩展，final权限不变。

## 上一次真实请求的安全metadata

| 项目             | 已核对事实                                                                          |
| ---------------- | ----------------------------------------------------------------------------------- |
| model            | @cf/black-forest-labs/flux-2-klein-4b                                               |
| 图片数量         | 1                                                                                   |
| input_image_0    | photo-1 本人身份照片；480×443 JPEG、无EXIF                                          |
| input_image_1    | 未发送                                                                              |
| 尺寸证据         | 实际执行守卫验证双边<512；精确480×443为未变的预处理代码离线复算，原ledger未记录宽高 |
| style reference  | 没有发送                                                                            |
| guidance         | 没有设置；不猜测服务端默认值                                                        |
| prompt模板       | f80b3e2中的AVATAR_PROMPT，当时无独立prompt版本字段                                  |
| prompt SHA-256   | d6630928a2054bcf930dce3fea57232a960ceb7f17f4c41524d7818553ef332c                    |
| 当时styleVersion | pixel-big-head-b6fe15a-v1                                                           |

当时是自拍+文字风格说明，没有真正以批准的原创像素资产作为模型参考。不能声称已验证双参考有效。

## 下一次已实现、尚未发送的payload

按[当前4B模型](https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/)和[官方多参考说明](https://developers.cloudflare.com/changelog/post/2026-01-28-flux-2-klein-9b-workers-ai/)（明确同样适用于4B的multipart/index语义）实现：

- input_image_0：本仓库原创像素风格参考，480×320 PNG。由 `scripts/build-avatar-style-reference.mjs` 从批准提交 b6fe15a8c11270d3c1568f7f40af08484ce71fd3 的 characters.mjs 验证并导出两名idle无道具角色，纯色底、无标签；不使用任何商业游戏/电影素材。
- input_image_1：用户自拍，按方向修正、去EXIF，长边<=480，双边<512，不发送其他用户图片。
- promptVersion：flux-style0-identity1-v2；styleVersion：pixel-big-head-b6fe15a-multi-v2。模板分别指定图1只供身份、图0只供风格/比例/像素语言，禁止复制图0的脸/发型/身份，限制为圆脸大头、极少肩部、清楚表情、无状态道具。
- 请求只包含两张图片、固定prompt及1024输出width/height；未添加guidance/steps，不自动重试或fallback。服务端仍要求处理政策匹配与真实请求开关开启；本轮开关保持关闭。用户本轮明确要求原创style参考，双语处理说明同步更新；不因此扩大到任何Space内容。
- 正式构建追踪打包SVG参考，不依赖public、原型服务器或运行时Git。脚本可复现，运行时仅读取固定服务端素材。

## 验证

- 26 files / 152 tests通过，含38项真实PostgreSQL集成；PNG/JPEG、不同底色、压缩色差、细发丝、封闭同色区域、混色边缘、复杂背景拒绝、源图恢复/替换、失败保护、输入顺序与禁止调用全部离线覆盖。
- 首次并行启动Vitest和E2E共享了同一个隔离测试库，测试清理互相影响；已停止该E2E并顺序重跑。取消断言也改为等待回Home后再检查删除，避免读取尚在提交的取消操作。不涉及真实账户库。
- 顺序重跑浏览器20/20通过，包含中英文、手机、before/after本人读取与Partner拒绝；production build、typecheck、lint、format/diff通过，production audit为0。构建追踪包含固定style reference。最终真实结果仍只存应用私密目录，不导出到公共目录或将私密路径写入报告。

真实外部调用为0；不重测SDXL，不进入MAP-01或ANIMATION-01。提交信息 `fix: normalize saved avatars and separate style references`，完整hash以包含本记录的提交定位；正常push目标main干净0/0，实际交付报告核对。
