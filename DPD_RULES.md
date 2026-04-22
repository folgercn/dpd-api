# DPD 插件业务逻辑与 DOM 结构说明书

本文档详细记录了 DPD 插件目前的本地解析逻辑、页面分流规则以及对应的网页 DOM 结构说明。

## 1. 核心分流逻辑 (Routing Rules)

根据包裹重量，插件会自动判断并跳转至不同的填单页面：

| 包裹重量 | 目标页面 URL | 页面功能描述 |
| :--- | :--- | :--- |
| **≤ 20kg** | `retoure-beauftragen.aspx` | **退货页面**：处理小件退货单 |
| **> 20kg** | `auftrag-starten.aspx` | **发货页面**：处理大包裹或标准发货单 |

---

## 2. 数据解析规则 (CSV Parsing)

插件严格按照 `样本.csv` 的列顺序进行数据提取（索引从 0 开始）：

*   **[0 - 5 列] 发件人信息 (Sender)**：包括姓名、电话、国家、城市、地址、邮编。
*   **[6 - 13 列] 收件人信息 (Recipient)**：包括姓名、公司、电话、国家、城市、地址、地址二、邮编。
*   **[14 - 15 列] 参考号 (Reference)**：订单号 + SKU。
*   **[16 列] 重量 (Weight)**：数值单位为 kg。

---

## 3. 填单填充规则 (Filling Rules)

### A. 退货页面 (Return Page: ≤ 20kg)
*   **发件人 (Absender)**：填入 CSV 中的 **[发件人信息]**。
*   **收件人 (Recipient)**：**不触碰**。使用 DPD 网页默认带出的仓库地址（如 EXPO Service GmbH）。
*   **其他**：填写重量和参考号。

### B. 发货页面 (Shipment Page: > 20kg)
*   **发件人 (LabelAddress)**：填入 CSV 中的 **[发件人信息]**。
*   **收件人 (ShipAddress)**：填入 CSV 中的 **[收件人信息]**。
*   **国家选择器**：`selLabelAddress_Country` / `CPLContentLarge_selShipAddress_Country`。
*   **地址补充 (Adresszusatz)**：`txtXxx_AdditionalInfo`，映射自 CSV 地址二。
*   **其他**：填写重量（长 ID）和参考号（长 ID）。

---

## 4. DOM 文件夹内容说明 (@/DOM)

该文件夹内存放了 DPD 网页的离线源码，是插件准确定位格子的“地图”：

1.  **`myDPD - Aufträge manuell erfassen.html`**
    *   **用途**：用于分析 **发货页面 (>20kg)** 的结构。
    *   **关键发现**：发件人前缀为 `LabelAddress`，收件人前缀为 `ShipAddress`。重量 ID 包含 `Parcel_1`。

2.  **`myDPD - Retoure beauftragen.html`**
    *   **用途**：用于分析 **退货页面 (≤20kg)** 的结构。
    *   **关键发现**：发件人前缀为 `Absender`（或直接使用 naked IDs 如 `txtFirstName`）。

---

## 5. 特殊处理逻辑 (Special Logic)

*   **姓名拆分**：自动将 `Jochen Manhart` 拆分为 `Jochen` (Vorname) 和 `Manhart` (Nachname)。
*   **地址拆分**：自动将 `Marienburgstraße 14` 拆分为 `Marienburgstraße` (Straße) 和 `14` (Hausnr.)。
*   **称呼逻辑**：
    *   如果 CSV 中有公司名，勾选 **“Firma”**。
    *   如果没有公司名，默认勾选 **“keine Anrede”**。
*   **填入技术**：
    *   使用 `setNativeValue` 穿透网页监听。
    *   使用 `.click()` 强制触发单选框的 Postback 逻辑。
    *   模糊匹配采用 `[区域前缀] + [字段关键字]` 双重锁定，防止错位。
*   **数据流关键点**：
    *   `prepareShipment` 保留 `sender`/`recipient` 嵌套结构（不扁平化）。
    *   每个地址通过 `prepareAddress` 独立标准化（姓名拆分、街道拆分、国家标准化）。
    *   `fillAddressBlock` 统一处理所有地址区块（含国家 select 和 AdditionalInfo）。

---
**版本：** v1.0.22  
**状态：** 已修复 prepareShipment 数据流断裂、新增国家选择器和地址补充字段支持。
