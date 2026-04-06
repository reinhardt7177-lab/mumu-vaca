"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Sparkles, UserRoundPlus } from "lucide-react";
import { getSessionUser, signInWithCredentials, signUpTeacher } from "@/lib/auth/client";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState("signin");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [nextPath, setNextPath] = useState("/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const nextValue = new URLSearchParams(window.location.search).get("next") || "/";
      setNextPath(nextValue);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function redirectIfLoggedIn() {
      try {
        const user = await getSessionUser();
        if (mounted && user) {
          router.replace(nextPath);
        }
      } catch {
        // ignore
      }
    }

    redirectIfLoggedIn();
    return () => {
      mounted = false;
    };
  }, [nextPath, router]);

  async function handleTeacherSignIn(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await signInWithCredentials({ loginId, password });
      setMessage("로그인 성공! 이동 중이에요.");
      router.replace(nextPath);
    } catch (signInError) {
      setError(signInError.message ?? "로그인에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTeacherSignUp(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await signUpTeacher({
        email: loginId,
        password,
        fullName: teacherName
      });

      setMessage("교사 회원가입 완료! 바로 시작할게요.");
      router.replace("/teacher");
    } catch (signUpError) {
      setError(signUpError.message ?? "회원가입에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  function handleMoveToInvite() {
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      setError("초대코드를 입력해 주세요.");
      return;
    }

    router.push(`/join?code=${encodeURIComponent(code)}`);
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/fairy-home-reference.png')" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1b2a22]/45 via-[#1b2a22]/20 to-[#1b2a22]/50" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#20342a]/45 via-transparent to-transparent" />

      <section className="relative mx-auto grid min-h-screen w-full max-w-7xl items-end gap-6 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <article className="rounded-[2rem] border border-white/40 bg-white/12 p-6 text-white shadow-[0_20px_60px_rgba(13,22,16,0.35)] backdrop-blur-md sm:p-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-wide">
            <Sparkles className="h-3.5 w-3.5" />
            teacher & student portal
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
            슬기로운
            <br />
            방학생활 시작하기
          </h1>
          <p className="mt-4 max-w-xl text-sm font-medium text-white/90 sm:text-base">
            교사는 회원가입 후 로그인하고, 학생은 선생님이 준 링크로 계정을 만들어요.
          </p>
          <p className="mt-3 text-xs font-semibold text-white/85 sm:text-sm">오늘의 모험은 로그인에서 시작돼요.</p>
        </article>

        <article className="rounded-[2rem] border border-[#f5e7c8] bg-[#fff8e8]/95 p-5 shadow-[0_16px_40px_rgba(36,33,24,0.3)] sm:p-6">
          <p className="text-sm font-extrabold text-[#6d4f2a]">입장하기</p>
          <h2 className="mt-1 text-2xl font-black text-[#345334]">선생님/학생 포털</h2>
          <p className="mt-2 text-sm font-semibold text-[#5b4e3d]">교사는 로그인, 학생은 초대코드로 이동해요.</p>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#f9efd7] p-1.5 ring-1 ring-[#dfc690]">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${mode === "signin" ? "bg-white text-[#345334] shadow" : "text-[#6a5b43]"}`}
          >
            교사 로그인
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${mode === "signup" ? "bg-white text-[#345334] shadow" : "text-[#6a5b43]"}`}
          >
            교사 회원가입
          </button>
          </div>

          <form onSubmit={mode === "signup" ? handleTeacherSignUp : handleTeacherSignIn} className="mt-5 grid gap-3">
          {mode === "signup" ? (
            <label className="grid gap-1 text-sm font-semibold">
              이름
              <input
                value={teacherName}
                onChange={(event) => setTeacherName(event.target.value)}
                type="text"
                required
                className="rounded-xl border border-[#9f8b69] bg-white/90 px-4 py-2 outline-none ring-[#9dd3ff] focus:ring"
                placeholder="예: 3학년 2반 김선생님"
              />
            </label>
          ) : null}

          <label className="grid gap-1 text-sm font-semibold">
            이메일(아이디)
            <input
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              type="text"
              required
              className="rounded-xl border border-[#9f8b69] bg-white/90 px-4 py-2 outline-none ring-[#9dd3ff] focus:ring"
              placeholder="teacher1 또는 teacher@example.com"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold">
            비밀번호
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              className="rounded-xl border border-[#9f8b69] bg-white/90 px-4 py-2 outline-none ring-[#9dd3ff] focus:ring"
              placeholder="6자 이상"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#32563a] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "처리 중..." : mode === "signup" ? "교사 회원가입" : "교사 로그인"}
          </button>
          </form>

          <div className="mt-7 rounded-2xl border border-[#bfd8f8] bg-[#e7f2ff]/90 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-bold text-[#31557c]">
              <UserRoundPlus className="h-4 w-4" />
              학생 입장
            </p>
            <p className="mt-1 text-xs text-[#31557c]/90">선생님 초대코드로 입장해서, 학생이 직접 아이디/비밀번호를 설정해요.</p>
            <div className="mt-3 flex gap-2">
            <input
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
              className="flex-1 rounded-xl border border-[#88a8cf] bg-white/95 px-4 py-2 text-sm outline-none ring-[#9dd3ff] focus:ring"
              placeholder="예: AB12CD34EF"
            />
            <button
              type="button"
              onClick={handleMoveToInvite}
              className="rounded-full bg-[#31557c] px-4 py-2 text-sm font-semibold text-white"
            >
              링크로 이동
            </button>
            </div>
          </div>

          {message ? <p className="mt-4 rounded-xl bg-[#d9f3e4] p-3 text-sm text-[#214a34]">{message}</p> : null}
          {error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          <p className="mt-4 text-center text-xs font-semibold text-[#6a5b43]/85">2026. mumuclass by 불곰코끼리</p>
        </article>
      </section>

    </main>
  );
}
