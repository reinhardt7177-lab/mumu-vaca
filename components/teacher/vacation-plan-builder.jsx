"use client";

import { useEffect, useMemo, useState } from "react";
import { FilePenLine, FolderOpen, Palette, Printer, RefreshCw, Save, Sparkles, Trash2 } from "lucide-react";
import {
  createClassVacationPlan,
  deleteClassVacationPlan,
  listClassVacationPlans,
  updateClassVacationPlan
} from "@/lib/firebase/classes";

const DESIGN_THEMES = {
  fairyForest: {
    label: "숲속 요정",
    wrapper: "bg-gradient-to-br from-[#f5ffe8] via-[#f1fff8] to-[#fff8e7] border-[#7aa069]/35",
    title: "text-[#2f5233]",
    badge: "bg-[#e7f5df] text-[#2f5233]",
    card: "bg-white/85 border-[#2f5233]/15"
  },
  sunnySky: {
    label: "햇살 하늘",
    wrapper: "bg-gradient-to-br from-[#eef7ff] via-[#f8fdff] to-[#fff6e9] border-[#6d8ead]/35",
    title: "text-[#2f4f6c]",
    badge: "bg-[#e6f2ff] text-[#2f4f6c]",
    card: "bg-white/88 border-[#2f4f6c]/15"
  },
  storyPaper: {
    label: "동화 노트",
    wrapper: "bg-[linear-gradient(180deg,#fffef6_0%,#fffdf2_100%)] border-[#947a55]/35",
    title: "text-[#624a2d]",
    badge: "bg-[#fff1d7] text-[#624a2d]",
    card: "bg-[#fffdfa] border-[#624a2d]/15"
  }
};

const TEMPLATE_HINTS = {
  pledge: "예: 매일 30분 독서하고 가족에게 먼저 인사하기",
  morningPlan: "예: 7:30 기상 -> 스트레칭 -> 아침 독서 20분",
  afternoonPlan: "예: 학교 과제 40분 + 수학 복습 20분",
  eveningPlan: "예: 오늘 배운 것 3줄 일기 + 내일 준비물 점검",
  weeklyMission: "예: 화/목 운동장 걷기, 금요일 방학 프로젝트 정리",
  safetyPromise: "예: 낯선 사람 따라가지 않기, 물놀이 시 보호자와 함께",
  familyProject: "예: 우리 동네 자연 관찰 지도 만들기",
  rewardRule: "예: 계획 실천 5일 달성 시 주말에 가족 보드게임"
};

function makeEmptyForm() {
  return {
    schoolName: "",
    grade: "",
    className: "",
    teacherName: "",
    vacationStart: "",
    vacationEnd: "",
    pledge: "",
    morningPlan: "",
    afternoonPlan: "",
    eveningPlan: "",
    weeklyMission: "",
    readingGoal: "",
    exerciseGoal: "",
    safetyPromise: "",
    familyProject: "",
    rewardRule: "",
    feedbackMemo: ""
  };
}

function formatDate(value) {
  if (!value) return "미정";
  return value;
}

function formatDateTimeMs(ms) {
  if (!ms) return "-";
  return new Date(ms).toLocaleString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function toPlanError(error, fallbackMessage) {
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? "");

  if (code === "permission-denied") {
    return "권한이 없어요. 교사 계정으로 로그인했는지 확인해 주세요.";
  }

  if (code === "unavailable") {
    return "네트워크 연결이 잠시 불안정해요. 잠시 후 다시 시도해 주세요.";
  }

  return message || fallbackMessage;
}

