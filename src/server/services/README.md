# Service 层约定

Service 层承载后续所有权限验证、领域规则和事务边界。React 组件、Server Actions 和 Route Handlers 不得直接实现业务规则。

## 约定

- 每个公开 Service operation 接受经过类型验证的输入和 `ServiceContext`。
- `ServiceContext.actorUserId` 表示当前已认证 User；不得信任客户端传入的 User 或 Resident 标识。
- 每个 Space 范围的 operation 必须先验证有效 Resident 成员资格。
- 多条写入或并发不变量使用 Prisma transaction 和数据库约束共同保证。
- 预期业务失败抛出 `DomainError` 子类；未知错误不转换为虚假的业务错误。
- Service 返回领域数据或专用 view model，不直接返回不必要的数据库字段。
- Server Actions 是已认证应用变更的默认边界。
- Auth.js、受保护媒体读取和文件上传使用 Route Handlers。

Phase 1 只建立约定和上下文类型，不实现 Phase 2 及后续业务功能。
