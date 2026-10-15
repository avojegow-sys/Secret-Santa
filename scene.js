// Пиксельный пейзаж: ночная заснеженная деревня, горы и озеро.
// Рисуется в малом разрешении и растягивается без сглаживания.
(function () {
  const W = 180, H = 120;
  const cv = document.getElementById("scene");
  if (!cv) return;
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");

  const bg = document.createElement("canvas");
  bg.width = W; bg.height = H;
  const g = bg.getContext("2d");

  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const px = (x, y, c, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };

  // Небо полосами
  const sky = ["#080b2e", "#0d1240", "#121a52", "#182462", "#1f2f74", "#283b86", "#324897", "#3d55a6", "#4863b2"];
  const horizon = 70;
  sky.forEach((c, i) => px(0, (i * horizon) / sky.length, c, W, Math.ceil(horizon / sky.length) + 1));

  // Звёзды
  const stars = [];
  for (let i = 0; i < 70; i++) {
    const s = { x: Math.floor(rnd() * W), y: Math.floor(rnd() * 48), c: rnd() > 0.6 ? "#ffffff" : "#aab8ff" };
    stars.push(s);
    px(s.x, s.y, s.c);
  }

  // Луна с ореолом
  const mx = 146, my = 20;
  for (let y = -13; y <= 13; y++) {
    for (let x = -13; x <= 13; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (d <= 8) px(mx + x, my + y, "#eef1ff");
      else if (d <= 12 && (x + y) % 2 === 0) px(mx + x, my + y, "#3a4aa0");
    }
  }
  [[-3, -2], [2, 1], [-1, 3], [3, -4]].forEach(([x, y]) => px(mx + x, my + y, "#c5cdf0", 2, 1));

  // Горы
  function ridge(peaks, base, color, snow, snowFrom) {
    for (let x = 0; x < W; x++) {
      let h = 0;
      peaks.forEach(([p, ph, s]) => { h = Math.max(h, ph - Math.abs(x - p) * s); });
      const top = Math.round(base - h);
      px(x, top, color, 1, base - top + 1);
      if (snow && h > snowFrom) {
        const depth = Math.floor((h - snowFrom) * 0.45) + ((x * 7) % 3);
        px(x, top, snow, 1, depth);
      }
    }
  }
  ridge([[22, 34, 0.9], [64, 48, 0.85], [104, 40, 0.9], [152, 50, 0.8]], 72, "#3b4a9a", "#dfe8ff", 24);
  ridge([[0, 14, 0.6], [42, 18, 0.7], [92, 12, 0.6], [172, 16, 0.6]], 74, "#1f2c66", "#8fa2e0", 15);

  // Озеро
  const lake = ["#1b2a6e", "#18266a", "#152260", "#111d56", "#0f1a4a"];
  lake.forEach((c, i) => px(0, 72 + i * 6, c, W, 7));
  for (let i = 0; i < 40; i++) px(rnd() * W, 74 + rnd() * 26, "#3a4fa0", 2 + Math.floor(rnd() * 4), 1);
  for (let y = 74; y < 98; y += 2) px(mx - 1 + ((y / 2) % 3), y, "#cfd8ff", 2 + ((y / 2) % 2), 1);

  // Мост
  for (let x = 50; x <= 130; x++) {
    const y = 85 - Math.round(Math.sin(((x - 50) / 80) * Math.PI) * 6);
    px(x, y, "#8a5632", 1, 2);
    px(x, y + 2, "#4a2a18");
    if (x % 6 === 0) px(x, y - 3, "#4a2a18", 1, 3);
    if (x % 3 === 0) px(x, y - 3, "#6b3f22");
  }
  // Отражение моста
  for (let x = 54; x <= 126; x += 2) px(x, 93, "#0b1440");

  // Сосны
  function pine(x, y, h) {
    px(x, y - 2, "#3a2012", 1, 3);
    for (let i = 0; i < h; i++) {
      const row = y - 2 - h + i;
      const w = 1 + Math.floor(i * 0.55) * 2;
      px(x - (w - 1) / 2, row, "#123a4a", w, 1);
      if (i % 4 === 0) px(x - (w - 1) / 2, row, "#e6f0ff", w, 1);
      else if (i % 4 === 1 && w > 3) px(x - (w - 1) / 2 + 1, row, "#e6f0ff", w - 2, 1);
    }
  }

  // Левый берег
  for (let x = 0; x < 54; x++) {
    const top = 75 + Math.floor((Math.max(0, x - 40)) * 1.3) + ((x * 5) % 2);
    px(x, top, "#2a2f66", 1, H - top);
    px(x, top, "#e6f0ff", 1, 3);
    px(x, top + 3, "#9fb4e8");
  }
  pine(8, 75, 24); pine(23, 76, 17); pine(37, 78, 13); pine(46, 80, 9);

  // Правый берег
  for (let x = 116; x < W; x++) {
    const top = 76 + Math.floor(Math.max(0, 128 - x) * 1.1);
    px(x, top, "#2a2f66", 1, H - top);
    px(x, top, "#e6f0ff", 1, 3);
    px(x, top + 3, "#9fb4e8");
  }
  pine(177, 76, 22); pine(167, 76, 13); pine(126, 80, 12);

  // Домик
  const cx = 138, cb = 76;
  px(cx, cb - 11, "#7a4a2e", 21, 11);
  for (let y = cb - 11; y < cb; y += 3) px(cx, y, "#5e3820", 21, 1);
  for (let i = 0; i < 10; i++) {
    const w = 25 - i * 2;
    px(cx - 2 + i, cb - 12 - i, "#5a3322", w, 1);
    if (i < 4) px(cx - 2 + i, cb - 12 - i, "#eef3ff", w, 1);
    else if (i < 6) px(cx - 2 + i + 1, cb - 12 - i, "#eef3ff", w - 2, 1);
  }
  px(cx + 14, cb - 26, "#4a2a18", 3, 6);
  px(cx + 13, cb - 27, "#eef3ff", 5, 2);
  g.fillStyle = "rgba(255, 210, 74, 0.2)";
  g.fillRect(cx + 1, cb - 9, 7, 7);
  g.fillRect(cx + 12, cb - 9, 7, 7);
  px(cx + 3, cb - 8, "#ffd24a", 4, 4);
  px(cx + 13, cb - 8, "#ffd24a", 4, 4);
  px(cx + 4, cb - 8, "#7a4a2e", 1, 4);
  px(cx + 14, cb - 8, "#7a4a2e", 1, 4);
  px(cx + 9, cb - 6, "#3a2012", 3, 6);

  // Фонарики у моста
  [[52, 78], [128, 80]].forEach(([x, y]) => {
    g.fillStyle = "rgba(255, 210, 74, 0.25)";
    g.fillRect(x - 3, y - 3, 7, 7);
    px(x, y, "#ffd24a", 1, 2);
    px(x, y + 2, "#4a2a18", 1, 4);
  });

  // Снежный передний план
  for (let x = 0; x < W; x++) {
    const top = 103 + Math.round(Math.sin(x / 9) * 2 + Math.sin(x / 3.5));
    px(x, top, "#dce8ff", 1, H - top);
    px(x, top + 3, "#a9bde8", 1, H - top - 3);
    px(x, top + 9, "#7f95cf", 1, H - top - 9);
  }
  for (let i = 0; i < 40; i++) px(rnd() * W, 104 + rnd() * 14, "#ffffff");

  // Анимация: снег и мерцание звёзд
  const flakes = Array.from({ length: 90 }, () => ({
    x: rnd() * W, y: rnd() * H, v: 0.12 + rnd() * 0.35, p: rnd() * 6.28, s: rnd() > 0.85 ? 2 : 1,
  }));
  const twinkle = stars.filter((_, i) => i % 3 === 0);

  function draw(t) {
    ctx.drawImage(bg, 0, 0);
    twinkle.forEach((s, i) => {
      if (Math.floor(t / 700 + i) % 3 === 0) {
        ctx.fillStyle = "#080b2e";
        ctx.fillRect(s.x, s.y, 1, 1);
      }
    });
    ctx.fillStyle = "#ffffff";
    flakes.forEach((f) => {
      ctx.globalAlpha = f.s === 2 ? 0.95 : 0.7;
      ctx.fillRect(Math.round(f.x + Math.sin(t / 1400 + f.p) * 3), Math.round(f.y), f.s, f.s);
    });
    ctx.globalAlpha = 1;
  }

  const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (still) { draw(0); return; }

  let last = 0;
  function frame(t) {
    if (t - last > 40) {
      last = t;
      flakes.forEach((f) => {
        f.y += f.v;
        if (f.y > H) { f.y = -2; f.x = rnd() * W; }
      });
      draw(t);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
