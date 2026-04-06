const BADGE_RULES = [
  {
    key: "weekly_sprout",
    name: "새싹 탐험가",
    level: 1,
    minCompletions: 5,
    reward: { xp: 12, acorns: 6 }
  },
  {
    key: "weekly_ranger",
    name: "숲길 레인저",
    level: 2,
    minCompletions: 10,
    reward: { xp: 20, acorns: 10 }
  },
  {
    key: "weekly_guardian",
    name: "숲의 수호자",
    level: 3,
    minCompletions: 15,
    reward: { xp: 30, acorns: 16 }
  }
];

export function getWeeklyBadgeByCompletions(count) {
  return [...BADGE_RULES].reverse().find((rule) => count >= rule.minCompletions) ?? null;
}

export function getBadgeRules() {
  return BADGE_RULES;
}
