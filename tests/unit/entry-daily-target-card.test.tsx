import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { EntryDailyTargetCard } from "@/components/entry-daily-target-card";

describe("entry daily target card", () => {
  test("renders today target, progress, and gap", () => {
    render(
      <EntryDailyTargetCard
        feedback={{
          targetTotal: 8,
          currentTotal: 5,
          gap: 3,
          completionRate: 63,
          status: "BEHIND",
        }}
      />,
    );

    expect(screen.getByText("今日目标")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("当前完成 5")).toBeInTheDocument();
    expect(screen.getByText("还差 3 单")).toBeInTheDocument();
  });
});
