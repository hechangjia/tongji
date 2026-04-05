# Design System — Maika

## Product Context
- **What this is:** Internal campus phone card sales tracking and commission settlement system
- **Who it's for:** Summer campus sales teams — admins managing operations, group leaders coordinating members, members entering daily sales
- **Space/industry:** Internal team tool / sales ops dashboard
- **Project type:** Web app (Next.js App Router, deployed on Vercel)

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian with glassmorphic accents
- **Decoration level:** Intentional — subtle gradients, backdrop blur, background grid texture. Not minimal, not expressive.
- **Mood:** A focused operations dashboard that still feels alive. The gradient backgrounds and glass surfaces add visual depth without getting in the way of data-heavy screens. Think "polished control room" not "consumer SaaS."
- **Key surfaces:** Glassmorphic cards (rgba white + backdrop-blur-xl), dark sidebar with gradient, theme-tinted body gradient

## Typography

### Font Stack
- **Body (sans):** `"DM Sans", "Noto Sans SC", "Avenir Next", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", sans-serif`
  - DM Sans: primary web font, optical size 9-40, weight 300-700. Clean geometric sans with excellent tabular-nums support.
  - Noto Sans SC: Chinese fallback, weight-matched to DM Sans for visual consistency across mixed CJK/Latin text.
  - Remaining: system fallbacks for offline/slow network.
- **Display (serif):** `"Iowan Old Style", "Noto Serif SC", "Songti SC", "STSong", serif`
  - System-only serif stack. Used exclusively for page hero titles and section headings (`.font-display` class).
  - No web serif loaded — avoids the visual weight mismatch between English serif and Chinese system fonts (prior learning).
- **Data:** Same as body, with `font-variant-numeric: tabular-nums` enabled. Required for leaderboard rankings, sales tables, and metric cards.
- **Code:** `"Geist Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace`

### Font Loading
```html
<!-- Google Fonts (add to layout.tsx or use next/font) -->
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&family=Noto+Sans+SC:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet" />
```
Total additional payload: ~50KB (DM Sans Latin subset + Noto Sans SC common subset + Geist Mono).

### Type Scale
| Token | Size | Usage |
|-------|------|-------|
| `4xl` | 2.25rem (36px) | Hero display headings |
| `3xl` | 1.875rem (30px) | Page titles (mobile) |
| `2xl` | 1.5rem (24px) | Section headings, metric values |
| `xl` | 1.25rem (20px) | Sub-headings |
| `lg` | 1.125rem (18px) | Emphasized body |
| `base` | 1rem (16px) | Body text |
| `sm` | 0.875rem (14px) | Secondary text, table cells, descriptions |
| `xs` | 0.75rem (12px) | Hints, timestamps, badge text |
| `label` | 0.72rem + 600 + uppercase + 0.22em tracking | Section labels, metric labels, eyebrows |

### Label Pattern
The recurring "label" pattern is a first-class typographic element:
```css
font-size: 0.72rem;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.22em;
color: var(--maika-muted);
```
Used for: metric card labels, section eyebrows, sidebar section titles, table headers, nav section titles. Letter-spacing variants: 0.18em (compact), 0.22em (standard), 0.24em (prominent).

## Color

### Approach
Balanced — 6 interchangeable theme palettes, each with a coherent gradient system. Color serves both function (semantic) and personality (theme identity).

### Theme System
6 themes stored in localStorage, applied via `data-maika-theme` attribute on `<html>`. SSR-safe via inline bootstrap script in `<head>`.

| Theme | ID | Label | Mood |
|-------|----|-------|------|
| Lagoon (default) | `lagoon` | 海雾青 | Cool teal-cyan, calm and focused |
| Sunset | `sunset` | 落日绯 | Warm orange-rose, energetic |
| Aurora | `aurora` | 极光绿 | Deep green, nature calm |
| Violet | `violet` | 夜幕紫 | Indigo-purple, deep focus |
| Ember | `ember` | 余烬铜 | Amber-brown, warm retro |
| Graphite | `graphite` | 石墨灰 | Neutral slate, low-stimulation |

