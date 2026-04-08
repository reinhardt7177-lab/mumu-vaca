"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, LogOut, Plus, RefreshCw, School, Sparkles, Trash2, Users, WandSparkles } from "lucide-react";
import { getSessionUser, signOutSession } from "@/lib/auth/client";
import { createTeacherClass, deleteTeacherClass, getTeacherClassBoard, listTeacherClasses } from "@/lib/firebase/classes";
import { createStudentInvite } from "@/lib/firebase/invites";
import { RequireAuth } from "@/components/auth/require-auth";
import { VacationPlanBuilder } from "@/components/teacher/vacation-plan-builder";

function toText(value) {
  return String(value ?? "").trim();
}

function formatDateTime(value) {
  if (!value) return "-";

  const millis = typeof value?.toMillis === "function" ? value.toMillis() : typeof value?.seconds === "number" ? value.seconds * 1000 : null;
  if (!millis) return "-";

  return new Date(millis).toLocaleString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function teacherFriendlyError(error, fallbackMessage) {
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? "");

  if (code === "auth/configuration-not-found" || message.includes("CONFIGURATION_NOT_FOUND")) {
    return "Firebase 인증 설정이 아직 비어 있어요. Authentication > 로그인 방법 > 이메일/비밀번호를 켜 주세요.";
  }

  if (code === "permission-denied") {
    return "권한이 없어요. 교사 계정으로 다시 로그인해 주세요.";
  }

  return message || fallbackMessage;
}

function ClassCard({ item, selected, onOpen, onDelete }) {
  return (
    <article className={`rounded-2xl border p-4 ${selected ? "border-[#32563a] bg-[#f0f8f1]" : "border-fairy-ink/15 bg-white"}`}>
      <p className="text-xs font-semibold text-fairy-ink/60">{item.grade}학년 · {item.classCode}</p>
      <h3 className="mt-1 text-lg font-bold text-fairy-ink">{item.className}</h3>
      <p className="mt-2 text-sm text-fairy-ink/75">학생 {item.studentCount}명 · 활성 초대코드 {item.activeInviteCount}개</p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onOpen(item.classId)}
          className="inline-flex items-center gap-1 rounded-full bg-[#32563a] px-3 py-1.5 text-xs font-semibold text-white"
        >
          <School className="h-3.5 w-3.5" /> 상황판 열기
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.classId)}
          className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
        >
          <Trash2 className="h-3.5 w-3.5" /> 삭제
        </button>
      </div>
    </article>
  );
}

