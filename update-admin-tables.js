const fs = require('fs');
const path = require('path');

// -------------------------------------------------------------
// 1. 重构 settlement-table.tsx
// -------------------------------------------------------------
const settlementFile = path.join(__dirname, 'src/components/admin/settlement-table.tsx');
let settlementContent = fs.readFileSync(settlementFile, 'utf8');

settlementContent = settlementContent.replace(
  'import { EmptyState } from "@/components/empty-state";',
  'import { EmptyState } from "@/components/empty-state";\nimport { BentoCard } from "@/components/ui/bento-card";'
);

settlementContent = settlementContent.replace(
  /<div className="overflow-hidden rounded-\[28px\].*?shadow-\[0_22px_60px_rgba\(8,47,73,0.08\)\]">/s,
  '<BentoCard radius="lg" className="overflow-hidden">'
);

settlementContent = settlementContent.replace(
  /<thead className="bg-slate-50\/90 text-left text-slate-600">/s,
  '<thead className="text-left border-b border-maika-muted/10 text-xs text-maika-muted uppercase tracking-[0.1em]">'
);

settlementContent = settlementContent.replace(
  /className="text-slate-700 transition hover:bg-cyan-50\/50"/g,
  'className="align-middle text-maika-foreground transition hover:bg-maika-foreground/5"'
);

settlementContent = settlementContent.replace(
  /<td className="px-5 py-4 font-medium text-slate-900">/g,
  '<td className="px-5 py-4 font-semibold text-maika-ink mono-accent">'
);

// 将渲染金额的 <td> 包裹上 mono-accent
settlementContent = settlementContent.replace(
  /<td>{formatAmount\(row\.amount\)}<\/td>/g,
  '<td className="mono-accent text-maika-accent-strong">{formatAmount(row.amount)}</td>'
);

// 将包裹 div 收尾替换为 BentoCard 收尾
settlementContent = settlementContent.replace(
  /<\/div>\s*<\/div>\s*\);/g,
  '</div>\n      </BentoCard>\n  );'
);

fs.writeFileSync(settlementFile, settlementContent);


// -------------------------------------------------------------
// 2. 重构 code-inventory-table.tsx
// -------------------------------------------------------------
const inventoryFile = path.join(__dirname, 'src/components/admin/code-inventory-table.tsx');
let inventoryContent = fs.readFileSync(inventoryFile, 'utf8');

inventoryContent = inventoryContent.replace(
  'import { EmptyState } from "@/components/empty-state";',
  'import { EmptyState } from "@/components/empty-state";\nimport { BentoCard } from "@/components/ui/bento-card";'
);

inventoryContent = inventoryContent.replace(
  /return "bg-amber-100 text-amber-700";/g,
  'return "bg-amber-500/10 text-amber-600";'
);

inventoryContent = inventoryContent.replace(
  /return "bg-emerald-100 text-emerald-700";/g,
  'return "bg-green-500/10 text-green-700";'
);

inventoryContent = inventoryContent.replace(
  /return "bg-slate-200 text-slate-700";/g,
  'return "bg-maika-muted/10 text-maika-muted";'
);

inventoryContent = inventoryContent.replace(
  /<div className="overflow-hidden rounded-\[28px\].*?shadow-\[0_22px_60px_rgba\(8,47,73,0.08\)\]">/s,
  '<BentoCard radius="lg" className="overflow-hidden">'
);

inventoryContent = inventoryContent.replace(
  /<thead className="bg-slate-50\/90 text-left text-slate-600">/s,
  '<thead className="text-left border-b border-maika-muted/10 text-xs text-maika-muted uppercase tracking-[0.1em]">'
);

inventoryContent = inventoryContent.replace(
  /className="text-slate-700 transition hover:bg-cyan-50\/50"/g,
  'className="align-middle text-maika-foreground transition hover:bg-maika-foreground/5"'
);

// 为标识码本身添加 mono-accent
inventoryContent = inventoryContent.replace(
  /<td className="px-5 py-4 font-medium text-slate-900">\{row\.code\}<\/td>/g,
  '<td className="px-5 py-4 font-medium text-maika-ink mono-accent tracking-wider">{row.code}</td>'
);

inventoryContent = inventoryContent.replace(
  /<\/div>\s*<\/div>\s*\);/g,
  '</div>\n      </BentoCard>\n  );'
);

fs.writeFileSync(inventoryFile, inventoryContent);
