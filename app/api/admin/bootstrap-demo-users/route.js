import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const bootstrapKey = process.env.BOOTSTRAP_ADMIN_KEY;

function toAuthPassword(loginPassword) {
  if (!loginPassword) return "12341234";
  return loginPassword === "1234" ? "12341234" : loginPassword;
}

async function findUserByEmail(supabase, email) {
  let page = 1;
  const perPage = 200;

  while (page < 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const found = data.users.find((user) => (user.email ?? "").toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

async function ensureUser(supabase, { email, password, role, fullName }) {
  let user = await findUserByEmail(supabase, email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, full_name: fullName }
    });
    if (error) throw error;
    user = data.user;
  }

  const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
    user_metadata: { ...(user.user_metadata ?? {}), role, full_name: fullName }
  });
  if (updateError) throw updateError;

  return updated.user;
}

export async function POST(request) {
  try {
    const requestKey = request.headers.get("x-bootstrap-key");
    if (!bootstrapKey || requestKey !== bootstrapKey) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) ?? {};
    const teacherId = String(body.teacherId ?? "teacher1").trim().toLowerCase();
    const studentId = String(body.studentId ?? "student1").trim().toLowerCase();
    const loginPassword = String(body.password ?? "1234").trim() || "1234";
    const authPassword = toAuthPassword(loginPassword);

    const teacherEmail = `${teacherId}@fairy-class.local`;
    const studentEmail = `${studentId}@fairy-class.local`;

    const supabase = createSupabaseAdmin();

    const teacherUser = await ensureUser(supabase, {
      email: teacherEmail,
      password: authPassword,
      role: "teacher",
      fullName: "요정 선생님"
    });

    const studentUser = await ensureUser(supabase, {
      email: studentEmail,
      password: authPassword,
      role: "student",
      fullName: "요정 학생"
    });

    let classId = null;
    const { data: existingClass } = await supabase
      .from("classes")
      .select("id")
      .eq("teacher_id", teacherUser.id)
      .limit(1)
      .maybeSingle();

    if (existingClass?.id) {
      classId = existingClass.id;
    } else {
      const { data: insertedClass, error: classInsertError } = await supabase
        .from("classes")
        .insert([{ name: "요정 3반", grade: 3, teacher_id: teacherUser.id }])
        .select("id")
        .single();

      if (classInsertError) throw classInsertError;
      classId = insertedClass.id;
    }

    const { error: teacherProfileError } = await supabase.from("profiles").upsert([
      {
        id: teacherUser.id,
        role: "teacher",
        full_name: "요정 선생님",
        grade: 3,
        class_code: classId
      }
    ]);
    if (teacherProfileError) throw teacherProfileError;

    const { error: studentProfileError } = await supabase.from("profiles").upsert([
      {
        id: studentUser.id,
        role: "student",
        full_name: "요정 학생",
        grade: 3,
        class_code: classId
      }
    ]);
    if (studentProfileError) throw studentProfileError;

    return NextResponse.json({
      ok: true,
      credentials: {
        teacher: { id: teacherId, email: teacherEmail, password: loginPassword },
        student: { id: studentId, email: studentEmail, password: loginPassword }
      },
      classId
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error?.message ?? "데모 계정 생성에 실패했습니다."
      },
      { status: 500 }
    );
  }
}
