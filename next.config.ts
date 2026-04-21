import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 显式转译陈旧的 CommonJS 包，以确保在 ESM 环境下正常运行
  transpilePackages: [
    "playwright-extra",
    "puppeteer-extra-plugin-stealth",
    "puppeteer-extra-plugin-user-preferences",
  ],
  async headers() {
    return [
      {
        source: "/api/parse-address",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.EXTENSION_CORS_ORIGIN || "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "POST, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
