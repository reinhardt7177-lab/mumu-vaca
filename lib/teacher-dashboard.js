import { createSupabaseAdmin } from "@/lib/supabase/server";

function toPercent(value) {
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

function getRateStatus(percent) {
  if (percent >= 80) return "good";
  if (percent >= 50) return "normal";
  return "low";
}

export async function getTeacherDashboard(teacherId) {
  const supabase = createSupabaseAdmin();

  let classesQuery = supabase.from("classes").select("id, name, grade, teacher_id").order("grade", { ascending: true });

  if (teacherId) {
    classesQuery = classesQuery.eq("teacher_id", teacherId);
  }

  const { data: classes, error: classError } = await classesQuery;

  if (classError) {
    throw new Error(classError.message);
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const classCards = await Promise.all(
    (classes ?? []).map(async (classInfo) => {
      const [{ count: studentCount, error: studentError }, { data: quests, error: questError }, { count: todayCheckins, error: checkinError }] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").eq("class_code", classInfo.id),
        supabase.from("quests").select("id").eq("class_id", classInfo.id),
        supabase.from("survival_checkins").select("id", { count: "exact", head: true }).eq("class_id", classInfo.id).gte("checked_at", todayStart.toISOString())
      ]);

      if (studentError || questError || checkinError) {
        throw new Error(studentError?.message ?? questError?.message ?? checkinError?.message ?? "학급 데이터 조회 실패");
      }

      const questIds = (quests ?? []).map((quest) => quest.id);
      let completionCount = 0;

      if (questIds.length > 0) {
        const { count, error: completionError } = await supabase
          .from("quest_completions")
          .select("id", { count: "exact", head: true })
          .in("quest_id", questIds);

        if (completionError) {
          throw new Error(completionError.message);
        }

        completionCount = count ?? 0;
      }

      const totalQuests = questIds.length;
      const students = studentCount ?? 0;
      const progressDenominator = Math.max(students * totalQuests, 1);
      const progressRate = completionCount / progressDenominator;
      const survivalRate = students > 0 ? (todayCheckins ?? 0) / students : 0;

      return {
        classId: classInfo.id,
        className: classInfo.name,
        grade: classInfo.grade,
        students,
        totalQuests,
        completionCount,
        todayCheckins: todayCheckins ?? 0,
        progressPercent: toPercent(progressRate),
        survivalPercent: toPercent(survivalRate),
        progressStatus: getRateStatus(toPercent(progressRate)),
        survivalStatus: getRateStatus(toPercent(survivalRate))
      };
    })
  );

  const totalStudents = classCards.reduce((acc, card) => acc + card.students, 0);
  const totalQuests = classCards.reduce((acc, card) => acc + card.totalQuests, 0);

  return {
    teacherId: teacherId ?? null,
    classCount: classCards.length,
    totalStudents,
    totalQuests,
    classCards
  };
}
