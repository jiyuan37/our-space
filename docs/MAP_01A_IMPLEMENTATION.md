# MAP-01A — 正式 Home 实施记录

> 最新有界修复与2026-09-07真实验收见[后续记录](./MAP_01A_BOUNDED_GEOMETRY.md)。本文件保留前轮3次读取的历史证据。

日期：2026-09-06（纽约）。状态：正式功能代码与公共服务保护已实现；**接入授权已获批，但真实读取未形成地图缓存，不能声明MAP-01A或MAP-01全部完成。**

## 已完成的正式代码

- `/home` 使用独立 `MapBrowser` / `MapCanvas` / `PixelGeography` 与 `ResidentMarker`，不加载 prototype HTML。
- 真实 `HomeService` 继续读取 ACTIVE Space、ACTIVE Resident、已确认 final 引用与 Presence。原图和未确认 candidate 不进入 Home；无头像使用姓名 fallback。
- 当前没有授权坐标，因此人物只显示在标注“未分享位置”的非地理快捷区域。选择浏览区域、拖动、回中不会写 Resident 位置。
- Presence 仍使用既有编辑/清除 action、查看者本地日历日、新日刷新和中文/英文；账户、邀请管理与头像创建/更换入口保留。
- 地图保持暖米道路、柔蓝水面、低饱和绿地与浅棕建筑；原创纹理和稀疏像素树来自批准原型的视觉语言。树属于公园制图装饰，不声称每一棵真实存在。数据范围外是未绘制纸面，不补造地理。
- 地理 provider、业务授权、缓存与 renderer 分离。无 schema/migration 变更，无新的核心实体。
- 修复首次加载早于 hydration 的可操作状态：区域选择与头像文件选择在组件就绪后启用；未改头像生成、候选确认或资源生命周期。

## 已批准的地图数据边界与实现

服务端只发送用户主动选择/查看区域的bbox与道路、建筑、公园、水体必需查询。**bbox本身是外发的地理区域数据**；不发送User/Resident ID、姓名、头像、Presence、Space、LifePoint、伴侣资料、后台或实时定位。服务器不转发Cookie、Referer或浏览器请求头。

目前可主动选择纽约中央公园南侧、巴黎塞纳河畔、京都鸭川河畔；没有默认城市，不将浏览选择当作人物位置。它是有限区域浏览，尚不是全球连续瓦片地图。巴黎范围本轮缩至`[2.334,48.852,2.350,48.862]`，未改变任何Resident坐标。

