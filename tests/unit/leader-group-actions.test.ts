import { beforeEach, describe, expect, test, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
);
const revalidatePathMock = vi.hoisted(() => vi.fn());
const userFindUniqueMock = vi.hoisted(() => vi.fn());
const groupUpdateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: userFindUniqueMock,
    },
    group: {
      update: groupUpdateMock,
    },
  },
}));

import { updateLeaderGroupProfileAction } from "@/app/(leader)/leader/group/actions";

describe("leader group actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("redirects guests to login", async () => {
    authMock.mockResolvedValue(null);

    const formData = new FormData();
    formData.set("slogan", "冲刺");
    formData.set("remark", "今日继续拉新");

    await expect(updateLeaderGroupProfileAction(formData)).rejects.toThrow(
      "redirect:/login?callbackUrl=%2Fleader%2Fgroup",
    );
  });

  test("rejects leaders without a bound group", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "leader-1",
        role: "LEADER",
        username: "leader01",
      },
    });
    userFindUniqueMock.mockResolvedValue({
      groupId: null,
    });

    const formData = new FormData();
    formData.set("slogan", "冲刺");
    formData.set("remark", "今日继续拉新");

    await expect(updateLeaderGroupProfileAction(formData)).rejects.toThrow(
      "redirect:/leader/group?notice=%E5%BD%93%E5%89%8D%E8%B4%A6%E5%8F%B7%E8%BF%98%E6%B2%A1%E6%9C%89%E7%BB%91%E5%AE%9A%E5%B0%8F%E7%BB%84%EF%BC%8C%E8%AF%B7%E5%85%88%E8%81%94%E7%B3%BB%E7%AE%A1%E7%90%86%E5%91%98%E5%A4%84%E7%90%86&noticeTone=error",
    );
  });

  test("updates the current leader group profile", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "leader-1",
        role: "LEADER",
        username: "leader01",
      },
    });
    userFindUniqueMock.mockResolvedValue({
      groupId: "group-1",
    });
    groupUpdateMock.mockResolvedValue({});

    const formData = new FormData();
    formData.set("slogan", "冲刺到底");
    formData.set("remark", "晚间重点盯紧转化");

    await expect(updateLeaderGroupProfileAction(formData)).rejects.toThrow(
      "redirect:/leader/group?notice=%E5%B0%8F%E7%BB%84%E4%BF%A1%E6%81%AF%E5%B7%B2%E6%9B%B4%E6%96%B0&noticeTone=success",
    );

    expect(groupUpdateMock).toHaveBeenCalledWith({
      where: { id: "group-1" },
      data: {
        slogan: "冲刺到底",
        remark: "晚间重点盯紧转化",
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/leader/group");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/groups");
  });
});
