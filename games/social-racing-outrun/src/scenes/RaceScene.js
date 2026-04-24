import { chapterData } from "../data/chapter-data";
import { EducationTuning, FeelTuning, RacingTuning, VisualTuning } from "../config/tuning";

const TRAFFIC_TEXTURES = ["car-traffic-1", "car-traffic-2", "car-traffic-3", "car-traffic-4"];
const RIVAL_TEXTURES = ["car-rival-1", "car-rival-2", "car-rival-3"];

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function pickRandom(arr) {
  return arr[(Math.random() * arr.length) | 0];
}

export function createRaceScene(Phaser) {
  return class RaceScene extends Phaser.Scene {
    constructor() {
      super("RaceScene");
      this.chapterIndex = 0;
      this.chapter = null;
      this.trackLength = 0;
      this.trackMap = [];
      this.runEnded = false;
    }

    init(data) {
      this.chapterIndex = typeof data?.chapterIndex === "number"
        ? data.chapterIndex
        : this.registry.get("chapterIndex") || 0;
      this.chapterIndex = clamp(this.chapterIndex, 0, chapterData.length - 1);
      this.chapter = chapterData[this.chapterIndex];
      this.prepareTrack(this.chapter.trackSections);
      this.runEnded = false;
    }

    create() {
      this.width = this.scale.width;
      this.height = this.scale.height;
      this.horizonY = VisualTuning.horizonY;

      this.createState();
      this.createBackground();
      this.createRoadLayers();
      this.createCars();
      this.createHud();
      this.createInput();
      this.createTouchControls();
      this.syncHud();
      this.showStatus("READY", "#ffe08f", 700);
    }

    createState() {
      this.score = this.registry.get("score") || 0;
      this.lives = this.registry.get("lives") || EducationTuning.startLives;
      this.totalCo2Reduced = this.registry.get("totalCo2Reduced") || 0;
      this.chapterLogs = this.registry.get("chapterLogs") || [];

      this.distance = 0;
      this.timer = this.chapter.timeLimit;
      this.speed = RacingTuning.baseSpeed;
      this.targetSpeed = RacingTuning.baseSpeed;
      this.boost = RacingTuning.boost.max * 0.35;
      this.boostActive = false;

      this.playerLaneTarget = 1;
      this.playerLanePos = 1;
      this.steerVisual = 0;

      this.comboStreak = 0;
      this.comboTimer = 0;
      this.comboMult = 1;

      this.chapterCo2 = EducationTuning.chapterStartCo2;
      this.missionIndex = 0;
      this.nextCheckpointDistance = this.chapter.checkpoints[0];
      this.checkpointPassed = 0;

      this.hitCooldown = 0;
      this.hitStopTimerMs = 0;
      this.gripBonus = 0;
      this.gripBonusTimer = 0;
      this.flashTimerMs = 0;
      this.flashColor = 0xffffff;
      this.statusTimer = 0;
      this.statusColor = "#ffffff";
      this.statusText = "";

      this.raceFinishTriggered = false;

      this.rivals = Array.from({ length: RacingTuning.rivals.count }).map((_, i) => ({
        id: "rival-" + i,
        lanePos: (i % RacingTuning.laneCount),
        laneTarget: (i % RacingTuning.laneCount),
        laneChangeTimer: randomRange(0.7, 1.7),
        speed: randomRange(RacingTuning.rivals.speedMin, RacingTuning.rivals.speedMax),
        skill: 0.6 + i * 0.12,
        distance: 180 + i * 130,
        nearMissed: false,
        overtakeCounted: false,
        sprite: null
      }));

      this.traffic = [];
      this.trafficSpawnTimer = randomRange(
        RacingTuning.traffic.spawnIntervalMin,
        RacingTuning.traffic.spawnIntervalMax
      );

      this.rank = RacingTuning.rivals.count + 1;
    }

    prepareTrack(sections) {
      this.trackMap = [];
      this.trackLength = 0;
      sections.forEach((section) => {
        const start = this.trackLength;
        const length = Math.max(120, section.length || 300);
        this.trackLength += length;
        this.trackMap.push({
          start,
          end: this.trackLength,
          length,
          curve: section.curve || 0,
          hill: section.hill || 0
        });
      });
      if (this.trackMap.length === 0) {
        this.trackMap.push({ start: 0, end: 1000, length: 1000, curve: 0.1, hill: 0.05 });
        this.trackLength = 1000;
      }
    }

    sampleTrack(distance) {
      let d = distance % this.trackLength;
      if (d < 0) d += this.trackLength;
      let idx = 0;
      for (let i = 0; i < this.trackMap.length; i++) {
        if (d < this.trackMap[i].end) {
          idx = i;
          break;
        }
      }
      const section = this.trackMap[idx];
      const next = this.trackMap[(idx + 1) % this.trackMap.length];
      const t = (d - section.start) / section.length;
      const curve = Phaser.Math.Linear(section.curve, next.curve, t);
      const hill = Phaser.Math.Linear(section.hill, next.hill, t);
      return { curve, hill };
    }

    createBackground() {
      this.sky = this.add
        .tileSprite(this.width / 2, this.horizonY / 2, this.width + 10, this.horizonY + 30, "bg-sky")
        .setDepth(-100);
      this.mountains = this.add
        .tileSprite(this.width / 2, this.horizonY + 24, this.width + 30, 170, "bg-mountains")
        .setDepth(-90)
        .setOrigin(0.5, 1);
      this.forest = this.add
        .tileSprite(this.width / 2, this.horizonY + 80, this.width + 40, 130, "bg-forest")
        .setDepth(-80)
        .setOrigin(0.5, 1);
      this.roadside = this.add
        .tileSprite(this.width / 2, this.height - 120, this.width + 40, 240, "bg-roadside")
        .setDepth(-75)
        .setOrigin(0.5, 1);
    }

    createRoadLayers() {
      this.roadG = this.add.graphics().setDepth(20);
      this.speedLineG = this.add.graphics().setDepth(1020);
      this.particleG = this.add.graphics().setDepth(1030);
    }

    createCars() {
      this.playerSprite = this.add.image(this.width / 2, this.height - 92, "car-player").setDepth(1200);
      this.playerSprite.setScale(1.4);

      this.rivals.forEach((rival, idx) => {
        rival.sprite = this.add.image(this.width / 2, -200, RIVAL_TEXTURES[idx % RIVAL_TEXTURES.length]).setVisible(false);
      });

      for (let i = 0; i < RacingTuning.traffic.maxCount; i++) {
        this.traffic.push({
          id: "traffic-" + i,
          active: false,
          lanePos: 1,
          laneTarget: 1,
          laneChangeTimer: 0,
          speed: 0,
          distance: 0,
          nearMissed: false,
          overtakeCounted: false,
          sprite: this.add.image(this.width / 2, -300, pickRandom(TRAFFIC_TEXTURES)).setVisible(false)
        });
      }
    }

    createHud() {
      this.hud = this.add.container(0, 0).setDepth(1500);
      const frame = this.add.image(this.width / 2, VisualTuning.hudTopPadding + 58, "hud-frame");
      frame.setDisplaySize(this.width - 14, 110).setAlpha(0.94);
      this.hud.add(frame);

      const styleLabel = { fontFamily: "Courier New", fontSize: "14px", color: "#b7d8ff" };
      const styleValue = { fontFamily: "Courier New", fontSize: "21px", fontStyle: "bold", color: "#ffe586" };
      const styleSmall = { fontFamily: "Courier New", fontSize: "13px", color: "#a7d7ff" };

      this.chapterLabel = this.add.text(18, 14, "CHAPTER", styleLabel);
      this.chapterValue = this.add.text(18, 31, "1 / 4", styleValue);
      this.hud.add([this.chapterLabel, this.chapterValue]);

      this.rankLabel = this.add.text(124, 14, "RANK", styleLabel);
      this.rankValue = this.add.text(124, 31, "4 / 4", styleValue);
      this.hud.add([this.rankLabel, this.rankValue]);

      this.timeLabel = this.add.text(210, 14, "TIME", styleLabel);
      this.timeValue = this.add.text(210, 31, "60", styleValue);
      this.hud.add([this.timeLabel, this.timeValue]);

      this.speedLabel = this.add.text(18, 66, "SPEED", styleSmall);
      this.speedValue = this.add.text(72, 64, "220", { fontFamily: "Courier New", fontSize: "17px", color: "#f1fbff" });
      this.boostLabel = this.add.text(140, 66, "BOOST", styleSmall);
      this.scoreLabel = this.add.text(222, 66, "SCORE", styleSmall);
      this.scoreValue = this.add.text(278, 64, "0", { fontFamily: "Courier New", fontSize: "17px", color: "#f7ffbf" });
      this.hud.add([this.speedLabel, this.speedValue, this.boostLabel, this.scoreLabel, this.scoreValue]);

      this.boostBarBg = this.add.rectangle(140, 90, 72, 10, 0x1f3557, 0.9).setOrigin(0, 0.5);
      this.boostBarFill = this.add.rectangle(141, 90, 70, 8, 0x78f6c0, 1).setOrigin(0, 0.5);
      this.co2Label = this.add.text(226, 84, "CO2 100", styleSmall);
      this.lifeLabel = this.add.text(302, 84, "♥♥♥", { fontFamily: "Courier New", fontSize: "16px", color: "#ff93aa" });
      this.hud.add([this.boostBarBg, this.boostBarFill, this.co2Label, this.lifeLabel]);

      this.missionBanner = this.add
        .text(this.width / 2, this.horizonY - 10, "", {
          fontFamily: "Malgun Gothic, sans-serif",
          fontSize: "17px",
          fontStyle: "bold",
          color: "#eaf3ff",
          align: "center",
          wordWrap: { width: this.width - 36 }
        })
        .setOrigin(0.5, 1)
        .setDepth(1500);

      this.statusLabel = this.add
        .text(this.width / 2, this.height * 0.42, "", {
          fontFamily: "Courier New",
          fontSize: "34px",
          fontStyle: "bold",
          color: "#ffe080",
          stroke: "#10203a",
          strokeThickness: 6
        })
        .setOrigin(0.5)
        .setDepth(1600)
        .setAlpha(0);
    }

    createInput() {
      this.keys = this.input.keyboard.addKeys({
        left: Phaser.Input.Keyboard.KeyCodes.LEFT,
        right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        accel: Phaser.Input.Keyboard.KeyCodes.UP,
        brake: Phaser.Input.Keyboard.KeyCodes.DOWN,
        boost: Phaser.Input.Keyboard.KeyCodes.SHIFT,
        boostAlt: Phaser.Input.Keyboard.KeyCodes.X
      });

      this.input.on("pointerdown", (pointer) => {
        if (pointer.y < this.height - 110) {
          if (pointer.x < this.width * 0.46) this.shiftLane(-1);
          else if (pointer.x > this.width * 0.54) this.shiftLane(1);
        }
      });
    }

    createTouchControls() {
      const y = this.height - 44;
      this.btnBrake = this.createTouchButton(64, y, 92, 40, "BRAKE", 0x213f67);
      this.btnBoost = this.createTouchButton(this.width / 2, y, 96, 40, "BOOST", 0x23583f);
      this.btnAccel = this.createTouchButton(this.width - 64, y, 92, 40, "ACCEL", 0x275b8d);

      this.bindHold(this.btnBrake, () => (this.holdBrake = true), () => (this.holdBrake = false));
      this.bindHold(this.btnBoost, () => (this.holdBoost = true), () => (this.holdBoost = false));
      this.bindHold(this.btnAccel, () => (this.holdAccel = true), () => (this.holdAccel = false));
    }

    createTouchButton(x, y, w, h, text, color) {
      const c = this.add.container(x, y).setDepth(1600);
      const bg = this.add
        .rectangle(0, 0, w, h, color, 0.92)
        .setStrokeStyle(2, 0x9fd2ff, 1)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(0, 0, text, {
          fontFamily: "Courier New",
          fontSize: "17px",
          fontStyle: "bold",
          color: "#eef8ff"
        })
        .setOrigin(0.5);
      c.add([bg, label]);
      c.bg = bg;
      return c;
    }

    bindHold(button, onDown, onUp) {
      button.bg.on("pointerdown", () => {
        onDown();
        button.bg.setFillStyle(0x4f84c2, 1);
      });
      button.bg.on("pointerup", () => {
        onUp();
        button.bg.setFillStyle(0x244f7a, 0.95);
      });
      button.bg.on("pointerout", () => {
        onUp();
        button.bg.setFillStyle(0x244f7a, 0.95);
      });
      button.bg.on("pointercancel", () => {
        onUp();
        button.bg.setFillStyle(0x244f7a, 0.95);
      });
    }

    shiftLane(delta) {
      this.playerLaneTarget = clamp(this.playerLaneTarget + delta, 0, RacingTuning.laneCount - 1);
    }

    update(_, deltaMs) {
      if (this.runEnded) return;
      const rawDt = Math.min(0.05, deltaMs / 1000);
      if (rawDt <= 0) return;

      if (this.hitStopTimerMs > 0) this.hitStopTimerMs -= deltaMs;
      const dt = this.hitStopTimerMs > 0 ? rawDt * 0.15 : rawDt;

      this.handleInput(rawDt);
      this.updatePlayerMotion(dt);
      this.updateRivals(dt);
      this.updateTraffic(dt);
      this.updateCombo(dt);
      this.updateEffects(rawDt);
      this.updateProgress(dt);
      this.renderWorld();
      this.syncHud();
    }

    handleInput(dt) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.left)) this.shiftLane(-1);
      if (Phaser.Input.Keyboard.JustDown(this.keys.right)) this.shiftLane(1);

      this.inputAccel = this.keys.accel.isDown || this.holdAccel;
      this.inputBrake = this.keys.brake.isDown || this.holdBrake;
      this.inputBoost = (this.keys.boost.isDown || this.keys.boostAlt.isDown || this.holdBoost) && this.boost > 0;

      if (this.inputAccel) {
        this.targetSpeed += RacingTuning.accelRate * dt;
      } else {
        this.targetSpeed -= RacingTuning.coastRate * dt;
      }
      if (this.inputBrake) this.targetSpeed -= RacingTuning.brakeRate * dt;

      this.targetSpeed = clamp(this.targetSpeed, RacingTuning.minSpeed, RacingTuning.maxSpeed);
    }

    updatePlayerMotion(dt) {
      this.playerLanePos += (this.playerLaneTarget - this.playerLanePos) * Math.min(1, dt * RacingTuning.steerSnap);
      this.steerVisual += ((this.playerLaneTarget - this.playerLanePos) - this.steerVisual) * Math.min(1, dt * 12);

      if (this.inputBoost && this.boost > 0) {
        this.boostActive = true;
        this.boost -= RacingTuning.boost.drainRate * dt;
      } else {
        this.boostActive = false;
        this.boost += RacingTuning.boost.recoverRate * dt;
      }
      this.boost = clamp(this.boost, 0, RacingTuning.boost.max);

      const sample = this.sampleTrack(this.distance + 20);
      const gripFactor = clamp(1 + this.gripBonus, 0.7, 1.4);
      const curvePenalty = Math.abs(sample.curve) * RacingTuning.curvePenalty * (this.speed / RacingTuning.maxBoostSpeed) / gripFactor;
      const boostPush = this.boostActive ? RacingTuning.boost.pushRate : 0;
      const desired = this.targetSpeed + boostPush;
      const accel = (desired - this.speed) * RacingTuning.speedLerp;
      this.speed = clamp(
        this.speed + (accel - curvePenalty) * dt,
        RacingTuning.minSpeed,
        RacingTuning.maxBoostSpeed
      );

      this.distance += this.speed * dt;
      this.timer = Math.max(0, this.timer - dt);

      if (this.gripBonusTimer > 0) {
        this.gripBonusTimer -= dt;
      } else {
        this.gripBonus *= 0.98;
      }
    }

    updateRivals(dt) {
      const now = this.time.now * 0.001;
      this.rivals.forEach((rival, idx) => {
        const rubber = (this.distance - rival.distance) * 0.03;
        const wave = Math.sin(now * (1.1 + idx * 0.13) + idx) * 22;
        const target = clamp(
          RacingTuning.rivals.speedMin + rival.skill * 220 + rubber + wave,
          RacingTuning.rivals.speedMin,
          RacingTuning.rivals.speedMax + 70
        );
        rival.speed += (target - rival.speed) * Math.min(1, dt * 2.4);
        rival.distance += rival.speed * dt;

        rival.laneChangeTimer -= dt;
        if (rival.laneChangeTimer <= 0) {
          rival.laneTarget = clamp(rival.laneTarget + (Math.random() < 0.5 ? -1 : 1), 0, RacingTuning.laneCount - 1);
          rival.laneChangeTimer = randomRange(0.8, 2.1);
        }
        rival.lanePos += (rival.laneTarget - rival.lanePos) * Math.min(1, dt * 5.4);

        if (!rival.overtakeCounted && rival.distance < this.distance - 12) {
          rival.overtakeCounted = true;
          this.onOvertake("RIVAL");
        }
      });

      const ahead = this.rivals.filter((r) => r.distance > this.distance).length;
      this.rank = ahead + 1;
    }

    updateTraffic(dt) {
      this.trafficSpawnTimer -= dt;
      if (this.trafficSpawnTimer <= 0) {
        this.spawnTraffic();
        this.trafficSpawnTimer = randomRange(
          RacingTuning.traffic.spawnIntervalMin,
          RacingTuning.traffic.spawnIntervalMax
        );
      }

      this.traffic.forEach((car) => {
        if (!car.active) return;
        car.distance += car.speed * dt;
        car.laneChangeTimer -= dt;
        if (car.laneChangeTimer <= 0 && Math.random() < 0.56) {
          car.laneTarget = clamp(car.laneTarget + (Math.random() < 0.5 ? -1 : 1), 0, RacingTuning.laneCount - 1);
          car.laneChangeTimer = randomRange(0.7, 1.9);
        }
        car.lanePos += (car.laneTarget - car.lanePos) * Math.min(1, dt * 4.8);

        const rel = car.distance - this.distance;
        if (!car.nearMissed && rel > 12 && rel < 36) {
          const laneGap = Math.abs(car.lanePos - this.playerLanePos);
          if (laneGap > 0.28 && laneGap < 0.78) {
            car.nearMissed = true;
            this.onNearMiss();
          }
        }

        if (!car.overtakeCounted && car.distance < this.distance - 10) {
          car.overtakeCounted = true;
          this.onOvertake("TRAFFIC");
        }

        if (rel < -90) {
          car.active = false;
          car.sprite.setVisible(false);
        }
      });

      this.checkCollisions();
    }

    spawnTraffic() {
      const slot = this.traffic.find((car) => !car.active);
      if (!slot) return;
      slot.active = true;
      slot.nearMissed = false;
      slot.overtakeCounted = false;
      slot.distance = this.distance + randomRange(180, VisualTuning.drawDistance - 60);
      slot.speed = randomRange(RacingTuning.traffic.minSpeed, RacingTuning.traffic.maxSpeed);
      slot.lanePos = (Math.random() * RacingTuning.laneCount) | 0;
      slot.laneTarget = slot.lanePos;
      slot.laneChangeTimer = randomRange(0.6, 1.8);
      slot.sprite.setTexture(pickRandom(TRAFFIC_TEXTURES));
      slot.sprite.setVisible(true);
    }

    checkCollisions() {
      if (this.hitCooldown > 0) return;
      const collisionDist = 16;
      const allCars = [
        ...this.traffic.filter((car) => car.active),
        ...this.rivals
      ];
      for (const car of allCars) {
        const rel = car.distance - this.distance;
        if (rel < 0 || rel > collisionDist) continue;
        const laneGap = Math.abs(car.lanePos - this.playerLanePos);
        if (laneGap < 0.22) {
          this.onCollision();
          break;
        }
      }
    }

    onCollision() {
      this.hitCooldown = RacingTuning.collision.cooldown;
      this.hitStopTimerMs = FeelTuning.hitStopDurationMs;
      this.speed = Math.max(RacingTuning.minSpeed, this.speed * RacingTuning.collision.speedLossFactor);
      this.targetSpeed = this.speed;
      this.score = Math.max(0, this.score - RacingTuning.collision.scorePenalty);
      this.lives -= 1;
      this.comboStreak = 0;
      this.comboMult = 1;
      this.comboTimer = 0;

      this.cameras.main.shake(FeelTuning.cameraShakeDuration, FeelTuning.cameraShakeHeavy / 1000);
      this.flashTimerMs = FeelTuning.flashDurationMs;
      this.flashColor = 0xff7c7c;
      this.spawnSparkBurst();
      this.playHitSfx();
      this.showStatus("CRASH!", "#ff8d8d", 400);
    }

    onOvertake(type) {
      this.comboStreak += 1;
      this.comboTimer = RacingTuning.comboTimeout;
      this.comboMult = clamp(1 + this.comboStreak * RacingTuning.comboStep, 1, RacingTuning.comboMax);
      const base = RacingTuning.overtakeBonus + (type === "RIVAL" ? 40 : 0);
      const gain = Math.round(base * this.comboMult);
      this.score += gain;
      this.boost = clamp(this.boost + 10, 0, RacingTuning.boost.max);
      this.showStatus("OVERTAKE +" + gain, "#a2ffd0", 420);
    }

    onNearMiss() {
      this.comboStreak += 1;
      this.comboTimer = RacingTuning.comboTimeout;
      this.comboMult = clamp(1 + this.comboStreak * RacingTuning.comboStep, 1, RacingTuning.comboMax);
      const gain = Math.round(RacingTuning.nearMissBonus * this.comboMult);
      this.score += gain;
      this.boost = clamp(this.boost + 8, 0, RacingTuning.boost.max);
      this.showStatus("NEAR MISS +" + gain, "#b4e7ff", 300);
    }

    updateCombo(dt) {
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
      } else if (this.comboStreak > 0) {
        this.comboStreak = Math.max(0, this.comboStreak - dt * 2.2);
        this.comboMult = clamp(1 + this.comboStreak * RacingTuning.comboStep, 1, RacingTuning.comboMax);
      }
    }

    updateEffects(dt) {
      if (this.hitCooldown > 0) this.hitCooldown -= dt;
      if (this.flashTimerMs > 0) this.flashTimerMs -= dt * 1000;
      if (this.statusTimer > 0) {
        this.statusTimer -= dt * 1000;
      } else {
        this.statusLabel.setAlpha(0);
      }
    }

    updateProgress() {
      if (this.raceFinishTriggered) return;

      if (
        this.missionIndex < this.chapter.checkpoints.length &&
        this.distance >= this.nextCheckpointDistance
      ) {
        this.onCheckpointReached();
      }

      const finishDistance = this.chapter.winCondition.finishDistance;
      const timeUp = this.timer <= 0;
      const reachedGoal = this.distance >= finishDistance;
      if (timeUp || reachedGoal || this.lives <= 0) {
        this.finishRun({
          reachedGoal,
          timeUp
        });
      }
    }

    onCheckpointReached() {
      const card = this.chapter.missionCards[this.missionIndex];
      this.checkpointPassed += 1;
      this.missionIndex += 1;
      this.score += RacingTuning.checkpointBonus;
      this.boost = clamp(this.boost + 14, 0, RacingTuning.boost.max);
      this.playCheckpointSfx();

      if (this.missionIndex < this.chapter.checkpoints.length) {
        this.nextCheckpointDistance = this.chapter.checkpoints[this.missionIndex];
      } else {
        this.nextCheckpointDistance = Number.POSITIVE_INFINITY;
      }

      if (card) {
        const cpText = "CHECKPOINT " + this.checkpointPassed + " / " + this.chapter.checkpoints.length;
        this.scene.launch("MissionCardScene", {
          card,
          chapterTitle: this.chapter.title,
          checkpointText: cpText
        });
        this.scene.pause();
      }
    }

    onMissionDecision(result) {
      const option = result?.option;
      if (!option) return;

      const before = this.chapterCo2;
      this.chapterCo2 = clamp(
        this.chapterCo2 + option.co2Delta,
        0,
        EducationTuning.chapterMaxCo2
      );
      const reduced = Math.max(0, before - this.chapterCo2);
      this.totalCo2Reduced += reduced;

      const effect = option.racingEffect || {};
      if (typeof effect.speedDelta === "number") {
        this.speed = clamp(this.speed + effect.speedDelta, RacingTuning.minSpeed, RacingTuning.maxBoostSpeed);
        this.targetSpeed = clamp(this.targetSpeed + effect.speedDelta * 0.8, RacingTuning.minSpeed, RacingTuning.maxSpeed);
      }
      if (typeof effect.boostDelta === "number") {
        this.boost = clamp(this.boost + effect.boostDelta, 0, RacingTuning.boost.max);
      }
      if (typeof effect.gripDelta === "number") {
        this.gripBonus = clamp(this.gripBonus + effect.gripDelta, -0.2, 0.35);
        this.gripBonusTimer = 5;
      }
      if (typeof effect.scoreDelta === "number") {
        this.score += Math.round(effect.scoreDelta * this.comboMult);
      }

      if (option.tag === "eco") {
        this.comboStreak += 1.6;
        this.comboTimer = RacingTuning.comboTimeout;
        this.comboMult = clamp(1 + this.comboStreak * RacingTuning.comboStep, 1, RacingTuning.comboMax);
        this.showStatus("ECO BOOST!", "#8effc0", 440);
      } else if (option.tag === "pollution") {
        this.comboStreak = 0;
        this.comboMult = 1;
        this.showStatus("CO2 증가...", "#ff9f9f", 380);
      } else {
        this.comboStreak += 0.7;
        this.comboTimer = RacingTuning.comboTimeout * 0.7;
        this.comboMult = clamp(1 + this.comboStreak * RacingTuning.comboStep, 1, RacingTuning.comboMax);
        this.showStatus("균형 선택", "#ffe7a4", 300);
      }

      this.playSelectSfx();
      this.syncHud();
    }

    finishRun({ reachedGoal, timeUp }) {
      if (this.raceFinishTriggered) return;
      this.raceFinishTriggered = true;
      this.runEnded = true;

      const targetCo2 = this.chapter.winCondition.targetCo2;
      const co2Success = this.chapterCo2 <= targetCo2;
      const clearCondition = reachedGoal && co2Success && this.lives > 0;
      const chapterScoreBonus = clearCondition ? Math.round(this.timer * 18 + (5 - this.rank) * 120) : 0;
      this.score += chapterScoreBonus;

      if (!clearCondition) {
        this.lives -= 1;
      }
      this.lives = Math.max(0, this.lives);

      const log = {
        title: this.chapter.title,
        success: clearCondition,
        chapterCo2: this.chapterCo2,
        targetCo2,
        rank: this.rank,
        timeLeft: this.timer,
        reason: timeUp ? "timeout" : clearCondition ? "clear" : "goal-fail"
      };
      this.chapterLogs.push(log);

      this.registry.set("score", this.score);
      this.registry.set("lives", this.lives);
      this.registry.set("totalCo2Reduced", this.totalCo2Reduced);
      this.registry.set("chapterLogs", this.chapterLogs);

      const tips = [
        "대중교통 + 텀블러 실천을 함께하면 감축 효과가 훨씬 커져요.",
        "가까운 거리는 도보/자전거 선택만으로도 큰 변화를 만들 수 있어요.",
        "냉난방 적정온도 유지와 분리배출은 가장 쉬운 탄소 감축 습관이에요."
      ];

      this.time.delayedCall(220, () => {
        this.scene.start("ChapterResultScene", {
          success: clearCondition,
          chapterTitle: this.chapter.title,
          chapterCo2: this.chapterCo2,
          targetCo2,
          rank: this.rank,
          timeLeft: this.timer,
          scoreDelta: chapterScoreBonus,
          totalScore: this.score,
          lives: this.lives,
          tip: tips[this.chapterIndex % tips.length],
          nextChapterIndex: this.chapterIndex + 1,
          clearedAll: clearCondition && this.chapterIndex === chapterData.length - 1
        });
      });
    }

    showStatus(text, color = "#ffe08a", durationMs = 350) {
      this.statusText = text;
      this.statusColor = color;
      this.statusTimer = durationMs;
      this.statusLabel.setText(text);
      this.statusLabel.setColor(color);
      this.statusLabel.setAlpha(1);
    }

    playTone(type, f0, f1, dur, volume) {
      try {
        const ctx = this.sound?.context;
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(f0, now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(30, f1), now + dur);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + dur + 0.01);
      } catch (_err) {
        // Keep silent on audio fallback failures.
      }
    }

    playHitSfx() {
      if (this.sound.get("sfx-hit")) this.sound.play("sfx-hit", { volume: 0.5 });
      else this.playTone("sawtooth", 170, 80, 0.23, 0.2);
    }

    playCheckpointSfx() {
      if (this.sound.get("sfx-checkpoint")) this.sound.play("sfx-checkpoint", { volume: 0.4 });
      else this.playTone("square", 580, 1080, 0.16, 0.16);
    }

    playSelectSfx() {
      if (this.sound.get("sfx-select")) this.sound.play("sfx-select", { volume: 0.36 });
      else this.playTone("triangle", 440, 720, 0.1, 0.12);
    }

    spawnSparkBurst() {
      const nearHalf = VisualTuning.roadBottomWidth * 0.29;
      const x = this.width / 2 + (this.playerLanePos - 1) * nearHalf + this.steerVisual * 10;
      const y = this.height - 114;
      const sparks = 14;
      for (let i = 0; i < sparks; i++) {
        const sprite = this.add
          .image(x, y, "fx-spark")
          .setDepth(1700)
          .setScale(randomRange(0.65, 1.15))
          .setAlpha(0.95);
        const angle = randomRange(-150, -30);
        const speed = randomRange(70, 220);
        const vx = Math.cos((angle * Math.PI) / 180) * speed;
        const vy = Math.sin((angle * Math.PI) / 180) * speed;
        this.tweens.add({
          targets: sprite,
          x: x + vx * 0.22,
          y: y + vy * 0.22,
          alpha: 0,
          duration: 250,
          ease: "Quad.easeOut",
          onComplete: () => sprite.destroy()
        });
      }
    }

    projectRoad(relativeDistance, lanePos) {
      if (relativeDistance <= 0 || relativeDistance > VisualTuning.drawDistance) return null;
      const p = 1 - relativeDistance / VisualTuning.drawDistance;
      if (p <= 0) return null;
      const worldDistance = this.distance + relativeDistance;
      const sample = this.sampleTrack(worldDistance);
      const baseY = this.horizonY + p * p * (this.height - this.horizonY);
      const hillOffset = sample.hill * p * p * 56;
      const center = this.width / 2 + sample.curve * p * p * 320 + this.steerVisual * 14;
      const halfRoad = Phaser.Math.Linear(VisualTuning.roadTopWidth, VisualTuning.roadBottomWidth, p);
      const laneX = center + (lanePos - 1) * halfRoad * 0.62;
      const scale = Phaser.Math.Linear(0.24, VisualTuning.carProjectionNear, p);
      return {
        x: laneX,
        y: baseY - hillOffset,
        scale,
        p
      };
    }

    drawRoad() {
      const g = this.roadG;
      g.clear();
      const roadTop = this.horizonY;
      const bottom = this.height;
      for (let y = roadTop; y < bottom; y += 2) {
        const p = (y - roadTop) / (bottom - roadTop);
        const worldZ = p * p * VisualTuning.drawDistance;
        const sample = this.sampleTrack(this.distance + worldZ);
        const center = this.width / 2 + sample.curve * p * p * 320 + this.steerVisual * 14;
        const hillOffset = sample.hill * p * p * 56;
        const yy = y - hillOffset;
        const halfRoad = Phaser.Math.Linear(VisualTuning.roadTopWidth, VisualTuning.roadBottomWidth, p);
        const left = center - halfRoad;
        const right = center + halfRoad;

        const grassStripe = (((this.distance * 0.05 + y * 0.14) | 0) & 1) === 0;
        g.fillStyle(grassStripe ? 0x3d8c4a : 0x327942, 1);
        g.fillRect(0, yy, left, 2);
        g.fillRect(right, yy, this.width - right, 2);

        const roadStripe = (((this.distance * 0.04 + y * 0.08) | 0) & 1) === 0;
        g.fillStyle(roadStripe ? 0x737883 : 0x666b74, 1);
        g.fillRect(left, yy, right - left, 2);

        const rumble = (((this.distance * 0.11 + y * 0.13) | 0) & 1) === 0;
        g.fillStyle(rumble ? 0xf7f7f7 : 0xff5b5b, 1);
        g.fillRect(left - 4, yy, 4, 2);
        g.fillRect(right, yy, 4, 2);

        if (p > 0.06) {
          const laneDash = ((this.distance * 0.14 + y * 0.24) | 0) % 24;
          if (laneDash < 14) {
            g.fillStyle(0xf0f2f5, 1);
            for (let i = 1; i < RacingTuning.laneCount; i++) {
              const lx = left + (i / RacingTuning.laneCount) * (right - left);
              g.fillRect(lx - 1, yy, 2, 2);
            }
          }
        }
      }
    }

    drawCars() {
      const nearRoadHalf = VisualTuning.roadBottomWidth * 0.62;
      const speedRatio = clamp(
        (this.speed - RacingTuning.minSpeed) / (RacingTuning.maxBoostSpeed - RacingTuning.minSpeed),
        0,
        1
      );

      this.rivals.forEach((rival) => {
        const proj = this.projectRoad(rival.distance - this.distance, rival.lanePos);
        if (!proj) {
          rival.sprite.setVisible(false);
          return;
        }
        rival.sprite
          .setVisible(true)
          .setPosition(proj.x, proj.y)
          .setScale(proj.scale)
          .setDepth(100 + proj.p * 1200);
      });

      this.traffic.forEach((car) => {
        if (!car.active) {
          car.sprite.setVisible(false);
          return;
        }
        const proj = this.projectRoad(car.distance - this.distance, car.lanePos);
        if (!proj) {
          car.sprite.setVisible(false);
          return;
        }
        car.sprite
          .setVisible(true)
          .setPosition(proj.x, proj.y)
          .setScale(proj.scale)
          .setDepth(100 + proj.p * 1180);
      });

      const px = this.width / 2 + (this.playerLanePos - 1) * nearRoadHalf * 0.29 + this.steerVisual * 11;
      const py = this.height - 86 + Math.sin(this.distance * 0.05) * 0.9;
      const pScale = 1.3 + speedRatio * 0.09 + (this.boostActive ? 0.06 : 0);
      this.playerSprite.setPosition(px, py).setScale(pScale).setDepth(1400);
      this.playerSprite.setRotation(this.steerVisual * 0.03);
    }

    drawSpeedLines() {
      const g = this.speedLineG;
      g.clear();
      const ratio = clamp(
        (this.speed - RacingTuning.minSpeed) / (RacingTuning.maxBoostSpeed - RacingTuning.minSpeed),
        0,
        1
      );
      if (ratio < FeelTuning.speedLineThreshold) return;

      const count = 8 + Math.floor(ratio * 12);
      const alpha = 0.12 + ratio * 0.18;
      g.fillStyle(0xffffff, alpha);
      for (let i = 0; i < count; i++) {
        const seed = ((this.distance * 0.03 + i * 31) | 0) % 9999;
        const y = this.height - 120 - ((seed * 13) % 280);
        const len = 14 + ((seed * 7) % 30);
        g.fillRect(14, y, len, 2);
        g.fillRect(this.width - 14 - len, y + 2, len, 2);
      }
    }

    drawFlash() {
      if (this.flashTimerMs <= 0) return;
      const t = clamp(this.flashTimerMs / FeelTuning.flashDurationMs, 0, 1);
      this.particleG.clear();
      this.particleG.fillStyle(this.flashColor, t * 0.24);
      this.particleG.fillRect(0, 0, this.width, this.height);
    }

    renderWorld() {
      const sample = this.sampleTrack(this.distance + 100);
      this.sky.tilePositionX = sample.curve * VisualTuning.skyParallax * 100;
      this.mountains.tilePositionX = sample.curve * VisualTuning.mountainParallax * 180;
      this.forest.tilePositionX = this.distance * 0.06 + sample.curve * VisualTuning.forestParallax * 190;
      this.roadside.tilePositionX = this.distance * 0.11 + sample.curve * VisualTuning.roadsideParallax * 220;

      this.drawRoad();
      this.drawCars();
      this.drawSpeedLines();
      this.drawFlash();
    }

    syncHud() {
      const chapterText = this.chapterIndex + 1 + " / " + chapterData.length;
      this.chapterValue.setText(chapterText);
      this.rankValue.setText(this.rank + " / " + (RacingTuning.rivals.count + 1));
      this.timeValue.setText(Math.max(0, Math.ceil(this.timer)).toString());
      this.speedValue.setText(Math.round(this.speed) + (this.boostActive ? "⚡" : ""));
      this.scoreValue.setText(Math.round(this.score).toString());
      this.boostBarFill.width = 70 * (this.boost / RacingTuning.boost.max);
      this.co2Label.setText("CO2 " + Math.round(this.chapterCo2) + " / " + this.chapter.winCondition.targetCo2);
      this.lifeLabel.setText("♥".repeat(this.lives) + "♡".repeat(Math.max(0, EducationTuning.startLives - this.lives)));
      const cpText =
        this.checkpointPassed + " / " + this.chapter.checkpoints.length + "  " + this.chapter.title;
      this.missionBanner.setText(cpText);
      if (this.comboMult > 1.05) {
        this.missionBanner.setText(cpText + "\nCOMBO x" + this.comboMult.toFixed(1));
      }
    }
  };
}
