"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Sparkles, UserRoundPlus } from "lucide-react";
import { getSessionUser, signInWithCredentials, signInTeacherWithGoogle, signUpTeacher } from "@/lib/auth/client";

function toFriendlyAuthError(error, fallbackMessage) {
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? "");

  if (code === "auth/configuration-not-found" || message.includes("CONFIGURATION_NOT_FOUND")) {
    return "Firebase 인증 설정이 아직 비어 있어요. Firebase Console > Authentication > Sign-in method에서 이메일/비밀번호를 켜 주세요.";
  }

  if (code === "auth/email-already-in-use") {
    return "이미 가입된 이메일이에요. 교사 로그인으로 들어가 주세요.";
  }

  if (code === "auth/invalid-email") {
    return "이메일 형식을 확인해 주세요.";
  }

  if (code === "auth/weak-password") {
    return "비밀번호를 6자 이상으로 설정해 주세요.";
  }

  if (code === "auth/invalid-credential" || code === "auth/invalid-login-credentials" || code === "auth/user-not-found") {
    return "아이디 또는 비밀번호를 다시 확인해 주세요.";
  }

  if (code === "auth/too-many-requests") {
    return "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.";
  }

  if (code === "auth/popup-closed-by-user") {
    return "구글 로그인 창이 닫혔어요. 다시 시도해 주세요.";
  }

  if (code === "auth/popup-blocked") {
    return "브라우저가 팝업을 막았어요. 팝업 허용 후 다시 눌러 주세요.";
  }

  if (code === "auth/operation-not-allowed") {
    return "Firebase에서 Google 로그인 방식이 아직 꺼져 있어요. Authentication > 로그인 방법 > Google을 켜 주세요.";
  }

  return message || fallbackMessage;
}

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
  const targetPath = nextPath && nextPath !== "/" ? nextPath : "/teacher";

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
          router.replace(targetPath);
        }
      } catch {
        // ignore
      }
    }

    redirectIfLoggedIn();
    return () => {
      mounted = false;
    };
  }, [targetPath, router]);

  async function handleTeacherSignIn(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await signInWithCredentials({ loginId, password });
      setMessage("로그인 성공! 이동 중이에요.");
      router.replace(targetPath);
    } catch (signInError) {
      setError(toFriendlyAuthError(signInError, "로그인에 실패했어요."));
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
      router.replace(targetPath);
    } catch (signUpError) {
      setError(toFriendlyAuthError(signUpError, "회원가입에 실패했어요."));
    } finally {
      setLoading(false);
    }
  }

  async function handleTeacherGoogleSignIn() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await signInTeacherWithGoogle();
      setMessage("구글 로그인 성공! 교사 지휘소로 이동할게요.");
      router.replace(targetPath);
    } catch (googleError) {
      setError(toFriendlyAuthError(googleError, "구글 로그인에 실패했어요."));
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

      <section className="relative mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-5 py-8 sm:px-8 sm:py-10">
        <article className="w-full rounded-[2rem] border border-[#f5e7c8] bg-[#fff8e8]/95 p-5 shadow-[0_16px_40px_rgba(36,33,24,0.3)] sm:p-6">
          <p className="text-sm font-extrabold text-[#6d4f2a]">입장하기</p>
          <h2 className="mt-1 text-2xl font-black text-[#345334]">선생님/학생 포털</h2>
          <p className="mt-2 text-sm font-semibold text-[#5b4e3d]">교사는 로그인, 학생은 초대코드로 이동해요.</p>
          <p className="mt-1 text-xs text-[#6a5b43]/85">빠른 시작: 구글 계정으로 교사 로그인 가능</p>

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

          <button
            type="button"
            onClick={handleTeacherGoogleSignIn}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#1f1f1f] ring-1 ring-fairy-ink/20 disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            구글로 교사 로그인
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
