# DPD Extension API 开发文档

本文档记录当前仓库的最小职责：保留 Chrome 扩展前端，并提供扩展所需的激活校验与 AI 地址解析后端。

如果需要排查 DPD 页面字段、控制台日志或自动刷新问题，请配合查看：
- [docs/extension-debugging.md](/Users/fujun/node/dpd_api/docs/extension-debugging.md)
- [docs/extension-field-mapping.md](/Users/fujun/node/dpd_api/docs/extension-field-mapping.md)

## 当前结构

当前仓库只保留两块核心：

1. Chrome 扩展前端：`src/extension`
2. Next.js API 后端：`src/app/api`

当前 Web 页面不再承担 OMS 后台职责，首页仅作为接口说明页。

## 核心业务流程

1. 用户在 Chrome 扩展弹窗中粘贴 Excel 文本。
2. 扩展调用 `POST /api/auth/verify` 校验激活码。
3. 扩展调用 `POST /api/parse-address` 请求 AI 解析。
4. 后端会先做输入预处理：
   - 支持 `4 列格式`：`SKU / 数量 / 重量 / 地址`
   - 支持 `单列格式`：只有地址文本
5. 后端只把地址块发送给 AI，AI 只解析地址字段。
6. 后端将 `SKU / 数量 / 重量` 与 AI 返回的地址结果合并成结构化 shipment。
7. 后端根据重量和服务类型决定是否附带仓库地址。
8. 扩展将结果发送给 `content.js`，填入当前 DPD 页面。

## 发货页 / 退货页规则

### 发货页

适用页面：
- `https://business.dpd.de/auftragsstart/auftrag-starten.aspx`

规则：
- 当 shipment 最终进入发货页链路时，后端会把 `WAREHOUSE_INFO` 解析为 `warehouse` 字段返回给扩展。
- 扩展收到 `warehouse` 后，会把它填入发货页的收件仓地址区域。
- 扩展不会自动跳转到发货页；只有当前已经打开这个页面时才会直接填写。

### 退货页

适用页面：
- `https://business.dpd.de/retouren/retoure-beauftragen.aspx`

规则：
- 当 shipment 最终进入退货页链路时，后端不会返回仓库信息。
- 扩展不会向退货页填写固定仓地址。
- 扩展不会自动跳转到退货页；只有当前已经打开这个页面时才会直接填写。

## 输入格式

### 4 列格式

字段顺序固定为：

1. `SKU`
2. `数量`
3. `重量`
4. `地址`

示例：

```text
PV200	1	9.3	"收件人：Thomas Kleeblatt
地址：Aussiger Str. 6
城市：Munster
省份：Niedersachsen
邮编：29633 Germany
电话：015164315540"
```

处理规则：

- 第 1 列 `SKU` 会合并进 `reference`
- 第 2 列 `数量` 会作为 `quantity`
- 第 3 列 `重量` 会作为 `weightKg`
- 第 4 列地址块才会送入 AI

### 单列格式

如果只有地址文本，也可以直接粘贴。

示例：

```text
Frau Marlies Jurk
Kirchgasse 1
Bad Rodach
Bayern
Germany
96476
01735615703
```

处理规则：

- 这种模式下只有地址会被解析
- 没有重量时，插件不会自动判断发货页还是退货页
- 需要操作员自己先打开正确页面

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

当前也兼容这类 7 段写法：

```bash
WAREHOUSE_INFO="公司名, 联系人姓名, 街道门牌, 邮编+城市, 国家, 邮箱, 电话"
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

1. 根据改动范围区分：
   - 后端部署
   - 扩展发布
2. 后端改动时：
   - `npm ci`
   - `npm run build`
   - 上传 `.next` 和生产运行文件到服务器
   - `pm2 startOrReload ecosystem.config.js`
3. 扩展改动时：
   - 自动打 tag
   - 同步扩展版本号
   - 打包 `src/extension`
   - 发布 GitHub Release
   - 发布 `version.json` 和 `updates.xml` 到 GitHub Pages

注意：
- GitHub Pages 现在承担的是插件更新元数据托管
- 它不是正式 API 后端
- 正式 API 域名当前为 `https://dpdapi.sunnywifi.cn`
