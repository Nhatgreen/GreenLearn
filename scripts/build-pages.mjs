import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Đang build GreenLearn cho GitHub Pages (Static Export)...');
process.env.GITHUB_PAGES = 'true';
process.env.NEXT_PUBLIC_BASE_PATH = '/GreenLearn';

execSync('next build', { stdio: 'inherit', env: process.env });

const outDir = path.resolve(process.cwd(), 'out');
const noJekyllPath = path.join(outDir, '.nojekyll');

if (fs.existsSync(outDir)) {
  fs.writeFileSync(noJekyllPath, '');
  console.log('✅ Đã tạo file out/.nojekyll cho GitHub Pages.');

  // Thêm query string ?v=buildVersion vào toàn bộ thẻ CSS và JS trong các file HTML để triệt tiêu cache cũ
  const buildVersion = Date.now().toString(36);
  let htmlCount = 0;

  function addVersionQueryToHtmlFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        addVersionQueryToHtmlFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const updated = content.replace(
          /(\/_next\/static\/(?:css|chunks)\/[^"'>]+?\.(?:css|js))(["'])/g,
          `$1?v=${buildVersion}$2`
        );
        if (updated !== content) {
          fs.writeFileSync(fullPath, updated, 'utf8');
          htmlCount++;
        }
      }
    }
  }

  addVersionQueryToHtmlFiles(outDir);
  console.log(`✅ Đã đóng dấu version query (?v=${buildVersion}) vào ${htmlCount} file HTML để chống cache cũ.`);
}

console.log('✨ Build thành công! Thư mục out/ đã sẵn sàng để deploy lên GitHub Pages.');
