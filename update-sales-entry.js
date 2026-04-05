const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/sales-entry-form.tsx');
let content = fs.readFileSync(file, 'utf8');

// 这个界面非常关键，我们必须把所有的圆角改成 3 阶，并引入 BentoCard
content = content.replace(
  'import { useActionState, useRef, useState, useTransition } from "react";',
  'import { useActionState, useRef, useState, useTransition } from "react";\nimport { BentoCard } from "@/components/ui/bento-card";'
);

content = content.replace(
  /className="overflow-hidden rounded-\[30px\] border border-white\/70 bg-white\/82 shadow-\[0_22px_60px_rgba\(8,47,73,0.08\)\]"/s,
  'className="overflow-hidden"'
);

// 我们在外部包一层 BentoCard lg
content = content.replace(
  /<div\n\s*className="overflow-hidden"/s,
  '<BentoCard radius="lg">\n      <div\n        className="overflow-hidden"'
);

// 结尾补充 </BentoCard>
content = content.replace(
  /<\/form>\n\s*<\/div>\n\s*\);\n\}/g,
  '</form>\n      </div>\n    </BentoCard>\n  );\n}'
);

// 把各个输入框的圆角修正为 sm (18px)
content = content.replace(/rounded-\[20px\]/g, 'rounded-[18px]');
content = content.replace(/rounded-\[22px\]/g, 'rounded-[18px]');
content = content.replace(/rounded-\[26px\]/g, 'rounded-[24px]');
content = content.replace(/rounded-\[28px\]/g, 'rounded-[24px]');

// 把手机号和标识码的输入框字体改成 mono-accent
content = content.replace(
  /className="w-full rounded-\[18px\] border border-slate-200 bg-white\/60/g,
  'className="mono-accent tracking-wider w-full rounded-[18px] border border-slate-200 bg-white/60'
);

fs.writeFileSync(file, content);
