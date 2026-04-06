import { BookOpenCheck, LogIn, Sparkles, UserRoundPlus } from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <img
        src="/images/fairy-home-reference.png"
        alt="슬기로운 방학생활 메인 배경"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1b2a22]/45 via-[#1b2a22]/20 to-[#1b2a22]/50" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#20342a]/45 via-transparent to-transparent" />

      <section className="relative mx-auto grid min-h-screen w-full max-w-7xl items-end gap-6 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <article className="rounded-[2rem] border border-white/40 bg-white/12 p-6 text-white shadow-[0_20px_60px_rgba(13,22,16,0.35)] backdrop-blur-md sm:p-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-wide">
            <Sparkles className="h-3.5 w-3.5" />
            mumuclass fairy tale
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
            슬기로운
            <br />
            방학생활
          </h1>
          <p className="mt-4 max-w-xl text-sm font-medium text-white/90 sm:text-base">
            숙제가 아니라 모험처럼. 아이는 매일 작은 퀘스트를 즐기고, 선생님은 초대링크로 반 친구들을 따뜻하게 연결해요.
          </p>
          <p className="mt-3 text-xs font-semibold text-white/85 sm:text-sm">안녕, 오늘도 요정이 기다리고 있었어.</p>
        </article>

        <article className="rounded-[2rem] border border-[#f5e7c8] bg-[#fff8e8]/95 p-5 shadow-[0_16px_40px_rgba(36,33,24,0.3)] sm:p-6">
          <p className="text-sm font-extrabold text-[#6d4f2a]">시작하기</p>
          <h2 className="mt-1 text-2xl font-black text-[#345334]">우리 반 여름 모험 열기</h2>
          <p className="mt-2 text-sm font-semibold text-[#5b4e3d]">선생님은 로그인하고, 학생은 링크에서 가입해요.</p>

          <div className="mt-4 grid gap-3">
            <a
              href="/login"
              className="inline-flex items-center justify-between rounded-2xl bg-[#32563a] px-4 py-3 text-sm font-bold text-white"
            >
              <span className="inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                교사 로그인 / 회원가입
              </span>
              <Sparkles className="h-4 w-4" />
            </a>
            <a
              href="/teacher"
              className="inline-flex items-center justify-between rounded-2xl bg-[#f9efd7] px-4 py-3 text-sm font-bold text-[#5f4a28] ring-1 ring-[#dfc690]"
            >
              <span className="inline-flex items-center gap-2">
                <BookOpenCheck className="h-4 w-4" />
                학생 초대링크 만들기
              </span>
              <Sparkles className="h-4 w-4" />
            </a>
            <a
              href="/join"
              className="inline-flex items-center justify-between rounded-2xl bg-[#e7f2ff] px-4 py-3 text-sm font-bold text-[#31557c] ring-1 ring-[#bfd8f8]"
            >
              <span className="inline-flex items-center gap-2">
                <UserRoundPlus className="h-4 w-4" />
                학생 링크로 가입하기
              </span>
              <Sparkles className="h-4 w-4" />
            </a>
          </div>

          <p className="mt-4 text-center text-xs font-semibold text-[#6a5b43]/85">2026. mumuclass by 불곰코끼리</p>
        </article>
      </section>
    </main>
  );
}
