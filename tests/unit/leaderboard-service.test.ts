import { describe, expect, test } from "vitest";
import { buildLeaderboard } from "@/server/services/leaderboard-service";

describe("leaderboard aggregation", () => {
  test("ranks by total count descending", () => {
    const board = buildLeaderboard([
      { userName: "A", count40: 1, count60: 1 },
      { userName: "B", count40: 3, count60: 0 },
    ]);

    expect(board[0].userName).toBe("B");
    expect(board[0].total).toBe(3);
    expect(board[0].rank).toBe(1);
  });
});
