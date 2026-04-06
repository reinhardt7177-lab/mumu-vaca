import { NextResponse } from "next/server";
import { getTeacherDashboard } from "@/lib/teacher-dashboard";

export async function GET(request) {
  try {
    const teacherId = request.nextUrl.searchParams.get("teacherId");
    const dashboard = await getTeacherDashboard(teacherId);
    return NextResponse.json(dashboard);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "대시보드 데이터를 가져오지 못했습니다."
      },
      { status: 500 }
    );
  }
}
