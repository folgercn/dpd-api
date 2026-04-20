/**
 * 地址解析工具类
 * 专门解析 Excel 中的多行地址信息
 */
class AddressParser {
  /**
   * 解析“退货人信息”（通常作为发件人）
   * 格式: Name \n Street No \n City \n State \n Country \n ZIP \n Phone
   */
  parseSender(raw) {
    if (!raw) return null;
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    
    // 基础映射 (根据观察到的 Excel 结构)
    const data = {
      name: lines[0] || '',
      streetWithNo: lines[1] || '',
      city: lines[2] || '',
      state: lines[3] || '',
      country: this.countryToCode(lines[4] || 'Germany'),
      zipCode: lines[5] || '',
      phone: lines[6] || ''
    };

    const { street, houseNo } = this.splitStreetAndNo(data.streetWithNo);
    return { ...data, street, houseNo };
  }

  /**
   * 解析“发件人信息”（实际为收件人）
   * 格式: 公司名称：xxx \n 收货人：xxx \n 收货地址：xxx \n ...
   */
  parseRecipient(raw) {
    if (!raw) return null;
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    const map = {};
    
    lines.forEach(line => {
      const parts = line.split(/[：:]/);
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('：').trim();
        map[key] = val;
      }
    });

    const data = {
      company: map['公司名称'] || '',
      name: map['收货人'] || '',
      streetWithNo: map['收货地址'] || '',
      city: map['城市'] || '',
      state: map['省州'] || '',
      zipCode: map['邮编'] || '',
      country: this.countryToCode(map['国家'] || 'Germany'),
      phone: map['收货电话'] || ''
    };

    const { street, houseNo } = this.splitStreetAndNo(data.streetWithNo);
    return { ...data, street, houseNo };
  }

  /**
   * 尝试拆分街道和门牌号
   * 例如 "Darmstädter Str. 117" -> { street: "Darmstädter Str.", houseNo: "117" }
   */
  splitStreetAndNo(input) {
    if (!input) return { street: '', houseNo: '' };
    // 去掉结尾的逗号
    const cleanInput = input.replace(/,$/, '').trim();
    // 匹配末尾的数字或数字+字母 (如 117a)
    const match = cleanInput.match(/^(.*?)\s+(\d+[a-zA-Z-\/]*)$/);
    
    if (match) {
      return {
        street: match[1].trim(),
        houseNo: match[2].trim()
      };
    }
    
    // 如果无法拆分，全部放入 street
    return { street: cleanInput, houseNo: '' };
  }

  /**
   * 国家名称转代码
   */
  countryToCode(country) {
    const c = country.toLowerCase();
    if (c.includes('germany') || c.includes('deutschland') || c.includes('gemany')) return 'DE';
    if (c.includes('united kingdom') || c.includes('gb')) return 'GB';
    if (c.includes('france')) return 'FR';
    return 'DE'; // 默认德国
  }
}

module.exports = new AddressParser();
