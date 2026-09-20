# MAP-01A — 有界地理提取与本轮真实验收

真实请求日期：2026-09-07（纽约）；暂停后收尾验证：2026-09-20。起点`be66c323822ac2350b6e439a23f7d0e1dfc7341f`，main、干净、origin/main 0/0，remote不变。

**结论：MAP-01A尚未完成。旧的响应字节失控在本次请求中未重现，但分层元素预算拒绝了截断结果；随后修正的0.005° cell与relation输出尚未真实验证。第2次请求按停止条件没有执行。**

## 查询、空间与预算

生产数据仍由可替换GeographyProvider进入SVG renderer。固定整数格网cell-v3为0.005°×0.005°，单格最大约0.31km²；当前巴黎Home视野需12格。最多36格，最大面积仍小于本轮初始16个0.01°格的总面积。不是整城市下载，不改道路/建筑坐标。

每个cell、每个必要层分别使用同一bbox筛选与输出geometry；采用qt顺序、有限元素输出与out count。每层多返回至多1个哨兵对象，真实total超过预算或返回元素数与total不符时拒绝，绝不把截断结果作为完整地图缓存。

| 层   | 必要tags                                                                                                      | 基础zoom门槛 | 输出                                              | cell元素/坐标预算                   |
| ---- | ------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------- | ----------------------------------- |
| 道路 | primary/secondary/tertiary及link、residential/unclassified/living_street/service/pedestrian；排除indoor与area | 15           | way tags + geom(bbox)                             | 350 / 10000                         |
| 建筑 | building非no；relation限定multipolygon                                                                        | 16           | way tags + geom(bbox)；relation body + geom(bbox) | way 450 / 16000；relation 32 / 4000 |
| 绿地 | park/garden/recreation_ground、grass/forest/meadow；relation限定multipolygon                                  | 15           | 同上                                              | way 100 / 8000；relation 32 / 4000  |
| 水体 | natural water/coastline、river/stream/canal/riverbank；relation限定multipolygon water                         | 15           | 同上                                              | way 100 / 10000；relation 32 / 8000 |

当前Home采用固定基础zoom16，再做本地放大，不进行全世界连续瓦片下载。基础层不取footway/path/steps/cycleway细分支路；这是制图细节过滤，不改地理形状。少量名称直接取已查询绿地/水体的name，最多显示4处；不为文字额外取geometry。没有行政边界、out meta或recurse down/up。

**单次响应上限保持5MiB。** QL的`maxsize:33554432`自起始提交已存在，是上游查询内存预算，不是响应字节上限，本轮未提高。单cell结构最多150000个geometry条目（含null）、50000个真实坐标；relation成员上限1500。拼接后最多8000个feature、150000个绘制点，避免多个缓存组合压垮手机。

## 裁剪、接缝与缓存

Overpass裁剪返回的null代表缺失坐标，不能当作连续polyline。道路使用线段裁剪保留跨边界的真实部分；不跨null接线。完整polygon按矩形边界裁剪并保留内环；无法确定完整拓扑时只绘已知轮廓，不补假水面/河岸。裁剪生成的格边不画成建筑真实边界，轮廓来自原始已知线段。

relation必须获得必要的成员geometry；仅有tags/bounds时明确拒绝。无几何的远处成员不递归扩展，未知/不完整拓扑不冒充完整填色面。

服务层先验ACTIVE Resident权限，再按cell-v3键读取独立公共地理缓存；命中不访问上游，缺失格在一次HTTP内顺序输出。进程内相同视野合并、跨进程磁盘锁、至少30秒间隔、Retry-After、默认10次/10MiB日预算与无自动重试保留。跨cell按OSM type/id归并，去除相同/反向片段并保留不同真实片段。拖动与缩放只操作当前已加载视野，相同区域不会按像素重新查询。

原始完整响应在解析前保存，便于离线诊断；正式cell缓存只在全部必要校验通过后写入，不混入fixture。查询版本和格网版本进入缓存key，不误用旧视野/旧格网结果。

新增内部安全失败阶段：RESPONSE_BYTE_LIMIT、LAYER_ELEMENT_LIMIT、LAYER_POINT_LIMIT、GEOMETRY_ENTRY_LIMIT、GEOMETRY_POINT_LIMIT；不记录上游正文或用户秘密。公开页面仍显示平静的地图不可用提示。

## 本轮唯一真实请求

离线201项测试及双端定向复测、build/格式/audit通过后，按用户授权发出第1次请求，使用当时0.01°的巴黎街区cell。所有请求由服务端发送，只有地理bbox/OSM查询，没有业务字段或Resident位置。

