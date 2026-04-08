"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type ComponentProps } from "react";

export type IntentPrefetchLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  enableIntentPrefetch?: boolean;
};

export function IntentPrefetchLink({
  href,
  enableIntentPrefetch = true,
  onMouseEnter,
  onFocus,
  onPointerDown,
  ...props
}: IntentPrefetchLinkProps) {
  const router = useRouter();
  const hasPrefetchedRef = useRef(false);

  function prefetchOnIntent() {
    if (!enableIntentPrefetch || hasPrefetchedRef.current) {
      return;
    }

    hasPrefetchedRef.current = true;
    router.prefetch(href);
  }

  return (
    <Link
      href={href}
      onMouseEnter={(event) => {
        prefetchOnIntent();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        prefetchOnIntent();
        onFocus?.(event);
      }}
      onPointerDown={(event) => {
        prefetchOnIntent();
        onPointerDown?.(event);
      }}
      {...props}
    />
  );
}
