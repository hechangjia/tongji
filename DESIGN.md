# Design System — Maika

## Product Context
- **What this is:** Internal campus phone card sales tracking and commission settlement system
- **Who it's for:** Summer campus sales teams — admins managing operations, group leaders coordinating members, members entering daily sales
- **Space/industry:** Internal team tool / sales ops dashboard
- **Project type:** Web app (Next.js App Router, deployed on Vercel)

## Aesthetic Direction
- **Direction:** Refined Utility (Glassmorphic Industrial) — 高效冷静的数据展现与空间层级的现代质感相结合。
- **Decoration level:** Intentional — 极简的信息流基础，利用毛玻璃 (backdrop-blur-xl) 和主题色环境光渐变 (Ambient Glows) 构建空间深度。
- **Mood:** A focused operations dashboard that feels alive. Polished control room.

## Typography
- **Display/Hero:** `"Iowan Old Style", "Noto Serif SC", "Songti SC", "STSong", serif` — 仅用于偶然的大标题（Hero）。注意：不可混用英文字体库与中文默认体以避免字重断层。
- **Body:** `"DM Sans", "Noto Sans SC", sans-serif` — 主干字体。DM Sans 提供极佳的几何结构与数字支持；Noto Sans SC 作为字重匹配的中文后备。
- **System Identifiers/Money:** `"Geist Mono", monospace` — **破局风险点**：用于手机号、验证码、金额、订单号。强烈的等宽工业感可立刻抓取视觉焦点。
- **Data/Tables:** DM Sans with `font-variant-numeric: tabular-nums` — 强制要求。

## Color
- **Approach:** Balanced Semantic
- **Themes:** 6 套基于 CSS 变量的主题 (Lagoon, Sunset, Aurora, Violet, Ember, Graphite)。
- **Core Strategy:** 极低亮度暗色或净冷白作为大背景；高对比度颜色仅限于状态标签（Status Tags）。
- **Semantic:**
  - Success: `bg-green-500/15 text-green-700`
  - Warning: `bg-amber-500/15 text-amber-700`
  - Error: `bg-rose-500/15 text-rose-700`

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable (数据表格紧凑 `px-4 py-3`，外部模块开阔 `p-6`)

## Layout
- **Approach:** Bento Box & Slide-over
- **Grid:** 摒弃传统无边距大表，采用圆角网格卡片（Bento Box）将独立指标与内联趋势图（Sparklines）打包。
- **Drill-down:** 详情页查看采用右侧滑出抽屉 (Slide-over/Drawer)，保持列表上下文不断裂。
- **Border radius:** 3-tier scale (sm: 18px, md: 24px, lg: 30px)

## Motion
- **Approach:** Minimal-Functional
- **Rule:** 仅在帮助理解空间关系时出现（如 300ms ease-out 抽屉滑出），绝不允许阻塞“录单”核心工作流。

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-05 | 升级架构为 Bento Box 与 Slide-over 抽屉 | 提升重度数据操作连贯性，避免频繁的页面跳转导致上下文丢失 |
| 2026-04-05 | 确立 Geist Mono 作为核心业务标识的主力字体 | 在单调的数据表中制造视觉焦点，提升内部系统的专业度与防伪感 |
| 2026-04-05 | 固化 DM Sans + Noto Sans SC 字重匹配策略 | 解决历史遗留的中英文字符在不同 OS 下视觉粗细不一致的 Pitfall |
