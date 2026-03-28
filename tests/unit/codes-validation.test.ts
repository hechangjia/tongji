import { describe, expect, test } from "vitest";
import {
  identifierAssignmentSchema,
  identifierUploadSchema,
  prospectAssignmentSchema,
  prospectUploadSchema,
} from "@/lib/validators/codes";

describe("codes validation", () => {
  test("accepts a valid identifier assignment payload", () => {
    expect(() =>
      identifierAssignmentSchema.parse({
        userId: "member-1",
        codeIds: ["code-1", "code-2"],
      }),
    ).not.toThrow();
  });

  test("requires an assignee and at least one identifier code", () => {
    expect(() =>
      identifierAssignmentSchema.parse({
        userId: "",
        codeIds: [],
      }),
    ).toThrow();
  });

  test("accepts a valid prospect assignment payload", () => {
    expect(() =>
      prospectAssignmentSchema.parse({
        userId: "member-1",
        leadIds: ["lead-1"],
      }),
    ).not.toThrow();
  });

  test("requires an assignee and at least one prospect lead", () => {
    expect(() =>
      prospectAssignmentSchema.parse({
        userId: "",
        leadIds: [],
      }),
    ).toThrow();
  });

  test("requires a real identifier upload file", () => {
    expect(() =>
      identifierUploadSchema.parse({
        file: undefined,
      }),
    ).toThrow();

    expect(() =>
      identifierUploadSchema.parse({
        file: new File(["code"], "", {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      }),
    ).toThrow();
  });

  test("requires a real prospect upload file", () => {
    expect(() =>
      prospectUploadSchema.parse({
        file: undefined,
      }),
    ).toThrow();

    expect(() =>
      prospectUploadSchema.parse({
        file: new File(["qq"], "", {
          type: "text/csv",
        }),
      }),
    ).toThrow();
  });
});