### CSS Variable Architecture
Each theme defines these variables in `:root` / `:root[data-maika-theme="..."]`:

| Variable | Purpose | Lagoon value |
|----------|---------|-------------|
| `--background` | Page background base | `#effcff` |
| `--foreground` | Primary text | `#082032` |
| `--maika-ink` | Headings, buttons, strong text | `#082f49` |
| `--maika-surface` | Glass card background | `rgba(255, 255, 255, 0.82)` |
| `--maika-accent` | Highlights, active states, badges | `#67e8f9` |
| `--maika-accent-strong` | Links, eyebrows, focus rings | `#0f766e` |
| `--maika-ring` | Focus ring color | `#bae6fd` |
| `--maika-muted` | Secondary text, labels | `#5a6f7f` |
| `--maika-selection` | Text selection highlight | `rgba(34, 211, 238, 0.35)` |
| `--maika-grid-line` | Background grid texture | `rgba(8, 47, 73, 0.04)` |

### Gradient Variables
| Variable | Purpose |
|----------|---------|
| `--maika-body-gradient` | Full-page background (radial accents + linear base) |
| `--maika-shell-gradient` | App shell backdrop |
| `--maika-login-gradient` | Login page dark gradient |
| `--maika-sidebar-gradient` | Desktop sidebar (dark, near-opaque) |
| `--maika-banner-gradient` | Banner quote strip |
| `--maika-header-gradient` | Page header surface |
| `--maika-podium-gradient` | Leaderboard podium |

### Semantic Colors (theme-independent)
| Purpose | Color | Usage |
|---------|-------|-------|
| Success | `#15803d` (green-700) | Approved status, positive change |
| Warning | `#b45309` (amber-700) | Pending status, attention needed |
| Error | `#be123c` (rose-700) | Rejected status, validation errors |
| Info | `#0369a1` (sky-700) | Informational callouts |

Semantic badge pattern: `background: rgba(color, 0.15); color: full-color; border-radius: 18px; font-size: 0.72rem; font-weight: 600;`

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable
- **Scale:**

| Token | Value | Common Tailwind | Usage |
|-------|-------|----------------|-------|
| `2xs` | 2px | `gap-0.5` | Micro gaps, divider margins |
| `xs` | 4px | `gap-1`, `p-1` | Tight inline spacing |
| `sm` | 8px | `gap-2`, `p-2` | Between related elements |
| `md` | 16px | `gap-4`, `p-4`, `px-4` | Standard card padding, form gaps |
| `lg` | 24px | `gap-6`, `p-6`, `px-6` | Section spacing, card groups |
| `xl` | 32px | `gap-8`, `p-8` | Major section breaks |
| `2xl` | 48px | `py-12` | Page-level vertical rhythm |
| `3xl` | 64px | `py-16` | Section separators |

### High-frequency combinations (from codebase analysis)
- **Compact content:** `px-4 py-3` or `px-3 py-2` — table cells, badges, compact cards
- **Standard card:** `px-5 py-4` — metric cards, nav items, form groups
- **Spacious container:** `p-6` or `px-6 py-6` — sidebar panels, page sections
- **Content stacking:** `space-y-2` (tight), `space-y-3` (standard), `space-y-4`/`space-y-5` (sections)
- **Inline gaps:** `gap-3` (default), `gap-4` (with more elements)

## Layout
- **Approach:** Grid-disciplined
- **Structure:** Fixed sidebar (288px, desktop only) + fluid main content area
- **Max content width:** 1600px (`max-w-[1600px]`)
- **Responsive breakpoints:** Mobile-first. Sidebar appears at `lg:` (1024px). Header collapses to mobile hamburger below `lg:`.
- **Card-based content:** All content blocks are rounded glass cards within the main area
- **Grid columns:** Auto-responsive via `grid-template-columns: repeat(auto-fill, minmax(...))` for metric/stat grids

