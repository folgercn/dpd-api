const dpdService = require('./src/services/dpdService');
const addressParser = require('./src/services/addressParser');

/**
 * 单条数据测试脚本
 */
async function testOne() {
  console.log('--- Starting Single Order Test ---');
  
  // 模拟从 Excel 读取的一条数据
  const rawData = {
    '重量（KG）': 11.7,
    '退货人信息': "Frau Iskra Miteva\r\nGrützmacherstr. 26\r\nWeyhe\r\nNiedersachsen\r\nGemany\r\n28844\r\n015736066844",
    '发件人信息': "公司名称：EXPO Service GmbH\r\n收货人： Hua Zhang+YG-RE\r\n收货地址：Darmstädter Str. 117, \r\n城市：Pfungstadt  \r\n省州：Hessen\r\n邮编： 64319\r\n国家：Germany\r\n收货电话：+49 (0)15257038155"
  };

  try {
    const sender = addressParser.parseSender(rawData['退货人信息']);
    const recipient = addressParser.parseRecipient(rawData['发件人信息']);
    const weight = rawData['重量（KG）'];

    console.log('Parsed Sender:', JSON.stringify(sender, null, 2));
    console.log('Parsed Recipient:', JSON.stringify(recipient, null, 2));

    const res = await dpdService.storeOrders({
      sender,
      recipient,
      weight
    });

    if (res.success) {
      console.log('--- SUCCESS! ---');
      console.log('Parcel Number:', res.parcelNumber);
    } else {
      console.error('--- FAILED ---');
      console.error('Error:', res.error);
      if (res.raw) {
        console.log('Full Response:', JSON.stringify(res.raw, null, 2));
      }
    }
  } catch (err) {
    console.error('Unexpected Error:', err);
  }
}

testOne();
