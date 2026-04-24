import { EducationTuning } from "../config/tuning";

function optionColor(tag) {
  if (tag === "eco") return { fill: 0x184f39, line: 0x68ffb6 };
  if (tag === "neutral") return { fill: 0x4f4720, line: 0xffe38a };
  return { fill: 0x5a2323, line: 0xff9d9d };
}

export function createMissionCardScene(Phaser) {
  return class MissionCardScene extends Phaser.Scene {
    constructor() {
      super("MissionCardScene");
      this.choiceLocked = false;
    }

    init(data) {
      this.payload = data || {};
      this.card = this.payload.card || { prompt: "", options: [] };
      this.chapterTitle = this.payload.chapterTitle || "";
      this.checkpointText = this.payload.checkpointText || "";
      this.decisionTimeLeft = EducationTuning.missionDecisionSeconds;
      this.choiceLocked = false;
    }

    create() {
      const { width, height } = this.scale;

      this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.62).setScrollFactor(0);

      const panel = this.add.container(width / 2, height / 2);
      const panelBg = this.add
        .image(0, 0, "mission-panel")
        .setDisplaySize(Math.min(width - 28, 350), 340)
        .setAlpha(0.97);
      panel.add(panelBg);

      const title = this.add
        .text(0, -144, this.chapterTitle, {
          fontFamily: "Courier New",
          fontSize: "18px",
          fontStyle: "bold",
          color: "#ffd97a",
          align: "center"
        })
        .setOrigin(0.5);
      panel.add(title);

      const checkpoint = this.add
        .text(0, -117, this.checkpointText, {
          fontFamily: "Courier New",
          fontSize: "13px",
          color: "#c7e6ff",
          align: "center"
        })
        .setOrigin(0.5);
      panel.add(checkpoint);

      const promptText = this.add
        .text(0, -74, this.card.prompt, {
          fontFamily: "Malgun Gothic, sans-serif",
          fontSize: "17px",
          fontStyle: "bold",
          color: "#f2f6ff",
          wordWrap: { width: 300 },
          align: "center",
          lineSpacing: 6
        })
        .setOrigin(0.5, 0);
      panel.add(promptText);

      this.timerLabel = this.add
        .text(0, 122, "선택 제한: " + this.decisionTimeLeft.toFixed(1) + "s", {
          fontFamily: "Courier New",
          fontSize: "14px",
          fontStyle: "bold",
          color: "#9be5ff"
        })
        .setOrigin(0.5);
      panel.add(this.timerLabel);

      this.optionButtons = [];
      this.card.options.forEach((option, index) => {
        const y = -5 + index * 62;
        const color = optionColor(option.tag);

        const btnBg = this.add
          .rectangle(0, y, 296, 52, color.fill, 0.95)
          .setStrokeStyle(2, color.line, 1)
          .setInteractive({ useHandCursor: true });
        const label = this.add
          .text(0, y, (index + 1) + ". " + option.label, {
            fontFamily: "Malgun Gothic, sans-serif",
            fontSize: "15px",
            fontStyle: "bold",
            color: "#f8fbff",
            wordWrap: { width: 270 },
            align: "center"
          })
          .setOrigin(0.5);

        btnBg.on("pointerdown", () => this.selectOption(index));

        panel.add(btnBg);
        panel.add(label);
        this.optionButtons.push({ bg: btnBg, label });
      });

      this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
      this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
      this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);

      this.timeEvent = this.time.addEvent({
        delay: 100,
        loop: true,
        callback: () => this.tickCountdown()
      });
    }

    tickCountdown() {
      if (this.choiceLocked) return;
      this.decisionTimeLeft = Math.max(0, this.decisionTimeLeft - 0.1);
      this.timerLabel.setText("선택 제한: " + this.decisionTimeLeft.toFixed(1) + "s");
      if (this.decisionTimeLeft <= 0.001) {
        const neutralIndex = Math.max(0, this.card.options.findIndex((opt) => opt.tag === "neutral"));
        this.selectOption(neutralIndex, true);
      }
    }

    selectOption(index, byTimeout = false) {
      if (this.choiceLocked) return;
      this.choiceLocked = true;

      const option = this.card.options[index] || this.card.options[1] || this.card.options[0];
      const raceScene = this.scene.get("RaceScene");
      if (raceScene && raceScene.onMissionDecision) {
        raceScene.onMissionDecision({
          option,
          index,
          byTimeout
        });
      }

      this.optionButtons.forEach((btn, idx) => {
        btn.bg.disableInteractive();
        btn.bg.setAlpha(idx === index ? 1 : 0.52);
      });

      this.time.delayedCall(220, () => {
        this.scene.stop();
        if (raceScene) this.scene.resume("RaceScene");
      });
    }

    update() {
      if (this.choiceLocked) return;
      if (Phaser.Input.Keyboard.JustDown(this.key1)) this.selectOption(0);
      if (Phaser.Input.Keyboard.JustDown(this.key2)) this.selectOption(1);
      if (Phaser.Input.Keyboard.JustDown(this.key3)) this.selectOption(2);
    }
  };
}
