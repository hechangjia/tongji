import { Suspense } from "react";
import { getCachedSession } from "@/lib/auth-request-cache";
import { db } from "@/lib/db";
import { MemberForm } from "@/components/admin/member-form";
import { MemberTable } from "@/components/admin/member-table";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusCallout } from "@/components/status-callout";

type MembersPageProps = {
  searchParams?: Promise<{
    notice?: string | string[];
    noticeTone?: string | string[];
  }>;
};

function pickQueryValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

async function getAdminMembersPageData() {
  const [members, groups] = await Promise.all([
    db.user.findMany({
      orderBy: [{ role: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        groupId: true,
        remark: true,
        status: true,
        createdAt: true,
        group: {
          select: {
            name: true,
          },
        },
      },
    }),
    db.group.findMany({
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  return {
    members,
    groups,
    activeMembers: members.filter((member) => member.status === "ACTIVE").length,
    adminMembers: members.filter((member) => member.role === "ADMIN").length,
  };
}

type AdminMembersPageData = Awaited<ReturnType<typeof getAdminMembersPageData>>;

function AdminMembersMetricsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-28 animate-pulse rounded-[24px] border border-white/70 bg-slate-100/80"
        />
      ))}
    </div>
  );
}

function AdminMembersContentSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(320px,360px)_minmax(0,1fr)]" aria-hidden="true">
      <div className="h-80 animate-pulse rounded-[24px] border border-white/70 bg-slate-100/80" />
      <div className="h-[32rem] animate-pulse rounded-[24px] border border-white/70 bg-slate-100/80" />
    </div>
  );
}

export async function AdminMembersHeaderMetrics({
  dataPromise,
}: {
  dataPromise: Promise<AdminMembersPageData>;
}) {
  const { members, activeMembers, adminMembers } = await dataPromise;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <MetricCard label="成员总数" value={members.length} />
      <MetricCard label="当前启用" value={activeMembers} tone="dark" />
      <MetricCard label="管理员数量" value={adminMembers} tone="accent" />
    </div>
  );
}

export async function AdminMembersContent({
  dataPromise,
  currentAdminIdPromise,
}: {
  dataPromise: Promise<AdminMembersPageData>;
  currentAdminIdPromise: Promise<string>;
}) {
  const [{ members, groups }, currentAdminId] = await Promise.all([
    dataPromise,
    currentAdminIdPromise,
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(320px,360px)_minmax(0,1fr)]">
      <MemberForm submitLabel="新增成员" groups={groups} />
      <MemberTable rows={members} groups={groups} currentAdminId={currentAdminId} />
    </div>
  );
}

export async function AdminMembersNotice({
  searchParamsPromise,
}: {
  searchParamsPromise?: MembersPageProps["searchParams"];
}) {
  const params = searchParamsPromise ? await searchParamsPromise : undefined;
  const notice = pickQueryValue(params?.notice)?.trim() ?? null;
  const noticeTone = pickQueryValue(params?.noticeTone) === "error" ? "error" : "success";

  if (!notice) {
    return null;
  }

  return (
    <StatusCallout
      tone={noticeTone}
      title={noticeTone === "error" ? "保存失败" : "操作完成"}
    >
      {notice}
    </StatusCallout>
  );
}

export default function AdminMembersPage({
  searchParams,
}: MembersPageProps = {}) {
  const currentAdminIdPromise = getCachedSession().then((session) => session!.user.id);
  const dataPromise = getAdminMembersPageData();

  return (
      <section className="space-y-6">
        <PageHeader
          eyebrow="管理员功能"
          title="成员管理"
          description="成员归组在这里完成：先给成员选择所属小组，再按需提升为组长。成员信息一旦调整，会立即影响登录、录入权限以及小组归属。"
        >
          <Suspense fallback={<AdminMembersMetricsSkeleton />}>
            <AdminMembersHeaderMetrics dataPromise={dataPromise} />
          </Suspense>
        </PageHeader>

        <Suspense fallback={null}>
          <AdminMembersNotice searchParamsPromise={searchParams} />
        </Suspense>

        <Suspense fallback={<AdminMembersContentSkeleton />}>
          <AdminMembersContent
            dataPromise={dataPromise}
            currentAdminIdPromise={currentAdminIdPromise}
          />
        </Suspense>
      </section>
  );
}
