import { chromium } from 'playwright-extra';
import { Browser, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { createRequire } from 'module';

// 按照 AGENTS.md 规范，使用 createRequire 引入陈旧的 CJS 插件，确保 ESM 兼容性
const require = createRequire(import.meta.url);
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

export interface AutomationResult {
  success: boolean;
  trackingNumber?: string;
  error?: string;
}

export class DPDAutomation {
  private browser?: Browser;
  private sessionDir: string;

  constructor() {
    this.sessionDir = path.join(process.cwd(), 'playwright', 'sessions');
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }

  async init() {
    this.browser = await chromium.launch({
      headless: true, // 设置为 false 可进行调试
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async login(accountId: string, username: string, password: string): Promise<{ context: BrowserContext; page: Page }> {
    if (!this.browser) await this.init();
    
    const storagePath = path.join(this.sessionDir, `${accountId}.json`);
    const context = await this.browser!.newContext({
      storageState: fs.existsSync(storagePath) ? storagePath : undefined,
      viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();
    
    // 访问登录页
    await page.goto('https://mydpd.dpd.de/login', { waitUntil: 'networkidle' });

    // 处理 Cookie 弹窗 (如果存在)
    const cookieBtn = page.locator('#onetrust-accept-btn-handler');
    if (await cookieBtn.isVisible()) {
      await cookieBtn.click();
    }

    // 检查是否已经登录
    if (await page.url().includes('/dashboard') || await page.url().includes('/home')) {
      return { context, page };
    }

    // 填写登录信息
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // 等待登录成功跳转
    await page.waitForURL(/dashboard|home/, { timeout: 30000 });

    // 保存 Session
    await context.storageState({ path: storagePath });

    return { context, page };
  }

  async createShipment(page: Page, order: any): Promise<AutomationResult> {
    try {
      // 1. 进入下单页面
      await page.goto('https://mydpd.dpd.de/shipment/create', { waitUntil: 'networkidle' });

      // 2. 填写收件人信息 (Recipient)
      // 注意：具体的 Selector 需要根据 DPD 官网实际 DOM 确定，此处为示意
      await page.fill('#recipient_name', order.recipientName);
      await page.fill('#recipient_street', order.recipientAddress);
      await page.fill('#recipient_zip', order.recipientZip);
      await page.fill('#recipient_city', order.recipientCity);
      await page.selectOption('#recipient_country', order.recipientCountry);

      // 3. 填写包裹信息
      await page.fill('#parcel_weight', order.weight.toString());

      // 4. 点击下单按钮
      await page.click('#submit_shipment');

      // 5. 等待单号生成并提取
      // DPD 通常在成功页面显示单号，或者提供 PDF 下载
      const trackingLocator = page.locator('.tracking-number-value');
      await trackingLocator.waitFor({ state: 'visible', timeout: 60000 });
      const trackingNumber = await trackingLocator.innerText();

      return { success: true, trackingNumber };

    } catch (err: any) {
      // 截图保存以供调试
      const screenshotPath = path.join(process.cwd(), 'playwright', 'screenshots', `${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath });
      return { success: false, error: err.message };
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
