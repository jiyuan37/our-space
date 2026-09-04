# Our Space

Our Space 是一个属于两个人的私密共同生活空间。它的使命是“即使相隔，也一起生活”，产品目标是增加 Presence，而不是增加 engagement。

当前仓库的 Phase 2 已完成并通过最终 Review：Credentials 注册/登录、JWT session、受保护路由、Space/OWNER Resident 原子创建和 Invitation 流程均已完成。Phase 3 尚未开始，尚未获得实施批准；Home、Presence、Life Point、Response、Shared Moment 和 Visit 尚未实施。

## 产品原则

- 建造一个家，而不是 feed。
- 增加陪伴感，而不是 engagement。
- 用户捕捉时刻，Our Space 保存故事。
- 沉默是有效状态，安静的 Home 不应显得损坏或空洞。
- 不提供 streak、公开 like、排名、relationship score 或操纵性通知。
- Space 内的内容只属于该 Space。

完整要求以 [`docs/OUR_SPACE_MASTER_SPEC.md`](./docs/OUR_SPACE_MASTER_SPEC.md) 为唯一事实来源。

## 技术栈

- Next.js 15、React 19、严格模式 TypeScript
- Tailwind CSS 4
- PostgreSQL 16、Prisma 6
- Zod
- Vitest、Testing Library、Playwright
- ESLint、Prettier

## 本地前置条件

- Node.js 22 LTS（项目仅支持 22.x；运行 `nvm use` 可读取 `.nvmrc`）
- npm 11 或兼容版本
- Docker Desktop / Docker Engine（推荐），或自行管理的 PostgreSQL 16

## 环境变量

复制示例配置：

```bash
cp .env.example .env
```

变量：

- `APP_URL`：应用本地地址。
- `DATABASE_URL`：开发数据库连接。
- `TEST_DATABASE_URL`：独立测试数据库连接；涉及数据库的测试不得复用开发数据库。
- `NEXTAUTH_URL`：NextAuth v4 对外应用地址。
- `AUTH_SECRET`：至少 32 字符的高熵认证 secret；production 必填。
- `TRUST_PROXY`：仅在已配置可信反向代理时设为 `true`。

## 启动 PostgreSQL

推荐使用 Docker Compose：

```bash
docker compose up -d postgres
```

如果使用自行管理的 PostgreSQL，只需在 `.env` 中替换 `DATABASE_URL` 和 `TEST_DATABASE_URL`。

## 安装与数据库设置

```bash
npm ci
npm run prisma:generate
npm run prisma:validate
npm run db:migrate:deploy
```

首次 migration 位于 `prisma/migrations`，禁止修改已经应用到共享环境的 migration；需要变更时应创建新 migration。

## 本地开发

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

可通过 `/register` 注册、`/login` 登录，并在 `/space` 创建 Space 与可复制的邀请链接。认证后页面仍是 Phase 2 过渡边界，不是 Home；由于 Settings 尚未实现，因此不会展示 Settings 导航。

## 验证命令

```bash
npm run lint
npm run typecheck
npm test
npm run prisma:validate
npm run db:migrate:deploy
npm run test:e2e:list
npm run build
```

完整 Playwright 浏览器测试需要先安装浏览器：

```bash
npx playwright install
npm run test:e2e
```

数据库集成测试必须显式提供独立的 `TEST_DATABASE_URL`。当前仍没有 demo seed 或 demo account。

## 目录结构

```text
prisma/
  migrations/            PostgreSQL migration
  schema.prisma          数据模型
src/
  app/                    Next.js App Router
  components/             React UI 组件
  lib/                    环境、数据库等基础能力
  server/
    errors/               类型化 Domain Errors
    services/             Service 约定与后续业务逻辑
  styles/                 Design Tokens 与全局样式
tests/
  e2e/                    Playwright 测试
```

## 架构边界

- React 组件只负责展示和交互组合，不承载业务规则。
- 已认证应用的数据修改默认通过 Server Actions。
- Auth.js、受保护媒体读取和文件上传使用 Route Handlers。
- 所有权限验证、领域规则和事务保留在 Service 层。
- 数据库约束与事务化 Service 共同维护并发不变量。

## 当前已知限制

详见 [`docs/KNOWN_LIMITATIONS.md`](./docs/KNOWN_LIMITATIONS.md)。当前尚无 demo account 或 seed data；这些不属于已完成的 Phase 2。
