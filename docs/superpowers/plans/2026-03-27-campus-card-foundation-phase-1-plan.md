# Campus Card Roles, Groups, and Registration Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the phase-1 foundation for the campus card system by introducing `LEADER` + `Group`, member self-registration, admin group management, and leader-aware navigation/guards while keeping the current sales and settlement flows running.

**Architecture:** Extend the existing `User`-centric app rather than replacing it. This phase upgrades the auth/session/permission model, adds group ownership metadata and CRUD, and creates leader-facing route placeholders so later phases can safely layer identifier-code inventory, prospect delivery, and new settlement logic on top. Existing sales entry, sales review, and settlement pages remain operational in this phase.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma/PostgreSQL, Auth.js, Zod, Vitest

---

## Phase Scope

This plan intentionally covers only the first sub-project from the approved spec:

- add `LEADER` and `Group`
- add member self-registration on the login page
- allow admins to manage groups, assign members to groups, promote/demote leaders, and edit remarks
- add leader-aware navigation and route protection

This plan explicitly does **not** implement:

- identifier-code inventory/import/distribution
- prospect delivery records
- identifier-backed sales entry
- settlement and commission-rule rewrite

Those belong in later plans after this foundation ships.

## File Structure

### Data model and auth contract

- Modify: `prisma/schema.prisma`
  - Add `LEADER` to `Role`
  - Add `Group` model
  - Add `remark` and `groupId` on `User`
- Create: `prisma/migrations/20260327213000_add_groups_leaders_and_member_remarks/migration.sql`
  - Persist the new role/group foundation
- Modify: `tests/unit/prisma-schema-contract.test.ts`
  - Lock the new Prisma contract
- Modify: `src/types/next-auth.d.ts`
  - Extend session and JWT role types to include `LEADER`

### Permissions and route protection

- Modify: `src/lib/auth.ts`
  - Keep credentials login, but recognize `LEADER`
- Modify: `src/lib/permissions.ts`
  - Add leader-aware helpers and redirects
- Modify: `src/proxy.ts`
  - Protect future `/leader/*` routes and redirect by role
- Modify: `tests/unit/auth.test.ts`
  - Cover the new permission behavior

### Login and registration

- Modify: `src/app/(auth)/login/actions.ts`
  - Add member registration action beside login
- Create: `src/app/(auth)/login/form-state.ts`
  - Shared form-state types for login/register
- Modify: `src/app/(auth)/login/page.tsx`
  - Render login/register split layout
- Modify: `src/components/login-form.tsx`
  - Consume the extracted login form-state type
- Create: `src/components/register-form.tsx`
  - Member registration form
- Modify: `src/lib/validators/auth.ts`
  - Add register schema
- Create: `tests/unit/login-actions.test.ts`
- Create: `tests/unit/login-page.test.tsx`

### Group management

- Create: `src/lib/validators/group.ts`
  - Validate group create/update payloads
- Create: `src/server/services/group-service.ts`
  - Shared group queries for admin/leader pages
- Create: `src/app/(admin)/admin/groups/actions.ts`
  - Group create/update leader-assignment actions
- Create: `src/app/(admin)/admin/groups/form-state.ts`
  - Shared action state for group forms
- Create: `src/app/(admin)/admin/groups/page.tsx`
  - Admin group management page
- Create: `src/components/admin/group-form.tsx`
  - Group create form
- Create: `src/components/admin/group-table.tsx`
  - Group edit/leader assignment table
- Create: `tests/unit/group-management.test.ts`
- Create: `tests/unit/admin-groups-page.test.tsx`

### Member management upgrades

- Modify: `src/app/(admin)/admin/members/actions.ts`
  - Save `remark`, `groupId`, and `role`
- Modify: `src/app/(admin)/admin/members/form-state.ts`
  - Extend create-form values with `remark` and `groupId`
- Modify: `src/app/(admin)/admin/members/page.tsx`
  - Load groups and updated member columns
