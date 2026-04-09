import type { ShellBannerData } from "@/lib/content-types";

export function BannerRotator({ banner }: { banner: ShellBannerData }) {
  if (!banner || banner.items.length === 0) {
    return null;
  }

  const activeItem =
    banner.mode === "RANDOM"
      ? banner.items[Math.floor(Math.random() * banner.items.length)] ?? banner.items[0]
      : banner.items[0];

  return (
    <section className="maika-banner-surface overflow-hidden rounded-[24px] border border-cyan-300/30 px-5 py-5 text-white shadow-[0_14px_36px_rgba(8,47,73,0.18)]">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-cyan-100/90">
        Today Banner
      </p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="max-w-3xl font-display text-xl leading-relaxed text-white">
            {activeItem?.content}
          </p>
          {activeItem?.author ? (
            <p className="mt-2 text-xs text-cyan-100/80">署名：{activeItem.author}</p>
          ) : null}
        </div>
        <span className="rounded-full bg-white/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-cyan-100/90">
          {banner.mode === "RANDOM" ? "随机显示" : "静态展示"}
        </span>
      </div>
    </section>
  );
}