export function VacationPlanBuilder({ selectedClassInfo, teacherEmail }) {
  const [form, setForm] = useState(makeEmptyForm);
  const [theme, setTheme] = useState("fairyForest");
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const [savedPlans, setSavedPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [activePlanId, setActivePlanId] = useState("");
  const [plansMessage, setPlansMessage] = useState("");
  const [plansError, setPlansError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  const selectedClassId = String(selectedClassInfo?.classId ?? "");

  useEffect(() => {
    if (!selectedClassInfo) return;

    setForm((prev) => ({
      ...prev,
      grade: prev.grade || String(selectedClassInfo.grade ?? ""),
      className: prev.className || String(selectedClassInfo.className ?? ""),
      schoolName: prev.schoolName || String(selectedClassInfo.className ?? "").split(" ")[0] || ""
    }));
  }, [selectedClassInfo]);

  useEffect(() => {
    if (!teacherEmail) return;
    setForm((prev) => ({ ...prev, teacherName: prev.teacherName || String(teacherEmail).split("@")[0] }));
  }, [teacherEmail]);

  async function loadPlans() {
    if (!selectedClassId) {
      setSavedPlans([]);
      setActivePlanId("");
      return;
    }

    setPlansLoading(true);
    setPlansError("");

    try {
      const list = await listClassVacationPlans(selectedClassId);
      setSavedPlans(list);
      if (activePlanId && !list.some((item) => item.planId === activePlanId)) {
        setActivePlanId("");
      }
    } catch (error) {
      setPlansError(toPlanError(error, "저장된 방학계획서를 불러오지 못했어요."));
    } finally {
      setPlansLoading(false);
    }
  }

  useEffect(() => {
    if (!isEditorOpen) return;
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditorOpen, selectedClassId]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function fillExample() {
    setForm((prev) => ({
      ...prev,
      pledge: prev.pledge || "매일 감사 인사 1번, 책 읽기 30분, 스스로 정리하기를 실천해요.",
      morningPlan: prev.morningPlan || "7:30 기상, 물 한 컵, 스트레칭 10분, 아침 독서 20분",
      afternoonPlan: prev.afternoonPlan || "점심 후 과제 40분 + 수학/국어 복습 20분",
      eveningPlan: prev.eveningPlan || "오늘 배운 점 3줄 일기, 내일 준비물 점검",
      weeklyMission: prev.weeklyMission || "월: 독서기록, 화: 체육활동, 수: 가족활동, 목: 창의미션, 금: 한 주 돌아보기",
      readingGoal: prev.readingGoal || "방학 동안 책 5권 읽고 독서기록장 작성",
      exerciseGoal: prev.exerciseGoal || "주 4회 20분 이상 걷기 또는 줄넘기",
      safetyPromise: prev.safetyPromise || "물놀이/자전거 활동 시 보호장비 착용, 귀가 시간 지키기",
      familyProject: prev.familyProject || "우리 가족 추억 인터뷰 후 미니 책 만들기",
      rewardRule: prev.rewardRule || "주간 목표 80% 이상 달성 시 가족 영화 1편 보기",
      feedbackMemo: prev.feedbackMemo || "아이가 스스로 계획을 점검할 수 있게 주 1회 대화해 주세요."
    }));
  }

  function resetForm() {
    setActivePlanId("");
    setTheme("fairyForest");
    setForm((prev) => ({
      ...prev,
      vacationStart: "",
      vacationEnd: "",
      pledge: "",
      morningPlan: "",
      afternoonPlan: "",
      eveningPlan: "",
      weeklyMission: "",
      readingGoal: "",
      exerciseGoal: "",
      safetyPromise: "",
      familyProject: "",
      rewardRule: "",
      feedbackMemo: ""
    }));
  }

  function handlePrint() {
    window.print();
  }

  function buildPlanPayload() {
    if (!selectedClassInfo?.classId) {
      throw new Error("학급 상황판에서 학급을 먼저 선택해 주세요.");
    }

    const className = String(form.className || selectedClassInfo.className || "").trim();
    const grade = Number(form.grade || selectedClassInfo.grade || 0) || 0;
    const gradeLabel = grade ? `${grade}학년` : "학년";

    return {
      title: `${gradeLabel} ${className || "학급"} 방학 생활계획서`,
      classId: selectedClassInfo.classId,
      className: className || String(selectedClassInfo.className ?? ""),
      classCode: String(selectedClassInfo.classCode ?? ""),
      grade,
      theme,
      form: {
        ...form,
        className: className || String(selectedClassInfo.className ?? ""),
        grade: String(form.grade || selectedClassInfo.grade || "")
      }
    };
  }

  async function handleSavePlan() {
    setPlansMessage("");
    setPlansError("");
    setSaveLoading(true);

    try {
      const payload = buildPlanPayload();

      if (activePlanId) {
        await updateClassVacationPlan(selectedClassId, activePlanId, payload);
        setPlansMessage("방학계획서를 수정 저장했어요.");
      } else {
        const created = await createClassVacationPlan(selectedClassId, payload);
        setActivePlanId(created.planId);
        setPlansMessage("방학계획서를 새로 저장했어요.");
      }

      await loadPlans();
    } catch (error) {
      setPlansError(toPlanError(error, "방학계획서 저장에 실패했어요."));
    } finally {
      setSaveLoading(false);
    }
  }

  function applySavedPlan(item) {
    setActivePlanId(item.planId);
    setTheme(item.theme || "fairyForest");

    const nextForm = {
      ...makeEmptyForm(),
      ...item.form
    };

    setForm((prev) => ({
      ...prev,
      ...nextForm,
      className: nextForm.className || item.className || prev.className,
      schoolName: nextForm.schoolName || prev.schoolName,
      grade: String(nextForm.grade || item.grade || prev.grade || "")
    }));

    setPlansMessage("저장된 계획서를 불러왔어요. 수정 후 다시 저장할 수 있어요.");
    setPlansError("");
    setIsEditorOpen(true);
  }

  async function handleDeletePlan(planId) {
    const target = savedPlans.find((item) => item.planId === planId);
    const label = target?.title || "이 계획서";

    const ok = window.confirm(`${label}를 삭제할까요?`);
    if (!ok) return;

    setPlansMessage("");
    setPlansError("");

    try {
      await deleteClassVacationPlan(selectedClassId, planId);
      if (activePlanId === planId) {
        setActivePlanId("");
      }
      await loadPlans();
      setPlansMessage("방학계획서를 삭제했어요.");
    } catch (error) {
      setPlansError(toPlanError(error, "방학계획서 삭제에 실패했어요."));
    }
  }

  const plan = useMemo(() => {
    const gradeLabel = form.grade ? `${form.grade}학년` : "학년 미입력";
    const classLabel = form.className || "학급 미입력";

    const autoChecklist = [
      `아침 루틴 실천: ${form.morningPlan || "아침 계획을 입력해 주세요."}`,
      `오후 학습 실천: ${form.afternoonPlan || "오후 계획을 입력해 주세요."}`,
      `저녁 정리 습관: ${form.eveningPlan || "저녁 계획을 입력해 주세요."}`,
      `주간 미션: ${form.weeklyMission || "주간 미션을 입력해 주세요."}`,
      `안전 약속: ${form.safetyPromise || "안전 약속을 입력해 주세요."}`
    ];

    return {
      title: `${gradeLabel} ${classLabel} 방학 생활계획서`,
      period: `${formatDate(form.vacationStart)} ~ ${formatDate(form.vacationEnd)}`,
      headerInfo: {
        schoolName: form.schoolName || "학교 미입력",
        teacherName: form.teacherName || "담임 미입력",
        gradeClass: `${gradeLabel} ${classLabel}`
      },
      checklist: autoChecklist,
      pledge: form.pledge || "방학 다짐을 입력해 주세요.",
      readingGoal: form.readingGoal || "독서 목표를 입력해 주세요.",
      exerciseGoal: form.exerciseGoal || "운동 목표를 입력해 주세요.",
      familyProject: form.familyProject || "가족 프로젝트를 입력해 주세요.",
      rewardRule: form.rewardRule || "보상 규칙을 입력해 주세요.",
      feedbackMemo: form.feedbackMemo || "학부모/담임 메모를 입력해 주세요."
    };
  }, [form]);

  const activeTheme = DESIGN_THEMES[theme] ?? DESIGN_THEMES.fairyForest;

  return (
    <section className="rounded-fairy bg-white p-6 shadow-fairy">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-xl font-bold text-fairy-ink">
          <FilePenLine className="h-5 w-5" /> 방학계획서 자동 작성
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsEditorOpen((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-full bg-[#32563a] px-4 py-2 text-sm font-semibold text-white"
          >
            <FilePenLine className="h-4 w-4" /> {isEditorOpen ? "작성기 닫기" : "방학계획서 작성"}
          </button>
          {isEditorOpen ? (
            <>
              <button
                type="button"
                onClick={fillExample}
                className="inline-flex items-center gap-1 rounded-full bg-[#d9f3e4] px-4 py-2 text-sm font-semibold text-[#214a34]"
              >
                <Sparkles className="h-4 w-4" /> 예시 문구 자동 채우기
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1 rounded-full bg-[#f2f2f7] px-4 py-2 text-sm font-semibold text-fairy-ink"
              >
                <RefreshCw className="h-4 w-4" /> 새 계획서 시작
              </button>
              <button
                type="button"
                onClick={handleSavePlan}
                disabled={saveLoading}
                className="inline-flex items-center gap-1 rounded-full bg-[#32563a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Save className="h-4 w-4" /> {saveLoading ? "저장 중..." : activePlanId ? "수정 저장" : "새로 저장"}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1 rounded-full bg-[#32563a] px-4 py-2 text-sm font-semibold text-white"
              >
                <Printer className="h-4 w-4" /> 인쇄하기
              </button>
            </>
          ) : null}
        </div>
      </div>

      <p className="mb-5 text-sm text-fairy-ink/75">
        칸에 내용을 입력하면 아래 방학계획서가 자동으로 완성돼요. 저장해 두면 나중에 수정하거나 삭제할 수 있어요.
      </p>

      {!isEditorOpen ? (
        <p className="rounded-xl border border-dashed border-fairy-ink/30 p-4 text-sm text-fairy-ink/70">
          방학계획서 작성 버튼을 누르면 입력 칸이 열리고, 작성 즉시 인쇄 가능한 계획서 미리보기가 생성됩니다.
        </p>
      ) : (
        <>
          {!selectedClassId ? (
            <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">학급 상황판에서 학급을 먼저 선택하면 저장/수정/삭제가 가능해요.</p>
          ) : null}

          {plansMessage ? <p className="mb-4 rounded-xl bg-[#d9f3e4] p-3 text-sm text-[#214a34]">{plansMessage}</p> : null}
          {plansError ? <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{plansError}</p> : null}

          <article className="mb-4 rounded-2xl border border-fairy-ink/15 bg-fairy-cream p-4">
            <h3 className="inline-flex items-center gap-2 text-sm font-bold text-fairy-ink">
              <FolderOpen className="h-4 w-4" /> 저장된 방학계획서
            </h3>

            {plansLoading ? <p className="mt-3 text-sm text-fairy-ink/70">불러오는 중이에요...</p> : null}

            {!plansLoading && savedPlans.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-fairy-ink/30 p-3 text-sm text-fairy-ink/70">아직 저장된 방학계획서가 없어요.</p>
            ) : null}

            {!plansLoading && savedPlans.length > 0 ? (
              <ul className="mt-3 grid gap-2">
                {savedPlans.map((item) => (
                  <li key={item.planId} className={`rounded-xl border p-3 ${item.planId === activePlanId ? "border-[#32563a] bg-white" : "border-fairy-ink/15 bg-white/80"}`}>
                    <p className="text-sm font-bold text-fairy-ink">{item.title || "제목 없는 계획서"}</p>
                    <p className="text-xs text-fairy-ink/65">{item.classCode || "-"} · 수정 {formatDateTimeMs(item.updatedAtMs)}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => applySavedPlan(item)}
                        className="inline-flex items-center gap-1 rounded-full bg-[#32563a] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        <FolderOpen className="h-3.5 w-3.5" /> 불러오기
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(item.planId)}
                        className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> 삭제
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-fairy-ink/15 bg-fairy-cream p-4">
              <h3 className="mb-3 text-sm font-bold text-fairy-ink">기본 정보</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="grid gap-1 text-xs font-semibold text-fairy-ink/85">
                  학교명
                  <input value={form.schoolName} onChange={(e) => updateField("schoolName", e.target.value)} className="rounded-lg border border-fairy-ink/20 px-3 py-2 text-sm" placeholder="예: 강진중앙초등학교" />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-fairy-ink/85">
                  담임명
                  <input value={form.teacherName} onChange={(e) => updateField("teacherName", e.target.value)} className="rounded-lg border border-fairy-ink/20 px-3 py-2 text-sm" placeholder="예: 김다정" />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-fairy-ink/85">
                  학년
                  <select value={form.grade} onChange={(e) => updateField("grade", e.target.value)} className="rounded-lg border border-fairy-ink/20 px-3 py-2 text-sm">
                    <option value="">학년 선택</option>
                    {[1, 2, 3, 4, 5, 6].map((grade) => (
                      <option key={grade} value={grade}>{grade}학년</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-semibold text-fairy-ink/85">
                  반/학급명
                  <input value={form.className} onChange={(e) => updateField("className", e.target.value)} className="rounded-lg border border-fairy-ink/20 px-3 py-2 text-sm" placeholder="예: 4학년 3반" />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-fairy-ink/85">
                  방학 시작일
                  <input type="date" value={form.vacationStart} onChange={(e) => updateField("vacationStart", e.target.value)} className="rounded-lg border border-fairy-ink/20 px-3 py-2 text-sm" />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-fairy-ink/85">
                  방학 종료일
                  <input type="date" value={form.vacationEnd} onChange={(e) => updateField("vacationEnd", e.target.value)} className="rounded-lg border border-fairy-ink/20 px-3 py-2 text-sm" />
                </label>
              </div>
            </article>

            <article className="rounded-2xl border border-fairy-ink/15 bg-fairy-cream p-4">
              <h3 className="mb-3 text-sm font-bold text-fairy-ink">계획 입력</h3>
              <div className="grid gap-2">
                {Object.entries(TEMPLATE_HINTS).map(([key, placeholder]) => (
                  <label key={key} className="grid gap-1 text-xs font-semibold text-fairy-ink/85">
                    {key === "pledge" && "방학 다짐"}
                    {key === "morningPlan" && "아침 계획"}
                    {key === "afternoonPlan" && "오후 계획"}
                    {key === "eveningPlan" && "저녁 계획"}
                    {key === "weeklyMission" && "주간 미션"}
                    {key === "safetyPromise" && "안전 약속"}
                    {key === "familyProject" && "가족 프로젝트"}
                    {key === "rewardRule" && "보상 규칙"}
                    <textarea
                      rows={2}
                      value={form[key]}
                      onChange={(event) => updateField(key, event.target.value)}
                      className="resize-y rounded-lg border border-fairy-ink/20 px-3 py-2 text-sm"
                      placeholder={placeholder}
                    />
                  </label>
                ))}

                <label className="grid gap-1 text-xs font-semibold text-fairy-ink/85">
                  독서 목표
                  <textarea rows={2} value={form.readingGoal} onChange={(event) => updateField("readingGoal", event.target.value)} className="resize-y rounded-lg border border-fairy-ink/20 px-3 py-2 text-sm" placeholder="예: 필독 도서 3권 + 자유 독서 2권" />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-fairy-ink/85">
                  운동 목표
                  <textarea rows={2} value={form.exerciseGoal} onChange={(event) => updateField("exerciseGoal", event.target.value)} className="resize-y rounded-lg border border-fairy-ink/20 px-3 py-2 text-sm" placeholder="예: 줄넘기 100회, 주 4회 걷기" />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-fairy-ink/85">
                  교사/학부모 메모
                  <textarea rows={2} value={form.feedbackMemo} onChange={(event) => updateField("feedbackMemo", event.target.value)} className="resize-y rounded-lg border border-fairy-ink/20 px-3 py-2 text-sm" placeholder="예: 주 1회 실천 여부 확인" />
                </label>
              </div>
            </article>
          </div>

          <article className="mt-6 rounded-2xl border border-fairy-ink/15 bg-fairy-cream p-4">
            <h3 className="inline-flex items-center gap-1 text-sm font-bold text-fairy-ink">
              <Palette className="h-4 w-4" /> 디자인 선택
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(DESIGN_THEMES).map(([key, info]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme(key)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold ${theme === key ? "bg-[#32563a] text-white" : "bg-white text-fairy-ink"}`}
                >
                  {info.label}
                </button>
              ))}
            </div>
          </article>

          <article className={`plan-print-root mt-6 rounded-2xl border p-6 shadow-sm ${activeTheme.wrapper}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${activeTheme.badge}`}>슬기로운 방학생활</p>
                <h3 className={`mt-2 text-2xl font-black ${activeTheme.title}`}>{plan.title}</h3>
                <p className="mt-1 text-sm text-fairy-ink/70">방학 기간: {plan.period}</p>
              </div>
              <div className={`rounded-xl border px-3 py-2 text-sm ${activeTheme.card}`}>
                <p>학교: {plan.headerInfo.schoolName}</p>
                <p>담임: {plan.headerInfo.teacherName}</p>
                <p>학급: {plan.headerInfo.gradeClass}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              <section className={`rounded-xl border p-4 ${activeTheme.card}`}>
                <h4 className="text-sm font-bold text-fairy-ink">방학 다짐</h4>
                <p className="mt-2 whitespace-pre-line text-sm text-fairy-ink/90">{plan.pledge}</p>
              </section>

              <section className={`rounded-xl border p-4 ${activeTheme.card}`}>
                <h4 className="text-sm font-bold text-fairy-ink">실천 체크리스트</h4>
                <ul className="mt-2 space-y-2 text-sm text-fairy-ink/90">
                  {plan.checklist.map((item) => (
                    <li key={item} className="rounded-lg bg-white/80 p-2">[ ] {item}</li>
                  ))}
                </ul>
              </section>

              <section className={`rounded-xl border p-4 ${activeTheme.card}`}>
                <h4 className="text-sm font-bold text-fairy-ink">독서/운동 목표</h4>
                <p className="mt-2 text-sm text-fairy-ink/90">독서: {plan.readingGoal}</p>
                <p className="mt-2 text-sm text-fairy-ink/90">운동: {plan.exerciseGoal}</p>
              </section>

              <section className={`rounded-xl border p-4 ${activeTheme.card}`}>
                <h4 className="text-sm font-bold text-fairy-ink">가족 프로젝트/보상 규칙</h4>
                <p className="mt-2 text-sm text-fairy-ink/90">프로젝트: {plan.familyProject}</p>
                <p className="mt-2 text-sm text-fairy-ink/90">보상 규칙: {plan.rewardRule}</p>
              </section>
            </div>

            <section className={`mt-3 rounded-xl border p-4 ${activeTheme.card}`}>
              <h4 className="text-sm font-bold text-fairy-ink">교사/학부모 메모</h4>
              <p className="mt-2 whitespace-pre-line text-sm text-fairy-ink/90">{plan.feedbackMemo}</p>
            </section>
          </article>
        </>
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }

          .plan-print-root,
          .plan-print-root * {
            visibility: visible;
          }

          .plan-print-root {
            position: absolute;
            inset: 0;
            margin: 0;
            width: 100%;
            border-radius: 0;
            box-shadow: none;
            border: none;
          }
        }
      `}</style>
    </section>
  );
}
