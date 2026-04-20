const batchProcessor = require('./src/batchProcessor');
const path = require('path');

// Excel 文件路径
const excelPath = '/Users/fujun/node/dpd_api/DPD快递出单.xlsx';

/**
 * 启动脚本
 */
async function run() {
    try {
        await batchProcessor.process(excelPath);
    } catch (err) {
        console.error('Fatal execution error:', err.message);
    }
}

run();
