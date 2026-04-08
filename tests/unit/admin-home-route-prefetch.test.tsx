import { render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

const prefetchMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    prefetch: prefetchMock,
  }),
}));

import { AdminHomeRoutePrefetch } from "@/components/admin/admin-home-route-prefetch";

describe("admin home route prefetch", () => {
  test("warms the priority admin routes on mount", () => {
    render(<AdminHomeRoutePrefetch />);

    expect(prefetchMock).toHaveBeenNthCalledWith(1, "/admin/insights");
    expect(prefetchMock).toHaveBeenNthCalledWith(2, "/admin/members");
  });
});
