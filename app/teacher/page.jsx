"use client";

import { useEffect, useMemo, useState } from "react";
import { FileUp, Leaf, LogOut, Sparkles, WandSparkles } from "lucide-react";
import { getSessionUser, signOutSession } from "@/lib/auth/client";
import { createStudentInvite } from "@/lib/firebase/invites";
import { RequireAuth } from "@/components/auth/require-auth";

const statusColor = {
  good: "bg-emerald-100 text-emerald-800",
  normal: "bg-amber-100 text-amber-800",
  low: "bg-rose-100 text-rose-800"
};

function ClassCard({ card }) {
  return (
    <article className="rounded-fairy bg-white p-5 shadow-fairy">
      <p className="text-xs font-semibold text-fairy-ink/60">{card.grade}학년</p>
      <h3 className="mt-1 text-lg font-bold">{card.className}</h3>
      <p className="mt-2 text-sm text-fairy-ink/70">학생 {card.students}명 · 퀘스트 {card.totalQuests}개</p>

      <div className="mt-4 grid gap-2 text-sm">
        <div className="flex items-center justify-between rounded-xl bg-fairy-cream px-3 py-2">
          <span>진도율</span>
          <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusColor[card.progressStatus]}`}>{card.progressPercent}%</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-fairy-cream px-3 py-2">
          <span>오늘 생존율</span>
          <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusColor[card.survivalStatus]}`}>{card.survivalPercent}%</span>
        </div>
      </div>
    </article>
  );
}

