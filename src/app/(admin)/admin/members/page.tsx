import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessAdmin, getDefaultRedirectPath } from "@/lib/permissions";
import { AppShell } from "@/components/app-shell";
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

export default async function AdminMembersPage({
  searchParams,
}: MembersPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Fmembers");
  }

  if (!canAccessAdmin(session.user)) {
    redirect(getDefaultRedirectPath(session.user.role));
  }

  const params = searchParams ? await searchParams : undefined;
  const notice = typeof params?.notice === "string" ? params.notice : null;
  const noticeTone = params?.noticeTone === "error" ? "error" : "success";
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
  const activeMembers = members.filter((member) => member.status === "ACTIVE").length;
  const adminMembers = members.filter((member) => member.role === "ADMIN").length;

  return (
    <AppShell
      role={session.user.role}
      userName={session.user.name ?? session.user.username}
      currentPath="/admin/members"
    >
      <section className="space-y-6">
        <PageHeader
          eyebrow="管理员功能"
          title="成员管理"
          description="在这里创建成员账号、修改成员状态，并在需要时重置登录密码。成员信息一旦调整，会立即影响登录和录入权限。"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="成员总数" value={members.length} />
            <MetricCard label="当前启用" value={activeMembers} tone="dark" />
            <MetricCard label="管理员数量" value={adminMembers} tone="accent" />
          </div>
        </PageHeader>

        {notice ? (
          <StatusCallout
            tone={noticeTone}
            title={noticeTone === "error" ? "保存失败" : "操作完成"}
          >
            {notice}
          </StatusCallout>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(320px,360px)_minmax(0,1fr)]">
          <MemberForm submitLabel="新增成员" groups={groups} />
          <MemberTable rows={members} groups={groups} currentAdminId={session.user.id} />
        </div>
      </section>
    </AppShell>
  );
}
