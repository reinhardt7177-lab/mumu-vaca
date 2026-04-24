import { chapterData } from "../data/chapter-data";

export function createChapterResultScene(Phaser) {
  return class ChapterResultScene extends Phaser.Scene {
    constructor() {
      super("ChapterResultScene");
    }

    init(data) {
      this.payload = data || {};
    }

    create() {
      const { width, height } = this.scale;

      this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.62);

      const panel = this.add.container(width / 2, height / 2);
      panel.add(this.add.image(0, 0, "mission-panel").setDisplaySize(Math.min(width - 30, 350), 430));

      const success = Boolean(this.payload.success);
      const titleColor = success ? "#95ffbc" : "#ff9f9f";
      const titleText = success ? "CHAPTER CLEAR!" : "CHAPTER FAILED";

      panel.add(
        this.add
          .text(0, -178, titleText, {
            fontFamily: "Courier New",
            fontSize: "32px",
            fontStyle: "bold",
            color: titleColor
          })
          .setOrigin(0.5)
      );

      panel.add(
        this.add
          .text(0, -140, this.payload.chapterTitle || "", {
            fontFamily: "Malgun Gothic, sans-serif",
            fontSize: "18px",
            fontStyle: "bold",
            color: "#ffe18a"
          })
          .setOrigin(0.5)
      );

      const summaryLines = [
        "순위: " + (this.payload.rank || "-"),
        "남은 시간: " + Math.max(0, Math.ceil(this.payload.timeLeft || 0)) + "s",
        "챕터 CO2 지수: " + Math.round(this.payload.chapterCo2 || 0),
        "목표 CO2: ≤ " + Math.round(this.payload.targetCo2 || 0),
        "획득 점수: " + Math.round(this.payload.scoreDelta || 0),
        "누적 점수: " + Math.round(this.payload.totalScore || 0),
        "남은 생명: " + Math.round(this.payload.lives || 0)
      ];

      panel.add(
        this.add
          .text(0, -12, summaryLines.join("\n"), {
            fontFamily: "Malgun Gothic, sans-serif",
            fontSize: "17px",
            color: "#eaf4ff",
            align: "center",
            lineSpacing: 9
          })
          .setOrigin(0.5)
      );

      const logLine = this.payload.tip || "실천 한 가지를 오늘 바로 행동으로 옮겨보세요.";
      panel.add(
        this.add
          .text(0, 134, "실천 제안\n" + logLine, {
            fontFamily: "Malgun Gothic, sans-serif",
            fontSize: "15px",
            color: "#b8e7ff",
            align: "center",
            lineSpacing: 6,
            wordWrap: { width: 300 }
          })
          .setOrigin(0.5)
      );

      const hasNext = this.payload.nextChapterIndex < chapterData.length;
      const canContinue = this.payload.lives > 0 && hasNext;
      const buttonText = canContinue ? "다음 챕터" : "최종 결과";

      const btn = this.add
        .container(width / 2, height - 82)
        .setSize(210, 50)
        .setInteractive(new Phaser.Geom.Rectangle(-105, -25, 210, 50), Phaser.Geom.Rectangle.Contains);

      const btnBg = this.add.rectangle(0, 0, 210, 50, 0xffde74, 1).setStrokeStyle(2, 0x294063, 1);
      const btnLabel = this.add
        .text(0, 0, buttonText, {
          fontFamily: "Malgun Gothic, sans-serif",
          fontSize: "20px",
          fontStyle: "bold",
          color: "#1d2c46"
        })
        .setOrigin(0.5);

      btn.add([btnBg, btnLabel]);
      btn.on("pointerdown", () => this.continueFlow());
      btn.on("pointerover", () => btnBg.setFillStyle(0xffe995, 1));
      btn.on("pointerout", () => btnBg.setFillStyle(0xffde74, 1));

      this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    continueFlow() {
      const hasNext = this.payload.nextChapterIndex < chapterData.length;
      const canContinue = this.payload.lives > 0 && hasNext;
      if (canContinue) {
        this.registry.set("chapterIndex", this.payload.nextChapterIndex);
        this.scene.start("RaceScene", { chapterIndex: this.payload.nextChapterIndex });
      } else {
        this.scene.start("FinalResultScene", {
          clearedAll: this.payload.clearedAll && this.payload.lives > 0
        });
      }
    }

    update() {
      if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.continueFlow();
      }
    }
  };
}
