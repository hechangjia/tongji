[Root](../CLAUDE.md) > **prisma**

# Database Layer (Prisma)

## Module Purpose

PostgreSQL database schema, migrations, and seed data. Uses Prisma ORM 6.19.2 with `prisma-client-js` generator.

## Schema Overview

15 models across 4 domains:

### Core Domain
- **User** -- all system users (ADMIN/LEADER/MEMBER), linked to groups
- **Group** -- sales teams with leader and member relationships
- **SalesRecord** -- daily sales counts (40/60 plans) with review workflow

### Commission Domain
- **CommissionRule** -- per-user commission rates with date ranges
- **DailyTarget** -- AI-suggested + admin-adjusted daily targets
- **MemberReminder** -- template-based reminders (TARGET_GAP/MISSING_SUBMISSION/FOLLOW_UP/CUSTOM)

### Content Domain
- **BannerQuote** -- motivational quotes (BUILTIN/CUSTOM sources)
- **BannerSettings** -- display mode config (RANDOM/ROTATE)
- **Announcement** -- system announcements with pin/expire support

### Identifier Code Domain (added in migrations 2-6)
- **IdentifierImportBatch** -- batch import tracking for codes
- **IdentifierCode** -- unique codes with status lifecycle (UNASSIGNED -> ASSIGNED -> SOLD)
- **CodeAssignment** -- assignment history tracking
- **ProspectImportBatch** -- batch import tracking for leads
- **ProspectLead** -- prospect leads with assignment + conversion tracking
- **IdentifierSale** -- completed sales linking code + lead + seller
- **GroupFollowUpItem** -- follow-up workflow items per group
- **GroupResourceAuditLog** -- audit trail with JSON before/after snapshots

## Key Enums

`Role`, `UserStatus`, `ContentStatus`, `SalesReviewStatus`, `IdentifierCodeStatus`, `ProspectLeadStatus`, `ProspectLeadSourceType`, `PlanType`, `BannerSourceType`, `BannerDisplayMode`, `ReminderStatus`, `ReminderTemplate`, `GroupFollowUpSourceType`, `GroupFollowUpStatus`, `GroupResourceAuditResourceType`, `GroupResourceAuditActionType`

## Migrations (6)

1. Initial schema (users, groups, sales, commission, banners, announcements)
2. `add_sales_review_audit_fields` -- review status workflow
3. `add_admin_insights_targets_and_reminders` -- daily targets + reminders
4. `add_groups_leaders_and_member_remarks` -- group leadership + remarks
5. `add_identifier_codes_and_prospect_leads` -- code/lead management
6. `add_member_identifier_sales` -- identifier sale + follow-up system
7. `add_leader_workbench_and_group_leaderboard` -- workbench + audit log

## Seed Script

`prisma/seed.ts` creates:
- Default admin user (`admin` / `admin123456`)
- Default member user (`member01` / `member123456`)
- Sample commission rules
- Default banner settings + 3 built-in quotes
- Sample announcement

## Key Indexes

- `SalesRecord`: `[saleDate]`, `[saleDate, reviewStatus, lastSubmittedAt]`, `[userId, saleDate]` (unique)
- `IdentifierCode`: `[status]`, `[assignedGroupId, status]`, `[currentOwnerUserId, status]`
- `GroupFollowUpItem`: `[groupId, status, lastActionAt]`, `[currentOwnerUserId, status]`
- `GroupResourceAuditLog`: `[groupId, createdAt]`

## Commands

```bash
npx prisma generate    # Generate client (also runs on postinstall)
npx prisma validate    # Validate schema
npx prisma db push     # Push schema changes (dev)
npx prisma migrate dev # Create migration (dev)
npx tsx prisma/seed.ts # Run seed script
```

## Tests

Unit: `prisma-schema-contract` -- validates schema structure expectations
