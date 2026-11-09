import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import ts from 'typescript';

interface ExtractedSymbol {
  name: string;
  kind: 'component' | 'hook' | 'fn' | 'store' | 'context' | 'type' | 'route' | 'const';
  file: string; // relative to repo root
  startLine: number;
  endLine: number;
  lineCount: number;
}

function getCommitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'uncommitted';
  }
}

function walkDir(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walkDir(fullPath, fileList);
      }
    } else if (/\.(ts|tsx)$/.test(file) && !file.endsWith('.d.ts')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function classifySymbol(name: string, node: ts.Node, filePath: string): ExtractedSymbol['kind'] {
  if (filePath.includes('/api/') || filePath.includes('\\api\\')) {
    if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(name)) return 'route';
  }
  if (filePath.includes('/context/') || filePath.includes('\\context\\')) {
    if (name.endsWith('Provider')) return 'context';
    if (name.startsWith('use')) return 'hook';
  }
  if (name.startsWith('use') && name.length > 3 && name[3] === name[3].toUpperCase()) {
    return 'hook';
  }
  if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node)) {
    return 'type';
  }
  if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    if (/^[A-Z]/.test(name)) return 'component';
    return 'fn';
  }
  if (ts.isVariableDeclaration(node)) {
    if (/^[A-Z]/.test(name)) {
      // Could be a React Component
      return 'component';
    }
    return 'const';
  }
  return 'const';
}

