import { EducationTuning } from "../config/tuning";

export function createFinalResultScene(Phaser) {
  return class FinalResultScene extends Phaser.Scene {
    constructor() {
      super("FinalResultScene");
    }

    init(data) {
      this.payload = data || {};
    }

    create() {
      const { width, height } = this.scale;
      const score = this.registry.get("score") || 0;
      const logs = this.registry.get("chapterLogs") || [];
      const reduced = this.registry.get("totalCo2Reduced") || 0;
      const lives = this.registry.get("lives") || 0;
      const clearedAll = Boolean(this.payload.clearedAll);

      this.add.rectangle(width / 2, height / 2, width, height, 0x03112a, 1);
      this.add.image(width / 2, height * 0.34, "bg-sky").setDisplaySize(width + 20, 280).setAlpha(0.85);
      this.add.image(width / 2, height * 0.5, "bg-mountains").setDisplaySize(width + 20, 170).setAlpha(0.9);
      this.add.image(width / 2, height * 0.62, "bg-forest").setDisplaySize(width + 20, 120).setAlpha(0.92);

      const header = clearedAll ? "CAMPAIGN COMPLETE" : "RUN COMPLETE";
      const headerColor = clearedAll ? "#94ffbc" : "#ffe594";
      this.add
        .text(width / 2, 52, header, {
          fontFamily: "Courier New",
          fontSize: "34px",
          fontStyle: "bold",
          color: headerColor
        })
        .setOrigin(0.5);

      const card = this.add.container(width / 2, height / 2 + 30);
      card.add(this.add.image(0, 0, "mission-panel").setDisplaySize(width - 28, 430).setAlpha(0.96));

      const coreLines = [
        "최종 점수: " + Math.round(score),
        "총 CO2 감축량: " + Math.round(reduced),
        "남은 생명: " + lives
      ];

      card.add(
        this.add
          .text(0, -160, coreLines.join("\n"), {
            fontFamily: "Malgun Gothic, sans-serif",
            fontSize: "20px",
            color: "#f1f7ff",
            align: "center",
            lineSpacing: 10
          })
          .setOrigin(0.5)
      );

      const logText = logs.length
        ? logs
            .map((item, idx) => {
              const status = item.success ? "성공" : "실패";
              return (
                (idx + 1) +
                ". " +
                item.title.replace("CHAPTER ", "C") +
                " · " +
                status +
                " · CO2 " +
                Math.round(item.chapterCo2) +
                "/" +
                Math.round(item.targetCo2)
              );
            })
            .join("\n")
        : "기록이 없습니다.";

      card.add(
        this.add
          .text(0, -10, "[챕터 기록]\n" + logText, {
            fontFamily: "Malgun Gothic, sans-serif",
            fontSize: "15px",
            color: "#c6e4ff",
            align: "left",
            wordWrap: { width: width - 90 },
            lineSpacing: 6
          })
          .setOrigin(0.5, 0)
      );

      const recommendation = clearedAll
        ? "오늘의 실천 습관을 계속 이어가면, 다음 달에도 더 낮은 CO2를 기록할 수 있어요."
        : "실패한 챕터의 선택을 바꿔보면, 훨씬 좋은 기록을 낼 수 있어요.";

      card.add(
        this.add
          .text(0, 170, recommendation, {
            fontFamily: "Malgun Gothic, sans-serif",
            fontSize: "14px",
            color: "#a7ffd0",
            align: "center",
            wordWrap: { width: width - 84 }
          })
          .setOrigin(0.5)
      );

      const restartBtn = this.add
        .container(width / 2, height - 60)
        .setSize(220, 50)
        .setInteractive(new Phaser.Geom.Rectangle(-110, -25, 220, 50), Phaser.Geom.Rectangle.Contains);

      const bg = this.add.rectangle(0, 0, 220, 50, 0xffde72, 1).setStrokeStyle(2, 0x20355a, 1);
      const txt = this.add
        .text(0, 0, "처음부터 다시", {
          fontFamily: "Malgun Gothic, sans-serif",
          fontSize: "20px",
          fontStyle: "bold",
          color: "#1a2e4a"
        })
        .setOrigin(0.5);
      restartBtn.add([bg, txt]);

      restartBtn.on("pointerdown", () => this.restartCampaign());
      restartBtn.on("pointerover", () => bg.setFillStyle(0xffed9a, 1));
      restartBtn.on("pointerout", () => bg.setFillStyle(0xffde72, 1));

      this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    restartCampaign() {
      this.registry.set("score", 0);
      this.registry.set("lives", EducationTuning.startLives);
      this.registry.set("totalCo2Reduced", 0);
      this.registry.set("chapterIndex", 0);
      this.registry.set("chapterLogs", []);
      this.scene.start("RaceScene", { chapterIndex: 0 });
    }

    update() {
      if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.restartCampaign();
      }
    }
  };
}
