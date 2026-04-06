export function getUtcDayRange() {
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  return {
    dayText: dayStart.toISOString().slice(0, 10),
    startIso: dayStart.toISOString(),
    endIso: dayEnd.toISOString()
  };
}

export function getUtcWeekRange() {
  const now = new Date();
  const day = now.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  weekStart.setUTCDate(weekStart.getUTCDate() + mondayOffset);

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  return {
    weekStartText: weekStart.toISOString().slice(0, 10),
    weekEndText: weekEnd.toISOString().slice(0, 10),
    weekStartIso: weekStart.toISOString(),
    weekEndIso: weekEnd.toISOString()
  };
}
