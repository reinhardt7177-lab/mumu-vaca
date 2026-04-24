function makePanelTexture(scene, key, width, height, colors) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.fillStyle(colors.outer, 1);
  g.fillRoundedRect(0, 0, width, height, 12);
  g.fillStyle(colors.inner, 0.92);
  g.fillRoundedRect(4, 4, width - 8, height - 8, 9);
  g.lineStyle(2, colors.border, 1);
  g.strokeRoundedRect(3, 3, width - 6, height - 6, 9);
  g.generateTexture(key, width, height);
  g.destroy();
}

function makeSpark(scene) {
  if (scene.textures.exists("fx-spark")) return;
  const g = scene.add.graphics();
  g.fillStyle(0xffd76b, 1);
  g.fillCircle(6, 6, 5);
  g.fillStyle(0xff7a4a, 1);
  g.fillCircle(6, 6, 2);
  g.generateTexture("fx-spark", 12, 12);
  g.destroy();
}

function makeCarTexture(scene, key, palette) {
  if (scene.textures.exists(key)) return;
  const w = 40;
  const h = 24;
  const g = scene.add.graphics();

  g.fillStyle(0x0f1218, 0.95);
  g.fillRect(3, 5, 4, 6);
  g.fillRect(33, 5, 4, 6);
  g.fillRect(3, 14, 4, 6);
  g.fillRect(33, 14, 4, 6);

  g.fillStyle(palette.body, 1);
  g.fillRoundedRect(6, 2, 28, 20, 4);

  g.fillStyle(0xffffff, 0.2);
  g.fillRect(8, 4, 24, 2);

  g.fillStyle(palette.glass, 1);
  g.fillRoundedRect(12, 7, 16, 8, 3);

  g.fillStyle(palette.roof, 1);
  g.fillRect(14, 8, 12, 4);

  g.fillStyle(0xffe58b, 1);
  g.fillRect(10, 18, 4, 2);
  g.fillRect(26, 18, 4, 2);

  g.fillStyle(0xff7b7b, 1);
  g.fillRect(10, 3, 4, 2);
  g.fillRect(26, 3, 4, 2);

  g.generateTexture(key, w, h);
  g.destroy();
}

function makeBackground(scene, key, width, height, painter) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  painter(g, width, height);
  g.generateTexture(key, width, height);
  g.destroy();
}

export function ensureFallbackTextures(scene, Phaser) {
  makePanelTexture(scene, "hud-frame", 320, 96, {
    outer: 0x0e1d3b,
    inner: 0x122b50,
    border: 0x84c0ff
  });

  makePanelTexture(scene, "mission-panel", 320, 220, {
    outer: 0x1b2138,
    inner: 0x24345c,
    border: 0xb4d8ff
  });

  makeSpark(scene);

  makeBackground(scene, "bg-sky", 512, 256, (g, w, h) => {
    for (let y = 0; y < h; y += 2) {
      const t = y / h;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0x2b88d8),
        Phaser.Display.Color.ValueToColor(0x79d7ff),
        100,
        t * 100
      );
      g.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      g.fillRect(0, y, w, 2);
    }
    g.fillStyle(0xffffff, 0.85);
    g.fillRect(40, 40, 80, 12);
    g.fillRect(48, 34, 52, 10);
    g.fillRect(190, 90, 96, 14);
    g.fillRect(208, 82, 58, 10);
  });

  makeBackground(scene, "bg-mountains", 512, 140, (g, w, h) => {
    g.fillStyle(0x2c4f72, 1);
    g.fillRect(0, 0, w, h);
    g.fillStyle(0x4f6e8d, 1);
    for (let x = -30; x < w + 40; x += 60) {
      const peak = 26 + (x % 120 ? 12 : 34);
      g.fillTriangle(x, h, x + 30, h - peak, x + 60, h);
    }
  });

  makeBackground(scene, "bg-forest", 512, 120, (g, w, h) => {
    g.fillStyle(0x2c8a4e, 1);
    g.fillRect(0, 0, w, h);
    g.fillStyle(0x3ea15d, 1);
    for (let i = 0; i < 40; i++) {
      const x = (i * 23) % w;
      const size = 8 + (i % 4) * 2;
      g.fillTriangle(x, h, x + size, h - 24 - (i % 3) * 5, x + size * 2, h);
    }
  });

  makeBackground(scene, "bg-roadside", 512, 180, (g, w, h) => {
    g.fillStyle(0x31784a, 1);
    g.fillRect(0, 0, w, h);
    g.fillStyle(0x2d9159, 1);
    for (let y = 0; y < h; y += 6) {
      g.fillRect(0, y, w, 2);
    }
    g.fillStyle(0x5bb4ea, 1);
    for (let i = 0; i < 18; i++) {
      const x = (i * 29) % w;
      g.fillRect(x, 20 + (i % 5) * 30, 10, 3);
      g.fillRect(x + 3, 14 + (i % 5) * 30, 4, 12);
    }
  });

  makeCarTexture(scene, "car-player", { body: 0xef4f4f, roof: 0xf8c287, glass: 0x9ce3ff });
  makeCarTexture(scene, "car-rival-1", { body: 0x4782ff, roof: 0xeaf1ff, glass: 0xa7ddff });
  makeCarTexture(scene, "car-rival-2", { body: 0xff8a45, roof: 0xfff1cc, glass: 0xb4e9ff });
  makeCarTexture(scene, "car-rival-3", { body: 0x7d6dff, roof: 0xefeaff, glass: 0xb4e1ff });
  makeCarTexture(scene, "car-traffic-1", { body: 0x3f84dc, roof: 0xe2efff, glass: 0x9ad9ff });
  makeCarTexture(scene, "car-traffic-2", { body: 0xffa146, roof: 0xffecc8, glass: 0xb7ecff });
  makeCarTexture(scene, "car-traffic-3", { body: 0x59b16f, roof: 0xe2ffe8, glass: 0xa8e7ff });
  makeCarTexture(scene, "car-traffic-4", { body: 0xcf5fcb, roof: 0xffebff, glass: 0xbee6ff });
}
