import * as XLSX from 'xlsx';

export interface ParsedOrder {
  customerOrderNo?: string;
  senderName: string;
  senderCompany?: string;
  senderPhone: string;
  senderAddress: string;
  senderCity: string;
  senderZip: string;
  senderCountry: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientZip: string;
  recipientCountry: string;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  productName?: string;
  sku?: string;
  quantity: number;
}

export class ExcelParser {
  static parse(buffer: Buffer): ParsedOrder[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];

    if (data.length === 0) return [];

    const firstRow = data[0];
    
    // 判断格式
    if ('收件人姓名' in firstRow) {
      return this.parseXingmaiFormat(data);
    } else if ('发件人信息' in firstRow || '退货人信息' in firstRow) {
      return this.parseDPDFormat(data);
    }
    
    throw new Error('未识别的 Excel 格式。请确保表头包含“收件人姓名”或“发件人信息”');
  }

  private static parseXingmaiFormat(data: any[]): ParsedOrder[] {
    return data.map(row => ({
      customerOrderNo: row['客户订单号']?.toString(),
      senderName: row['发件人姓名'] || 'EXPO Service GmbH',
      senderCompany: row['发件人公司'],
      senderPhone: row['发件人电话']?.toString() || '',
      senderAddress: row['发件人地址'] || '',
      senderCity: row['发件人城市'] || '',
      senderZip: row['发件人邮编']?.toString() || '',
      senderCountry: row['发件人国家'] || 'DE',
      recipientName: row['收件人姓名'] || '',
      recipientPhone: row['收件人电话']?.toString() || '',
      recipientAddress: row['收件人地址'] || '',
      recipientCity: row['收件人城市'] || '',
      recipientZip: row['收件人邮编']?.toString() || '',
      recipientCountry: row['收件人国家'] || 'DE',
      weight: parseFloat(row['重量(kg)']) || 1.0,
      length: parseFloat(row['长(cm)']),
      width: parseFloat(row['宽(cm)']),
      height: parseFloat(row['高(cm)']),
      productName: row['中文品名1'],
      sku: row['SKU1'],
      quantity: parseInt(row['数量1']) || 1
    }));
  }

  private static parseDPDFormat(data: any[]): ParsedOrder[] {
    // 复用之前的地址解析逻辑思想
    return data.map(row => {
      const sender = this.parseAddressBlock(row['退货人信息'] || '');
      const recipient = this.parseAddressBlock(row['发件人信息'] || ''); // 注意：在此格式中，发件人信息列往往存放的是收件人

      return {
        senderName: sender.name,
        senderPhone: sender.phone,
        senderAddress: sender.street,
        senderCity: sender.city,
        senderZip: sender.zip,
        senderCountry: sender.country || 'DE',
        recipientName: recipient.name,
        recipientPhone: recipient.phone,
        recipientAddress: recipient.street,
        recipientCity: recipient.city,
        recipientZip: recipient.zip,
        recipientCountry: recipient.country || 'DE',
        weight: parseFloat(row['重量（KG）']) || 1.0,
        quantity: parseInt(row['数量']) || 1,
        sku: row['型号']
      };
    });
  }

  private static parseAddressBlock(text: string) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    // 简单解析逻辑（根据 DPD快递出单.xlsx 的观察）
    // 1: Name, 2: Street, 3: City, 4: State, 5: Country, 6: Zip, 7: Phone
    return {
      name: lines[0] || '',
      street: lines[1] || '',
      city: lines[2] || '',
      zip: lines[5] || '',
      country: this.mapCountry(lines[4]),
      phone: lines[6] || ''
    };
  }

  private static mapCountry(c: string): string {
    if (!c) return 'DE';
    const upper = c.toUpperCase();
    if (upper.includes('GERMANY') || upper.includes('DE')) return 'DE';
    if (upper.includes('ITALY') || upper.includes('IT')) return 'IT';
    return upper.slice(0, 2);
  }
}
