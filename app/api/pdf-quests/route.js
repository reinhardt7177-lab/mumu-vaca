import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { parseQuestText } from "@/lib/pdf/quest-parser";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const classId = formData.get("classId");
    const teacherId = formData.get("teacherId") || null;
    const file = formData.get("pdf");

    if (!classId || typeof classId !== "string") {
      return NextResponse.json({ error: "classId는 필수입니다." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF 파일이 필요합니다." }, { status: 400 });
    }

    if (!file.type.includes("pdf")) {
      return NextResponse.json({ error: "PDF 형식만 업로드할 수 있어요." }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: fileBuffer });
    const parsed = await parser.getText();
    await parser.destroy();

    const parsedQuests = parseQuestText(parsed.text);

    if (!parsedQuests.length) {
      return NextResponse.json({ error: "PDF에서 퀘스트 문장을 찾지 못했어요." }, { status: 422 });
    }

    const supabaseAdmin = createSupabaseAdmin();
    const payload = parsedQuests.map((quest) => ({
      class_id: classId,
      created_by: teacherId,
      title: quest.title,
      description: quest.description,
      quest_type: quest.quest_type
    }));

    const { data, error } = await supabaseAdmin
      .from("quests")
      .insert(payload)
      .select("id, title, quest_type")
      .limit(100);

    if (error) {
      return NextResponse.json({ error: `Supabase 저장 실패: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({
      insertedCount: data?.length ?? 0,
      quests: data ?? []
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "PDF 파싱 중 알 수 없는 오류가 발생했어요."
      },
      { status: 500 }
    );
  }
}
