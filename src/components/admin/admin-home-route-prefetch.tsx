"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const CRITICAL_ADMIN_ROUTES = ["/admin/insights", "/admin/members"] as const;

export function AdminHomeRoutePrefetch() {
  const router = useRouter();

  useEffect(() => {
    for (const href of CRITICAL_ADMIN_ROUTES) {
      router.prefetch(href);
    }
  }, [router]);

  return null;
}
