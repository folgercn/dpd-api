# Chrome 扩展字段映射固化文档

本文档用于固定当前 `src/extension` 中已经落地的字段映射关系，方便后续维护、排查和改版时快速对照。

如果你当前要做的是“怎么开控制台、怎么抓真实输入框、怎么拿调试日志”，请先看：
- [docs/extension-debugging.md](/Users/fujun/node/dpd_api/docs/extension-debugging.md)

适用代码版本：
- 输入解析来源：[src/extension/popup.js](/Users/fujun/node/dpd_api/src/extension/popup.js)
- 页面填充来源：[src/extension/content.js](/Users/fujun/node/dpd_api/src/extension/content.js)

## 1. 总体链路

当前扩展链路已经恢复为“扩展前端 + 后端 AI 解析”模式：

1. 用户在扩展弹窗中粘贴 Excel 行文本。
2. `popup.js` 调用后端 `POST /api/parse-address`。
3. 后端先按输入格式做预处理：
   - `4 列格式`：`SKU / 数量 / 重量 / 地址`
   - `单列格式`：只有地址
4. 后端只把地址块交给 AI 解析。
5. 后端返回结构化 shipment，并根据 `serviceType` 决定是否附带 `warehouse`。
6. `content.js` 收到 `shipment` 后，只填写当前页面，不会自动跳转。

## 1.1 输入映射规则

### 4 列格式

| 输入列 | 含义 | 当前处理 |
| --- | --- | --- |
| 第 1 列 | `SKU` | 合并进 `reference`，并保留为 `sku` |
| 第 2 列 | `数量` | 作为 `quantity` |
| 第 3 列 | `重量` | 作为 `weightKg` |
| 第 4 列 | 地址块 | 发送给 AI 解析 |

### 单列格式

| 输入 | 当前处理 |
| --- | --- |
| 只有地址文本 | 只解析地址，不推断 `SKU / 数量 / 重量` |

## 1.2 仓库地址返回规则

仓库地址来源：
- `.env` / `.env.local` 中的 `WAREHOUSE_INFO`

当前规则是固化的：

- 发货页链路：后端返回 `warehouse`
- 退货页链路：后端返回 `warehouse = null`

也就是说：

- `https://business.dpd.de/auftragsstart/auftrag-starten.aspx`
  会使用固定仓地址
- `https://business.dpd.de/retouren/retoure-beauftragen.aspx`
  不会使用固定仓地址
## 2. 标准化规则

在 `content.js` 中，写入页面前会做一次标准化。

### 2.1 姓名拆分

`splitName(fullName)` 规则：

- 只有一个词时：视为 `lastName`
- 多个词时：
  - 第一个词 -> `firstName`
  - 剩余部分 -> `lastName`

### 2.2 街道拆分

`splitStreetAndHouseNumber(fullStreet)` 规则：

- 使用“数字前空格”拆分
- 前半段 -> `street`
- 后半段 -> `houseNumber`

### 2.3 国家代码归一化

当前已内置的归一化关系：

| 输入值 | 输出值 |
| --- | --- |
| `DE` / `DEU` / `GERMANY` / `DEUTSCHLAND` | `DEU` |
| `IT` / `ITA` / `ITALY` / `ITALIEN` | `ITA` |
| `FR` / `FRA` / `FRANCE` / `FRANKREICH` | `FRA` |
| `AT` / `AUT` / `AUSTRIA` / `OESTERREICH` / `ÖSTERREICH` | `AUT` |
| `NL` / `NLD` / `NETHERLANDS` / `NIEDERLANDE` | `NLD` |
| `ES` / `ESP` / `SPAIN` / `SPANIEN` | `ESP` |
| `PL` / `POL` / `POLAND` / `POLEN` | `POL` |

未命中的值会原样返回。

## 3. 发货页字段映射

适用页面：
- `https://business.dpd.de/auftragsstart/auftrag-starten.aspx`

执行入口：
- `fillStartOrderPage(shipment)`

### 3.1 客户地址 -> LabelAddress

| shipment 字段 | 页面字段 ID |
| --- | --- |
| `recipientName` / `firstName` / `lastName` | `txtLabelAddress_FirstName` / `txtLabelAddress_LastName` |
| `company` | `txtLabelAddress_Company` |
| `street` | `txtLabelAddress_Street` |
| `houseNumber` | `txtLabelAddress_HouseNo` |
| `postalCode` | `txtLabelAddress_ZipCode` |
| `city` | `txtLabelAddress_City` |
| `country` | `selLabelAddress_Country` |
| `email` | `txtLabelAddress_Mail` |
| `phone` | `txtLabelAddress_Phone` |

### 3.2 固定仓地址 warehouse -> ShipAddress