- HTTP响应通过response.ok检查，完整JSON **678954 bytes**（约0.65MiB），未触发5MiB读取限制；具体HTTP状态码没有在这次解析失败记录中保留，不倒推为精确200。
- 返回839个elements，其中4个count；道路实际total **1371**，建筑 **1557**，绿地26，水体7。输出受351/451等上限限制，解析器根据total正确拒绝；失败层是**LAYER_ELEMENT_LIMIT**，当时对外错误仍是MAP_PROVIDER_TOO_LARGE。
- 真实源响应已保留在本机地图数据目录。它是完整JSON，包含受限数量的OSM对象；不等于完整地理视野，不能作为正式cell缓存。**没有合格生产地图缓存。**
- 同一源响应还证实：relation使用out tags geom时只有type/id/bounds/tags，缺少members。随后离线改为relation专用body geom，并对缺失成员明确拒绝。
- 根据这次真实计数离线改为0.005° cell、减少基础道路细分支路；没有提高单次字节或各层预算。新版七组输出的查询快照与schema回归已补充，**没有真实验证新版**。
- 本轮 **Overpass 1次，Cloudflare 0次**。第一次触发安全限制后立即停止，第2次不执行。维护验收额度使用同一个全局锁/间隔和独立持久两次授权记录，不删除旧计数、不改变5MiB上限；第二次辅助脚本要求第一次验收成功，因此本轮不可继续。

## 验证与截图

自动测试只用受控fixture/transport与独立PostgreSQL；正式账户和头像资源不受测试写入影响。覆盖完全在bbox内way、超长穿越way、局部相交multipolygon、跨边界线段、cell接缝去重、元素/点/响应预算、文件缓存持久化、授权、无自动重试及renderer缺口处理。查询快照禁止unrestricted out geom、recurse、out meta。

09-20最终安全补丁后：33个测试文件、203/203项（含40项真实PostgreSQL）通过；完整桌面/手机E2E 24/24通过（1.5分钟），地图手机用例375px。build、独立typecheck、lint、format与git diff检查通过，production audit为0漏洞。安全补丁前同样203/203与24/24通过。本轮初次完整E2E为23/24（手机头像用例等待测试候选超时），一次定向启动遇到开发服务器超时；随后双端头像和地图定向复测4/4通过，未修改头像功能。

本轮没有合格的真实Home地图截图。浏览器控制工具仍返回Sky Computer Use service startup request failed（浏览器控制服务无法启动）；更关键的是视野数据没有通过完整性验收。不会以旧伦敦fixture或截断的真实响应冒充完成。E2E已支持今后只从真实cell缓存读取、关闭外部请求并记录desktop/375px截图；本轮未启用该真实证据模式。

## 收尾安全补丁

09-20 production audit新增报告Next.js critical与sharp high问题。按维护者公告作同版本系列补丁升级：next/eslint-config-next 15.5.22 → 15.5.25，sharp及override 0.35.3 → 0.35.4，锁文件同步；不改变头像处理逻辑，也不发真实生成请求。依据：[Next.js维护者公告](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4)、[sharp维护者公告](https://github.com/lovell/sharp/security/advisories/GHSA-rgj7-g3m4-5g8c)。

## 不变边界与交付

地图授权只涵盖主动浏览区域；bbox/cell本身是外发地理数据，不发送User/Resident标识、Presence、头像、Space/LifePoint、伴侣资料或实时/后台位置。公共Overpass仅开发/测试/早期低流量使用；商业或规模化前重评后端，无公共生产SLA。

头像风格已批准，个人candidate未自动确认；Avatar生成、定位、轨迹、ANIMATION-01和LifePoint行为均未改。MAP-01A失败不影响Auth/Resident/Presence。只记录真实blocker，不声明MAP-01完成。

本地服务收尾恢复时仅进程级关闭地图外发与真实头像生成，不修改用户.env.local；避免在没有新增授权时页面触发请求。没有合格缓存时显示既有平静降级，真实账户/Presence仍可用。

本轮提交信息`fix: bound map geometry by cells and layer budgets`，完整hash由包含本记录的提交定位。正常push，保持main、干净和origin同步0/0，最终以实际Git命令复核。

依据：[官方Overpass QL输出、bbox与count语义](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL)、[官方bbox裁剪说明](https://dev.overpass-api.de/overpass-doc/en/full_data/bbox.html)。relation输出差异由本轮真实响应结构复核；不把文档推测当作真实接口验证。
