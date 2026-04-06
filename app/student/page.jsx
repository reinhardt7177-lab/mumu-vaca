"use client";

import { useEffect, useState } from "react";
import { Camera, CheckCircle2, Sprout } from "lucide-react";
import { getToneByGrade } from "@/lib/grade-tone";
import { StudentGamePanel } from "@/components/student/student-game-panel";
import { RequireAuth } from "@/components/auth/require-auth";

const missions = [
  { id: 1, title: "국어 읽기 20분", reward: "+2 도토리", done: false },
  { id: 2, title: "수학 문제집 2쪽", reward: "+3 도토리", done: false },
  { id: 3, title: "오늘 감사한 일 1개 쓰기", reward: "+1 도토리", done: true }
];

export default function StudentPage() {
  const [grade, setGrade] = useState(3);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const value = Number(new URLSearchParams(window.location.search).get("grade") ?? 3);
    if (Number.isFinite(value) && value >= 1 && value <= 6) {
      setGrade(value);
    }
  }, []);

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <section className="rounded-fairy bg-white/85 p-8 shadow-fairy backdrop-blur">
          <p className="text-sm font-semibold text-fairy-ink/70">{grade}학년 요정 친구</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight">안녕! 오늘 하루는 어땠어?</h1>
          <p className="mt-4 text-fairy-ink/80">{getToneByGrade(grade)}</p>
        </section>

        <section className="rounded-fairy bg-white p-6 shadow-fairy">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Sprout className="h-5 w-5" /> 오늘의 미션
          </h2>
          <ul className="mt-4 space-y-3">
            {missions.map((mission) => (
              <li key={mission.id} className="flex items-center justify-between rounded-2xl bg-fairy-cream p-4">
                <div>
                  <p className="font-semibold text-fairy-ink">{mission.title}</p>
                  <p className="text-sm text-fairy-ink/70">{mission.reward}</p>
                </div>
                {mission.done ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-fairy-mint px-3 py-1 text-xs font-bold text-fairy-ink">
                    <CheckCircle2 className="h-4 w-4" /> 완료
                  </span>
                ) : (
                  <button className="rounded-full bg-fairy-ink px-4 py-2 text-sm font-semibold text-white">요정에게 보내기</button>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-fairy bg-white p-6 shadow-fairy">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Camera className="h-5 w-5" /> 10초 생존 신고
          </h2>
          <p className="mt-2 text-sm text-fairy-ink/80">오늘 창밖의 하늘은 어떤 색이야? 사진으로 보여줘.</p>
          <button className="mt-4 rounded-full bg-fairy-sky px-5 py-2.5 text-sm font-semibold text-fairy-ink">
            하늘 사진 올리기
          </button>
        </section>

        <StudentGamePanel />
      </main>
    </RequireAuth>
  );
}