export default function TeacherPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [dataMode, setDataMode] = useState("supabase");

  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [teacherFilter, setTeacherFilter] = useState("");
  const [teacherIdInput, setTeacherIdInput] = useState("");
  const [sessionUser, setSessionUser] = useState(null);
  const [inviteClassCode, setInviteClassCode] = useState("");
  const [inviteGrade, setInviteGrade] = useState(3);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteNotice, setInviteNotice] = useState("");

  async function loadDashboard(teacherId = "") {
    setDashboardLoading(true);
    setDashboardError("");

    try {
      const query = teacherId ? `?teacherId=${encodeURIComponent(teacherId)}` : "";
      const response = await fetch(`/api/teacher-dashboard${query}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "학급 현황을 가져오지 못했습니다.");
      }

      setDashboard(payload);
    } catch (fetchError) {
      setDashboardError(fetchError.message);
    } finally {
      setDashboardLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const user = await getSessionUser();

        if (!mounted) return;
        setSessionUser(user ?? null);

        if (user?.provider === "firebase") {
          setDataMode("firebase");
          setDashboard({
            classCount: 0,
            totalStudents: 0,
            totalQuests: 0,
            classCards: []
          });
          setDashboardLoading(false);
          return;
        }

        setDataMode("supabase");
        if (user?.id) {
          setTeacherFilter(user.id);
          setTeacherIdInput(user.id);
          await loadDashboard(user.id);
        } else {
          await loadDashboard();
        }
      } catch {
        if (mounted) {
          await loadDashboard();
        }
      }
    }

    initSession();
    return () => {
      mounted = false;
    };
  }, []);

  const summaryText = useMemo(() => {
    if (!dashboard) return "데이터를 불러오는 중이에요.";
    return `총 ${dashboard.classCount}개 학급, 학생 ${dashboard.totalStudents}명, 등록 퀘스트 ${dashboard.totalQuests}개`;
  }, [dashboard]);

  async function handleSignOut() {
    await signOutSession();
    setSessionUser(null);
    setTeacherFilter("");
    setTeacherIdInput("");
    await loadDashboard();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (dataMode === "firebase") {
      setError("현재 교사 대시보드 데이터는 Supabase 기반입니다. Firestore 마이그레이션 후 활성화됩니다.");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData(event.currentTarget);
      if (teacherIdInput.trim()) {
        formData.set("teacherId", teacherIdInput.trim());
      } else if (sessionUser?.id && !String(formData.get("teacherId") ?? "").trim()) {
        formData.set("teacherId", sessionUser.id);
      }

      const response = await fetch("/api/pdf-quests", {
        method: "POST",
        body: formData
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "PDF 처리에 실패했습니다.");
      }

      setResult(payload);
      await loadDashboard(String(formData.get("teacherId") ?? "").trim());
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateInvite(event) {
    event.preventDefault();
    setError("");
    setInviteNotice("");
    setInviteCode("");
    setInviteLink("");
    setInviteLoading(true);

    try {
      const code = await createStudentInvite({
        classCode: inviteClassCode,
        grade: inviteGrade
      });
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const link = `${origin}/join?code=${encodeURIComponent(code)}`;
      setInviteCode(code);
      setInviteLink(link);
    } catch (inviteError) {
      setError(inviteError.message ?? "초대코드 생성에 실패했어요.");
    } finally {
      setInviteLoading(false);
    }
  }

  async function copyInviteLink() {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteNotice("초대링크를 복사했어요.");
    } catch {
      setError("클립보드 복사에 실패했어요.");
    }
  }

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <section className="rounded-fairy bg-white/85 p-8 shadow-fairy backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-fairy-ink/70">마법의 지휘소</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight">학급 현황 + PDF 자동 퀘스트 변환</h1>
            <p className="mt-2 text-sm text-fairy-ink/70">
              로그인 유저: {sessionUser?.email ?? "없음 (수동 teacherId 입력 가능)"}
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/login" className="rounded-full bg-fairy-sky px-4 py-2 text-sm font-semibold text-fairy-ink">
              로그인
            </a>
            {sessionUser ? (
              <button onClick={handleSignOut} className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-fairy-ink">
                <LogOut className="h-4 w-4" /> 로그아웃
              </button>
            ) : null}
          </div>
        </div>
        <p className="mt-4 text-fairy-ink/80">{summaryText}</p>
        {dataMode === "firebase" ? (
          <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            Firebase 인증 연결 완료. 학생 초대링크 기능은 바로 사용 가능하고, 기존 Supabase 대시보드 데이터는 마이그레이션 중입니다.
          </p>
        ) : null}
      </section>

      <section className="rounded-fairy bg-white p-6 shadow-fairy">
        <h2 className="mb-4 text-xl font-bold">학생 초대링크 만들기</h2>
        <p className="mb-4 text-sm text-fairy-ink/80">선생님이 링크를 만들고 공유하면, 학생이 링크에서 아이디/비밀번호를 직접 설정해 가입해요.</p>
        {dataMode !== "firebase" ? (
          <p className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">초대링크 기능은 Firebase 로그인 모드에서만 동작해요.</p>
        ) : null}

        <form onSubmit={handleCreateInvite} className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
          <label className="grid gap-1 text-sm font-semibold">
            학급 코드
            <input
              value={inviteClassCode}
              onChange={(event) => setInviteClassCode(event.target.value)}
              required
              disabled={dataMode !== "firebase"}
              className="rounded-xl border border-fairy-ink/20 px-4 py-2 outline-none ring-fairy-sky focus:ring"
              placeholder="예: 3-2 또는 FAIRY-3A"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold">
            학년
            <select
              value={inviteGrade}
              onChange={(event) => setInviteGrade(Number(event.target.value))}
              disabled={dataMode !== "firebase"}
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
            disabled={inviteLoading || dataMode !== "firebase"}
            className="self-end rounded-full bg-fairy-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {inviteLoading ? "생성 중..." : "초대링크 생성"}
          </button>
        </form>

        {inviteCode ? (
          <div className="mt-4 rounded-2xl bg-fairy-cream p-4">
            <p className="text-sm font-semibold">초대코드: {inviteCode}</p>
            <p className="mt-1 break-all text-sm text-fairy-ink/80">{inviteLink}</p>
            <button type="button" onClick={copyInviteLink} className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-fairy-ink">
              링크 복사
            </button>
            {inviteNotice ? <p className="mt-2 text-xs text-fairy-ink/70">{inviteNotice}</p> : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-fairy bg-white p-6 shadow-fairy">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="grid gap-2 text-sm font-semibold">
            교사 ID 필터
            <input
              value={teacherFilter}
              onChange={(event) => setTeacherFilter(event.target.value)}
              className="rounded-xl border border-fairy-ink/20 px-4 py-2 outline-none ring-fairy-sky focus:ring"
              placeholder="교사 UUID를 입력하면 해당 학급만 조회"
            />
          </label>
          <button
            type="button"
            onClick={() => loadDashboard(teacherFilter.trim())}
            disabled={dataMode === "firebase"}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-fairy-sky px-4 text-sm font-semibold text-fairy-ink"
          >
            <Sparkles className="h-4 w-4" /> 현황 새로고침
          </button>
        </div>

        {dashboardError ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{dashboardError}</p> : null}

        {dashboardLoading ? (
          <p className="text-sm text-fairy-ink/70">학급 현황을 불러오는 중이에요...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(dashboard?.classCards ?? []).map((card) => (
              <ClassCard key={card.classId} card={card} />
            ))}
            {(dashboard?.classCards ?? []).length === 0 ? (
              <div className="rounded-fairy border border-dashed border-fairy-ink/30 p-6 text-sm text-fairy-ink/70">
                <p className="font-semibold">아직 연결된 학급 데이터가 없어요.</p>
                <p className="mt-1">classes, profiles 테이블의 샘플 데이터를 먼저 넣어 주세요.</p>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="rounded-fairy bg-white p-6 shadow-fairy">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <Leaf className="h-5 w-5" /> PDF 마법 파서
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">
            학급 ID
            <input
              name="classId"
              required
              className="rounded-xl border border-fairy-ink/20 px-4 py-2 outline-none ring-fairy-sky focus:ring"
              placeholder="예: 8b1f1f37-..."
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            교사 사용자 ID
            <input
              name="teacherId"
              value={teacherIdInput}
              onChange={(event) => setTeacherIdInput(event.target.value)}
              className="rounded-xl border border-fairy-ink/20 px-4 py-2 outline-none ring-fairy-sky focus:ring"
              placeholder="Supabase 연동 시 로그인 계정으로 자동 입력"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            방학 계획서 PDF
            <input name="pdf" type="file" accept="application/pdf" required className="rounded-xl border border-dashed border-fairy-ink/30 p-4" />
          </label>

          <button
            type="submit"
            disabled={isLoading || dataMode === "firebase"}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-fairy-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isLoading ? <WandSparkles className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            {isLoading ? "마법 해석 중..." : "퀘스트로 변환하기"}
          </button>
        </form>

        {error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        {result ? (
          <div className="mt-6 rounded-2xl bg-fairy-cream p-4">
            <p className="font-bold">등록 완료: {result.insertedCount}개</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-fairy-ink/80">
              {result.quests.slice(0, 10).map((quest) => (
                <li key={quest.id}>{quest.title}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
      </main>
    </RequireAuth>
  );
}
