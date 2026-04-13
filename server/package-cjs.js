// 构建前脚本：将 ES Module 转换为 CommonJS 用于 pkg 打包
// 在 Windows 上运行: node package-cjs.js

const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'index.js');
const destFile = path.join(__dirname, 'index.cjs');

let content = fs.readFileSync(srcFile, 'utf8');

// 转换 ES module 为 CommonJS
content = content
  // import { xxx } from 'xxx' -> const { xxx } = require('xxx')
  .replace(/import\s+{([^}]+)}\s+from\s+'([^']+)'/g, "const {$1} = require('$2')")
  // import xxx from 'xxx' -> const xxx = require('xxx').default || require('xxx')
  .replace(/import\s+(\w+)\s+from\s+'([^']+)'/g, "const $1 = require('$2')")
  // import * as xxx from 'xxx' -> const xxx = require('xxx')
  .replace(/import\s+\*\s+as\s+(\w+)\s+from\s+'([^']+)'/g, "const $1 = require('$2')")
  // import 'xxx' (side-effect only) -> removed
  .replace(/import\s+'([^']+)'/g, "// import '$1'")
  // export default xxx -> module.exports = xxx
  .replace(/export\s+default\s+/g, 'module.exports = ')
  // export const/function/class -> comment out for now (handled above)
  .replace(/^export\s+/gm, '// export ');

fs.writeFileSync(destFile, content);
console.log('[Build] Generated CommonJS version:', destFile);
