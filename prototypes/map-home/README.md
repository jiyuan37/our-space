# 真实世界像素地图 Home — 隔离交互原型

**具体规格与隔离原型已完成，等待用户确认视觉和实现方案。**

本原型采用用户进一步指定的《星露谷物语》式温暖像素乡野方向，所有角色、树冠与纹理均为原创代码绘制，不含游戏原素材。真实伦敦街区结构来自 OpenStreetMap；人物、状态、生活内容和移动是合成演示。

## 启动与打开

从项目根目录，在现有 Node.js 22 环境执行：

```bash
cd /Users/yuan/Desktop/our-space
node prototypes/map-home/serve.mjs
```

打开 [http://127.0.0.1:4173](http://127.0.0.1:4173)。服务器仅监听本机，Ctrl+C 停止；不依赖数据库、Next.js、账号或外部地图服务。也可以使用 Node.js 22 的绝对路径 `/Users/yuan/.nvm/versions/node/v22.22.2/bin/node` 启动。直接双击 HTML 会受浏览器本地模块/JSON 读取限制，应使用上述服务器。

准确入口：`/Users/yuan/Desktop/our-space/prototypes/map-home/index.html`。生产 `/home` 和导航完全独立。

## 体验方式

- 地图可拖动，聚焦地图后方向键移动，`+` / `-` 缩放；两位 Resident 按钮用于回到其位置，位置不可展示时查看身份面板。
- 点角色查看自愿状态，点花形针查看示例 LifePoint；关闭/Escape 保留地图位置。底部可查看无地点时刻及不保存的 composer 示例。
- 左下“原型实验台”可选 13 个场景：双方安静、新的端点变化、同段已展示、只有终点、噪声、无数据、过期、暂停、端点示意、有中间样本、A→B→A、采样缺口、两人远隔。
- 选择新变化时默认回放约 3 秒，抵达停止；“跳过”直接到最后可展示点。“再打开地图”和真实刷新不自动重播；要重复体验，明确点“重置演示游标”。这是调试功能。
- 虚线表示端点变化示意，实线表示有效合成采样段；两者均非真实用户轨迹，不证明步行。缺口不补线。
- 英文/中文切换不重放；系统 reduced-motion 或“关闭移动回放”采用静态前后位置表达。
- 实验台可切换平静、看书、抱杯子、Presence 跨日/清除；不会修改位置。示例账户展示候选/确认流程说明，无上传、拍照或生成能力。
- 远距场景点击小雨切到“巴黎 · 本原型未打包此处底图”，保留街区尺度；不会把伦敦底图当巴黎或缩成整个地球。

## 原型文件与隔离

- `app.mjs`：本地渲染、面板、双语、回放与镜头控制。
- `movement.mjs`：可测试状态机、合成样本、集中配置、查看者游标 key。
- `characters.mjs`：原创 SVG 同角色静止、8 帧步态、读书/抱杯姿态；没有 raster 或第三方资产依赖。
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
- 风格化示意：树冠按公园内部布置，**不是真实树木清单或 POI**；水纹、草点、屋顶瓦纹只是原创材质，屋顶色彩与实际外观不对应。生活针位置由虚构内容指定，不是真实发生地点。
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

## 本轮验证

保持原型服务器运行，使用仓库已有依赖：

```bash
node --test prototypes/map-home/movement.test.mjs
node prototypes/map-home/browser.test.mjs
npm run format:check
git diff --check
```

浏览器脚本使用已安装的 Playwright 与 Google Chrome，不运行安装；默认将有用途的证据写入本目录 `screenshots/`，也可设置 `PROTOTYPE_OUTPUT=/tmp/our-space-map-evidence`。验证结果数值见 [verification.json](./screenshots/verification.json)。原型测试不涉及生产账号或真实数据库。

本轮实际结果：Node.js `v22.22.2`；状态机 **23/23**、Chrome 浏览器 **24 组检查通过**，运行时外部请求 0、真实 geolocation 调用 0、page error 0。文字对比度：正文 10.61:1、次级文案 6.14:1、主按钮 5.41:1、地图标签 5.50:1、河名 5.20:1。`git diff --check` 与 `npm run format:check` 通过。

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