- Modify: `src/components/admin/member-form.tsx`
  - Create member with optional group and remark
- Modify: `src/components/admin/member-table.tsx`
  - Edit role/group/remark
- Modify: `src/lib/validators/member.ts`
  - Validate `groupId`, `remark`, and leader promotion input
- Modify: `tests/unit/member-actions.test.ts`
- Modify: `tests/unit/member-management.test.ts`

### Navigation and leader route placeholders

- Modify: `src/components/app-shell.tsx`
  - Add `LEADER` nav sections
- Modify: `src/app/(admin)/admin/page.tsx`
  - Add group-management quick entry
- Create: `src/app/(leader)/leader/group/page.tsx`
  - Leader group overview placeholder backed by real group data
- Create: `src/app/(leader)/leader/sales/page.tsx`
  - Leader sales page placeholder for later phases
- Create: `src/app/(shared)/leaderboard/groups/page.tsx`
  - Shared group leaderboard placeholder page
- Modify: `tests/unit/app-shell.test.tsx`
- Create: `tests/unit/leader-pages.test.tsx`

### Documentation and verification

- Modify: `README.md`
  - Document the new phase-1 role/group/register foundation
- Modify: `docs/ai/handoff.md`
  - Capture the new phase split and current state

## Task 1: Add Group and Leader Prisma Foundation

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260327213000_add_groups_leaders_and_member_remarks/migration.sql`
- Modify: `tests/unit/prisma-schema-contract.test.ts`

- [ ] **Step 1: Write the failing schema contract expectations**

Add expectations like:

```ts
test("locks group and leader foundation in Prisma schema", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  expect(schema).toContain("enum Role");
  expect(schema).toContain("LEADER");
  expect(schema).toContain("model Group");
  expect(schema).toMatch(/remark\s+String\?/);
  expect(schema).toMatch(/groupId\s+String\?/);
});
```

- [ ] **Step 2: Run the schema contract test and verify it fails**

Run: `npm run test -- tests/unit/prisma-schema-contract.test.ts`
Expected: FAIL because `LEADER` / `Group` / `remark` / `groupId` are missing.

- [ ] **Step 3: Add the minimal Prisma schema changes**

Implement:

```prisma
enum Role {
  MEMBER
  LEADER
  ADMIN
}

