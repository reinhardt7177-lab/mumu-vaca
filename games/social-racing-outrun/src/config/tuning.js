export const RacingTuning = {
  laneCount: 3,
  minSpeed: 120,
  baseSpeed: 220,
  maxSpeed: 520,
  maxBoostSpeed: 620,
  accelRate: 340,
  brakeRate: 430,
  coastRate: 165,
  speedLerp: 6.2,
  steerSnap: 12.5,
  curvePenalty: 96,
  boost: {
    max: 100,
    drainRate: 36,
    recoverRate: 8,
    pushRate: 540
  },
  checkpointBonus: 300,
  overtakeBonus: 110,
  nearMissBonus: 70,
  comboTimeout: 2.3,
  comboStep: 0.17,
  comboMax: 3.1,
  collision: {
    cooldown: 0.8,
    speedLossFactor: 0.5,
    scorePenalty: 180
  },
  traffic: {
    minSpeed: 140,
    maxSpeed: 320,
    spawnIntervalMin: 0.65,
    spawnIntervalMax: 1.35,
    maxCount: 10
  },
  rivals: {
    count: 3,
    speedMin: 220,
    speedMax: 430
  }
};

export const FeelTuning = {
  cameraShakeHit: 9,
  cameraShakeHeavy: 13,
  cameraShakeDuration: 220,
  hitStopDurationMs: 85,
  boostFovKick: 0.08,
  flashDurationMs: 180,
  speedLineThreshold: 0.54
};

export const VisualTuning = {
  width: 390,
  height: 780,
  horizonY: 220,
  roadTopWidth: 52,
  roadBottomWidth: 360,
  drawDistance: 1100,
  roadsideParallax: 0.7,
  skyParallax: 0.12,
  mountainParallax: 0.24,
  forestParallax: 0.5,
  scanlineAlpha: 0.08,
  vignetteAlpha: 0.18,
  carBaseScale: 1.0,
  carProjectionNear: 1.4,
  hudTopPadding: 10
};

export const EducationTuning = {
  startLives: 3,
  chapterStartCo2: 100,
  chapterMaxCo2: 180,
  missionDecisionSeconds: 3
};
