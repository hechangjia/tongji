import { AnnouncementForm } from "@/components/admin/announcement-form";
import { AnnouncementTable } from "@/components/admin/announcement-table";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusCallout } from "@/components/status-callout";
import {
  isAnnouncementVisible,
  listAnnouncementsForAdmin,
} from "@/server/services/announcement-service";

type AnnouncementsPageProps = {
  searchParams?: Promise<{
    notice?: string | string[];
  }>;
};

function toDateTimeLocalString(value: Date) {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export default async function AdminAnnouncementsPage({
  searchParams,
}: AnnouncementsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const notice = typeof params?.notice === "string" ? params.notice : null;
  const rows = await listAnnouncementsForAdmin();
  const now = new Date();
  const visibleCount = rows.filter((row) =>
    isAnnouncementVisible(
      {
        status: row.status,
        publishAt: row.publishAt,
        expireAt: row.expireAt,
      },
      now,
    ),
  ).length;
  const pinnedCount = rows.filter((row) => row.isPinned).length;

  return (
      <section className="space-y-6">
        <PageHeader
          eyebrow="内容系统"
          title="全体公告"
          description="面向全体登录用户发布正式通知。支持置顶、发布时间和过期时间，用于展示当前真正需要团队执行的事项。"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="公告总数" value={rows.length} />
            <MetricCard label="当前可见" value={visibleCount} tone="dark" />
            <MetricCard label="置顶数量" value={pinnedCount} tone="accent" />
          </div>
        </PageHeader>

        {notice ? (
          <StatusCallout tone="success" title="操作完成">
            {notice}
          </StatusCallout>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
          <AnnouncementForm
            initialValues={{
              title: "",
              content: "",
              publishAt: toDateTimeLocalString(now),
              expireAt: "",
              status: "ACTIVE",
              isPinned: true,
            }}
          />

          <AnnouncementTable
            rows={rows.map((row) => ({
              id: row.id,
              title: row.title,
              content: row.content,
              isPinned: row.isPinned,
              status: row.status,
              publishAt: row.publishAt,
              expireAt: row.expireAt,
            }))}
          />
        </div>
      </section>
  );
}
