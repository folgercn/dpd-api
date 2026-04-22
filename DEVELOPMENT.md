# DPD API 开发文档

本文档面向开发人员，记录了项目的内部流程、环境配置和开发运行方式。

## 核心业务流程

1. 在 Chrome 扩展程序的弹出窗口中粘贴一行或多行 Excel 数据。
2. 弹出窗口调用 `POST /api` 接口。
3. API 调用 AI 模型（Gemini-3-Flash）并返回结构化的货运数据。
4. 弹出窗口预览解析后的行数据。
5. 选中的行数据发送给 `content.js`，后者自动填入当前活跃的 DPD 页面。

## 环境配置

在项目根目录下创建 `.env.local`：

```bash
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=google/gemini-3-flash-preview
OPENROUTER_REFERER=http://localhost:3000
OPENROUTER_APP_TITLE=DPD 地址解析器

# 数据库配置
DATABASE_URL="file:./dev.db"

# 仓库信息（用于注入 AI Prompt）
WAREHOUSE_INFO="EXPO Service GmbH, Hua Zhang, Darmstädter Str. 117, 64319 Pfungstadt, Germany, zhhh6489@gmail.com, +49 (0)15257038155"

# 限流与安全
IP_RATE_LIMIT=30
LICENSE_RATE_LIMIT=20
MAX_TEXT_LENGTH=10000
```

## 本地开发运行

```bash
npm install
npx prisma db push
npm run dev
```

## 生产部署

项目已接入 GitHub Actions 自动化流水线。
- **分支推送**：任何对 `main` 分支的推送都会自动部署到服务器。
- **版本发布**：推送代码后会自动计算版本号、打包插件并创建 GitHub Release。

## 验证与检查

```bash
npx tsc --noEmit
npm run build
```
