# 真实世界像素地图 Home — 隔离交互原型

**隔离原型局部人物重绘已完成验证，等待用户查看人物前后对照；生产实施未批准。**

本原型采用用户进一步指定的《星露谷物语》式温暖像素乡野方向，所有头像与保留的稀疏水纹均为原创代码绘制，不含游戏原素材。真实伦敦街区结构来自 OpenStreetMap；人物、状态、生活内容和移动是合成演示。

## 启动与打开

从项目根目录，在现有 Node.js 22 环境执行：

```bash
cd /Users/yuan/Desktop/our-space
node prototypes/map-home/serve.mjs
```

打开 [http://127.0.0.1:4173](http://127.0.0.1:4173)。服务器仅监听本机，Ctrl+C 停止；不依赖数据库、Next.js、账号或外部地图服务。也可以使用 Node.js 22 的绝对路径 `/Users/yuan/.nvm/versions/node/v22.22.2/bin/node` 启动。直接双击 HTML 会受浏览器本地模块/JSON 读取限制，应使用上述服务器。

准确入口：`/Users/yuan/Desktop/our-space/prototypes/map-home/index.html`。生产 `/home` 和导航完全独立。

## 体验方式

- 地图可拖动，聚焦地图后方向键移动，`+` / `-` 缩放；“找我们”内的两位 Resident 按钮用于回到其位置，位置不可展示时查看身份面板。
- 点角色查看自愿状态，点花形针查看示例 LifePoint；关闭/Escape 保留地图位置。底部可查看无地点时刻及不保存的 composer 示例。
- 左下“原型实验台”可选 13 个场景：没有新移动（主动状态独立）、新的端点变化、同段已展示、只有终点、噪声、无数据、过期、暂停、端点示意、有中间样本、A→B→A、采样缺口、两人远隔。
- 选择新变化时默认回放约 3 秒，抵达停止；“跳过”直接到最后可展示点。“再打开地图”和真实刷新不自动重播；要重复体验，明确点“重置演示游标”。这是调试功能。
- 虚线表示端点变化示意，实线表示有效合成采样段；两者均非真实用户轨迹，不证明步行。缺口不补线。
- 英文/中文切换不重放；系统 reduced-motion 或“关闭移动回放”采用静态前后位置表达。
- 实验台可切换平静、看书、喝奶茶、Presence 跨日/清除；不会修改位置。示例账户展示候选/确认流程说明，无上传、拍照或生成能力。
- 远距场景点击小雨切到“巴黎 · 本原型未打包此处底图”，保留街区尺度；不会把伦敦底图当巴黎或缩成整个地球。

## 原型文件与隔离

- `app.mjs`：本地渲染、面板、双语、回放与镜头控制。
- `background.mjs`：原创草地/水纹、树冠、建筑配色与细部；装饰不代表实测树木或建筑外观。
- `movement.mjs`：可测试状态机、合成样本、集中配置、查看者游标 key。
- `characters.mjs`：原创 SVG 大头状态角色、8 帧轻微朝向/节奏、读书/奶茶单一道具；没有第三方人物资产依赖。
- `avatar-preview.mjs`：从真实旧/新绘制代码生成手机原尺寸对照和 4× 最近邻预览，默认输出到仓库外。
- `geography.json`：OSM 公开地理数据的过滤派生库，ODbL-1.0；不包含任何用户私人数据。
- `prepare-data.py`：从两份 Overpass JSON 生成地理数据，拒绝未闭合水域关系；原始临时下载不提交。
- `serve.mjs`：只服务本目录的本地静态服务器；`Permissions-Policy` 禁止 geolocation/camera/microphone，页面 CSP 限制外部连接。
- `movement.test.mjs` / `browser.test.mjs`：独立测试，不更改生产测试目录或配置。

运行时仅向 localhost 读取文件，地图归因链接只有主动点击才访问外部 OSM。没有外部字体、AI、付费服务、位置权限调用、生产 Service/DB 写入。演示游标在 `our-space-prototype:v1:demo-viewer:demo-space:demo` 保存 opaque 段 id；不含真实位置，不能作为生产认证或权限实现证据。

## 真实数据、来源与许可

数据区域 bbox：west `-0.127`、south `51.498`、east `-0.109`、north `51.510`，伦敦南岸/泰晤士河公开街区。开发时读取 [Overpass API](https://overpass-api.de/api/interpreter)，OSM snapshot 时间 `2026-09-05T02:33:21Z`；本轮工作日期为纽约 2026-09-04。

[© OpenStreetMap contributors](https://www.openstreetmap.org/copyright)。地理数据根据 [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/) 提供，派生 `geography.json` 同样遵循 ODbL-1.0，并随本原型提供可机读数据。OSM 无背书含义。运行地图保留可点击归因，不请求 OSM 公共瓦片。

- 真实：道路/步道、公园、建筑轮廓与水域坐标；保留 OSM way/relation id。水域 relation `28934` 的 outer/inner 几何拼接成闭合环；公园包含 Jubilee Gardens `way/4373996`。
- 处理：过滤室内、隧道、private access 和非展示道路类别；保留坐标，不重新安排现实道路/地点。局部等距近似投影 `x=(lon+0.12)*69300`、`y=(51.505-lat)*111320`，用于此小区域视觉打样；不是测绘/导航精度承诺。SVG 仅映射投影和镜头，无坐标挪动。
- 风格化示意：V2 移除装饰树和密集草点/屋顶瓦纹；稀疏水纹只是原创材质，建筑沙色块与实际外观不对应。生活针位置由虚构内容指定，不是真实发生地点。
- 合成：两位角色、全部 sample id/时间/精度/轨迹、Presence、LifePoint 和巴黎示例。没有真人照片、私人住址或设备轨迹。
- 简化：只收录所查类别，不保证所有建筑 relation/道路层级完整；相距很远的另一城市未打包底图。原型不支持全球任意浏览、地理编码或导航。

复现原始数据请求（写入临时目录，不写生产）：

```bash
curl -fG 'https://overpass-api.de/api/interpreter' \
  --data-urlencode 'data=[out:json][timeout:30];(way[highway](51.498,-0.127,51.510,-0.109);way[leisure=park](51.498,-0.127,51.510,-0.109);way[natural=water](51.498,-0.127,51.510,-0.109);way[building](51.498,-0.127,51.510,-0.109););out geom;' \
  -o /tmp/our-space-osm.json
curl -fG 'https://overpass-api.de/api/interpreter' \
  --data-urlencode 'data=[out:json][timeout:30];relation[natural=water](51.498,-0.127,51.510,-0.109);out geom;' \
  -o /tmp/our-space-water.json
python3 prototypes/map-home/prepare-data.py /tmp/our-space-osm.json /tmp/our-space-water.json /tmp/our-space-geography.json
```

当前源数据会更新；上述命令复现处理流程，不保证未来返回与已提交 snapshot 字节一致。原型无需再次下载。

## 局部人物美术重绘（2026-09-05）

本轮从实际基线 `b2d9b8f1f821cd123e3ba3704d0ae69f37904747` 继续；main、干净工作树，fetch 后 0/0。用户明确要求人物素材重绘，本轮不是新 Phase 或完整 Review。

- 旧版为 SVG 头肩像，脸较窄、明显脖子/肩膀和 3px 浅色外圈；本轮直接重画 `characters.mjs` 的轮廓、脸型、发型、五官与托持道具，不通过 CSS 放大制造变化。
- 同一 48×50 画布内，脸颊和下巴改成宽圆像素阶梯，消除细长脖子，仅保留极少衣领；浅色外线减为 1 个绘制单位。脸宽 36 个绘制单位，衣服高 7 个单位。手机 SVG 仍为 60×62.5 CSS px，桌面沿用 76px 宽，点击区和锚点不变。
- 小林保留长发/发夹身份，睁眼温和专注、小幅微笑，以一只极简小手托书；小雨保留短发身份，放松弯眼和小微笑，以小手托带吸管的奶茶。两者表情形状不同；每人一个道具，位于五官下方/外侧，不添加徽章、数字或奖励装饰。
- 从实际 SVG 的 alpha 像素覆盖测量：排除背景/阴影，扣除道具遮盖后，可见头部占角色总可见面积，小林约 84.4%、小雨约 82.9%。这是本轮试绘的测量口径，不作为生成人像系统验收。
- `app.mjs`、`background.mjs`、地理 JSON、移动状态机、HTML/CSS 与生产文件均未修改。主动状态/位置分离、过期回中性、移动微动和单一道具继续沿用调用契约。

### 人物对照与复现

```bash
PROTOTYPE_OUTPUT=/tmp/our-space-avatar-redraw node prototypes/map-home/avatar-preview.mjs
node --test prototypes/map-home/movement.test.mjs
PROTOTYPE_OUTPUT=/tmp/our-space-avatar-redraw node prototypes/map-home/browser.test.mjs
npm run format:check
git diff --check
```

预览脚本默认只读上述 `b2d9b8f` 中的旧素材，并导入工作树中的新素材；不会切换分支或回退工作树。可通过 `AVATAR_BEFORE_REF` 显式指定其他对照 ref。旧/新 SVG 各自先在真实 Chromium 中以 60px 宽渲染，生成含 2px 留白的 64×68 PNG，再用 `image-rendering: pixelated` 放大为 256×272，确为 4 倍最近邻，不是另一张效果图或放大的矢量重渲染。HTML 预览内嵌这些 PNG，可独立打开。

本机实际证据目录：

`/Users/yuan/.codex/visualizations/2026/09/05/01a06f69-36dd-7ce0-bada-87b2bbbfd321/avatar-redraw/`

包含 `comparison-1x.png` / `.html`、`comparison-4x.png` / `.html`、两人的旧/新 SVG 和原尺寸 PNG、`mobile-before.png` / `mobile-after.png`、`preview-evidence.json` 与 `verification.json`。手机对照均为 375×812，中心 `[-0.1181, 51.50455]`，scale 1.05。两锚点分别保持 `left:169.309px;top:480.993px` 和 `left:274.818px;top:434.239px`。图片和临时浏览器产物未提交到 Git。

### 本轮验证与边界

Node.js 22：23/23 状态机、旧 30 组浏览器检查保留并增加造型/五官不被道具遮挡检查，合计 31 组通过。覆盖原有点击/详情/焦点、双端双语、至少 44px、移动/跳过/刷新不重播/reduced-motion。运行时外部请求/真实定位调用/页面错误均为 0；格式与 diff 检查通过。未重跑生产 Phase 3 全量 Review。

修复过程：浏览器首次实际位移检查出现 `page.waitForFunction: Timeout 4000ms exceeded.`，保留原断言重新运行后通过。新增遮挡断言最初用奶茶所有部件的整体矩形，误把吸管与杯身之间的空白判为遮挡；改为检查各实际绘制路径后通过，没有移除检查。正常尺寸复核后收小小雨的笑口、加高杯身并把吸管移到脸外侧。

本轮只交付两名原创模拟人物的局部美术迭代；真人头像生成、真实定位和生产 `/home` 均未实现或修改，背景气质沿用上一版。人物美术仍等待用户确认，完成后停止。

## V2 背景精修（2026-09-05）

从 `a9cbcebbca5aaa2858634ce73e236600b580b031`、main、干净工作树和 0/0 同步状态继续，按用户要求保持 avatar-first 结构，仅提升背景气质。原创像素表现受温暖农场小镇气质启发，不使用 Stardew Valley 具体素材、角色、UI 或地图。

- 草地使用低对比浅色块、少量草尖/小花与浅色内沿，材质裁切在真实公园轮廓内。
- 优先精修 Jubilee Gardens：从真实步道间的空隙选点，使用小型、圆润、统一像素树冠；默认手机可见 3 棵、桌面 4 棵。装饰树不代表现实树木位置，低 zoom 隐藏，靠近头像、姓名、生活针或地名时让位。
- 普通建筑采用稳定的奶咖/浅棕/浅陶土四种颜色与低对比屋顶内沿；仅河岸 3 栋既有建筑加少量屋顶色带，不复制密集瓦纹。真实 footprint 未移动；色彩和外观不是实测复原。
- 路面换为更暖的浅沙色，步道略加宽以形成柔和生活路径，中心线/连接关系不变。水域保持原柔和蓝色，使用稀疏阶梯波纹，不增加动效和高频噪声。
- 头像的 60px/76px 构图与单一道具完全沿用；背景树约 19px/21px 宽，色差克制，人物仍有更大尺寸、更明确轮廓和局部色彩重点。

本轮代码仅改 `app.mjs` 的背景渲染/装饰避让、新增 `background.mjs`，并在既有浏览器测试的双端双语检查中加入树木可见数量及不遮挡人物断言。`geography.json`、头像资源、`movement.mjs`、HTML/CSS 结构、生产 `/home` 均未改。

验证：Node 22，23/23 状态机测试、30 组浏览器检查通过；外部请求/定位调用/页面错误均为 0。文字色未变，原有 5 对文字对比度最低 5.20:1。`npm run format:check` 与 `git diff --check` 通过。未重新运行生产应用矩阵。

真实浏览器截图保存在仓库外：

`/Users/yuan/.codex/visualizations/2026/09/05/01a06f69-36dd-7ce0-bada-87b2bbbfd321/map-home-warm/`

包括 `before-mobile.png` / `after-mobile.png`（375×812）、`before-desktop.png` / `after-desktop.png`（1280×850）、`park-closeup.png`（实际桌面视口区域截图）和 `verification.json`。before/after 的中心均为 `[-0.1181, 51.50455]`，手机 scale 1.05、桌面 1.18；未换街区或缩放来改变视觉比较。

复现验证仍使用下节命令，将 `PROTOTYPE_OUTPUT` 指向仓库外新目录即可。生产地图/真实头像生成/定位仍未实现；本轮停在背景视觉确认点。

## V2：头像优先与视觉降噪

本次从 `a335e858b11748531a9481726762c83aebdc0f16` 开始，fetch 后 main / origin/main 为 0/0，工作树干净。只迭代隔离原型和三份范围内文档。

- 重新绘制头肩 SVG，不裁剪/放大 V1 全身角色：手机宽 60px，桌面 76px；小林棕发、专注表情与书，小雨深发、轻松表情与奶茶。每人最多一个道具，姓名去掉逐人示例后缀；页面统一标注“交互原型 · 角色与移动为演示”。
- 保留同一份 `geography.json`、真实道路/河岸/公园/建筑轮廓与原坐标投影。移除屋顶网格、地面密集颗粒和装饰树，减弱次要道路；稀疏水纹、沙色建筑、低饱和绿地。低 zoom 只保留主要地名，地名与头像相交时隐藏该标签。
- 删除左侧宣传面板，顶部只保留轻品牌/Space 名称；重复人物定位收进“找我们”，账户与语言仍可用。缩放/回中心合为一组；底部一个主操作，无地点时刻为次级入口。无位置变化不再误报“双方安静”，工程说明进入实验台。
- 头像针尖继续对应原地理坐标，选中提高层级；未通过虚构距离来分开人物。详情一次一个，桌面紧凑面板、手机底部 sheet，保留被选头像可见；切换人替换内容，关闭/Escape 返回最新触发头像。详情是非模态 dialog，键盘可以继续访问其他地图人物；拖动超过 6px 不误开详情。
- 保留 `movement.mjs` 原状态机和配置；位移与 8 帧头像微动独立，身份、主动状态道具不变。完成/跳过/静态表达处理同一演示游标，刷新及语言切换不重播；镜头不追赶人物。端点虚线仍明确为演示，跨日/清除停止旧状态道具。

### V2 验证及截图

Node.js `v22.22.2`，状态机 **23/23**；原有 **24 组浏览器语义检查全部保留**，增加头像构图/单一道具/可访问名称、默认降噪、详情切换/不叠面板/焦点、头像拖动、移动道具和镜头稳定、手机 sheet，合计 **30 组通过**。375×812、1280×850 和中英文均检查无横向溢出、可见按钮/链接/选择器至少 44px。实际使用的 5 对文字色对比度为 5.20–10.61:1；外部请求、真实定位调用、页面错误均为 0。

V1 修改前真实打开并保存了双端截图；V2 使用完全相同的中心 `[-0.1181, 51.50455]`，手机 scale 1.05、桌面 scale 1.18，同区域对比。证据保存在仓库外：

`/Users/yuan/.codex/visualizations/2026/09/05/01a06f69-36dd-7ce0-bada-87b2bbbfd321/map-home-v2/`

包含 `before-mobile.png`、`before-desktop.png`、`after-mobile.png`、`after-desktop.png`、`mobile-selected.png`、`mobile-moving.png`、`mobile-settled.png`、`mobile-en-US.png`、`desktop-en-US.png` 和 `verification.json`。本机路径不属于 Git 分发内容；其他机器可运行下列命令重新生成 V2 证据，V1 可从上述基线提交复现。

```bash
node --test prototypes/map-home/movement.test.mjs
PROTOTYPE_OUTPUT=/tmp/our-space-map-home-v2-evidence node prototypes/map-home/browser.test.mjs
npm run format:check
git diff --check
```

首轮浏览器在截图后发生 `page.waitForFunction: Timeout 4000ms exceeded.`；独立实测位移约 3 秒正常抵达。测试在切换场景后显式 `bringToFront()`，没有删除位移/停止断言，重跑通过。截图复核修正手机 sheet 遮挡选中头像、地名与人物重叠。

限制：目前是两名固定原创演示身份；真实头像生成、真实定位、生产 Home、后台采集均未实现。地图为小范围街区，最小 zoom 头像可能局部相叠，选中层级/键盘与“找我们”可用，不制造位置距离。Safari/Firefox、真机后台与生产权限未验证。本轮不运行生产 Phase 3 矩阵，不改写其历史结论；V2 视觉仍需用户确认。

## V1 历史验证（a335e85）

保持原型服务器运行，使用仓库已有依赖：

```bash
node --test prototypes/map-home/movement.test.mjs
node prototypes/map-home/browser.test.mjs
npm run format:check
git diff --check
```

浏览器脚本使用已安装的 Playwright 与 Google Chrome，不运行安装；V2 默认将证据写入系统临时目录 `our-space-map-home-v2-evidence/`，可用 `PROTOTYPE_OUTPUT` 指向仓库外目录。以下 V1 历史验证结果数值见 [verification.json](./screenshots/verification.json)，已有截图不被 V2 默认覆盖。原型测试不涉及生产账号或真实数据库。

V1 历史实际结果：Node.js `v22.22.2`；状态机 **23/23**、Chrome 浏览器 **24 组检查通过**，运行时外部请求 0、真实 geolocation 调用 0、page error 0。文字对比度：正文 10.61:1、次级文案 6.14:1、主按钮 5.41:1、地图标签 5.50:1、河名 5.20:1。`git diff --check` 与 `npm run format:check` 通过。

地理数据逐项检查通过：3176 要素、23853 坐标点，原始 Overpass 结果重新转换后与打包 JSON 解析结构完全一致。

状态机断言覆盖无变化/无基线/噪声/无数据/过期/暂停/缺口/新变化/中间点/往返、一次性游标、端点语义、乱序与异常速度、重复 id、差精度、共享 epoch、撤销、最多 3 段、长距、账户/Space 隔离、Presence freshness 与非法坐标。

实际浏览器验证了位移发生与停止、刷新/语言切换不重播、手动跳过、系统/手动 reduced-motion、详情关闭保留镜头、无地点入口、远距空态、双端双语无横向溢出、可见操作 >=44px、无真实定位调用/外部请求/页面错误，并测量文字对比度。原始失败和修复：手机实验台挡住跳过按钮、按下角色时 CSS transform 覆盖地理锚点；均修复后重验。原型保留按钮节点，使动画不清空键盘焦点。

截图：

- [375×812 中文静止](./screenshots/mobile-zh-CN.png)
- [1280×850 中文](./screenshots/desktop-zh-CN.png)
- [手机移动中](./screenshots/mobile-moving.png)
- [桌面移动中](./screenshots/desktop-moving.png)
- [手机英文](./screenshots/mobile-en-US.png)
- [桌面英文](./screenshots/desktop-en-US.png)

没有修改生产代码/依赖/配置/数据库，因此未重跑 Phase 3 的 76/15/12 应用测试矩阵；其历史结果不是本轮新证据。Safari/Firefox、真实 GPS 精度、OS 后台、锁屏电量与生产权限/删除仍未验证。

## 规格及后续

子要求与验收映射见 [AVATAR_AND_MAP_SPEC.md](../../docs/AVATAR_AND_MAP_SPEC.md)。Web/PWA 无法可靠保证被定位方页面隐藏/锁屏/关闭后持续采样；完整后台目标需获批原生定位工作包，当前未实施。生产地图供应商、自拍/AI lifecycle、头像是否阻断/照片替代、精度/频率/保留与原生范围仍待决定。
