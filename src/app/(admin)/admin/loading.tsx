function AdminLoadingCard({
  className,
}: {
  className: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-[24px] border border-white/70 bg-slate-100/80 ${className}`}
    />
  );
}

export default function Loading() {
  return (
    <section className="space-y-6" aria-label="管理员页面加载中">
      <div className="rounded-[24px] border border-white/60 bg-white/82 p-6 shadow-[0_18px_50px_rgba(8,47,73,0.08)]">
        <div className="space-y-3">
          <AdminLoadingCard className="h-4 w-28" />
          <AdminLoadingCard className="h-10 w-56" />
          <AdminLoadingCard className="h-5 w-full max-w-2xl" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <AdminLoadingCard key={index} className="h-28" />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <AdminLoadingCard key={index} className="h-40" />
        ))}
      </div>
    </section>
  );
}
