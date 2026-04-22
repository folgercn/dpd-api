# DPD Extension API 开发文档

本文档记录当前仓库的最小职责：保留 Chrome 扩展前端，并提供扩展所需的激活校验与 AI 地址解析后端。

## 当前结构

当前仓库只保留两块核心：

1. Chrome 扩展前端：`src/extension`
2. Next.js API 后端：`src/app/api`

当前 Web 页面不再承担 OMS 后台职责，首页仅作为接口说明页。

## 核心业务流程

1. 用户在 Chrome 扩展弹窗中粘贴 Excel 文本。
2. 扩展调用 `POST /api/auth/verify` 校验激活码。
3. 扩展调用 `POST /api/parse-address` 请求 AI 解析。
4. 后端调用大模型，将文本解析为结构化 shipment。
5. 后端根据重量和服务类型决定是否附带仓库地址。
6. 扩展将结果发送给 `content.js`，自动填入 DPD 页面。

## 发货页 / 退货页规则

### 发货页

适用页面：
- `https://business.dpd.de/auftragsstart/auftrag-starten.aspx`

规则：
- 当 shipment 最终进入发货页链路时，后端会把 `WAREHOUSE_INFO` 解析为 `warehouse` 字段返回给扩展。
- 扩展收到 `warehouse` 后，会把它填入发货页的收件仓地址区域。

### 退货页

适用页面：
- `https://business.dpd.de/retouren/retoure-beauftragen.aspx`

规则：
- 当 shipment 最终进入退货页链路时，后端不会返回仓库信息。
- 扩展不会向退货页填写固定仓地址。

## 环境配置

在项目根目录下创建 `.env.local`：

```bash
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=google/gemini-3-flash-preview
OPENROUTER_REFERER=http://localhost:3000
OPENROUTER_APP_TITLE=DPD Address Parser

# 扩展激活码
EXTENSION_LICENSE_KEYS=DPD-AI-XXXXXXX,DPD-AI-YYYYYYY

# 限流与安全
IP_RATE_LIMIT=30
LICENSE_RATE_LIMIT=10
RATE_LIMIT_WINDOW_MS=60000
MAX_TEXT_LENGTH=10000

# 固定仓地址
WAREHOUSE_INFO="EXPO Service GmbH, Hua Zhang, Darmstädter Str. 117, 64319 Pfungstadt, Germany, zhhh6489@gmail.com, +49 (0)15257038155"
```

## WAREHOUSE_INFO 的作用

`WAREHOUSE_INFO` 当前会被后端真实使用，不再是摆设变量。

格式约定：

```bash
WAREHOUSE_INFO="公司名, 联系人姓名, 街道门牌, 邮编, 城市, 国家, 邮箱, 电话"
```

示例：

```bash
WAREHOUSE_INFO="EXPO Service GmbH, Hua Zhang, Darmstädter Str. 117, 64319 Pfungstadt, Germany, zhhh6489@gmail.com, +49 (0)15257038155"
```

后端会将它解析为：

- `company`
- `recipientName`
- `firstName`
- `lastName`
- `street`
- `houseNumber`
- `postalCode`
- `city`
- `countryCode`
- `email`
- `phone`

并且只在发货页链路中返回给扩展。

## 本地开发运行

```bash
npm install
npm run dev
```

## 本地验证

建议至少验证以下两条接口：

```bash
POST /api/auth/verify
POST /api/parse-address
```

完整检查：

```bash
npm run build
```

## 发布说明

当前 GitHub Actions 主要负责：

1. 自动打 tag
2. 同步扩展版本号
3. 打包 `src/extension`
4. 发布 GitHub Release
5. 发布 `version.json` 到 GitHub Pages

注意：
- GitHub Pages 现在承担的是插件更新元数据托管
- 它不是正式 API 后端
- 正式 API 域名需要单独部署和配置
