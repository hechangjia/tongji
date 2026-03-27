import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { SalesEntrySuccessCard } from "@/components/sales-entry-success-card";

describe("sales entry success card", () => {
  test("renders the structured update summary", () => {
    render(
      <SalesEntrySuccessCard
        summary={{
          saleDate: "2026-03-26",
          count40: 5,
          count60: 2,
          total: 7,
          remark: "地推",
          savedAtIso: "2026-03-26T08:15:00.000Z",
          isUpdate: true,
          recoveredFromError: false,
        }}
      />,
    );

    expect(screen.getByText("今日记录已更新")).toBeInTheDocument();
    expect(screen.getByText("40 套餐数量")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看我的记录" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "继续调整今天记录" }),
    ).toBeInTheDocument();
  });
});
