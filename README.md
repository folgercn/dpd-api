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

## 🚀 快速开始（安装指南）

### 1. 下载插件
前往 [GitHub Releases](https://github.com/folgercn/dpd-api/releases) 页面，下载最新版本的 `dpd-extension.zip`。

### 2. 安装插件
1. 下载后请先 **解压** ZIP 文件到一个固定目录。
2. 打开 Chrome 浏览器，在地址栏输入 `chrome://extensions/` 并回车。
3. 在右上角开启 **“开发者模式” (Developer mode)**。
4. 点击左上角的 **“加载已解压的扩展程序” (Load unpacked)**。
5. 选择您刚才解压的文件夹。
6. 安装成功后，建议点击浏览器右上角的“拼图”图标，将 **DPD AI 助手** 固定到工具栏。

### 3. 激活与配置
1. 点击插件图标，点击右上角的 **齿轮图标** 进入设置。
2. **API 地址**：默认已配置为生产环境地址。
3. **激活码**：输入您的专属激活码，点击“激活”。
4. 激活成功后，锁定界面将消失，即可开始使用。

## 💡 使用方法
1. 从 Excel 中复制包含地址信息的行。
2. 在插件窗口中粘贴文本，点击 **“解析地址”**。
3. AI 将自动拆分姓名、地址、邮编、电话、重量等信息。
4. 确保您已登录 DPD Business 官网。
5. 在预览列表中选择一条地址，点击 **“填入当前页”**，系统将自动完成表单填写。

## 支持的 DPD 页面

### 20kg 以下
`https://business.dpd.de/auftragsstart/auftrag-starten.aspx`

### 20kg 以上 / 退货 (Return)
`https://business.dpd.de/retouren/retoure-beauftragen.aspx`

## 验证
常用的本地检查命令：

```bash
npx tsc --noEmit
node --check src/extension/popup.js
node --check src/extension/content.js
npm run build
```

`npm run lint` 目前在现有的 ESLint/Next 配置兼容层中会因循环结构错误而失败（在触及项目代码之前）。
