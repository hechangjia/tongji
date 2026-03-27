export type AdminInsightReasonTag =
  | "结果下滑"
  | "目标偏差过大"
  | "晚交"
  | "驳回偏多";

export type AdminInsightRecommendedAction =
  | "ADJUST_TARGET"
  | "SEND_REMINDER"
  | "REVIEW_SALES";

export type AdminInsightRiskLevel = "HIGH" | "MEDIUM" | "LOW";

export type AdminInsightMemberCardInput = {
  userId: string;
  userName: string;
  targetTotal: number;
  currentTotal: number;
  recentAverageTotal: number;
  recentLateSubmissionCount: number;
  recentRejectedCount: number;
  recentDeclineDelta: number;
};

export type AdminInsightMemberCard = {
  userId: string;
  userName: string;
  riskScore: number;
  riskLevel: AdminInsightRiskLevel;
  reasonTags: AdminInsightReasonTag[];
  recommendedActions: AdminInsightRecommendedAction[];
  targetGap: number;
};

export function buildAdminInsightMemberCard(
  input: AdminInsightMemberCardInput,
): AdminInsightMemberCard {
  const reasonTags: AdminInsightReasonTag[] = [];
  const recommendedActions = new Set<AdminInsightRecommendedAction>();
  const targetGap = Math.max(0, input.targetTotal - input.currentTotal);
  let riskScore = 0;

  if (input.recentDeclineDelta >= 3 || input.currentTotal <= input.recentAverageTotal - 3) {
    riskScore += 2;
    reasonTags.push("结果下滑");
    recommendedActions.add("SEND_REMINDER");
  }

  if (targetGap >= 3 || (input.targetTotal > 0 && input.currentTotal / input.targetTotal <= 0.5)) {
    riskScore += 2;
    reasonTags.push("目标偏差过大");
    recommendedActions.add("ADJUST_TARGET");
    recommendedActions.add("SEND_REMINDER");
  }

  if (input.recentLateSubmissionCount > 0) {
    riskScore += 1;
    reasonTags.push("晚交");
    recommendedActions.add("SEND_REMINDER");
  }

  if (input.recentRejectedCount > 0) {
    riskScore += 1;
    reasonTags.push("驳回偏多");
    recommendedActions.add("REVIEW_SALES");
  }

  const riskLevel: AdminInsightRiskLevel =
    riskScore >= 4 ? "HIGH" : riskScore >= 2 ? "MEDIUM" : "LOW";

  return {
    userId: input.userId,
    userName: input.userName,
    riskScore,
    riskLevel,
    reasonTags,
    recommendedActions: Array.from(recommendedActions),
    targetGap,
  };
}
