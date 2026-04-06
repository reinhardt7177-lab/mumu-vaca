import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  calculateNextStreak,
  getBaseReward,
  getComboReward,
  getStreakMilestoneReward
} from "@/lib/game/reward-engine";
import { getUtcDayRange, getUtcWeekRange } from "@/lib/game/time-utils";
import { getWeeklyBadgeByCompletions } from "@/lib/game/weekly-badge";

export async function POST(request) {
  try {
    const body = await request.json();
    const studentId = body?.studentId;
    const questId = body?.questId;
    const note = typeof body?.note === "string" ? body.note : null;

    if (!studentId || !questId) {
      return NextResponse.json({ error: "studentId와 questId는 필수입니다." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    const { data: quest, error: questError } = await supabase
      .from("quests")
      .select("id, title, quest_type")
      .eq("id", questId)
      .single();

    if (questError || !quest) {
      return NextResponse.json({ error: "퀘스트를 찾을 수 없습니다." }, { status: 404 });
    }

    const { error: insertCompletionError } = await supabase
      .from("quest_completions")
      .insert({ quest_id: questId, student_id: studentId, note });

    if (insertCompletionError) {
      if (insertCompletionError.code === "23505") {
        return NextResponse.json({ error: "이미 완료한 퀘스트입니다." }, { status: 409 });
      }
      return NextResponse.json({ error: insertCompletionError.message }, { status: 500 });
    }

    const { dayText: todayText, startIso, endIso } = getUtcDayRange();
    const { weekStartText, weekStartIso, weekEndIso } = getUtcWeekRange();

    const [
      { count: todayCompletionCount, error: todayCountError },
      { count: weekCompletionCount, error: weekCountError },
      { data: streakRow, error: streakError },
      { data: profileRow, error: profileError },
      { data: weeklyBadgeRow, error: weeklyBadgeError }
    ] = await Promise.all([
        supabase
          .from("quest_completions")
          .select("id", { head: true, count: "exact" })
          .eq("student_id", studentId)
          .gte("completed_at", startIso)
          .lt("completed_at", endIso),
        supabase
          .from("quest_completions")
          .select("id", { head: true, count: "exact" })
          .eq("student_id", studentId)
          .gte("completed_at", weekStartIso)
          .lt("completed_at", weekEndIso),
        supabase
          .from("student_streaks")
          .select("student_id, current_streak, best_streak, last_active_date")
          .eq("student_id", studentId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("id, xp, acorns")
          .eq("id", studentId)
          .single(),
        supabase
          .from("student_weekly_badges")
          .select("id, badge_level")
          .eq("student_id", studentId)
          .eq("week_start_date", weekStartText)
          .maybeSingle()
      ]);

    if (todayCountError || weekCountError || streakError || profileError || weeklyBadgeError || !profileRow) {
      return NextResponse.json(
        {
          error:
            todayCountError?.message ??
            weekCountError?.message ??
            streakError?.message ??
            profileError?.message ??
            weeklyBadgeError?.message ??
            "학생 데이터를 찾을 수 없습니다."
        },
        { status: 500 }
      );
    }

    const baseReward = getBaseReward(quest.quest_type);
    const comboReward = getComboReward(todayCompletionCount ?? 0);

    const nextStreakResult = calculateNextStreak(
      streakRow?.last_active_date ?? null,
      streakRow?.current_streak ?? 0,
      todayText
    );

    const bestStreak = Math.max(streakRow?.best_streak ?? 0, nextStreakResult.currentStreak);
    const streakReward = nextStreakResult.isNewDay ? getStreakMilestoneReward(nextStreakResult.currentStreak) : null;

    const reachedBadge = getWeeklyBadgeByCompletions(weekCompletionCount ?? 0);
    const shouldUpgradeBadge =
      reachedBadge && (!weeklyBadgeRow || reachedBadge.level > (weeklyBadgeRow.badge_level ?? 0));
    const weeklyBadgeReward = shouldUpgradeBadge ? reachedBadge.reward : null;

    const totalXp = baseReward.xp + (comboReward?.xp ?? 0) + (streakReward?.xp ?? 0) + (weeklyBadgeReward?.xp ?? 0);
    const totalAcorns =
      baseReward.acorns + (comboReward?.acorns ?? 0) + (streakReward?.acorns ?? 0) + (weeklyBadgeReward?.acorns ?? 0);

    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({
        xp: (profileRow.xp ?? 0) + totalXp,
        acorns: (profileRow.acorns ?? 0) + totalAcorns
      })
      .eq("id", studentId);

    if (updateProfileError) {
      return NextResponse.json({ error: updateProfileError.message }, { status: 500 });
    }

    const { error: upsertStreakError } = await supabase.from("student_streaks").upsert(
      {
        student_id: studentId,
        current_streak: nextStreakResult.currentStreak,
        best_streak: bestStreak,
        last_active_date: todayText
      },
      { onConflict: "student_id" }
    );

    if (upsertStreakError) {
      return NextResponse.json({ error: upsertStreakError.message }, { status: 500 });
    }

    if (shouldUpgradeBadge) {
      const { error: upsertBadgeError } = await supabase.from("student_weekly_badges").upsert(
        {
          student_id: studentId,
          week_start_date: weekStartText,
          badge_key: reachedBadge.key,
          badge_name: reachedBadge.name,
          badge_level: reachedBadge.level,
          completion_count: weekCompletionCount ?? 0
        },
        { onConflict: "student_id,week_start_date" }
      );

      if (upsertBadgeError) {
        return NextResponse.json({ error: upsertBadgeError.message }, { status: 500 });
      }
    }

    await supabase
      .from("student_daily_quests")
      .update({ completed_at: new Date().toISOString() })
      .eq("student_id", studentId)
      .eq("quest_date", todayText)
      .eq("quest_id", questId)
      .is("completed_at", null);

    const rewardLogs = [
      {
        student_id: studentId,
        source: "quest",
        reason: baseReward.reason,
        xp_amount: baseReward.xp,
        acorn_amount: baseReward.acorns,
        quest_id: questId
      }
    ];

    if (comboReward) {
      rewardLogs.push({
        student_id: studentId,
        source: "combo",
        reason: comboReward.reason,
        xp_amount: comboReward.xp,
        acorn_amount: comboReward.acorns,
        quest_id: questId
      });
    }

    if (streakReward) {
      rewardLogs.push({
        student_id: studentId,
        source: "streak",
        reason: streakReward.reason,
        xp_amount: streakReward.xp,
        acorn_amount: streakReward.acorns,
        quest_id: questId
      });
    }

    if (weeklyBadgeReward && reachedBadge) {
      rewardLogs.push({
        student_id: studentId,
        source: "event",
        reason: `주간 배지 달성: ${reachedBadge.name}`,
        xp_amount: weeklyBadgeReward.xp,
        acorn_amount: weeklyBadgeReward.acorns,
        quest_id: questId
      });
    }

    const [{ error: rewardLogError }, { error: xpLogError }] = await Promise.all([
      supabase.from("reward_logs").insert(rewardLogs),
      supabase.from("xp_logs").insert({
        student_id: studentId,
        amount: totalXp,
        reason: `퀘스트 완료 보상 (${quest.title})`
      })
    ]);

    if (rewardLogError || xpLogError) {
      return NextResponse.json({ error: rewardLogError?.message ?? xpLogError?.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "퀘스트 완료! 도토리와 경험치를 받았어요.",
      questTitle: quest.title,
      gained: {
        xp: totalXp,
        acorns: totalAcorns
      },
      detail: {
        baseReward,
        comboReward,
        streakReward,
        weeklyBadge: shouldUpgradeBadge ? reachedBadge : null
      },
      streak: {
        current: nextStreakResult.currentStreak,
        best: bestStreak
      },
      weekly: {
        completionCount: weekCompletionCount ?? 0,
        badge: shouldUpgradeBadge ? reachedBadge : null
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "완료 처리 중 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}
