const soap = require('soap');
const NodeCache = require('node-cache');
require('dotenv').config();

// 初始化缓存，默认 24 小时过期
const tokenCache = new NodeCache({ stdTTL: process.env.TOKEN_CACHE_TTL || 86400 });

/**
 * DPD API 服务类
 * 封装 LoginService 和 ShipmentService
 */
class DPDService {
  constructor() {
    this.delisId = process.env.DPD_DELIS_ID;
    this.password = process.env.DPD_PASSWORD;
    this.messageLanguage = process.env.DPD_MESSAGE_LANGUAGE || 'en_US';
    this.loginWsdl = process.env.DPD_LOGIN_WSDL;
    this.shipmentWsdl = process.env.DPD_SHIPMENT_WSDL;
    
    // SOAP 客户端配置
    this.soapOptions = {
      // 针对沙盒环境和 TLS 握手问题的兼容性配置
      https: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
      },
      // 强制使用某些特定的请求头，如果需要的话
      forceSoap12Headers: false,
    };
  }

  /**
   * 获取 DPD 身份验证 Token
   * 优先从缓存读取，失效后调用 LoginService 获取
   * @returns {Promise<string>} Auth Token
   */
  async getAuthToken() {
    const cacheKey = `dpd_token_${this.delisId}`;
    const cachedToken = tokenCache.get(cacheKey);

    if (cachedToken) {
      console.log('Using cached DPD token.');
      return cachedToken;
    }

    console.log('Requesting new DPD authentication token...');
    try {
      const client = await soap.createClientAsync(this.loginWsdl, this.soapOptions);
      const args = {
        delisId: this.delisId,
        password: this.password,
        messageLanguage: this.messageLanguage
      };

      // 调用 getAuth 方法
      // 注意：根据 WSDL 可能需要处理命名空间或参数结构
      const [result] = await client.getAuthAsync(args);
      
      if (result && result.return && result.return.authToken) {
        const token = result.return.authToken;
        tokenCache.set(cacheKey, token);
        console.log('Login successful, token cached.');
        return token;
      } else {
        throw new Error('Login failed: Token not found in response.');
      }
    } catch (error) {
      console.error('DPD Login Error:', error.message);
      throw error;
    }
  }

  /**
   * 提交货运订单
   * @param {Object} orderData 包含 sender, recipient, parcels 等信息
   * @returns {Promise<Object>} 下单结果，包含 parcelNumber
   */
  async storeOrders(orderData) {
    const authToken = await this.getAuthToken();
    
    try {
      const client = await soap.createClientAsync(this.shipmentWsdl, this.soapOptions);
      
      // 设置 SOAP Header
      const header = {
        'ns:authentication': {
            'delisId': this.delisId,
            'authToken': authToken,
            'messageLanguage': this.messageLanguage
        }
      };
      client.addSoapHeader(header, 'authentication', 'ns', 'http://dpd.com/common/service/types/Authentication/2.0');

      // 构建请求体 (根据 ShipmentServiceV45 标准)
      const params = {
        printOptions: {
          printOption: [
            {
              outputFormat: 'PDF',
              paperFormat: 'A6'
            }
          ]
        },
        order: {
          generalShipmentData: {
            identificationNumber: `ID_${Date.now()}`,
            sendingDepot: '0166', // 默认网点
            product: 'CL',
            sender: {
              name1: orderData.sender.name,
              street: orderData.sender.street,
              houseNo: orderData.sender.houseNo || '.',
              country: orderData.sender.country,
              zipCode: orderData.sender.zipCode,
              city: orderData.sender.city,
              phone: orderData.sender.phone
            },
            recipient: {
              name1: orderData.recipient.name,
              name2: orderData.recipient.company || '',
              street: orderData.recipient.street,
              houseNo: orderData.recipient.houseNo || '.',
              country: orderData.recipient.country,
              zipCode: orderData.recipient.zipCode,
              city: orderData.recipient.city,
              phone: orderData.recipient.phone
            },
            softwareVersion: 'Antigravity_DPD_v1.0'
          },
          parcels: [
            {
              weight: Math.round(parseFloat(orderData.weight) * 100) || 100 
            }
          ],
          productAndServiceData: {
            orderType: 'consignment'
          }
        }
      };

      console.log(`Sending storeOrders for: ${orderData.recipient.name}`);
      const [result] = await client.storeOrdersAsync(params);
      
      // 提取结果中的单号
      // 成功响应结构: result.shipmentResponses[0].parcelInformation[0].parcelLabelNumber
      const shipment = result && result.shipmentResponses && result.shipmentResponses[0];
      const parcelInfo = shipment && shipment.parcelInformation && shipment.parcelInformation[0];
      
      if (parcelInfo && parcelInfo.parcelLabelNumber) {
        return {
          success: true,
          parcelNumber: parcelInfo.parcelLabelNumber,
          raw: result
        };
      } else {
        return { success: false, error: 'No parcel information returned from DPD.', raw: result };
      }
    } catch (error) {
      console.error('DPD storeOrders Error:', error.message);
      if (error.root) {
        console.error('SOAP Fault Details:', JSON.stringify(error.root, null, 2));
      }
      return { success: false, error: error.message, raw: error.root };
    }
  }
}

module.exports = new DPDService();
