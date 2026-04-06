import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getUtcWeekRange } from "@/lib/game/time-utils";

function dateRangeUtc() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export async function GET(request) {
  try {
    const studentId = request.nextUrl.searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "studentId가 필요합니다." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { startIso, endIso } = dateRangeUtc();
    const { weekStartText } = getUtcWeekRange();

    const [
      { data: profile, error: profileError },
      { data: streak, error: streakError },
      { count: todayCompletionCount, error: countError },
      { data: inventory, error: inventoryError },
      { data: equips, error: equipsError },
      { data: weeklyBadge, error: weeklyBadgeError }
    ] = await Promise.all([
      supabase.from("profiles").select("id, full_name, xp, acorns").eq("id", studentId).single(),
      supabase
        .from("student_streaks")
        .select("current_streak, best_streak, last_active_date")
        .eq("student_id", studentId)
        .maybeSingle(),
      supabase
        .from("quest_completions")
        .select("id", { head: true, count: "exact" })
        .eq("student_id", studentId)
        .gte("completed_at", startIso)
        .lt("completed_at", endIso),
      supabase
        .from("student_inventory")
        .select("item_key, item_name, quantity, acquired_at")
        .eq("student_id", studentId)
        .order("acquired_at", { ascending: false }),
      supabase
        .from("student_equips")
        .select("category, item_key, item_name")
        .eq("student_id", studentId),
      supabase
        .from("student_weekly_badges")
        .select("badge_key, badge_name, badge_level, completion_count, week_start_date")
        .eq("student_id", studentId)
        .eq("week_start_date", weekStartText)
        .maybeSingle()
    ]);

    if (profileError || streakError || countError || inventoryError || equipsError || weeklyBadgeError || !profile) {
      return NextResponse.json(
        {
          error:
            profileError?.message ??
            streakError?.message ??
            countError?.message ??
            inventoryError?.message ??
            equipsError?.message ??
            weeklyBadgeError?.message ??
            "학생 정보를 찾을 수 없습니다."
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profile,
      streak: {
        current: streak?.current_streak ?? 0,
        best: streak?.best_streak ?? 0,
        lastActiveDate: streak?.last_active_date ?? null
      },
      todayCompletionCount: todayCompletionCount ?? 0,
      inventory: inventory ?? [],
      equips: equips ?? [],
      weeklyBadge: weeklyBadge ?? null
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "학생 상태 조회에 실패했습니다."
      },
      { status: 500 }
    );
  }
}
