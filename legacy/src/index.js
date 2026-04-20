const dpdService = require('./services/dpdService');

/**
 * 测试脚本：验证 DPD 登录
 */
async function testLogin() {
  console.log('--- Starting DPD API Test ---');
  try {
    const token = await dpdService.getAuthToken();
    console.log('--- Test Success ---');
    console.log('Token Received:', token);
    
    // 尝试二次调用，观察缓存效果
    console.log('--- Testing Cache ---');
    await dpdService.getAuthToken();
    
  } catch (error) {
    console.error('--- Test Failed ---');
    console.error('Error details:', error.message);
  }
}

testLogin();
