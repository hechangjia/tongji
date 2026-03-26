"use client";

import { useEffect, useState } from "react";
import type { ShellBannerData } from "@/lib/content-types";

function BannerRotatorInner({ banner }: { banner: Exclude<ShellBannerData, null> }) {
  const [activeIndex, setActiveIndex] = useState(() => {
    if (banner.mode === "RANDOM") {
      return Math.floor(Math.random() * banner.items.length);
    }

    return 0;
  });

  useEffect(() => {
    if (!banner || banner.mode !== "ROTATE" || banner.items.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % banner.items.length);
    }, 4500);

      return () => window.clearInterval(timer);
    }, [banner]);

  const activeItem = banner.items[activeIndex] ?? banner.items[0];

  return (
    <section className="overflow-hidden rounded-[26px] border border-cyan-300/30 bg-[linear-gradient(135deg,#082f49_0%,#0f766e_100%)] px-5 py-5 text-white shadow-[0_20px_50px_rgba(8,47,73,0.22)]">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-cyan-100/90">
        Today Banner
      </p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="max-w-3xl font-display text-xl leading-relaxed text-white">
            {activeItem.content}
          </p>
          {activeItem.author ? (
            <p className="mt-2 text-xs text-cyan-100/80">署名：{activeItem.author}</p>
          ) : null}
        </div>
        <span className="rounded-full bg-white/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-cyan-100/90">
          {banner.mode === "ROTATE" ? "轮播中" : "随机显示"}
        </span>
      </div>
    </section>
  );
}

export function BannerRotator({ banner }: { banner: ShellBannerData }) {
  if (!banner || banner.items.length === 0) {
    return null;
  }

  const bannerKey = `${banner.mode}:${banner.items.map((item) => item.id).join("|")}`;

  return <BannerRotatorInner key={bannerKey} banner={banner} />;
}
