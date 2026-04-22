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

## 极限静态检查规范 (Strict Static Checking Standards)

为了杜绝“代码能看但不能跑”或“IDE 满屏报错”的情况，所有 Agent 必须遵守以下流程：

1. **强制全量编译**：任何涉及逻辑、类型、API 路由或数据库模型的修改，**必须**运行 `npm run build` 进行验证。仅运行 `tsc` 是不够的，必须通过 Next.js 的生产环境构建检查。
2. **零红线标准**：严禁提交在 IDE 中会报红的代码。如果由于 Prisma 类型更新滞后等外部因素导致 IDE 报错，必须使用显式的类型守卫或防御性类型断言（如必要时使用 `(obj as any)`）来消除错误，直到环境同步。
3. **数据库同步优先级**：修改 `schema.prisma` 后，必须按顺序执行：
   - `npx prisma db push` (同步数据库)
   - `npx prisma generate` (生成类型文件)
   - 验证生成的类型是否已在 `node_modules` 中生效。
4. **日志与链路审计**：所有新开发的接口必须包含全链路日志（Receive -> Process/AI -> Response -> Error），并确保日志输出中不包含明文密钥等敏感信息。
5. **Lint 强制对齐**：必须保持 `eslint.config.mjs` 有效。严禁为了绕过报错而置空 Lint 配置，必须针对冲突项进行精准屏蔽或修复。
