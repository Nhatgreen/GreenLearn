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
}

console.log('✨ Build thành công! Thư mục out/ đã sẵn sàng để deploy lên GitHub Pages.');
