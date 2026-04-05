# Maika 全局重构实施计划 (2025 现代设计规范)

> 目标：将现有项目向 2025 Refined Utility (Glassmorphic Industrial) 规范平滑迁移。
> **核心铁律（性能约束）**：所有重构必须保证极速响应。前端渲染不卡顿，抽屉按需加载，毛玻璃限制过度计算，路由切换无白屏。

## 阶段 1：基础设施建设 (Infrastructure & Foundations)
- [ ] **字体引入**：通过 `next/font/google` 全局挂载 `DM Sans` 和 `Noto Sans SC`，同时引入 `Geist Mono`。确保零布局偏移（Zero CLS）。
- [ ] **Tailwind 与 CSS 变量梳理 (`src/app/globals.css`)**：
  - 设立 3 阶圆角：`--radius-sm: 18px`, `--radius-md: 24px`, `--radius-lg: 30px`。
  - 配置 `ambient glows` 与全局 `backdrop-blur-xl` 的工具类（**必须开启 GPU 硬件加速 `transform-gpu`** 以防掉帧）。
  - 增加对金额和标识符的专用类（结合 `Geist Mono` 和 `tabular-nums`）。

## 阶段 2：基础组件库构建 (Base UI Components)
- [ ] **通用 BentoCard (`src/components/ui/bento-card.tsx`)**：支持 3 阶圆角，内部提供条件化的磨砂玻璃效果（非必需不开启）。
- [ ] **SlideOver 侧滑抽屉 (`src/components/ui/slide-over.tsx`)**：支持 300ms ease-out。**性能约束**：必须采用动态引入（Lazy import）或挂载检测，绝不在首屏渲染不可见的庞大 DOM 树。
- [ ] **重构状态类组件**：统一状态徽章 (`Badge`) 和按钮 (`Button`)，强制预设颜色，剥离旧阴影。

## 阶段 3：核心业务重构 (Core Business Refactoring)
*第一波：团长工作台先导试验 (Pilot: Leader Workbench)*
- [ ] 使用 Bento Box 布局重构 `src/app/(leader)/leader/...` 页面。
- [ ] 销售额明细/标识码强行套用 `Geist Mono`。
- [ ] 将线索分配和记录审核替换为 `SlideOver` 交互（结合 Next.js 局部重载机制，避免全量刷新）。

*第二波：超级管理员区域 (Admin Area)*
- [ ] 改造 `src/components/admin/` 的大型表格，开启数字表格排版模式 (`tabular-nums`)。
- [ ] 所有管理员表单编辑操作统一放入按需加载的侧滑抽屉。

*第三波：成员输入视图及外围 (Member & Shared)*
- [ ] 翻新主录单界面 (`sales-entry-form.tsx`)，最高优先级保证无任何延迟响应。
- [ ] 刷新全站 Layout 外壳 (`app-shell-client.tsx`)。

## 阶段 4：清理与抛光 (Cleanup & Polish)
- [ ] **清剿旧圆角**：全库搜索并清理 `rounded-2xl`, `rounded-[20px]`, `rounded-[28px]` 等遗留代码，向 `sm/md/lg` 对齐。
- [ ] 动效复查：剔除过度动画，仅保留 150ms 悬停微拟物和 300ms 必要的空间移动。