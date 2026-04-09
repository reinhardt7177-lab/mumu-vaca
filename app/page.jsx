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

      <section className="relative mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-7 sm:px-6 sm:py-9">
        <article className="mx-auto flex w-full max-w-[540px] aspect-[3/2] flex-col rounded-[1.35rem] border border-white/45 bg-white/16 p-4 text-white shadow-[0_20px_60px_rgba(13,22,16,0.35)] backdrop-blur-md sm:p-5">
          <div>
            <h1 className="text-3xl font-black leading-tight sm:text-4xl">무무방학</h1>
            <p className="mt-2.5 text-sm font-medium text-white/92 sm:text-base">
              뻔한 방학 숙제 대신 즐거운 퀘스트! 링크 하나로 연결되는 우리 반만의 특별한 방학 생활.
            </p>
          </div>

          <div className="mt-auto">
            <a
              href="/login"
              className="inline-flex w-full items-center justify-between rounded-2xl bg-[#32563a] px-4 py-2.5 text-sm font-bold text-white"
            >
              <span className="inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                우리 반 방학 입장하기
              </span>
              <span aria-hidden>✨</span>
            </a>

            <p className="mt-4 text-center text-xs font-semibold text-white/85">2026. mumuclass by 불곰코끼리</p>
          </div>
        </article>
      </section>
    </main>
  );
}
