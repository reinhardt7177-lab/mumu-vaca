import { AssetManifest } from "../assets/asset-manifest";
import { ensureFallbackTextures } from "../assets/fallback-textures";
import { EducationTuning } from "../config/tuning";

export function createBootScene(Phaser) {
  return class BootScene extends Phaser.Scene {
    constructor() {
      super("BootScene");
    }

    preload() {
      this.cameras.main.setBackgroundColor("#061024");

      AssetManifest.images.forEach((asset) => {
        this.load.image(asset.key, asset.url);
      });

      AssetManifest.audio.forEach((asset) => {
        this.load.audio(asset.key, asset.urls);
      });

      const { width, height } = this.scale;
      const label = this.add
        .text(width / 2, height / 2, "LOADING...", {
          fontFamily: "Courier New",
          fontSize: "24px",
          color: "#ffea8c"
        })
        .setOrigin(0.5);

      const barBg = this.add.rectangle(width / 2, height / 2 + 36, 260, 12, 0x1c3457, 0.9).setOrigin(0.5);
      const bar = this.add.rectangle(width / 2 - 128, height / 2 + 36, 4, 8, 0x7bddff, 1).setOrigin(0, 0.5);

      this.load.on("progress", (value) => {
        bar.width = Math.max(4, Math.floor(256 * value));
      });

      this.load.on("complete", () => {
        label.setText("READY");
        barBg.destroy();
        bar.destroy();
      });
    }

    create() {
      ensureFallbackTextures(this, Phaser);

      this.registry.set("score", 0);
      this.registry.set("lives", EducationTuning.startLives);
      this.registry.set("totalCo2Reduced", 0);
      this.registry.set("chapterIndex", 0);
      this.registry.set("chapterLogs", []);
      this.registry.set("campaignStartedAt", Date.now());

      this.time.delayedCall(120, () => {
        this.scene.start("RaceScene", { chapterIndex: 0 });
      });
    }
  };
}
