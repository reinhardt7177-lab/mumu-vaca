"use client";

import { useEffect, useRef, useState } from "react";
import { createSocialRacingGame } from "@/games/social-racing-outrun/src/create-game";

export default function SocialRacingOutrunPage() {
  const mountRef = useRef(null);
  const gameRef = useRef(null);
  const [loadingText, setLoadingText] = useState("Phaser 엔진 로딩 중...");

  useEffect(() => {
    let active = true;

    const boot = async () => {
      try {
        setLoadingText("Phaser 엔진 로딩 중...");
        const phaserModule = await import("phaser");
        const Phaser = phaserModule.default ?? phaserModule;

        if (!active || !mountRef.current) return;
        setLoadingText("게임 씬 초기화 중...");
        gameRef.current = createSocialRacingGame(Phaser, mountRef.current);
        setLoadingText("");
      } catch (error) {
        console.error("Failed to start social-racing-outrun:", error);
        setLoadingText("게임 초기화 실패: 콘솔 로그를 확인하세요.");
      }
    };

    boot();

    return () => {
      active = false;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Neo-OutRun 환경 레이싱</h1>
        <p style={styles.subtitle}>체크포인트 미션카드 + 3차선 레이싱 + Phaser 3</p>
      </div>

      <section style={styles.shell}>
        <div style={styles.gameFrame}>
          <div ref={mountRef} style={styles.mount} />
          {loadingText ? <div style={styles.loading}>{loadingText}</div> : null}
        </div>

        <div style={styles.guide}>
          <p style={styles.guideTitle}>조작</p>
          <p style={styles.guideLine}>이동: ← → / 화면 좌우 터치</p>
          <p style={styles.guideLine}>가속: ↑ / ACCEL 버튼</p>
          <p style={styles.guideLine}>감속: ↓ / BRAKE 버튼</p>
          <p style={styles.guideLine}>부스트: Shift 또는 X / BOOST 버튼</p>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    margin: 0,
    padding: "16px",
    display: "grid",
    placeItems: "center",
    gap: "14px",
    background:
      "radial-gradient(circle at 50% -12%, #4aa2ff 0%, #1f4f85 42%, #0a1630 75%, #040816 100%)",
    fontFamily: "\"Trebuchet MS\", \"Malgun Gothic\", sans-serif"
  },
  header: {
    textAlign: "center",
    color: "#edf6ff",
    textShadow: "0 2px 0 rgba(0,0,0,0.55)"
  },
  title: {
    margin: 0,
    fontSize: "clamp(22px, 3.7vw, 34px)",
    letterSpacing: "0.4px"
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: "clamp(12px, 2.2vw, 15px)",
    color: "#c9ddff"
  },
  shell: {
    width: "min(94vw, 560px)",
    display: "grid",
    gap: "10px"
  },
  gameFrame: {
    position: "relative",
    width: "100%",
    aspectRatio: "9 / 16",
    borderRadius: "14px",
    border: "4px solid #9dc6f8",
    overflow: "hidden",
    boxShadow: "0 16px 44px rgba(0,0,0,0.45), inset 0 0 0 4px #122540",
    background: "linear-gradient(180deg, #091b38, #040b17)"
  },
  mount: {
    width: "100%",
    height: "100%",
    touchAction: "none"
  },
  loading: {
    position: "absolute",
    inset: "0",
    display: "grid",
    placeItems: "center",
    background: "rgba(4,10,20,0.7)",
    color: "#d7eaff",
    fontWeight: 700,
    letterSpacing: "0.2px",
    fontSize: "clamp(12px, 2.2vw, 15px)"
  },
  guide: {
    borderRadius: "12px",
    border: "2px solid #78a9e5",
    background: "rgba(8, 20, 42, 0.85)",
    color: "#d7e8ff",
    padding: "10px 12px",
    lineHeight: 1.32
  },
  guideTitle: {
    margin: 0,
    fontWeight: 700,
    color: "#ffe08a"
  },
  guideLine: {
    margin: "4px 0 0",
    fontSize: "14px"
  }
};