function extractSymbolsFromFile(filePath: string, repoRoot: string): ExtractedSymbol[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relPath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

  const symbols: ExtractedSymbol[] = [];

  function visit(node: ts.Node) {
    const isExported = (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0;

    if (ts.isFunctionDeclaration(node) && node.name && isExported) {
      const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
      symbols.push({
        name: node.name.text,
        kind: classifySymbol(node.name.text, node, relPath),
        file: relPath,
        startLine: startLine + 1,
        endLine: endLine + 1,
        lineCount: endLine - startLine + 1
      });
    } else if (ts.isVariableStatement(node) && isExported) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) {
          const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(decl.getStart());
          const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(decl.getEnd());
          symbols.push({
            name: decl.name.text,
            kind: classifySymbol(decl.name.text, decl, relPath),
            file: relPath,
            startLine: startLine + 1,
            endLine: endLine + 1,
            lineCount: endLine - startLine + 1
          });
        }
      }
    } else if ((ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node)) && isExported) {
      const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
      symbols.push({
        name: node.name.text,
        kind: 'type',
        file: relPath,
        startLine: startLine + 1,
        endLine: endLine + 1,
        lineCount: endLine - startLine + 1
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return symbols;
}

export function generateDocsIndex(isCheckMode = false) {
  const repoRoot = process.cwd();
  const commitHash = getCommitHash();
  const isoDate = new Date().toISOString().split('T')[0];

  const srcDir = path.join(repoRoot, 'src');
  const allFiles = walkDir(srcDir);

  const allSymbols: ExtractedSymbol[] = [];
  for (const f of allFiles) {
    allSymbols.push(...extractSymbolsFromFile(f, repoRoot));
  }

  const symbolIndexPath = path.join(repoRoot, 'docs', 'ai', '03_SYMBOL_INDEX.md');

  // Read existing manual descriptions if file exists
  const manualRoles = new Map<string, string>();
  if (fs.existsSync(symbolIndexPath)) {
    const existingContent = fs.readFileSync(symbolIndexPath, 'utf-8');
    const lines = existingContent.split('\n');
    for (const l of lines) {
      const match = l.match(/^\|\s*`([^`]+)`\s*\|\s*([^|]+)\|\s*\[([^\]]+)\]\([^)]+\)\s*\|\s*(.*)\|$/);
      if (match) {
        const symName = match[1].trim();
        const role = match[4].trim();
        if (role && !role.includes('Tự động tạo') && role !== '-') {
          manualRoles.set(symName, role);
        }
      }
    }

    if (isCheckMode) {
      // Stale detection
      const currentSymSet = new Set(allSymbols.map(s => s.name));
      const staleSymbols: string[] = [];
      for (const sym of manualRoles.keys()) {
        if (!currentSymSet.has(sym)) {
          staleSymbols.push(sym);
        }
      }
      if (staleSymbols.length > 0) {
        console.error(`[STALE DETECTION] Các ký hiệu trong tài liệu không còn tồn tại trong mã nguồn:`, staleSymbols);
        process.exit(1);
      }
      console.log(`[CHECK OK] Mọi ký hiệu đều hợp lệ.`);
      return;
    }
  }

  // Pre-defined role lookup for key architectural symbols
  const defaultRoles: Record<string, string> = {
    'BookSpread': 'Mô phỏng cuốn sách mở 2.5D, phân trang động DOM, bìa cứng, gờ gáy và popover Inteline',
    'PaperSheet': 'Mô phỏng tờ giấy A4/ghi chép đơn lẻ 2.5D với độ xoay tự do và texture giấy',
    'StickyNoteItem': 'Giấy ghi chú dán bàn học (Patrick Hand font, NFC normalized, xoay 360°)',
    'InfiniteDesk': 'Mặt bàn vô cực 2.5D: quản lý pan, zoom, phím tắt Alt+Drag, bắt sự kiện click',
    'DeskDrawingCanvas': 'Canvas vẽ nét bút dạ quang và bút vẽ tự do với chế độ multiply blend',
    'DeskDrawingInteractionLayer': 'Lớp đón bắt sự kiện kéo vẽ mượt mà, phân định vẽ nét vs di chuyển bàn',
    'DeskGrid': 'Lưới caro toạ độ bàn học trắng tinh khiết chống mỏi mắt',
    'Minimap': 'Bản đồ radar thu nhỏ góc nhìn toàn cảnh không gian bàn học 2.5D',
    'StudySpaceDeskView': 'Component trung tâm tích hợp toàn bộ Canvas bàn học, HUD 4 góc và modal',
    'VisualLinkThreads': 'Vẽ các đường dây nối SVG trực quan từ đoạn trích sách sang giấy note Inteline',
    'TopLeftNav': 'HUD góc trên-trái: chuyển đổi bàn học, tìm kiếm tài liệu, đồng bộ góc nhìn',
    'TopRightWallet': 'HUD góc trên-phải: hiển thị số dư ViToken, chuỗi điểm danh streak, chọn model AI',
    'BottomLeftKnowledge': 'HUD góc dưới-trái: nút tải tài liệu và mở chợ chia sẻ tri thức KnowInherit 85/15',
    'BottomRightToolkit': 'HUD góc dưới-phải: công cụ bút dạ quang, tạo note, khoá góc nhìn, zoom 100%',
    'MultiplayerBar': 'HUD cộng tác học nhóm thời gian thực: danh sách avatar, thả cảm xúc emoji',
    'VrFrameOverlay': 'Khung viền 4 góc và nhãn chế độ "Không gian học 2.5D" phong cách VR HUD',
    'IntelineModal': 'Hộp thoại AI hỏi đáp ngữ cảnh sâu Inteline theo từng dòng/trang tài liệu',
    'KnowInheritPublishModal': 'Hộp thoại chia sẻ tài liệu lên chợ tri thức: AI thẩm định điểm và tính giá',
    'StudyToolsModal': 'Bộ công cụ ôn tập toàn diện STudy: TextRank, Cloze Quiz, Flashcard, Roadmap',
    'MobileCompanionView': 'Giao diện di động rút gọn đồng bộ tài liệu từ máy tính',
    'useStudySpace': 'Hook truy cập trạng thái không gian bàn học, camera, danh sách tài liệu',
    'StudySpaceProvider': 'Provider quản lý toàn bộ state bàn học, tài liệu, toạ độ, nét vẽ, zIndex',
    'useViToken': 'Hook quản lý ví ViToken, chi tiêu token, điểm danh streak và cấu hình AI',
    'ViTokenProvider': 'Provider lưu trữ và đồng bộ ví ViToken, lịch sử giao dịch vào localStorage',
    'POST': 'Cổng xử lý AI Gateway đa chế độ: ChatGPT Codex, Gemini BYOK, OpenAI System',
    'paginateDocument': 'Động cơ phân trang chính xác theo chiều cao trang, chống cắt cụt công thức',
    'summarizeWithTextRank': 'Thuật toán TextRank & TF-IDF trích xuất tóm tắt nội dung không cần AI',
    'generateClozeQuestions': 'Thuật toán Cloze Deletion tự động đục lỗ từ khoá tạo bài tập trắc nghiệm',
    'generateFlashcardsFromRules': 'Quy tắc bóc tách câu định nghĩa thành bộ thẻ nhớ Flashcard ôn tập',
    'extractOutlineAndRoadmap': 'Thuật toán trích xuất tiêu đề dựng lộ trình học tương tác theo thời gian'
  };

  // Group symbols by module
  const groups: Record<string, ExtractedSymbol[]> = {
    'Canvas & 2.5D Desk': [],
    'Objects (Sách, Giấy, Note)': [],
    'HUD & Overlays': [],
    'Modals & Workflows': [],
    'Context & State': [],
    'Non-AI Engine & Utils': [],
    'API Routes & Backend': [],
    'Types & Data': []
  };

  for (const sym of allSymbols) {
    if (sym.file.includes('components/canvas')) groups['Canvas & 2.5D Desk'].push(sym);
    else if (sym.file.includes('components/objects')) groups['Objects (Sách, Giấy, Note)'].push(sym);
    else if (sym.file.includes('components/hud')) groups['HUD & Overlays'].push(sym);
    else if (sym.file.includes('components/modals') || sym.file.includes('mobile')) groups['Modals & Workflows'].push(sym);
    else if (sym.file.includes('context')) groups['Context & State'].push(sym);
    else if (sym.file.includes('lib') || sym.file.includes('utils')) groups['Non-AI Engine & Utils'].push(sym);
    else if (sym.file.includes('api')) groups['API Routes & Backend'].push(sym);
    else groups['Types & Data'].push(sym);
  }

  let output = `# 03_SYMBOL_INDEX.md — Chỉ Mục Toàn Bộ Ký Hiệu Codebase ViTudy\n\n`;
  output += `> **Commit Hash:** \`${commitHash}\`  \n`;
  output += `> **Cập nhật lần cuối:** \`${isoDate}\`  \n`;
  output += `> **Quy ước:** Symbol | Kind | File:Lines (Symbol) | Vai trò chức năng\n\n`;
  output += `<!-- manual:start -->\n`;
  output += `Tài liệu này được đồng bộ tự động qua \`npm run docs:index\` và kiểm tra bởi \`npm run docs:check\`.\n`;
  output += `<!-- manual:end -->\n\n`;

  for (const [groupName, syms] of Object.entries(groups)) {
    if (syms.length === 0) continue;
    output += `### ${groupName}\n\n`;
    output += `| Ký hiệu (Symbol) | Loại (Kind) | Vị trí (File:Lines) | Vai trò chức năng |\n`;
    output += `|---|---|---|---|\n`;

    // Sort alphabetically by symbol name
    syms.sort((a, b) => a.name.localeCompare(b.name));

    for (const s of syms) {
      const role = manualRoles.get(s.name) || defaultRoles[s.name] || 'Thành phần nghiệp vụ của phân hệ ' + groupName;
      output += `| \`${s.name}\` | \`${s.kind}\` | [${s.file}:L${s.startLine}-L${s.endLine}](file:///${path.resolve(s.file).replace(/\\/g, '/')}) | ${role} |\n`;
    }
    output += `\n`;
  }

  fs.mkdirSync(path.dirname(symbolIndexPath), { recursive: true });
  fs.writeFileSync(symbolIndexPath, output, 'utf-8');
  console.log(`[DOCS INDEX] Đã tạo thành công ${symbolIndexPath} (${allSymbols.length} symbols)`);
}

if (process.argv[1] && process.argv[1].includes('gen-docs-index')) {
  const isCheck = process.argv.includes('--check');
  generateDocsIndex(isCheck);
}
