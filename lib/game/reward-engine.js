const BASE_REWARD_BY_TYPE = {
  required: { xp: 15, acorns: 3, reason: "필수 퀘스트 완료" },
  optional: { xp: 10, acorns: 2, reason: "선택 퀘스트 완료" },
  survival: { xp: 8, acorns: 2, reason: "생존 퀘스트 완료" }
};

const COMBO_REWARD = {
  xp: 10,
  acorns: 4,
  reason: "하루 3콤보 보너스"
};

const STREAK_MILESTONE_REWARD = {
  3: { xp: 6, acorns: 5, reason: "3일 연속 출석 보상" },
  7: { xp: 12, acorns: 12, reason: "7일 연속 출석 보상" },
  14: { xp: 20, acorns: 25, reason: "14일 연속 출석 보상" }
};

export function getBaseReward(questType) {
  return BASE_REWARD_BY_TYPE[questType] ?? BASE_REWARD_BY_TYPE.required;
}

export function getComboReward(todayCompletionCount) {
  return todayCompletionCount === 3 ? COMBO_REWARD : null;
}

export function getStreakMilestoneReward(streakCount) {
  return STREAK_MILESTONE_REWARD[streakCount] ?? null;
}

export function calculateNextStreak(previousLastDate, previousCurrentStreak, todayDateText) {
  if (!previousLastDate) {
    return { currentStreak: 1, isNewDay: true };
  }

  if (previousLastDate === todayDateText) {
    return { currentStreak: previousCurrentStreak, isNewDay: false };
  }

  const yesterday = new Date(`${todayDateText}T00:00:00.000Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayText = yesterday.toISOString().slice(0, 10);

  if (previousLastDate === yesterdayText) {
    return { currentStreak: previousCurrentStreak + 1, isNewDay: true };
  }

  return { currentStreak: 1, isNewDay: true };
}
