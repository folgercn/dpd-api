# Chrome 扩展调试与字段定位指南

本文档只讲一件事：当 DPD 页面字段又变了，或者扩展“看起来填了但页面没动”时，应该怎么排查，怎么重新找到正确的输入框。

配套文档：
- 字段映射固化表：[docs/extension-field-mapping.md](/Users/fujun/node/dpd_api/docs/extension-field-mapping.md)

适用代码：
- 扩展弹窗：[src/extension/popup.js](/Users/fujun/node/dpd_api/src/extension/popup.js)
- 页面填充：[src/extension/content.js](/Users/fujun/node/dpd_api/src/extension/content.js)

## 1. 先理解当前行为

当前扩展的调试日志策略是：

- 默认不往控制台 `console.log` 大量刷屏
- 关键调试日志会写进页面的 `sessionStorage`
- key 固定为：

```text
__DPD_EXT_DEBUG_LOGS__
```

也就是说：

- 就算 DPD 页面自动刷新
- 只要还是同一个标签页会话
- 上一轮关键日志通常还在

## 2. 怎么打开控制台

在 DPD 页面里：

1. 打开目标页面
   - 发货页：`https://business.dpd.de/auftragsstart/auftrag-starten.aspx`
   - 退货页：`https://business.dpd.de/retouren/retoure-beauftragen.aspx`
2. 按 `F12`
3. 或者按：
   - macOS: `Option + Command + I`
   - Windows: `Ctrl + Shift + I`
4. 切到 `Console`

如果你要看元素结构，也可以切到 `Elements`。

## 3. 怎么拿扩展调试日志

先在扩展里点一次：

- `解析预览`
- `填入当前页`

如果页面没反应，或者自动刷新了，再到控制台执行：

```js
JSON.parse(sessionStorage.getItem('__DPD_EXT_DEBUG_LOGS__') || '[]')
```

如果要直接复制出来发给别人：

```js
copy(sessionStorage.getItem('__DPD_EXT_DEBUG_LOGS__') || '[]')
```

日志重点看这些项：

- `received fill request`
- `normalized shipment`
- `fillStartOrderPage`
- `fillReturnPage`
- `fillAddressBlock`
- `filling field`
- `select filled`
- `select option not found`
- `field not found`
- `fill result`
- `beforeunload`
- `form.submit called`
- `__doPostBack called`
- `submit event fired`

## 4. 怎么判断是“数据错了”还是“DOM 找错了”

先看日志里的：

- `rawShipment`
- `normalized shipment`

如果这里字段已经错位，比如：

- `email` 里是手机号
- `country` 里是邮箱
- `city` 里是国家

那问题在后端预处理或配置解析，不在页面 DOM。

如果这里数据是对的，但页面没填进去，再看：

- `field not found`
- `select option not found`

这类通常才是页面字段定位问题。

## 5. 怎么抓当前页面真实输入框

`content.js` 里已经有一个辅助方法：

- `logVisibleFormControls(scope)`

它会把当前页面所有可见的：

- `input`
- `textarea`
- `select`

记录到调试日志里。

每个控件会带这些信息：

- `id`
- `name`
- `type`
- `placeholder`
- `ariaLabel`
- `title`
- `value`
- `containerText`

拿法：

1. 在目标页面点一次 `填入当前页`
2. 再执行：

```js
JSON.parse(sessionStorage.getItem('__DPD_EXT_DEBUG_LOGS__') || '[]')
```

3. 找 `message = "visible form controls"`

这条日志就是最重要的“真实控件清单”。

## 6. 怎么找到正确的填写框

不要先猜 `id`，按这个顺序来：

1. 先确定页面区块
   - 发货页：
     - `Absender`
     - `Empfänger`
   - 退货页：
     - `Absender`
2. 再从 `visible form controls` 里找对应字段文案
   - `containerText`
   - `placeholder`
   - `name`
   - `id`
3. 最后才决定写死哪个字段

推荐优先级：

1. 稳定语义特征
   - `name`
   - `placeholder`
   - `containerText`
2. 明确区块范围
   - `LabelAddress`
   - `ShipAddress`
   - 退货页地址区块
3. 最后再用 `id`

原因是：

- 页面 `id` 以后可能改
- 但字段文案、区块结构、名称模式通常更稳定

## 7. 当前最常用的发货页字段

发货页真实字段一般能在日志里看到这类 ID：

- `txtLabelAddress_FirstName`
- `txtLabelAddress_LastName`
- `txtLabelAddress_ZipCode`
- `txtLabelAddress_City`
- `txtLabelAddress_Street`
- `txtLabelAddress_HouseNo`
- `txtLabelAddress_Mail`
- `txtLabelAddress_Phone`
- `selLabelAddress_Country`

仓库区通常是：

- `txtShipAddress_FirstName`
- `txtShipAddress_LastName`
- `txtShipAddress_ZipCode`
- `txtShipAddress_City`
- `txtShipAddress_Street`
- `txtShipAddress_HouseNo`
- `txtShipAddress_Mail`
- `txtShipAddress_Phone`
- `CPLContentLarge_selShipAddress_Country`

公共运单字段通常是：

- `CPLContentLarge_txtOrderData_ParcelCounter`
- `txtWeight_Parcel_1`
- `txtOrderData_OrderReferenceList_OrderReference1`

## 8. 当前最常用的退货页字段

退货页当前常见字段一般是：

- `txtFirstName`
- `txtLastName`
- `txtZipCode_WithAddress`
- `txtCity`
- `txtStreet`
- `txtHouseNo`
- `txtMail_WithAddress`
- `txtPhone`
- `CPLContentLarge_selCountry_WithAddress`
- `txtWeight_Parcel1`
- `txtOrderReference1`

如果 DPD 改版，优先重新抓一次 `visible form controls`，不要直接猜。

## 9. 怎么排查自动刷新

如果点完“填入当前页”页面自己刷新，先不要猜扩展跳页。

当前代码已经会记录：

- `beforeunload`
- `form.submit called`
- `__doPostBack called`
- `submit event fired`

这说明它更可能是页面自己触发了提交或回发。

排查顺序：

1. 看 `beforeunload` 是否出现
2. 看是不是紧跟着：
   - `form.submit called`
   - `__doPostBack called`
3. 再回看上一条刚操作的是哪个字段：
   - 常见高风险字段是 `select`
   - 特别是国家下拉

## 10. 维护建议

以后只要碰字段映射，建议固定按这个顺序做：

1. 先复现问题
2. 取 `sessionStorage` 日志
3. 确认 `rawShipment` / `normalized shipment` 是否正确
4. 抓 `visible form controls`
5. 对照区块和真实字段
6. 再改 `content.js`
7. 同步更新：
   - [docs/extension-field-mapping.md](/Users/fujun/node/dpd_api/docs/extension-field-mapping.md)
   - 本文档

这样下次再改，就不会又从头猜一遍。