model Group {
  id           String   @id @default(cuid())
  name         String   @unique
  slogan       String?
  remark       String?
  leaderUserId String?  @unique
  leader       User?    @relation("GroupLeader", fields: [leaderUserId], references: [id], onDelete: SetNull)
  members      User[]   @relation("GroupMembers")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

and on `User`:

```prisma
remark  String?
groupId String?
group   Group? @relation("GroupMembers", fields: [groupId], references: [id], onDelete: SetNull)
```

Create the matching SQL migration.

- [ ] **Step 4: Re-run the schema contract test**

Run: `npm run test -- tests/unit/prisma-schema-contract.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260327213000_add_groups_leaders_and_member_remarks/migration.sql tests/unit/prisma-schema-contract.test.ts
git commit -m "feat: add group and leader schema foundation"
```

## Task 2: Upgrade Auth, Session, and Route Guards for `LEADER`

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/lib/permissions.ts`
- Modify: `src/types/next-auth.d.ts`
- Modify: `src/proxy.ts`
- Modify: `tests/unit/auth.test.ts`

- [ ] **Step 1: Extend `tests/unit/auth.test.ts` with failing leader expectations**

Add assertions like:

```ts
test("leader cannot access admin routes", () => {
  expect(canAccessAdmin({ role: "LEADER" })).toBe(false);
});

test("default redirect sends leaders to the leader group page", () => {
  expect(getDefaultRedirectPath("LEADER")).toBe("/leader/group");
});
```

- [ ] **Step 2: Run the permission test and verify it fails**

Run: `npm run test -- tests/unit/auth.test.ts`
Expected: FAIL because `LEADER` is not supported yet.

- [ ] **Step 3: Implement leader-aware auth and permission helpers**

Make the minimal contract changes:

```ts
export type SessionRole = "ADMIN" | "LEADER" | "MEMBER";

export function canAccessLeader(session: SessionLike) {
  return session?.role === "ADMIN" || session?.role === "LEADER";
}

export function getDefaultRedirectPath(role: SessionRole) {
  if (role === "ADMIN") return "/admin";
  if (role === "LEADER") return "/leader/group";
  return "/entry";
}
```

Update:

- Auth.js session/JWT typing
- `authorize()` return type
- `/proxy` route matcher and leader-route redirects

- [ ] **Step 4: Re-run the permission test**

Run: `npm run test -- tests/unit/auth.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/lib/permissions.ts src/types/next-auth.d.ts src/proxy.ts tests/unit/auth.test.ts
git commit -m "feat: add leader auth and route guards"
```

## Task 3: Add Member Self-Registration to the Login Page

**Files:**
- Modify: `src/app/(auth)/login/actions.ts`
- Create: `src/app/(auth)/login/form-state.ts`
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/components/login-form.tsx`
- Create: `src/components/register-form.tsx`
- Modify: `src/lib/validators/auth.ts`
- Create: `tests/unit/login-actions.test.ts`
- Create: `tests/unit/login-page.test.tsx`

- [ ] **Step 1: Write the failing registration action test**

Create a test like:

```ts
test("registerMemberAction creates an active member account and redirects to entry", async () => {
  userFindUniqueMock.mockResolvedValue(null);
  userCreateMock.mockResolvedValue({});
  hashPasswordMock.mockResolvedValue("hashed-password");

  const formData = new FormData();
  formData.set("username", "member09");
  formData.set("password", "member123456");

  await expect(registerMemberAction(initialState, formData)).rejects.toThrow("redirect:/entry");
});
```

- [ ] **Step 2: Write the failing login-page rendering test**

Create a page test that expects both sections:

```tsx
expect(screen.getByText("账号登录")).toBeInTheDocument();
expect(screen.getByText("成员注册")).toBeInTheDocument();
```

- [ ] **Step 3: Run both tests to verify they fail**

Run: `npm run test -- tests/unit/login-actions.test.ts tests/unit/login-page.test.tsx`
Expected: FAIL because the register action and UI do not exist yet.

- [ ] **Step 4: Implement minimal register flow**

Add:

- `registerSchema`
- `RegisterFormState`
- `registerMemberAction`
- duplicate-username rejection
- `Role.MEMBER` + `UserStatus.ACTIVE` account creation
- `register-form.tsx`
- login/register split layout on `/login`

Use minimal creation logic:

```ts
await db.user.create({
  data: {
    username,
    name: username,
    passwordHash: await hashPassword(password),
    role: Role.MEMBER,
    status: UserStatus.ACTIVE,
  },
});
```

- [ ] **Step 5: Re-run the login/register tests**

Run: `npm run test -- tests/unit/login-actions.test.ts tests/unit/login-page.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/(auth)/login/actions.ts src/app/(auth)/login/form-state.ts src/app/(auth)/login/page.tsx src/components/login-form.tsx src/components/register-form.tsx src/lib/validators/auth.ts tests/unit/login-actions.test.ts tests/unit/login-page.test.tsx
git commit -m "feat: add member self-registration flow"
```

## Task 4: Add Admin Group Management

**Files:**
- Create: `src/lib/validators/group.ts`
- Create: `src/server/services/group-service.ts`
- Create: `src/app/(admin)/admin/groups/actions.ts`
- Create: `src/app/(admin)/admin/groups/form-state.ts`
- Create: `src/app/(admin)/admin/groups/page.tsx`
- Create: `src/components/admin/group-form.tsx`
- Create: `src/components/admin/group-table.tsx`
- Create: `tests/unit/group-management.test.ts`
- Create: `tests/unit/admin-groups-page.test.tsx`

- [ ] **Step 1: Write the failing group validator/service test**

Create tests like:

```ts
test("groupSchema requires a unique name and optional slogan", () => {
  expect(groupSchema.parse({ name: "一组", slogan: "冲刺" }).name).toBe("一组");
});
```

and:

```ts
test("admin groups page renders create form and existing rows", async () => {
  render(await AdminGroupsPage());
  expect(screen.getByText("小组管理")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the new tests and verify they fail**

Run: `npm run test -- tests/unit/group-management.test.ts tests/unit/admin-groups-page.test.tsx`
Expected: FAIL because the group module does not exist.

- [ ] **Step 3: Implement minimal group CRUD foundation**

Add:

- `groupSchema`
- `listGroupsForAdmin()`
- `createGroupAction()`
- `updateGroupAction()`
- `/admin/groups` page with:
  - create group form
  - edit group table
  - leader assignment `<select>`

- [ ] **Step 4: Re-run the group tests**

Run: `npm run test -- tests/unit/group-management.test.ts tests/unit/admin-groups-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/validators/group.ts src/server/services/group-service.ts src/app/(admin)/admin/groups/actions.ts src/app/(admin)/admin/groups/form-state.ts src/app/(admin)/admin/groups/page.tsx src/components/admin/group-form.tsx src/components/admin/group-table.tsx tests/unit/group-management.test.ts tests/unit/admin-groups-page.test.tsx
git commit -m "feat: add admin group management"
```

## Task 5: Upgrade Member Management with Group, Role, and Remark Fields

**Files:**
- Modify: `src/app/(admin)/admin/members/actions.ts`
- Modify: `src/app/(admin)/admin/members/form-state.ts`
- Modify: `src/app/(admin)/admin/members/page.tsx`
- Modify: `src/components/admin/member-form.tsx`
- Modify: `src/components/admin/member-table.tsx`
- Modify: `src/lib/validators/member.ts`
- Modify: `tests/unit/member-actions.test.ts`
- Modify: `tests/unit/member-management.test.ts`

- [ ] **Step 1: Extend validator tests with failing role/group/remark expectations**

Add tests like:

```ts
test("memberUpdateSchema accepts leader promotion, group assignment, and remark", () => {
  const parsed = memberUpdateSchema.parse({
    id: "member-1",
    username: "member01",
    name: "成员1",
    role: "LEADER",
    groupId: "group-1",
    remark: "负责新生点位",
    status: "ACTIVE",
    password: "",
  });

  expect(parsed.role).toBe("LEADER");
});
```

- [ ] **Step 2: Extend the action test with failing update expectations**

Add a failing expectation like:

```ts
expect(userUpdateMock).toHaveBeenCalledWith({
  where: { id: "member-1" },
  data: expect.objectContaining({
    role: "LEADER",
    groupId: "group-1",
    remark: "负责新生点位",
  }),
});
```

- [ ] **Step 3: Run the member tests and verify they fail**

Run: `npm run test -- tests/unit/member-management.test.ts tests/unit/member-actions.test.ts`
Expected: FAIL because member validators and actions do not support the new fields.

- [ ] **Step 4: Implement the minimal member-management upgrade**

Add:

- `role`, `groupId`, `remark` to validators
- leader promotion / demotion handling
- group dropdowns in create/edit forms
- remarks on create/edit
- groups loaded into `/admin/members`

Guardrails:

- admins cannot demote themselves away from `ADMIN`
- leader assignment requires a non-empty `groupId`
- promoting a new leader to a group must clear the old leader in that same group

- [ ] **Step 5: Re-run the member tests**

Run: `npm run test -- tests/unit/member-management.test.ts tests/unit/member-actions.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/(admin)/admin/members/actions.ts src/app/(admin)/admin/members/form-state.ts src/app/(admin)/admin/members/page.tsx src/components/admin/member-form.tsx src/components/admin/member-table.tsx src/lib/validators/member.ts tests/unit/member-actions.test.ts tests/unit/member-management.test.ts
git commit -m "feat: add group-aware member management"
```

## Task 6: Add Leader Navigation and Placeholder Leader Routes

**Files:**
- Modify: `src/components/app-shell.tsx`
- Modify: `src/app/(admin)/admin/page.tsx`
- Create: `src/app/(leader)/leader/group/page.tsx`
- Create: `src/app/(leader)/leader/sales/page.tsx`
- Create: `src/app/(shared)/leaderboard/groups/page.tsx`
- Modify: `tests/unit/app-shell.test.tsx`
- Create: `tests/unit/leader-pages.test.tsx`

- [ ] **Step 1: Extend the app-shell test with failing leader navigation expectations**

Add a test like:

```tsx
expect(buildNavSections("LEADER")).toEqual([
  expect.objectContaining({ title: "组长区" }),
]);
```

and assert visible links:

```tsx
expect(screen.getByRole("link", { name: "小组看板" })).toBeInTheDocument();
expect(screen.getByRole("link", { name: "小组销售" })).toBeInTheDocument();
```

- [ ] **Step 2: Write the failing leader page smoke test**

Create a page test that expects:

```tsx
expect(screen.getByText("本组看板")).toBeInTheDocument();
```

- [ ] **Step 3: Run the navigation/leader tests to verify they fail**

Run: `npm run test -- tests/unit/app-shell.test.tsx tests/unit/leader-pages.test.tsx`
Expected: FAIL because leader nav and pages do not exist.

- [ ] **Step 4: Implement minimal leader placeholders**

Add:

- leader nav section:
  - `/leader/group`
  - `/leader/sales`
  - `/leaderboard/groups`
- admin home quick-entry for `/admin/groups`
- leader group page backed by real current group info
- leader sales page placeholder with empty-state copy pointing to later phases
- shared group leaderboard placeholder page

- [ ] **Step 5: Re-run the navigation/leader tests**

Run: `npm run test -- tests/unit/app-shell.test.tsx tests/unit/leader-pages.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/app-shell.tsx src/app/(admin)/admin/page.tsx src/app/(leader)/leader/group/page.tsx src/app/(leader)/leader/sales/page.tsx src/app/(shared)/leaderboard/groups/page.tsx tests/unit/app-shell.test.tsx tests/unit/leader-pages.test.tsx
git commit -m "feat: add leader routes and navigation foundation"
```

## Task 7: Sync Docs and Run Phase-1 Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/ai/handoff.md`

- [ ] **Step 1: Update docs to reflect the new phase-1 foundation**

Document:

- third role `LEADER`
- self-registration
- group management routes
- current phase split (identifier codes still pending)

- [ ] **Step 2: Run focused verification**

Run:

```bash
npm run test -- tests/unit/prisma-schema-contract.test.ts tests/unit/auth.test.ts tests/unit/login-actions.test.ts tests/unit/login-page.test.tsx tests/unit/group-management.test.ts tests/unit/admin-groups-page.test.tsx tests/unit/member-management.test.ts tests/unit/member-actions.test.ts tests/unit/app-shell.test.tsx tests/unit/leader-pages.test.tsx
```

Expected: PASS

- [ ] **Step 3: Run broad verification**

Run:

```bash
npm run lint
npx tsc --noEmit
npm run test
npm run build
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add README.md docs/ai/handoff.md
git commit -m "docs: sync phase-1 group and registration foundation"
```

## Follow-Up Plans Required After This Phase

After this phase ships, write separate plans for:

1. identifier-code import, inventory, and assignment
2. prospect delivery and identifier-backed sales entry
3. `40 / 60` commission-rule migration and settlement rewrite
4. group leaderboard, exports, and analytics alignment
