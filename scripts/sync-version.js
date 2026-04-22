const fs = require('fs');
const path = require('path');

// 读取 package.json
const pkgPath = path.join(__dirname, '../package.json');
const manifestPath = path.join(__dirname, '../src/extension/manifest.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// 同步版本号
manifest.version = pkg.version;

// 写回 manifest.json
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log(`✅ 已将版本号同步为: ${pkg.version}`);
