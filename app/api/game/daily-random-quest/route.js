import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getUtcDayRange } from "@/lib/game/time-utils";

function pickRandom(items) {
  if (!items?.length) return null;
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

export async function GET(request) {
  try {
    const studentId = request.nextUrl.searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "studentId가 필요합니다." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { dayText } = getUtcDayRange();

    const { data: existing, error: existingError } = await supabase
      .from("student_daily_quests")
      .select("student_id, quest_date, completed_at, quest:quests(id, title, quest_type, description)")
      .eq("student_id", studentId)
      .eq("quest_date", dayText)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existing?.quest) {
      return NextResponse.json({
        questDate: dayText,
        assigned: true,
        completed: Boolean(existing.completed_at),
        quest: existing.quest
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, class_code")
      .eq("id", studentId)
      .single();

    if (profileError || !profile?.class_code) {
      return NextResponse.json({ error: "학생의 반 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    const [{ data: classQuests, error: questError }, { data: completedRows, error: completedError }] = await Promise.all([
      supabase
        .from("quests")
        .select("id, title, quest_type, description")
        .eq("class_id", profile.class_code),
      supabase.from("quest_completions").select("quest_id").eq("student_id", studentId)
    ]);

    if (questError || completedError) {
      return NextResponse.json({ error: questError?.message ?? completedError?.message }, { status: 500 });
    }

    if (!classQuests?.length) {
      return NextResponse.json({ error: "학급에 등록된 퀘스트가 없습니다." }, { status: 404 });
    }

    const completedSet = new Set((completedRows ?? []).map((row) => row.quest_id));
    const notCompletedPool = classQuests.filter((quest) => !completedSet.has(quest.id));
    const selectedQuest = pickRandom(notCompletedPool.length ? notCompletedPool : classQuests);

    if (!selectedQuest) {
      return NextResponse.json({ error: "랜덤 퀘스트를 고르지 못했어요." }, { status: 500 });
    }

    const { error: insertError } = await supabase.from("student_daily_quests").insert({
      student_id: studentId,
      quest_date: dayText,
      quest_id: selectedQuest.id
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      questDate: dayText,
      assigned: true,
      completed: false,
      quest: selectedQuest
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "오늘의 랜덤 퀘스트를 가져오지 못했습니다."
      },
      { status: 500 }
    );
  }
}
