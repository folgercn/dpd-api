<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 模块引入规范 (Module Import Standards)

为了确保在 Next.js 15+ 的全 ESM 环境中代码的稳定性和可维护性，必须遵守以下引入原则：

1. **原生 ESM 优先**：所有内部代码和现代库必须使用 `import` 语句。禁止在 TypeScript 文件中直接使用全局 `require`。
2. **CJS 兼容性处理**：
   - 对于只提供 CommonJS 导出且在 ESM 下解析异常（如报错 `utils.typeOf is not a function`）的陈旧插件，**必须**使用 Node.js 的 `createRequire` 来桥接。
   - **严禁**直接混用 `import` 和全局 `require` 引入同一个功能链上的不同模块。
3. **实现模板**：
   ```typescript
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
   
   // 正确桥接 CJS 插件
   const legacyPlugin = require('legacy-plugin-name')();
   ```
4. **包转译配置**：对于这类需要特殊处理的旧包，必须在 `next.config.ts` 的 `transpilePackages` 中进行注册。
