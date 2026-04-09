import { LogIn, Sparkles } from "lucide-react";

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

      <section className="relative mx-auto flex min-h-screen w-full max-w-4xl items-center px-5 py-8 sm:px-8 sm:py-10">
        <article className="w-full rounded-[2rem] border border-white/45 bg-white/15 p-6 text-white shadow-[0_20px_60px_rgba(13,22,16,0.35)] backdrop-blur-md sm:p-8 lg:p-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-wide">
            <Sparkles className="h-3.5 w-3.5" />
            mumuclass fairy tale
          </p>
          <p className="mt-4 text-sm font-extrabold text-[#f7e7c8]">시작하기</p>
          <h1 className="mt-1 text-4xl font-black leading-tight sm:text-5xl">슬기로운 방학생활</h1>
          <p className="mt-4 max-w-2xl text-sm font-medium text-white/90 sm:text-base">
            숙제가 아니라 모험처럼. 아이는 매일 작은 퀘스트를 즐기고, 선생님은 초대링크로 반 친구들을 따뜻하게 연결해요.
          </p>
          <p className="mt-2 text-sm font-semibold text-white/90">선생님은 로그인하고, 학생은 링크에서 가입해요.</p>
          <p className="mt-2 text-xs font-semibold text-white/85 sm:text-sm">안녕, 오늘도 요정이 기다리고 있었어.</p>

          <div className="mt-6">
            <a
              href="/login"
              className="inline-flex w-full items-center justify-between rounded-2xl bg-[#32563a] px-5 py-3 text-sm font-bold text-white sm:w-auto sm:min-w-[320px]"
            >
              <span className="inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                로그인 시작하기
              </span>
              <Sparkles className="h-4 w-4" />
            </a>
          </div>

          <p className="mt-5 text-center text-xs font-semibold text-white/85">2026. mumuclass by 불곰코끼리</p>
        </article>
      </section>
    </main>
  );
}
