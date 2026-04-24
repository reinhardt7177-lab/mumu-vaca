import { VisualTuning } from "./config/tuning";
import { createBootScene } from "./scenes/BootScene";
import { createRaceScene } from "./scenes/RaceScene";
import { createMissionCardScene } from "./scenes/MissionCardScene";
import { createChapterResultScene } from "./scenes/ChapterResultScene";
import { createFinalResultScene } from "./scenes/FinalResultScene";

export function createSocialRacingGame(Phaser, mountTarget) {
  const config = {
    type: Phaser.AUTO,
    parent: mountTarget,
    backgroundColor: "#03112a",
    width: VisualTuning.width,
    height: VisualTuning.height,
    render: {
      antialias: false,
      pixelArt: true,
      roundPixels: true
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: VisualTuning.width,
      height: VisualTuning.height
    },
    scene: [
      createBootScene(Phaser),
      createRaceScene(Phaser),
      createMissionCardScene(Phaser),
      createChapterResultScene(Phaser),
      createFinalResultScene(Phaser)
    ]
  };

  return new Phaser.Game(config);
}