- `MAP_EXTERNAL_PROCESSING_APPROVED=osm-overpass-area-only-v1`为明确政策开关，空值不外发；本机按本轮批准开启。头像真实生成开关仍关闭。
- `MAP_OVERPASS_ENDPOINT`支持可替换HTTPS后端，默认公共实例；客户端不能指定端点、凭据或原始查询。`User-Agent`为`OurSpace/0.1 MAP-01A (+https://github.com/jiyuan37/our-space)`。
- `MAP_CACHE_DIR`默认`.data/map-cache`，与头像私密资源分离。成功地理缓存按区域复用、不后台刷新/自动过期；完整原始响应以查询摘要命名，在解析前原子保存，支持离线修复。没有用户浏览历史；保留的bbox查询及地理响应不等于“无地理数据”。
- 每人每分钟最多30次应用读取；同区域进程内Promise合并。所有同主机worker使用同一磁盘锁，公共上游只串行访问；锁覆盖请求至完成，不排队轰炸。
- 正常应用预算持久化为UTC每日最多10次/10MiB，单次响应5MiB；发送前预留，成功按实际读取字节结算，失败保守不退还，不能通过重启规避。每次结束至少间隔30秒；429/406/504及其他HTTP错误采用更长Retry-After，没有自动重试。
- 客户端收到安全retryAt与Retry-After后显示双语平静提示，期间禁用重试。拖动/缩放只操作相机，不产生外部请求。已有缓存先读缓存，无缓存则降级，Auth/Resident/Presence服务不依赖Overpass成功。
- 共享磁盘适用于当前单主机早期环境，多主机需共享限流/缓存后端；崩溃留锁会安全阻断。维护者确认没有活跃请求后才能清除遗留锁，不能无条件定期删锁。
- **仅批准开发、测试和早期低流量**。正式规模化/商业发布前必须重新评估自托管、专用或付费地图后端，不能把公共Overpass当成无限免费基础设施或生产SLA。
- 图上保持`© OpenStreetMap contributors · ODbL`。依据：[官方bbox/geometry](https://dev.overpass-api.de/overpass-doc/en/full_data/bbox.html)、[公共实例政策](https://wiki.openstreetmap.org/wiki/Overpass_API)、[429/504说明](https://dev.overpass-api.de/command_line.html)、[版权](https://www.openstreetmap.org/copyright)。

## 本轮有限真实读取与未完成项

所有请求由本地服务器/同一provider发出，仅主动选中的巴黎区域；无并行、无自动重试、未换实例。实际计数 **3次Overpass、0次Cloudflare**。

1. 第一次从真实登录用户Home主动选择巴黎触发，未形成缓存；当时诊断不足，不能确认具体失败层。
2. 第二次经退避后单次受控读取，记录`LOCAL_PROCESSING_ERROR`，仍无完整源响应；不能倒推它一定与第三次同因。
3. 第三次缩小巴黎bbox，记录`MAP_PROVIDER_TOO_LARGE`。读取循环在累计响应超过5MiB时中止，尚未到JSON解析/地理规范化；没有完整源文件可恢复。第三次使用一次性15MiB保守总预算以保留前两次各5MiB失败预留；此临时注入已移除，应用默认仍是10MiB/日。所有3次计数与15MiB预留保留，未重置配额；当天后续未缓存读取由默认闸门拒绝。

已确认的根因层是**响应读取体积限制**。静态查询检查发现选择bbox后仍`out geom`输出完整相交对象，长河流关系可能很大；缺少完整响应，不能确认具体哪个OSM对象造成超限。缩小选择bbox没有解决这次失败。不能用提高预算、不完整JSON或固定伦敦fixture掩盖。

还需解决“大范围相交几何的有界提取且保持正确闭合/内环”并进行真实加载验收。官方`out geom(bbox)`会裁剪坐标，但不能未经处理就将缺失多边形用直线补齐；本轮未将此未验证方案塞入生产。没有真实地图成功截图，只有离线测试截图及真实降级状态，不能写`MAP-01A production Map-first Home implemented`作为已验收结论。

本轮到此停止真实上游读取。当前正式candidate未确认，Avatar Style Baseline不变；不开始定位/动画/LifePoint。

## 上轮测试证据（254d4f8）

使用 Node 22 与独立 PostgreSQL 测试库，单元/数据库测试和 E2E 严格顺序运行。正式账户数据库不导入测试用户。

- `npm test`：31 files，178/178 tests，包括40项真实PostgreSQL集成。
- `npm run test:e2e`：Desktop Chrome + Pixel 7，共24/24；最后地图范围裁剪后定向双端2/2再次通过。覆盖375px宽度、拖动/键盘缩放/回中、详情不重置视野、真实成员、无坐标、Presence、双语及既有认证/邀请/头像回归。
- `typecheck`、`lint`、`format:check`、`git diff --check`通过；production audit 0 vulnerabilities。`npm run build`通过，`/home`首屏JS约131kB；本地production服务已恢复，并用现有真实账户打开`/home`，没有自动选择区域或触发地图/AI外发。
- 本轮 Cloudflare 0请求、Overpass数据0请求。测试使用受控provider和地理fixture，不声称它是真实生产数据接入。
- 离线截图位于本机证据目录 `map-home/chromium-map-offline-fixture.png` 和 `map-home/mobile-chrome-map-offline-fixture.png`。截图用的是实际正式renderer与测试账户，地理由浏览器拦截的OSM快照提供，**不是生产区域截图**；快照没有写入生产bundle或cache。

## 头像与后续边界

Our Space Avatar Style Baseline 已由用户批准，AVATAR-01 pipeline 已实现；当前真实candidate未确认为用户头像。本轮不自动确认、取消或延长candidate，不发送新生成请求。

真实位置采集、地理Resident marker授权语义、movement replay、ANIMATION-01与LifePoint集成仍未实现。LifePoint不强制location。不自动开始后续工作包。

## 本轮验证

- `npm test`：32 files，190/190 tests，包括40项真实PostgreSQL集成；新增持久串行/退避/预算、HTTPS端点替换、响应超限、解析失败源保留、缓存降级与中英退避UI。
- 自动测试仅受控transport/fixture；正式`.data`不写测试地理素材，源保留测试使用独立临时目录。地图测试与头像测试都不外发。
- `npm run test:e2e`：Desktop Chrome + Pixel 7，共24/24通过；顺序运行独立测试库，没有与Vitest并发。
- `npm run build`、`npm run typecheck`、`npm run lint`通过；`npm audit --omit=dev`为0 vulnerabilities；format/diff检查见最终交付。正式production服务已恢复。
- 末次浏览器截图工具两次返回`Sky Computer Use service startup request failed`（浏览器控制服务无法启动），未取得本轮真实降级截图。已有双端fixture截图仍只作为离线renderer证据，不当作真实巴黎地图验收。

## Git交付

本轮起点`254d4f8372ab58d61ff4534bd7b8deadc9c64fe0`，main、干净、origin同步0/0。提交信息`fix: guard public Overpass access and record live limits`，完整hash由包含本记录的Git提交定位；正常push后目标main、干净、0/0，以最终命令核对。提交代表接入保护与已验证代码，不代表真实地图验收已完成。

# OpenFreeMap provider migration（2026-09-24）

- 正式底图：`OpenFreeMapProvider`返回OpenFreeMap vector TileJSON、Our Space MapLibre style layers及OpenFreeMap/OpenStreetMap attribution；`BaseMapCanvas`负责client-only初始化、loading/error、resize和unmount cleanup。
- 可选细节：既有`OverpassProvider`现在履行`EnrichmentProvider`，只在用户主动要求更多建筑细节时走`/api/map`。七层、layer/cell budgets、cell-v4 cache、deduplication、bounded geometry及incomplete handling均保留。
- 解耦结果：Home首屏、Resident marker/fallback和Presence不等待Overpass；enrichment失败只显示平静提示，已加载的OpenFreeMap底图不被移除。
- 验收边界：当前执行环境到`https://tiles.openfreemap.org/planet`的CONNECT tunnel返回403。自动测试可证明provider/style wiring与解耦行为，但不能替代真实tile视觉成功；需在允许访问OpenFreeMap的网络补充真实双端截图。
