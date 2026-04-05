const fs = require('fs');
const path = require('path');

const shellFile = path.join(__dirname, 'src/components/app-shell-client.tsx');
let shellContent = fs.readFileSync(shellFile, 'utf8');

// 修复 NavItem 的硬编码样式，迁移到新的设计系统规范
shellContent = shellContent.replace(
  /rounded-2xl border px-4 py-3 text-sm font-medium transition duration-200 \${/g,
  'rounded-[18px] border px-4 py-3 text-sm font-medium transition duration-200 ${'
);

shellContent = shellContent.replace(
  /"border-cyan-300\/70 bg-cyan-300 text-slate-950 shadow-\[0_16px_32px_rgba\(6,182,212,0.22\)\]"/g,
  '"border-maika-accent-strong/40 bg-maika-accent-strong text-white shadow-[0_16px_32px_rgba(15,118,110,0.22)]"'
);

shellContent = shellContent.replace(
  /"border-white\/10 bg-white\/6 text-slate-100 hover:border-cyan-300\/35 hover:bg-white\/12 hover:text-white"/g,
  '"border-white/10 bg-white/5 text-white/80 hover:border-maika-accent/30 hover:bg-white/10 hover:text-white"'
);

// 修复 Sidebar 外观
shellContent = shellContent.replace(
  /<aside className="maika-fade-up hidden w-\[288px\] shrink-0 lg:flex">/g,
  '<aside className="maika-fade-up hidden w-[288px] shrink-0 lg:flex translate-z-0">'
);

shellContent = shellContent.replace(
  /className="maika-sidebar-surface flex w-full flex-col overflow-y-auto rounded-\[30px\] border border-white\/10 px-5 py-6 shadow-\[0_28px_80px_rgba\(8,47,73,0.28\)\]"/g,
  'className="maika-sidebar-surface flex w-full flex-col overflow-y-auto rounded-[var(--radius-lg)] border border-white/10 px-5 py-6 shadow-[0_28px_80px_rgba(8,47,73,0.28)] backdrop-blur-xl"'
);

// 修改 Sidebar 中的角色标识符和字体
shellContent = shellContent.replace(
  /text-\[1\.4rem\] font-bold tracking-tight text-white/g,
  'text-[1.4rem] font-bold tracking-tight text-white mono-accent'
);

shellContent = shellContent.replace(
  /<p className="text-xs font-medium text-cyan-200\/80">/g,
  '<p className="eyebrow text-maika-accent mb-1">'
);

// 修复移动端顶部栏
shellContent = shellContent.replace(
  /className="maika-fade-up sticky top-0 z-40 mb-4 flex items-center justify-between rounded-\[26px\] border border-white\/60 bg-white\/70 px-5 py-3 shadow-\[0_20px_60px_rgba\(8,47,73,0.12\)\] backdrop-blur-lg lg:hidden"/g,
  'className="maika-fade-up sticky top-0 z-40 mb-4 flex items-center justify-between rounded-[var(--radius-md)] border border-white/60 bg-white/70 px-5 py-3 shadow-[0_20px_60px_rgba(8,47,73,0.12)] maika-glass lg:hidden translate-z-0"'
);

// 修复内容区域的毛玻璃背景
shellContent = shellContent.replace(
  /className="maika-glass mx-auto flex w-full max-w-\[1200px\] flex-col rounded-\[24px\] lg:rounded-\[30px\]"/g,
  'className="mx-auto flex w-full max-w-[1200px] flex-col rounded-[var(--radius-md)] lg:rounded-[var(--radius-lg)]"'
);

fs.writeFileSync(shellFile, shellContent);