export default function TeacherPage() {
  const [sessionUser, setSessionUser] = useState(null);
  const [dataMode, setDataMode] = useState("firebase");
  const [topError, setTopError] = useState("");

  const [classNameInput, setClassNameInput] = useState("");
  const [classCodeInput, setClassCodeInput] = useState("");
  const [classGradeInput, setClassGradeInput] = useState(3);
  const [classCreating, setClassCreating] = useState(false);

  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState("");

  const [board, setBoard] = useState(null);
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardError, setBoardError] = useState("");

  const [inviteLoading, setInviteLoading] = useState(false);
  const [latestInviteCode, setLatestInviteCode] = useState("");
  const [latestInviteLink, setLatestInviteLink] = useState("");
  const [notice, setNotice] = useState("");
  const boardSectionRef = useRef(null);

  const summaryText = useMemo(() => {
    const totalStudents = classes.reduce((acc, item) => acc + Number(item.studentCount ?? 0), 0);
    return `내 학급 ${classes.length}개 · 학생 ${totalStudents}명`;
  }, [classes]);

  async function refreshClasses(preferredClassId = "") {
    setClassesLoading(true);
    setTopError("");

    try {
      const list = await listTeacherClasses();
      setClasses(list);

      const chosenId = preferredClassId || selectedClassId;
      if (chosenId && list.some((item) => item.classId === chosenId)) {
        setSelectedClassId(chosenId);
      } else if (list.length > 0) {
        setSelectedClassId(list[0].classId);
      } else {
        setSelectedClassId("");
        setBoard(null);
      }
    } catch (error) {
      setTopError(teacherFriendlyError(error, "학급 목록을 불러오지 못했어요."));
    } finally {
      setClassesLoading(false);
    }
  }

  async function loadBoard(classId) {
    if (!classId) {
      setBoard(null);
      return;
    }

    setBoardLoading(true);
    setBoardError("");

    try {
      const payload = await getTeacherClassBoard(classId);
      setBoard(payload);
    } catch (error) {
      setBoardError(teacherFriendlyError(error, "학급 상황판을 불러오지 못했어요."));
    } finally {
      setBoardLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const user = await getSessionUser();
        if (!mounted) return;

        setSessionUser(user ?? null);
        if (user?.provider !== "firebase") {
          setDataMode("supabase");
          setTopError("교사 학급 기능은 Firebase 로그인 모드에서 동작해요. Firebase 계정으로 로그인해 주세요.");
          setClassesLoading(false);
          return;
        }

        setDataMode("firebase");
        await refreshClasses();
      } catch (error) {
        if (mounted) {
          setTopError(teacherFriendlyError(error, "초기화에 실패했어요."));
          setClassesLoading(false);
        }
      }
    }

    init();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (dataMode !== "firebase") return;
    loadBoard(selectedClassId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, dataMode]);

  async function handleCreateClass(event) {
    event.preventDefault();
    setClassCreating(true);
    setTopError("");
    setNotice("");

    try {
      const created = await createTeacherClass({
        className: classNameInput,
        classCode: classCodeInput,
        grade: classGradeInput
      });

      setClassNameInput("");
      setClassCodeInput("");
      setClassGradeInput(3);
      setNotice(`학급 생성 완료: ${created.className} (${created.classCode})`);
      await refreshClasses(created.classId);
    } catch (error) {
      setTopError(teacherFriendlyError(error, "학급 생성에 실패했어요."));
    } finally {
      setClassCreating(false);
    }
  }

  async function handleDeleteClass(classId) {
    const target = classes.find((item) => item.classId === classId);
    const label = target ? `${target.className} (${target.classCode})` : "이 학급";
    const ok = window.confirm(`${label} 학급을 삭제할까요?\n삭제하면 해당 학급 초대코드는 모두 비활성화돼요.`);
    if (!ok) return;

    setTopError("");
    setNotice("");

    try {
      await deleteTeacherClass(classId);
      setLatestInviteCode("");
      setLatestInviteLink("");
      setNotice("학급을 삭제했어요.");
      await refreshClasses();
    } catch (error) {
      setTopError(teacherFriendlyError(error, "학급 삭제에 실패했어요."));
    }
  }

  async function handleCreateInvite() {
    if (!selectedClassId) return;

    setInviteLoading(true);
    setTopError("");
    setNotice("");

    try {
      const code = await createStudentInvite({ classId: selectedClassId });
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const link = `${origin}/join?code=${encodeURIComponent(code)}`;

      setLatestInviteCode(code);
      setLatestInviteLink(link);
      setNotice("초대코드를 만들었어요. 링크를 복사해서 학생에게 보내 주세요.");

      await Promise.all([loadBoard(selectedClassId), refreshClasses(selectedClassId)]);
    } catch (error) {
      setTopError(teacherFriendlyError(error, "초대코드 생성에 실패했어요."));
    } finally {
      setInviteLoading(false);
    }
  }

  function handleOpenBoard(classId) {
    if (!classId) return;
    setSelectedClassId(classId);
    setBoard(null);
    setBoardError("");
    loadBoard(classId);

    setTimeout(() => {
      boardSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  async function copyText(value, label) {
    if (!toText(value)) return;

    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label}를 복사했어요.`);
    } catch {
      setTopError("클립보드 복사에 실패했어요.");
    }
  }

  async function handleSignOut() {
    await signOutSession();
    window.location.href = "/login";
  }

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <section className="rounded-fairy bg-white/88 p-6 shadow-fairy backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-fairy-ink/70">교사용 지휘소</p>
              <h1 className="mt-2 text-3xl font-bold leading-tight">학급 만들기 · 상황판 · 초대링크</h1>
              <p className="mt-3 text-sm text-fairy-ink/75">{summaryText}</p>
              <p className="mt-1 text-xs text-fairy-ink/65">로그인: {sessionUser?.email ?? "-"}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => refreshClasses()}
                className="inline-flex items-center gap-1 rounded-full bg-fairy-sky px-4 py-2 text-sm font-semibold text-fairy-ink"
              >
                <RefreshCw className="h-4 w-4" /> 새로고침
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-fairy-ink"
              >
                <LogOut className="h-4 w-4" /> 로그아웃
              </button>
            </div>
          </div>

          {dataMode !== "firebase" ? (
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">교사 학급 기능은 Firebase 모드에서만 동작해요.</p>
          ) : null}
          {topError ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{topError}</p> : null}
          {notice ? <p className="mt-4 rounded-xl bg-[#d9f3e4] p-3 text-sm text-[#214a34]">{notice}</p> : null}
        </section>

        <section className="rounded-fairy bg-white p-6 shadow-fairy">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <Plus className="h-5 w-5" /> 학급 생성
          </h2>

          <form onSubmit={handleCreateClass} className="grid gap-3 sm:grid-cols-[1fr_1fr_120px_auto]">
            <label className="grid gap-1 text-sm font-semibold">
              학급 이름
              <input
                value={classNameInput}
                onChange={(event) => setClassNameInput(event.target.value)}
                required
                disabled={dataMode !== "firebase" || classCreating}
                className="rounded-xl border border-fairy-ink/20 px-4 py-2 outline-none ring-fairy-sky focus:ring"
                placeholder="예: 강진중앙초 4학년 3반"
              />
            </label>

            <label className="grid gap-1 text-sm font-semibold">
              학급 코드
              <input
                value={classCodeInput}
                onChange={(event) => setClassCodeInput(event.target.value)}
                disabled={dataMode !== "firebase" || classCreating}
                className="rounded-xl border border-fairy-ink/20 px-4 py-2 outline-none ring-fairy-sky focus:ring"
                placeholder="예: GJ-4-3 (비우면 자동 생성)"
              />
            </label>

            <label className="grid gap-1 text-sm font-semibold">
              학년
              <select
                value={classGradeInput}
                onChange={(event) => setClassGradeInput(Number(event.target.value))}
                disabled={dataMode !== "firebase" || classCreating}
                className="rounded-xl border border-fairy-ink/20 px-3 py-2 outline-none ring-fairy-sky focus:ring"
              >
                {[1, 2, 3, 4, 5, 6].map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}학년
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={dataMode !== "firebase" || classCreating}
              className="self-end rounded-full bg-[#32563a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {classCreating ? "생성 중..." : "학급 만들기"}
            </button>
          </form>
        </section>

        <section className="rounded-fairy bg-white p-6 shadow-fairy">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <School className="h-5 w-5" /> 내 학급 목록
          </h2>

          {classesLoading ? <p className="text-sm text-fairy-ink/70">학급 목록을 불러오는 중이에요...</p> : null}

          {!classesLoading && classes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-fairy-ink/30 p-4 text-sm text-fairy-ink/70">아직 만든 학급이 없어요. 위에서 첫 학급을 만들어 보세요.</p>
          ) : null}

          {!classesLoading && classes.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((item) => (
                <ClassCard
                  key={item.classId}
                  item={item}
                  selected={item.classId === selectedClassId}
                  onOpen={handleOpenBoard}
                  onDelete={handleDeleteClass}
                />
              ))}
            </div>
          ) : null}
        </section>

        <section ref={boardSectionRef} className="rounded-fairy bg-white p-6 shadow-fairy">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <WandSparkles className="h-5 w-5" /> 학급 상황판
          </h2>

          {!selectedClassId ? (
            <p className="rounded-xl border border-dashed border-fairy-ink/30 p-4 text-sm text-fairy-ink/70">상황판을 볼 학급을 먼저 선택해 주세요.</p>
          ) : null}

          {boardError ? <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{boardError}</p> : null}
          {boardLoading ? <p className="text-sm text-fairy-ink/70">학급 상황판을 불러오는 중이에요...</p> : null}

          {!boardLoading && board ? (
            <div className="grid gap-6">
              <div className="rounded-2xl bg-fairy-cream p-4">
                <p className="text-xs font-semibold text-fairy-ink/60">{board.classInfo.grade}학년 · {board.classInfo.classCode}</p>
                <h3 className="mt-1 text-xl font-bold text-fairy-ink">{board.classInfo.className}</h3>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-fairy-ink">학생 {board.studentCount}명</span>
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-fairy-ink">활성 초대코드 {board.activeInviteCount}개</span>
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-fairy-ink">누적 초대코드 {board.invites.length}개</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCreateInvite}
                    disabled={inviteLoading}
                    className="inline-flex items-center gap-1 rounded-full bg-[#32563a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    <Sparkles className="h-4 w-4" /> {inviteLoading ? "초대코드 생성 중..." : "새 초대코드 생성"}
                  </button>
                  <button
                    type="button"
                    onClick={() => loadBoard(selectedClassId)}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-fairy-ink"
                  >
                    <RefreshCw className="h-4 w-4" /> 상황판 새로고침
                  </button>
                </div>
              </div>

              {latestInviteCode ? (
                <div className="rounded-2xl border border-[#bfd8f8] bg-[#e7f2ff]/90 p-4">
                  <p className="text-sm font-bold text-[#31557c]">방금 만든 초대코드</p>
                  <p className="mt-1 text-lg font-black text-[#31557c]">{latestInviteCode}</p>
                  <p className="mt-2 break-all text-sm text-[#31557c]/90">{latestInviteLink}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => copyText(latestInviteCode, "초대코드")}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#31557c]"
                    >
                      <Copy className="h-3.5 w-3.5" /> 코드 복사
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(latestInviteLink, "초대링크")}
                      className="inline-flex items-center gap-1 rounded-full bg-[#31557c] px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      <Copy className="h-3.5 w-3.5" /> 링크 복사
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-2">
                <article className="rounded-2xl border border-fairy-ink/15 p-4">
                  <h4 className="text-sm font-bold text-fairy-ink">초대코드 목록</h4>
                  {board.invites.length === 0 ? (
                    <p className="mt-3 text-sm text-fairy-ink/70">아직 만든 초대코드가 없어요.</p>
                  ) : (
                    <ul className="mt-3 space-y-2 text-sm">
                      {board.invites.map((invite) => {
                        const code = String(invite.inviteCode ?? invite.id ?? "");
                        const link = `${typeof window !== "undefined" ? window.location.origin : ""}/join?code=${encodeURIComponent(code)}`;
                        return (
                          <li key={code} className="rounded-xl bg-fairy-cream p-3">
                            <p className="font-semibold text-fairy-ink">{code}</p>
                            <p className="text-xs text-fairy-ink/70">{invite.isActive ? "활성" : "비활성"} · 생성 {formatDateTime(invite.createdAt)}</p>
                            <button
                              type="button"
                              onClick={() => copyText(link, "초대링크")}
                              className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-fairy-ink"
                            >
                              <Copy className="h-3 w-3" /> 링크 복사
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </article>

                <article className="rounded-2xl border border-fairy-ink/15 p-4">
                  <h4 className="inline-flex items-center gap-1 text-sm font-bold text-fairy-ink">
                    <Users className="h-4 w-4" /> 학생 가입 현황
                  </h4>
                  {board.students.length === 0 ? (
                    <p className="mt-3 text-sm text-fairy-ink/70">아직 이 학급으로 가입한 학생이 없어요.</p>
                  ) : (
                    <ul className="mt-3 space-y-2 text-sm">
                      {board.students.map((student) => (
                        <li key={student.uid ?? student.id} className="rounded-xl bg-fairy-cream p-3">
                          <p className="font-semibold text-fairy-ink">{student.fullName || student.email || "이름 미설정"}</p>
                          <p className="text-xs text-fairy-ink/70">{student.email || "-"}</p>
                          <p className="text-xs text-fairy-ink/70">가입 {formatDateTime(student.createdAt)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </div>
            </div>
          ) : null}
        </section>

        <VacationPlanBuilder
          selectedClassInfo={board?.classInfo ?? null}
          teacherEmail={sessionUser?.email ?? ""}
        />
      </main>
    </RequireAuth>
  );
}
