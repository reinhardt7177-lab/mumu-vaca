export const chapterData = [
  {
    id: "heat-fire",
    title: "CHAPTER 1 · 폭염과 산불",
    subtitle: "기후위기 첫 구간",
    timeLimit: 68,
    checkpoints: [1300, 2650, 4000],
    missionCards: [
      {
        prompt: "폭염 경보일 등굣길, 어떤 선택이 더 좋을까?",
        options: [
          {
            label: "혼자 자가용 이동",
            co2Delta: 16,
            racingEffect: { speedDelta: -28, boostDelta: -18, gripDelta: -0.06, scoreDelta: 20 },
            tag: "pollution"
          },
          {
            label: "친구와 카풀",
            co2Delta: 4,
            racingEffect: { speedDelta: 12, boostDelta: 8, gripDelta: 0.02, scoreDelta: 50 },
            tag: "neutral"
          },
          {
            label: "버스/대중교통 이용",
            co2Delta: -14,
            racingEffect: { speedDelta: 24, boostDelta: 28, gripDelta: 0.07, scoreDelta: 120 },
            tag: "eco"
          }
        ]
      },
      {
        prompt: "교실 냉방은 어떤 방식이 가장 바람직할까?",
        options: [
          {
            label: "18도 강냉방 계속",
            co2Delta: 18,
            racingEffect: { speedDelta: -32, boostDelta: -16, gripDelta: -0.08, scoreDelta: 10 },
            tag: "pollution"
          },
          {
            label: "필요 시간만 냉방",
            co2Delta: 3,
            racingEffect: { speedDelta: 8, boostDelta: 10, gripDelta: 0.03, scoreDelta: 45 },
            tag: "neutral"
          },
          {
            label: "적정온도 26도 유지",
            co2Delta: -12,
            racingEffect: { speedDelta: 20, boostDelta: 25, gripDelta: 0.07, scoreDelta: 110 },
            tag: "eco"
          }
        ]
      },
      {
        prompt: "야외활동 후 쓰레기 처리는 어떻게 할까?",
        options: [
          {
            label: "종류 상관없이 한 번에 버리기",
            co2Delta: 12,
            racingEffect: { speedDelta: -16, boostDelta: -12, gripDelta: -0.04, scoreDelta: 20 },
            tag: "pollution"
          },
          {
            label: "일반쓰레기만 분리",
            co2Delta: 2,
            racingEffect: { speedDelta: 8, boostDelta: 6, gripDelta: 0.02, scoreDelta: 45 },
            tag: "neutral"
          },
          {
            label: "분리배출 꼼꼼히",
            co2Delta: -13,
            racingEffect: { speedDelta: 22, boostDelta: 30, gripDelta: 0.08, scoreDelta: 120 },
            tag: "eco"
          }
        ]
      }
    ],
    trackSections: [
      { length: 500, curve: 0.0, hill: 0.1 },
      { length: 450, curve: 0.25, hill: 0.22 },
      { length: 600, curve: -0.32, hill: -0.18 },
      { length: 560, curve: 0.18, hill: 0.15 },
      { length: 760, curve: -0.42, hill: -0.2 },
      { length: 980, curve: 0.08, hill: 0.05 }
    ],
    winCondition: {
      finishDistance: 5400,
      targetCo2: 58
    }
  },
  {
    id: "flood-city",
    title: "CHAPTER 2 · 홍수와 침수",
    subtitle: "집중호우 대응",
    timeLimit: 65,
    checkpoints: [1400, 2900, 4300],
    missionCards: [
      {
        prompt: "집중호우 예보가 떴다면 가장 먼저 무엇을 할까?",
        options: [
          {
            label: "아무 준비 없이 외출",
            co2Delta: 14,
            racingEffect: { speedDelta: -26, boostDelta: -16, gripDelta: -0.07, scoreDelta: 20 },
            tag: "pollution"
          },
          {
            label: "우산만 챙기고 이동",
            co2Delta: 3,
            racingEffect: { speedDelta: 10, boostDelta: 8, gripDelta: 0.03, scoreDelta: 50 },
            tag: "neutral"
          },
          {
            label: "배수구 점검 및 안전 공유",
            co2Delta: -11,
            racingEffect: { speedDelta: 24, boostDelta: 26, gripDelta: 0.08, scoreDelta: 130 },
            tag: "eco"
          }
        ]
      },
      {
        prompt: "비 오는 날 장보기 이동은?",
        options: [
          {
            label: "가까워도 차 이용",
            co2Delta: 13,
            racingEffect: { speedDelta: -20, boostDelta: -14, gripDelta: -0.05, scoreDelta: 25 },
            tag: "pollution"
          },
          {
            label: "상황 보고 선택",
            co2Delta: 2,
            racingEffect: { speedDelta: 10, boostDelta: 8, gripDelta: 0.03, scoreDelta: 50 },
            tag: "neutral"
          },
          {
            label: "대중교통 이용",
            co2Delta: -12,
            racingEffect: { speedDelta: 22, boostDelta: 24, gripDelta: 0.08, scoreDelta: 125 },
            tag: "eco"
          }
        ]
      },
      {
        prompt: "침수 이후 정리할 때 더 나은 방법은?",
        options: [
          {
            label: "일회용품 대량 사용",
            co2Delta: 12,
            racingEffect: { speedDelta: -18, boostDelta: -10, gripDelta: -0.05, scoreDelta: 25 },
            tag: "pollution"
          },
          {
            label: "필요량만 사용",
            co2Delta: 2,
            racingEffect: { speedDelta: 8, boostDelta: 10, gripDelta: 0.03, scoreDelta: 55 },
            tag: "neutral"
          },
          {
            label: "재사용 도구 활용",
            co2Delta: -11,
            racingEffect: { speedDelta: 20, boostDelta: 22, gripDelta: 0.08, scoreDelta: 120 },
            tag: "eco"
          }
        ]
      }
    ],
    trackSections: [
      { length: 460, curve: 0.08, hill: 0.07 },
      { length: 540, curve: -0.34, hill: -0.25 },
      { length: 620, curve: 0.4, hill: 0.18 },
      { length: 600, curve: -0.2, hill: 0.1 },
      { length: 800, curve: 0.36, hill: -0.22 },
      { length: 980, curve: -0.1, hill: 0.12 }
    ],
    winCondition: {
      finishDistance: 5600,
      targetCo2: 54
    }
  },
  {
    id: "carbon-neutral",
    title: "CHAPTER 3 · 탄소중립 실천",
    subtitle: "생활 속 감축 행동",
    timeLimit: 64,
    checkpoints: [1500, 3000, 4500],
    missionCards: [
      {
        prompt: "등교 준비물, 어떤 방식이 더 친환경일까?",
        options: [
          {
            label: "매번 새 비닐봉투",
            co2Delta: 15,
            racingEffect: { speedDelta: -26, boostDelta: -18, gripDelta: -0.07, scoreDelta: 20 },
            tag: "pollution"
          },
          {
            label: "종이봉투 재사용",
            co2Delta: 2,
            racingEffect: { speedDelta: 10, boostDelta: 9, gripDelta: 0.03, scoreDelta: 55 },
            tag: "neutral"
          },
          {
            label: "에코백 꾸준히 사용",
            co2Delta: -13,
            racingEffect: { speedDelta: 24, boostDelta: 30, gripDelta: 0.08, scoreDelta: 135 },
            tag: "eco"
          }
        ]
      },
      {
        prompt: "급식 시간 탄소중립 실천은?",
        options: [
          {
            label: "육류 위주로만 선택",
            co2Delta: 11,
            racingEffect: { speedDelta: -16, boostDelta: -9, gripDelta: -0.04, scoreDelta: 25 },
            tag: "pollution"
          },
          {
            label: "평소 식단 유지",
            co2Delta: 1,
            racingEffect: { speedDelta: 8, boostDelta: 8, gripDelta: 0.03, scoreDelta: 55 },
            tag: "neutral"
          },
          {
            label: "채소 메뉴 함께 선택",
            co2Delta: -10,
            racingEffect: { speedDelta: 18, boostDelta: 22, gripDelta: 0.07, scoreDelta: 120 },
            tag: "eco"
          }
        ]
      },
      {
        prompt: "물 마실 때 더 좋은 습관은?",
        options: [
          {
            label: "일회용컵 계속 사용",
            co2Delta: 14,
            racingEffect: { speedDelta: -20, boostDelta: -14, gripDelta: -0.05, scoreDelta: 20 },
            tag: "pollution"
          },
          {
            label: "종이컵 사용 줄이기",
            co2Delta: 3,
            racingEffect: { speedDelta: 8, boostDelta: 8, gripDelta: 0.03, scoreDelta: 50 },
            tag: "neutral"
          },
          {
            label: "텀블러 사용하기",
            co2Delta: -14,
            racingEffect: { speedDelta: 26, boostDelta: 32, gripDelta: 0.09, scoreDelta: 140 },
            tag: "eco"
          }
        ]
      }
    ],
    trackSections: [
      { length: 520, curve: 0.18, hill: 0.12 },
      { length: 560, curve: -0.36, hill: -0.28 },
      { length: 620, curve: 0.28, hill: 0.2 },
      { length: 680, curve: -0.46, hill: -0.18 },
      { length: 760, curve: 0.4, hill: 0.14 },
      { length: 940, curve: -0.12, hill: 0.1 }
    ],
    winCondition: {
      finishDistance: 5900,
      targetCo2: 50
    }
  },
  {
    id: "daily-habit",
    title: "CHAPTER 4 · 생활 속 감축 습관",
    subtitle: "마지막 실천 챌린지",
    timeLimit: 63,
    checkpoints: [1600, 3200, 4700],
    missionCards: [
      {
        prompt: "택배 상자는 어떻게 쓰는 게 좋을까?",
        options: [
          {
            label: "바로 버리기",
            co2Delta: 10,
            racingEffect: { speedDelta: -14, boostDelta: -10, gripDelta: -0.04, scoreDelta: 30 },
            tag: "pollution"
          },
          {
            label: "필요할 때만 재사용",
            co2Delta: 1,
            racingEffect: { speedDelta: 10, boostDelta: 8, gripDelta: 0.03, scoreDelta: 60 },
            tag: "neutral"
          },
          {
            label: "다회용 상자 선택",
            co2Delta: -12,
            racingEffect: { speedDelta: 24, boostDelta: 28, gripDelta: 0.08, scoreDelta: 135 },
            tag: "eco"
          }
        ]
      },
      {
        prompt: "가까운 거리 이동 습관은?",
        options: [
          {
            label: "무조건 자동차 이동",
            co2Delta: 14,
            racingEffect: { speedDelta: -24, boostDelta: -15, gripDelta: -0.06, scoreDelta: 20 },
            tag: "pollution"
          },
          {
            label: "상황에 따라 선택",
            co2Delta: 2,
            racingEffect: { speedDelta: 10, boostDelta: 8, gripDelta: 0.03, scoreDelta: 55 },
            tag: "neutral"
          },
          {
            label: "자전거/도보 이동",
            co2Delta: -12,
            racingEffect: { speedDelta: 22, boostDelta: 30, gripDelta: 0.09, scoreDelta: 140 },
            tag: "eco"
          }
        ]
      },
      {
        prompt: "주말 실천 활동으로 알맞은 것은?",
        options: [
          {
            label: "에어컨 강냉방으로 실내만",
            co2Delta: 12,
            racingEffect: { speedDelta: -16, boostDelta: -10, gripDelta: -0.04, scoreDelta: 25 },
            tag: "pollution"
          },
          {
            label: "평소처럼 보내기",
            co2Delta: 3,
            racingEffect: { speedDelta: 10, boostDelta: 10, gripDelta: 0.03, scoreDelta: 60 },
            tag: "neutral"
          },
          {
            label: "동네 환경정화 참여",
            co2Delta: -13,
            racingEffect: { speedDelta: 26, boostDelta: 34, gripDelta: 0.1, scoreDelta: 150 },
            tag: "eco"
          }
        ]
      }
    ],
    trackSections: [
      { length: 540, curve: 0.22, hill: 0.14 },
      { length: 590, curve: -0.42, hill: -0.28 },
      { length: 680, curve: 0.34, hill: 0.24 },
      { length: 700, curve: -0.48, hill: -0.2 },
      { length: 760, curve: 0.44, hill: 0.18 },
      { length: 980, curve: -0.16, hill: 0.1 }
    ],
    winCondition: {
      finishDistance: 6200,
      targetCo2: 46
    }
  }
];
