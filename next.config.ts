import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 显式转译陈旧的 CommonJS 包，以确保在 ESM 环境下正常运行
  transpilePackages: ['playwright-extra', 'puppeteer-extra-plugin-stealth', 'puppeteer-extra-plugin-user-preferences']
};

export default nextConfig;
