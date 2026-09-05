# Our Space

Our Space 是一个属于两个人的私密共同生活空间。它的使命是“即使相隔，也一起生活”，产品目标是增加 Presence，而不是增加 engagement。

当前 Phase 3 已完成并通过 Final Review，包含 Quiet Home、Presence 和中英文 i18n；Phase 4 尚未开始、未获实施批准。用户已批准像素视觉及 AVATAR-01 正式开发。头像账户流程与 Cloudflare adapter 已接入，真实照片生成验证仍等待账户配置及授权样本，不能宣称 AVATAR-01 完成。应用验收基线与证据见 [CURRENT_STATE.md](./docs/CURRENT_STATE.md)。

## 像素头像

登录并进入自己的 Space 后，在 `/home` 点击「创建我的像素形象」；已有头像时点击「更换形象」。没有配置外部服务时仍可使用 Home 和本地照片预览，不发送照片、不生成假候选。配置、私密存储、清理与受控测试说明见 [头像运行说明](./docs/AVATAR_OPERATIONS.md)。本轮不生产接入地图、定位或状态动画。

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

可通过 `/register` 注册、`/login` 登录，并在 `/space` 创建 Space 与可复制的邀请链接。认证后可进入 `/home` 查看 Quiet Home / Presence；`/space` 仍提供 Space/Invitation 管理，Settings 尚未实现。

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

## 隔离像素地图 Home 原型

在 Node.js 22 环境，从仓库根目录运行：

```bash
node prototypes/map-home/serve.mjs
```

打开 [本地原型](http://127.0.0.1:4173)。完整启动、场景、公开地图数据来源、独立验证及截图见 [原型说明](./prototypes/map-home/README.md)。它不替换生产 `/home`，不采集位置或照片，不接入 AI/生产 Service。后续生产工作包尚待批准。
