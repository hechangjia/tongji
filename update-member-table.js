const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/admin/member-table.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 注入 SlideOver 和 BentoCard 导入
content = content.replace(
  'import { EmptyState } from "@/components/empty-state";',
  'import { EmptyState } from "@/components/empty-state";\nimport { BentoCard } from "@/components/ui/bento-card";\nimport { SlideOver } from "@/components/ui/slide-over";\nimport { useState } from "react";'
);

// 将纯函数组件重构为一个使用 useState 的 Client Component，以管理抽屉状态
content = content.replace(
  'export function MemberTable({',
  '"use client";\n\nexport function MemberTable({'
);

// 修改组件体开头
const hookInjection = `
  const [editingMember, setEditingMember] = useState<MemberRow | null>(null);

  if (rows.length === 0) {
`;

content = content.replace(
  '  if (rows.length === 0) {',
  hookInjection
);

fs.writeFileSync(filePath, content);
