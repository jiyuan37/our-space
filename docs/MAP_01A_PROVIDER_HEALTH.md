# MAP-01A Provider Health 调查

日期：2026-09-24。基线：`4afa19f`，与 `origin/main` 为 `0/0`。

## 结论

当前证据不支持把问题继续归因于 bounded query 本身，也不支持把任一 public Overpass endpoint 当作 MAP-01A 的生产 SLA。用户在独立机器上以极小 `node` query 请求 `overpass-api.de`，约 33 秒后得到 empty response；本执行环境再以同一个极小、固定、无用户坐标的 query 分别检查三个公共 endpoint，三个请求都在约 5.5–6.0 秒后出现 transport failure。它们没有返回 HTTP body，因此本次无法取得 `remark`，也没有 incomplete response 可解析。

这不证明三个 endpoint 永久故障；它证明“偶发一次 public endpoint 成功”不能满足真实地图可靠性验收。现有 fixed-cell、分层预算、geometry 去重、5 MiB 响应限制和 incomplete rejection 全部保留，不再以盲目扩大或缩小查询作为主方向。

## 独立 health probe

命令：`npm run test:map-providers`。

Probe 固定发送 `[out:json][timeout:5];node(1);out;`，query hash 为 `e47d865cac2d8995`。每个 endpoint 最多一次，15 秒客户端 timeout，无 retry；输出只含 endpoint 名、query hash、latency、HTTP/result 分类、remark、element count 与 response bytes，不含完整 query、用户数据、位置或 secret。

| endpoint name     | latency | result                    | incomplete / remark |
| ----------------- | ------: | ------------------------- | ------------------- |
| `overpass-api-de` | 5533 ms | `TypeError: fetch failed` | 无响应体，无法判断  |
| `kumi-systems`    | 6001 ms | `TypeError: fetch failed` | 无响应体，无法判断  |
| `private-coffee`  | 5747 ms | `TypeError: fetch failed` | 无响应体，无法判断  |

本次共 3 个 endpoint、每个恰好 1 次请求，没有对失败 endpoint 重试，也没有触发正式 Home query。结果只能说明本执行环境当时无法完成这些公网请求；结合独立机器的 33 秒 empty response，公共 Overpass 的当前可用性不足以承担验收依赖。

## Provider health abstraction

- `FileProviderHealth` 只持久化 endpoint name、最后检查时间、latency、outcome、连续失败次数和 circuit 打开截止时间；不保存 URL、query、坐标或用户字段。
- outcome 固定为 `success`、`timeout`、`http_error`、`transport_error`、`incomplete` 或本地预算拒绝的 `response_rejected`。Overpass `remark`、empty或无效响应仍触发 incomplete 分类，不会写入地图 cache 或渲染 partial map。
- 每次失败从 30 秒开始指数 backoff，最高 15 分钟；成功才清零。全部 circuit 打开时直接返回 backoff，不外发。
- endpoint fallback 只作用于**下一次独立地图读取**。一次逻辑读取最多发送一个 upstream request，不在同一次调用中连打多个 public endpoint，因此没有 retry storm。
- server operator 最多配置 1 个 primary 和 2 个 HTTPS fallback；客户端仍不能提供 endpoint。全局 request gate、每日预算、请求间隔与 5 MiB 单响应上限保持不变。

## MVP 可用方案

推荐采用 **cache-first regional dataset + 有 SLA 的数据来源**：按明确支持区域预生成/预热固定 cell，部署时携带已验证的真实 OSM 派生 cache；运行时 Home 默认只读 cache，小范围缺口再交给受 health/circuit/gate 约束的 backend。这样不会要求一次下载完整 Home viewport，也不会把 public Overpass 的即时健康状态暴露给用户。

可靠数据来源按对现有实现的改动量排序：

1. **自托管 Overpass**：最能复用 bounded query 和 parser；需要区域 extract 更新、容量、监控和运维。
2. **付费或具明确 SLA 的 Overpass-compatible backend**：复用成本低，但需单独完成合同、隐私、配额和成本评估。
3. **OSM vector/tile provider**：适合稳定地图交付，但协议和渲染管线不同，需新 adapter 与许可/归因复核；不能自动迁移。

公共 endpoint 可保留为开发诊断或低频人工预热候选，但不应作为生产 cache miss 的可靠 SLA，也不能以一次成功作为 MAP-01A 验收。验收需要：可靠 provider 的来源与运维边界明确、真实 regional cache 可重复生成、cache miss 行为受控、incomplete 永远拒绝、双端真实地图从该可靠来源渲染。
