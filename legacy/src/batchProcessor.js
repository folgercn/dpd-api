const XLSX = require('xlsx');
const dpdService = require('./services/dpdService');
const addressParser = require('./services/addressParser');
const path = require('path');

/**
 * 批处理类
 * 负责 Excel 读取、数据转换、批量下单及结果回写
 */
class BatchProcessor {
  async process(inputFilePath) {
    console.log(`--- Starting Batch Processing: ${inputFilePath} ---`);
    
    // 1. 读取 Excel
    const workbook = XLSX.readFile(inputFilePath);
    const sheetName = workbook.SheetNames[0];
    const datasheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(datasheet);
    
    console.log(`Found ${rows.length} rows to process.`);
    
    const results = [];

    // 2. 遍历并处理
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        console.log(`\n[Processing Row ${i + 1}/${rows.length}]`);
        
        try {
            // 解析地址
            const sender = addressParser.parseSender(row['退货人信息']);
            const recipient = addressParser.parseRecipient(row['发件人信息']);
            const weight = row['重量（KG）'];

            if (!sender || !recipient) {
                console.error(`Row ${i + 1}: Failed to parse address information.`);
                results.push({ ...row, 下单结果: '失败', 错误信息: '地址解析失败' });
                continue;
            }

            // 调用 DPD 下单
            const res = await dpdService.storeOrders({
                sender,
                recipient,
                weight
            });

            if (res.success) {
                console.log(`Success! Parcel Number: ${res.parcelNumber}`);
                results.push({ 
                    ...row, 
                    快递单号: res.parcelNumber, 
                    下单结果: '成功',
                    处理时间: new Date().toLocaleString()
                });
            } else {
                console.error(`Failed! Error: ${res.error}`);
                results.push({ 
                    ...row, 
                    下单结果: '失败', 
                    错误信息: res.error 
                });
            }
        } catch (err) {
            console.error(`Row ${i + 1}: Unexpected error: ${err.message}`);
            results.push({ ...row, 下单结果: '异常', 错误信息: err.message });
        }
    }

    // 3. 将结果写回新 Excel
    this.saveResults(results, inputFilePath);
  }

  saveResults(results, originalPath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputFileName = `DPD快递出单_处理结果_${timestamp}.xlsx`;
    const outputPath = path.join(path.dirname(originalPath), outputFileName);
    
    console.log(`\n--- Saving results to: ${outputPath} ---`);
    
    const newWb = XLSX.utils.book_new();
    const newWs = XLSX.utils.json_to_sheet(results);
    XLSX.utils.book_append_sheet(newWb, newWs, 'Result');
    XLSX.writeFile(newWb, outputPath);
    
    console.log('Batch processing completed successfully.');
    return outputPath;
  }
}

module.exports = new BatchProcessor();
