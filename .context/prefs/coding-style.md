# Coding Style Guide

> 此文件定义团队编码规范，所有 LLM 工具在修改代码时必须遵守。
> 提交到 Git，团队共享。

## General
- Prefer small, reviewable changes; avoid unrelated refactors.
- Keep functions short (<50 lines); avoid deep nesting (≤3 levels).
- Name things explicitly; no single-letter variables except loop counters.
- Handle errors explicitly; never swallow errors silently.

## Language-Specific
### TypeScript & React (Next.js 16)
- 使用 `use client` 和 `use server` 明确划分 Server Components 和 Client Components 的边界。
- 业务逻辑必须下沉到 Service 层 (`src/server/services/`)，禁止在 Server Action 或 Component 中直接调用 Prisma。
- Server Actions 必须通过 Zod Schema 校验输入。
- Use strict mode; prefer `interface` over `type` for object shapes.
- 缓存：合理使用 `unstable_cache` 和 `updateTag` 进行粒度缓存控制。

### Tailwind CSS (v4)
- 遵循现有的 `globals.css` 颜色变量和 Theme 规范，不可随意硬编码颜色。
- 采用移动端优先 (Mobile-First) 的响应式设计写法。

## Git Commits
- Conventional Commits, imperative mood.
- Atomic commits: one logical change per commit.

## Testing
- Every feat/fix MUST include corresponding tests.
- Coverage must not decrease.
- Fix flow: write failing test FIRST, then fix code.

## Security
- Never log secrets (tokens/keys/cookies/JWT).
- Validate inputs at trust boundaries using Zod.
