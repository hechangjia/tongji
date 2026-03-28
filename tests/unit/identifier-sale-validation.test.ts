import { describe, expect, test } from "vitest";
import { identifierSaleSchema } from "@/lib/validators/identifier-sale";

describe("identifier sale validation", () => {
  test("accepts a sale using an assigned lead", () => {
    expect(() =>
      identifierSaleSchema.parse({
        codeId: "code-1",
        planType: "PLAN_40",
        saleDate: "2026-03-28",
        sourceMode: "ASSIGNED_LEAD",
        prospectLeadId: "lead-1",
        remark: "现场转化",
      }),
    ).not.toThrow();
  });

  test("accepts a sale using manual QQ input", () => {
    expect(() =>
      identifierSaleSchema.parse({
        codeId: "code-1",
        planType: "PLAN_60",
        saleDate: "2026-03-28",
        sourceMode: "MANUAL_INPUT",
        qqNumber: "123456",
        major: "计算机",
      }),
    ).not.toThrow();
  });

  test("requires prospectLeadId when using an assigned lead", () => {
    expect(() =>
      identifierSaleSchema.parse({
        codeId: "code-1",
        planType: "PLAN_40",
        saleDate: "2026-03-28",
        sourceMode: "ASSIGNED_LEAD",
      }),
    ).toThrow("请选择已分配的新生线索");
  });

  test("requires manual QQ and major when using manual input", () => {
    expect(() =>
      identifierSaleSchema.parse({
        codeId: "code-1",
        planType: "PLAN_40",
        saleDate: "2026-03-28",
        sourceMode: "MANUAL_INPUT",
        qqNumber: "",
        major: "",
      }),
    ).toThrow();
  });

  test("rejects mixed assigned-lead and manual-input payloads", () => {
    expect(() =>
      identifierSaleSchema.parse({
        codeId: "code-1",
        planType: "PLAN_40",
        saleDate: "2026-03-28",
        sourceMode: "ASSIGNED_LEAD",
        prospectLeadId: "lead-1",
        qqNumber: "123456",
        major: "计算机",
      }),
    ).toThrow("已分配线索模式下不能再填写手动 QQ 信息");
  });
});
