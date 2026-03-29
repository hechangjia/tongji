import { render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

const useActionStateMock = vi.hoisted(() => vi.fn());
const useFormStatusMock = vi.hoisted(() => vi.fn());

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");

  return {
    ...actual,
    useActionState: useActionStateMock,
  };
});

vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom");

  return {
    ...actual,
    useFormStatus: useFormStatusMock,
  };
});

vi.mock("@/app/(admin)/admin/codes/actions", () => ({
  importIdentifierCodesAction: vi.fn(),
  importProspectLeadsAction: vi.fn(),
}));

import { CodeImportCard } from "@/components/admin/code-import-card";
import { ProspectImportCard } from "@/components/admin/prospect-import-card";

describe("admin import cards", () => {
  test("server action upload forms do not declare encType explicitly", () => {
    useActionStateMock.mockImplementation((_action, initialState) => [initialState, vi.fn()]);
    useFormStatusMock.mockReturnValue({
      pending: false,
    });

    const { container } = render(
      <>
        <CodeImportCard />
        <ProspectImportCard />
      </>,
    );

    const forms = Array.from(container.querySelectorAll("form"));

    expect(forms).toHaveLength(2);

    for (const form of forms) {
      expect(form).not.toHaveAttribute("enctype");
    }
  });
});