### Border Radius Scale
| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 18px | Buttons, badges, nav items, form inputs, small cards |
| `md` | 24px | Metric cards, identity panels, content blocks |
| `lg` | 30px | Main content area, sidebar, page header, app shell |
| `full` | 9999px | Pills, circular badges, role indicators |

**Note:** Current codebase uses 7 radius values (18/20/22/24/26/28/30px). New code should use only sm/md/lg/full. Existing intermediate values (20/22/26/28) should be migrated to the nearest tier during refactoring.

## Motion
- **Approach:** Minimal-functional
- **Philosophy:** Motion serves comprehension, not decoration. Internal tool users interact repeatedly — animations must never slow them down.

### Duration Scale
| Token | Value | Easing | Usage |
|-------|-------|--------|-------|
| `micro` | 200ms | `ease-out` | Hover/focus transitions, color changes, border shifts |
| `short` | 300ms | `ease-out` | Menu open/close, drawer slide |
| `entrance` | 420ms | `ease-out` | Page content fade-up on load |

### Easing
- **Enter (appear):** `ease-out` — fast start, gentle settle
- **Exit (disappear):** `ease-in` — gentle start, fast exit
- **Move (reposition):** `ease-in-out` — smooth both ends

### Animation: fade-up
```css
@keyframes maika-fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.maika-fade-up { animation: maika-fade-up 0.42s ease-out both; }
```
Applied to: sidebar, mobile header, main content area on page load.

## Glass Surface System
The signature visual element. Glass surfaces create depth hierarchy without heavy borders or shadows.

| Surface | Background | Blur | Border | Shadow |
|---------|-----------|------|--------|--------|
| Main content | `var(--maika-surface)` | `blur(18px)` / `backdrop-blur-xl` | `border-white/60` | `0 28px 80px rgba(8,47,73,0.12)` |
| Sidebar | `var(--maika-sidebar-gradient)` | none (opaque) | `border-white/10` | `0 28px 80px rgba(8,47,73,0.28)` |
| Metric card (light) | `rgba(255,255,255,0.82)` | none | `border-white/70` | `0 16px 36px rgba(8,47,73,0.08)` |
| Page header | `var(--maika-header-gradient)` | `blur(18px)` | `border-white/60` | `0 22px 60px rgba(8,47,73,0.08)` |
| Mobile header | `rgba(255,255,255,0.7)` | `blur(18px)` | `border-white/60` | `0 20px 60px rgba(8,47,73,0.12)` |
| Menu overlay | `bg-slate-950/45` | `blur-sm` | none | none |

## Background Textures
- **Grid:** 22px grid, `var(--maika-grid-line)` color (very subtle). Class: `.maika-grid`
- **Body gradient:** 3-stop radial/linear gradient per theme. Applied to `body` via `--maika-body-gradient`

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-05 | Initial design system created | Codified from existing 16.5K-line codebase via /design-consultation |
| 2026-04-05 | DM Sans + Noto Sans SC as body web fonts | Cross-platform consistency. System-only stack (Avenir Next) varies wildly on Windows/Linux |
| 2026-04-05 | Keep system serif for display, no web serif | Prior learning: English serif + Chinese system font = visual weight mismatch. Serif headings are infrequent enough that system fallback is acceptable |
| 2026-04-05 | Border radius normalized to 3 tiers (18/24/30) | Codebase had 7 different values. Reducing to 3 improves consistency without visual change |
| 2026-04-05 | Geist Mono for code | Consistent with Vercel deployment platform. Clean and compact |
| 2026-04-05 | No dark mode (yet) | Internal summer tool. 6 theme options already cover user preference for visual variety. Full dark mode is a future consideration |
