# DPD API 和 Chrome 扩展程序

Next.js 后端加上一个 Chrome 扩展程序，利用 AI 解析粘贴的 Excel 货运行数据，并自动填入 myDPD Business 表单。

## 当前流程

1. 在 Chrome 扩展程序的弹出窗口中粘贴一行或多行 Excel 数据。
2. 弹出窗口调用 `POST /api/parse-address` 接口。
3. API 调用 OpenRouter 接口（使用 `google/gemini-3-flash-preview` 模型）并返回结构化的货运数据。
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
START_SHIPMENT_WORKER=false
```

`START_SHIPMENT_WORKER=false` 用于在本地开发期间禁用旧的 Playwright 货运任务运行器。Chrome 扩展程序的流程不需要该运行器。

## 开发运行

```bash
npm install
npm run dev
```

API 运行地址：

```text
http://localhost:3000/api/parse-address
```

如果修改了 `.env.local`、`next.config.ts` 或依赖项，请重启 `npm run dev`。普通的 API 和扩展程序源码修改无需重启 Next.js 即可生效。

## Chrome 扩展程序

从以下路径加载已解压的扩展程序：

```text
/Users/fujun/node/dpd-api/src/extension
```

在 Chrome 中：

```text
chrome://extensions -> 开发者模式 -> 加载已解压的扩展程序
```

重载规则：

- `popup.html` / `popup.js`：关闭并重新打开弹出窗口。
- `content.js` / `manifest.json`：重新加载扩展程序，然后刷新 DPD 页面。

## 支持的 DPD 页面

### 20kg 以下

```text
https://business.dpd.de/auftragsstart/auftrag-starten.aspx
```

当前映射关系：

- 上方的 `Absender / LabelAddress` 区块：从 Excel 解析出的客户地址。
- 下方的 `Empfänger / ShipAddress` 区块：固定的仓库地址。
- 包裹（Parcel）部分：重量、可选的尺寸和参考号。

固定仓库信息：

```text
EXPO Service GmbH
Hua Zhang
Darmstädter Str. 117
64319 Pfungstadt
Germany / DEU
zhhh6489@gmail.com
+49 (0)15257038155
```

### 20kg 以上 / 退货 (Return)

```text
https://business.dpd.de/retouren/retoure-beauftragen.aspx
```

当前映射关系：

- 客户国家
- 客户邮编（取自“发件人邮编”）
- 客户邮箱
- 包裹重量
- 参考号 1（取自“客户订单号” + “SKU1”）

退货地址将从 DPD 账户地址簿中选择。

## 验证

常用的本地检查命令：

```bash
npx tsc --noEmit
node --check src/extension/popup.js
node --check src/extension/content.js
npm run build
```

`npm run lint` 目前在现有的 ESLint/Next 配置兼容层中会因循环结构错误而失败（在触及项目代码之前）。
