"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStudentInvite } from "@/lib/firebase/invites";
import { signUpStudentWithInvite } from "@/lib/auth/client";

function toFriendlyAuthError(error, fallbackMessage) {
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? "");

  if (code === "auth/configuration-not-found" || message.includes("CONFIGURATION_NOT_FOUND")) {
    return "Firebase 인증 설정이 아직 비어 있어요. 선생님에게 Firebase Authentication(이메일/비밀번호) 활성화를 요청해 주세요.";
  }

  if (code === "auth/email-already-in-use") {
    return "이미 사용 중인 학생 아이디(이메일)예요. 다른 아이디를 써 주세요.";
  }

  if (code === "auth/invalid-email") {
    return "학생 아이디 형식을 다시 확인해 주세요.";
  }

  if (code === "auth/weak-password") {
    return "비밀번호를 6자 이상으로 설정해 주세요.";
  }

  if (code === "auth/too-many-requests") {
    return "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.";
  }

  if (message.includes("Invalid invite code")) {
    return "초대코드가 올바르지 않거나 만료되었어요. 선생님께 새 링크를 받아 주세요.";
  }

  if (message.includes("ID and password are required")) {
    return "학생 아이디와 비밀번호를 모두 입력해 주세요.";
  }

  return message || fallbackMessage;
}

export default function JoinPage() {
  const router = useRouter();

  const [inviteCode, setInviteCode] = useState("");
  const [invite, setInvite] = useState(null);
  const [checkingInvite, setCheckingInvite] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState(3);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const code = new URLSearchParams(window.location.search).get("code") ?? "";
    setInviteCode(String(code).trim().toUpperCase());
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchInvite() {
      if (!inviteCode) return;
      setCheckingInvite(true);
      setError("");

      try {
        const data = await getStudentInvite(inviteCode);
        if (!mounted) return;

        if (!data || !data.isActive) {
          setInvite(null);
          setError("초대코드가 올바르지 않거나 만료되었어요. 선생님께 새 링크를 받아 주세요.");
          return;
        }

        setInvite(data);
        const nextGrade = Number(data.grade ?? 3);
        if (Number.isFinite(nextGrade) && nextGrade >= 1 && nextGrade <= 6) {
          setGrade(nextGrade);
        }
      } catch {
        if (mounted) {
          setError("초대 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
        }
      } finally {
        if (mounted) {
          setCheckingInvite(false);
        }
      }
    }

    fetchInvite();
    return () => {
      mounted = false;
    };
  }, [inviteCode]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await signUpStudentWithInvite({
        inviteCode,
        loginId,
        password,
        fullName
      });
      setMessage("학생 계정이 만들어졌어요. 미션 화면으로 이동할게요.");
      router.replace(`/student?grade=${grade}`);
    } catch (joinError) {
      setError(toFriendlyAuthError(joinError, "학생 계정을 만들지 못했어요. 다시 시도해 주세요."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 py-10">
      <section className="rounded-fairy bg-white/90 p-8 shadow-fairy backdrop-blur">
        <h1 className="text-3xl font-bold">학생 링크 가입하기</h1>
        <p className="mt-2 text-sm text-fairy-ink/80">
          선생님이 준 초대링크로 들어왔다면, 이름과 아이디/비밀번호를 정하고 우리 반 방학 모험에 합류해요.
        </p>

        <label className="mt-5 grid gap-1 text-sm font-semibold">
          초대 코드
          <input
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
            className="rounded-xl border border-fairy-ink/20 px-4 py-2 outline-none ring-fairy-sky focus:ring"
            placeholder="AB12CD34EF"
          />
        </label>

        {checkingInvite ? <p className="mt-3 text-sm text-fairy-ink/70">초대코드 확인 중...</p> : null}
        {invite ? (
          <p className="mt-3 rounded-xl bg-fairy-mint p-3 text-sm">
            학급: {invite.className || invite.classCode} ({invite.classCode}) / 학년: {invite.grade}학년
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
          <label className="grid gap-1 text-sm font-semibold">
            학생 이름
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              type="text"
              required
              className="rounded-xl border border-fairy-ink/20 px-4 py-2 outline-none ring-fairy-sky focus:ring"
              placeholder="예: 홍길동"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold">
            학생 아이디
            <input
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              type="text"
              required
              className="rounded-xl border border-fairy-ink/20 px-4 py-2 outline-none ring-fairy-sky focus:ring"
              placeholder="예: gildong3"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold">
            비밀번호
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              className="rounded-xl border border-fairy-ink/20 px-4 py-2 outline-none ring-fairy-sky focus:ring"
              placeholder="6자 이상"
            />
          </label>

          <button
            type="submit"
            disabled={loading || !invite}
            className="mt-1 rounded-full border border-[#32563a] bg-[#32563a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2b4932] disabled:cursor-not-allowed disabled:border-[#9bb2a1] disabled:bg-[#9bb2a1]"
          >
            {loading ? "가입 중..." : "학생 계정 만들기"}
          </button>
        </form>

        {message ? <p className="mt-4 rounded-xl bg-fairy-mint p-3 text-sm">{message}</p> : null}
        {error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      </section>
    </main>
  );
}
