"use client";

import { useEffect, useMemo, useState } from "react";
import { Clover, Flame, Medal, ShoppingBag, Sprout, Stars } from "lucide-react";
import { getBackgroundClass, getCompanionLabel, getTitleText } from "@/lib/game/equip-visuals";
import { getSessionUser, signOutSession } from "@/lib/auth/client";

function rarityBadgeClass(rarity) {
  if (rarity === "epic") return "bg-violet-100 text-violet-700";
  if (rarity === "rare") return "bg-sky-100 text-sky-700";
  return "bg-emerald-100 text-emerald-700";
}

function mapEquips(equips = []) {
  return equips.reduce((acc, equip) => {
    acc[equip.category] = equip;
    return acc;
  }, {});
}

export function StudentGamePanel() {
  const [studentId, setStudentId] = useState("");
  const [questId, setQuestId] = useState("");
  const [stats, setStats] = useState(null);
  const [shopItems, setShopItems] = useState([]);
  const [dailyQuest, setDailyQuest] = useState(null);
  const [reward, setReward] = useState(null);
  const [purchaseResult, setPurchaseResult] = useState(null);
  const [equipResult, setEquipResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionEmail, setSessionEmail] = useState("");
  const [sessionProvider, setSessionProvider] = useState("");

  const inventorySummary = useMemo(() => {
    if (!stats?.inventory?.length) return "아직 가진 아이템이 없어요.";
    return stats.inventory.map((item) => `${item.item_name} x${item.quantity}`).join(", ");
  }, [stats]);

  const equippedSummary = useMemo(() => mapEquips(stats?.equips ?? []), [stats]);
  const equippedBackgroundKey = equippedSummary.background?.item_key ?? null;
  const equippedTitleName = equippedSummary.title?.item_name ?? null;
  const equippedCompanionKey = equippedSummary.companion?.item_key ?? null;

  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      try {
        const user = await getSessionUser();

        if (cancelled || !user) return;
        setSessionEmail(user.email ?? "");
        setSessionProvider(user.provider ?? "");
        setStudentId((current) => current || user.id);
      } catch {
        // 로그인 없이도 수동 입력 동작 유지
      }
    }

    hydrateSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function signOut() {
    await signOutSession();
    setSessionEmail("");
  }

  async function loadStats() {
    if (sessionProvider === "firebase") {
      setError("Firebase 인증은 연결됐어요. 게임 데이터 API는 현재 Supabase 기반이라 Firestore로 마이그레이션 중입니다.");
      return;
    }

    if (!studentId) {
      setError("studentId를 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [statsRes, shopRes, dailyRes] = await Promise.all([
        fetch(`/api/game/student-stats?studentId=${encodeURIComponent(studentId)}`),
        fetch(`/api/game/shop?studentId=${encodeURIComponent(studentId)}`),
        fetch(`/api/game/daily-random-quest?studentId=${encodeURIComponent(studentId)}`)
      ]);

      const statsPayload = await statsRes.json();
      const shopPayload = await shopRes.json();
      const dailyPayload = await dailyRes.json();

      if (!statsRes.ok) {
        throw new Error(statsPayload.error ?? "학생 상태를 불러오지 못했습니다.");
      }
      if (!shopRes.ok) {
        throw new Error(shopPayload.error ?? "상점 정보를 불러오지 못했습니다.");
      }
      if (!dailyRes.ok) {
        throw new Error(dailyPayload.error ?? "랜덤 퀘스트를 불러오지 못했습니다.");
      }

      setStats(statsPayload);
      setShopItems(shopPayload.items ?? []);
      setDailyQuest(dailyPayload);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }

  async function completeQuest(targetQuestId) {
    if (sessionProvider === "firebase") {
      setError("Firebase 모드에서는 게임 완료 API가 아직 준비 중이에요.");
      return;
    }

    const selectedQuestId = targetQuestId ?? questId;

    if (!studentId || !selectedQuestId) {
      setError("studentId와 questId를 모두 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/game/complete-quest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, questId: selectedQuestId })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "퀘스트 완료 처리에 실패했습니다.");
      }

      setReward(payload);
      setPurchaseResult(null);
      setEquipResult(null);
      await loadStats();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  async function buyItem(itemKey) {
    if (sessionProvider === "firebase") {
      setError("Firebase 모드에서는 상점 API가 아직 준비 중이에요.");
      return;
    }

    if (!studentId) {
      setError("먼저 studentId를 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/game/purchase-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, itemKey })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "아이템 구매에 실패했습니다.");
      }

      setPurchaseResult(payload);
      setReward(null);
      setEquipResult(null);
      await loadStats();
    } catch (purchaseError) {
      setError(purchaseError.message);
    } finally {
      setLoading(false);
    }
  }

  async function equipItem(itemKey) {
    if (sessionProvider === "firebase") {
      setError("Firebase 모드에서는 장착 API가 아직 준비 중이에요.");
      return;
    }

    if (!studentId) {
      setError("먼저 studentId를 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/game/equip-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, itemKey })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "아이템 장착에 실패했습니다.");
      }

      setEquipResult(payload);
      setReward(null);
      setPurchaseResult(null);
      await loadStats();
    } catch (equipError) {
      setError(equipError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-fairy bg-white p-6 shadow-fairy">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <Stars className="h-5 w-5" /> 레벨업 광장 (랜덤 퀘스트 + 주간 배지)
      </h2>
      <p className="mt-2 text-sm text-fairy-ink/80">오늘의 랜덤 퀘스트와 주간 배지를 포함한 게임 루프를 테스트할 수 있어요.</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-fairy-cream px-3 py-1">로그인 유저: {sessionEmail || "없음"}</span>
        <span className="rounded-full bg-white px-3 py-1 font-semibold text-fairy-ink">
          인증: {sessionProvider || "없음"}
        </span>
        <a href="/login" className="rounded-full bg-fairy-sky px-3 py-1 font-semibold text-fairy-ink">
          로그인
        </a>
        {sessionEmail ? (
          <button type="button" onClick={signOut} className="rounded-full bg-white px-3 py-1 font-semibold text-fairy-ink">
            로그아웃
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold">
          학생 ID
          <input
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            className="rounded-xl border border-fairy-ink/20 px-4 py-2 outline-none ring-fairy-sky focus:ring"
            placeholder="Firebase UID 또는 Supabase UUID"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          퀘스트 ID (수동)
          <input
            value={questId}
            onChange={(event) => setQuestId(event.target.value)}
            className="rounded-xl border border-fairy-ink/20 px-4 py-2 outline-none ring-fairy-sky focus:ring"
            placeholder="quests의 UUID"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={loadStats}
          disabled={loading || sessionProvider === "firebase"}
          className="rounded-full bg-fairy-sky px-4 py-2 text-sm font-semibold text-fairy-ink disabled:opacity-60"
        >
          학생 상태 새로고침
        </button>
        <button
          onClick={() => completeQuest()}
          disabled={loading || sessionProvider === "firebase"}
          className="rounded-full bg-fairy-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          수동 퀘스트 완료 보내기
        </button>
      </div>

      {error ? <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {dailyQuest?.quest ? (
        <div className="mt-4 rounded-2xl bg-fairy-cream p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-fairy-ink">
            <Clover className="h-4 w-4" /> 오늘의 랜덤 퀘스트
          </p>
          <p className="mt-2 font-semibold">{dailyQuest.quest.title}</p>
          <p className="mt-1 text-sm text-fairy-ink/70">유형: {dailyQuest.quest.quest_type}</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setQuestId(dailyQuest.quest.id)}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-fairy-ink"
            >
              이 퀘스트 ID 채우기
            </button>
            <button
              onClick={() => completeQuest(dailyQuest.quest.id)}
              disabled={loading || dailyQuest.completed}
              className="rounded-full bg-fairy-ink px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {dailyQuest.completed ? "이미 완료" : "바로 완료하기"}
            </button>
          </div>
        </div>
      ) : null}

      {stats ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-fairy-cream p-4 text-sm">
              <p className="text-fairy-ink/70">경험치</p>
              <p className="mt-1 text-xl font-bold">{stats.profile.xp}</p>
            </div>
            <div className="rounded-2xl bg-fairy-cream p-4 text-sm">
              <p className="text-fairy-ink/70">도토리</p>
              <p className="mt-1 flex items-center gap-1 text-xl font-bold">
                <Sprout className="h-4 w-4" /> {stats.profile.acorns}
              </p>
            </div>
            <div className="rounded-2xl bg-fairy-cream p-4 text-sm">
              <p className="text-fairy-ink/70">연속 스트릭</p>
              <p className="mt-1 flex items-center gap-1 text-xl font-bold">
                <Flame className="h-4 w-4" /> {stats.streak.current}일
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
            <p className="flex items-center gap-2 font-bold">
              <Medal className="h-4 w-4" /> 주간 배지
            </p>
            {stats.weeklyBadge ? (
              <p className="mt-1">
                {stats.weeklyBadge.badge_name} (레벨 {stats.weeklyBadge.badge_level}) · 주간 완료 {stats.weeklyBadge.completion_count}개
              </p>
            ) : (
              <p className="mt-1">아직 배지가 없어요. 이번 주 완료 횟수를 올려 보자.</p>
            )}
          </div>

          <div className="mt-4 rounded-2xl bg-fairy-mint/70 p-4 text-sm text-fairy-ink">
            <p className="font-bold">내 가방</p>
            <p className="mt-1">{inventorySummary}</p>
            <p className="mt-3 font-bold">현재 장착</p>
            <p className="mt-1 text-sm">
              배경: {equippedSummary.background?.item_name ?? "없음"} / 칭호: {equippedSummary.title?.item_name ?? "없음"} / 동물: {" "}
              {equippedSummary.companion?.item_name ?? "없음"}
            </p>
          </div>

          <div className={`mt-4 overflow-hidden rounded-2xl bg-gradient-to-br ${getBackgroundClass(equippedBackgroundKey)} p-5`}>
            <p className="text-xs font-semibold text-fairy-ink/70">숲 미리보기</p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-fairy-ink/70">나의 칭호</p>
                <p className="mt-1 inline-flex rounded-full bg-white/85 px-3 py-1 text-sm font-bold text-fairy-ink">
                  {getTitleText(equippedTitleName)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-fairy-ink/70">요정 동물</p>
                <p className="mt-1 text-base font-semibold text-fairy-ink">{getCompanionLabel(equippedCompanionKey)}</p>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className="h-14 w-14 rounded-full bg-white/70" />
              <div className="h-16 w-16 rounded-full bg-white/80" />
              <div className="h-20 w-20 rounded-full bg-white/90" />
            </div>
            <div className="mt-2 text-xs text-fairy-ink/70">장착을 바꾸면 숲 분위기가 바로 바뀌어요.</div>
          </div>
        </>
      ) : null}

      {reward ? (
        <div className="mt-4 rounded-2xl bg-fairy-mint p-4 text-sm text-fairy-ink">
          <p className="font-bold">{reward.message}</p>
          <p className="mt-1">
            +{reward.gained.xp} XP / +{reward.gained.acorns} 도토리
          </p>
          {reward.weekly?.badge ? <p className="mt-1 font-semibold">주간 배지 획득: {reward.weekly.badge.name}</p> : null}
        </div>
      ) : null}

      {purchaseResult ? (
        <div className="mt-4 rounded-2xl bg-fairy-sky/60 p-4 text-sm text-fairy-ink">
          <p className="font-bold">{purchaseResult.message}</p>
          <p className="mt-1">남은 도토리: {purchaseResult.remainingAcorns}</p>
        </div>
      ) : null}

      {equipResult ? (
        <div className="mt-4 rounded-2xl bg-amber-100 p-4 text-sm text-amber-900">
          <p className="font-bold">{equipResult.message}</p>
        </div>
      ) : null}

      <div className="mt-6">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <ShoppingBag className="h-5 w-5" /> 도토리 상점
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shopItems.map((item) => {
            const canEquip = ["background", "title", "companion"].includes(item.category);
            const canBuy = !loading && Boolean(studentId);
            const canEquipNow = canEquip && (item.ownedQuantity ?? 0) > 0 && !loading && Boolean(studentId);

            return (
              <article key={item.itemKey} className="rounded-2xl border border-fairy-ink/10 bg-fairy-cream p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold">{item.itemName}</p>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${rarityBadgeClass(item.rarity)}`}>{item.rarity}</span>
                </div>
                <p className="mt-2 text-sm text-fairy-ink/80">{item.description}</p>
                <p className="mt-2 text-xs text-fairy-ink/70">카테고리: {item.category}</p>
                <p className="mt-3 text-sm font-semibold">가격: {item.priceAcorns} 도토리</p>
                <p className="mt-1 text-xs text-fairy-ink/70">보유: {item.ownedQuantity ?? 0}</p>
                {item.isEquipped ? (
                  <p className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">장착 중</p>
                ) : null}

                <div className="mt-3 grid gap-2">
                  <button
                    onClick={() => buyItem(item.itemKey)}
                    disabled={!canBuy}
                    className="w-full rounded-full bg-fairy-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    구매하기
                  </button>
                  {canEquip ? (
                    <button
                      onClick={() => equipItem(item.itemKey)}
                      disabled={!canEquipNow || item.isEquipped}
                      className="w-full rounded-full bg-fairy-sky px-3 py-2 text-sm font-semibold text-fairy-ink disabled:opacity-60"
                    >
                      장착하기
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