来源：
- 后端根据 `WAREHOUSE_INFO` 返回的 `shipment.warehouse`

注意：
- 只有发货页链路才会有 `warehouse`
- 如果 `warehouse` 为空，扩展不会填 `ShipAddress`

| warehouse 字段 | 页面字段 ID |
| --- | --- |
| `firstName` | `txtShipAddress_FirstName` |
| `lastName` | `txtShipAddress_LastName` |
| `company` | `txtShipAddress_Company` |
| `street` | `txtShipAddress_Street` |
| `houseNumber` | `txtShipAddress_HouseNo` |
| `postalCode` | `txtShipAddress_ZipCode` |
| `city` | `txtShipAddress_City` |
| `country` | `CPLContentLarge_selShipAddress_Country` |
| `email` | `txtShipAddress_Mail` |
| `phone` | `txtShipAddress_Phone` |

### 3.3 运单公共字段

| shipment 字段 | 页面字段 ID |
| --- | --- |
| `quantity` | `CPLContentLarge_txtOrderData_ParcelCounter` |
| `weightKg` | `txtWeight_Parcel_1` |
| `reference` | `txtOrderData_OrderReferenceList_OrderReference1` |

## 4. 退货页字段映射

适用页面：
- `https://business.dpd.de/retouren/retoure-beauftragen.aspx`

执行入口：
- `fillReturnPage(shipment)`

### 4.1 页面初始化动作

| 动作 | 页面字段 ID |
| --- | --- |
| 勾选“现在输入地址” | `CPLContentLarge_chkInput_WithAddress` |

### 4.2 退货地址字段

当前退货页不会使用固定仓地址。

| shipment 字段 | 页面字段 ID |
| --- | --- |
| `company` | `txtCompany` |
| `firstName` | `txtFirstName` |
| `lastName` | `txtLastName` |
| `country` | `CPLContentLarge_selCountry_WithAddress` |
| `postalCode` | `txtZipCode_WithAddress` |
| `city` | `txtCity` |
| `street` | `txtStreet` |
| `houseNumber` | `txtHouseNo` |
| `email` | `txtMail_WithAddress` |
| `phone` | `txtPhone` |
| `quantity` | `CPLContentLarge_txtParcelCount` |
| `weightKg` | `txtWeight_Parcel1` |
| `reference` | `txtOrderReference1` |

## 5. WAREHOUSE_INFO 配置映射

环境变量：

```bash
WAREHOUSE_INFO="公司名, 联系人姓名, 街道门牌, 邮编, 城市, 国家, 邮箱, 电话"
```

当前解析规则如下：

| WAREHOUSE_INFO 位置 | 目标字段 |
| --- | --- |
| 第 1 段 | `company` |
| 第 2 段 | `recipientName` |
| 第 3 段 | `street` + `houseNumber` |
| 第 4 段 | `postalCode` |
| 第 5 段 | `city` |
| 第 6 段 | `countryCode` |
| 第 7 段 | `email` |
| 第 8 段 | `phone` |

同时兼容这类 7 段格式：

```bash
WAREHOUSE_INFO="公司名, 联系人姓名, 街道门牌, 邮编+城市, 国家, 邮箱, 电话"
```

## 6. DOM 查找兜底规则

`fillField()` 当前的查找策略如下：

1. 先精确匹配：
   - `document.getElementById(id)`
   - `document.getElementById("CPLContentLarge_" + id)`
2. 如果失败，且传入了 `prefix`，则做模糊匹配：
   - `[id*="${prefix}"][id*="${keyword}"]`
3. 如果是邮编字段，再做邮编兜底匹配：
   - `[id*="${prefix}"][id*="Zip"]`
   - `[id*="${prefix}"][id*="PLZ"]`

这意味着当前映射并不是只依赖单一 ID，也包含了一层“前缀 + 关键词”的容错策略。

## 7. 当前已知限制

以下内容不是未来设计，而是当前代码已经固化的现实约束：

- 退货页不会使用 `WAREHOUSE_INFO`。
- 只有发货页链路才会使用 `WAREHOUSE_INFO`。
- 扩展不会自动跳转发货页或退货页。
- 如果当前页面不对，插件会提示操作员先打开正确页面。
- 页面字段高度依赖 DPD 当前 DOM 结构；如果 DPD 改了字段 ID，这份映射也要同步更新。

## 8. 建议的维护原则

后续如果要调整扩展逻辑，建议优先同步更新这份文档中的以下部分：

- 输入列映射
- 发货页字段映射
- 退货页字段映射
- 国家归一化规则
- 当前页填写规则

这样可以保证“代码里的已映射关系”始终有一份稳定、可核对的书面版本。
