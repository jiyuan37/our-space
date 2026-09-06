import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: true,
  outputFileTracingIncludes: {
    "/api/avatar/generate": ["./src/server/avatar/style-reference.svg"],
  },
  // 私密候选、资源和任务地址不进入 Next 开发访问日志。
  logging: { incomingRequests: { ignore: [/^\/api\/avatar(?:\/|$)/] } },
};

export default nextConfig;
