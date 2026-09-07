# MAP-01A — 正式 Home 实施记录

日期：2026-09-06。状态：功能代码与离线验证完成；**公共地图服务接入确认及真实数据验收仍待完成，不能声明 MAP-01A 或 MAP-01 全部完成。**

## 已完成的正式代码

- `/home` 使用独立 `MapBrowser` / `MapCanvas` / `PixelGeography` 与 `ResidentMarker`，不加载 prototype HTML。
- 真实 `HomeService` 继续读取 ACTIVE Space、ACTIVE Resident、已确认 final 引用与 Presence。原图和未确认 candidate 不进入 Home；无头像使用姓名 fallback。
- 当前没有授权坐标，因此人物只显示在标注“未分享位置”的非地理快捷区域。选择浏览区域、拖动、回中不会写 Resident 位置。
- Presence 仍使用既有编辑/清除 action、查看者本地日历日、新日刷新和中文/英文；账户、邀请管理与头像创建/更换入口保留。
- 地图保持暖米道路、柔蓝水面、低饱和绿地与浅棕建筑；原创纹理和稀疏像素树来自批准原型的视觉语言。树属于公园制图装饰，不声称每一棵真实存在。数据范围外是未绘制纸面，不补造地理。
- 地理 provider、业务授权、缓存与 renderer 分离。无 schema/migration 变更，无新的核心实体。
- 修复首次加载早于 hydration 的可操作状态：区域选择与头像文件选择在组件就绪后启用；未改头像生成、候选确认或资源生命周期。

## 尚待确认的地图数据边界

建议使用公共 OSM Overpass：服务端只发送用户主动选中的公共浏览区域，不发送 User/Resident、Space、头像、Presence 或任何定位。固定端点、范围白名单、不自动重试、限制响应大小、校验官方 geometry schema；公共地理本地缓存，无后台刷新。

目前提供纽约中央公园南侧、巴黎塞纳河畔、京都鸭川河畔三个可主动选择的范围，没有默认城市，不将选择当作人物位置。它是限定范围浏览，尚不是全球连续瓦片地图。视野偏好只保存当前浏览器，不写入 Resident。

- `MAP_EXTERNAL_PROCESSING_APPROVED` 空值默认关闭。只有具体方案获准后才能设为 `osm-overpass-area-only-v1`。
- `MAP_CACHE_DIR` 可指定本地地理缓存目录；默认 `.data/map-cache`，与私密头像存储独立。缓存没有用户信息或浏览历史，当前不自动失效；更新由维护者受控执行。
- 每用户每分钟最多30次应用读取，全进程每天最多10次缓存未命中的provider请求，相同区域并发合并。复用现有单进程 limiter，多实例部署仍需共享限流/缓存。
- 公共服务无本产品的可用性保证；未批准、失败或无数据时明确说明，不补入伦敦demo。尚未验证真实 Overpass 响应、目标区域可用性或生产外部部署。
- 图上显示 `© OpenStreetMap contributors · ODbL` 与版权链接。资料：[官方范围/geometry](https://dev.overpass-api.de/overpass-doc/en/full_data/bbox.html)、[公共实例](https://wiki.openstreetmap.org/wiki/Overpass_API)、[版权](https://www.openstreetmap.org/copyright)。

## 测试证据

使用 Node 22 与独立 PostgreSQL 测试库，单元/数据库测试和 E2E 严格顺序运行。正式账户数据库不导入测试用户。

- `npm test`：31 files，178/178 tests，包括40项真实PostgreSQL集成。
- `npm run test:e2e`：Desktop Chrome + Pixel 7，共24/24；最后地图范围裁剪后定向双端2/2再次通过。覆盖375px宽度、拖动/键盘缩放/回中、详情不重置视野、真实成员、无坐标、Presence、双语及既有认证/邀请/头像回归。
- `typecheck`、`lint`、`format:check`、`git diff --check`通过；production audit 0 vulnerabilities。`npm run build`通过，`/home`首屏JS约131kB；本地production服务已恢复，并用现有真实账户打开`/home`，没有自动选择区域或触发地图/AI外发。
- 本轮 Cloudflare 0请求、Overpass数据0请求。测试使用受控provider和地理fixture，不声称它是真实生产数据接入。
- 离线截图位于本机证据目录 `map-home/chromium-map-offline-fixture.png` 和 `map-home/mobile-chrome-map-offline-fixture.png`。截图用的是实际正式renderer与测试账户，地理由浏览器拦截的OSM快照提供，**不是生产区域截图**；快照没有写入生产bundle或cache。

## 头像与后续边界

Our Space Avatar Style Baseline 已由用户批准，AVATAR-01 pipeline 已实现；当前真实candidate未确认为用户头像。本轮不自动确认、取消或延长candidate，不发送新生成请求。

真实位置采集、地理Resident marker授权语义、movement replay、ANIMATION-01与LifePoint集成仍未实现。LifePoint不强制location。不自动开始后续工作包。

## Git交付

起点 `19651200c475ffe92461cbbef0331bb6fe009218`，main、干净、origin同步0/0。已验证的代码与上述未完成状态一起提交，提交信息 `feat: prepare production map-first home`，完整hash由包含本记录的Git提交定位；正常push后目标main、干净、0/0，以最终实际命令核对。提交不等于尚未获准的真实地图接入已完成。
