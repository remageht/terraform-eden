// Procedural Living Landscape Renderer (Canvas 2D)
export class LandscapeRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = canvas.width;
    this.height = canvas.height;

    // Environmental state
    this.timeOfDay = 0.25; // 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
    this.daySpeed = 0.00015; // smooth day-night cycle
    this.habitability = 0.0; // 0.0 to 1.0 (Terraforming progress)
    this.wind = 0;
    this.time = 0;

    // Entities
    this.stars = [];
    this.clouds = [];
    this.birds = [];
    this.fireflies = [];
    this.trees = [];
    this.flowers = [];

    // Weather effects
    this.sandstormIntensity = 0;
    this.rainIntensity = 0;

    this.initEnvironment();
    this.handleResize();
    window.addEventListener("resize", () => this.handleResize());
  }

  handleResize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    this.generateTerrainFeatures();
  }

  initEnvironment() {
    // Generate stars
    this.stars = [];
    for (let i = 0; i < 180; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random() * 0.7,
        size: 0.6 + Math.random() * 1.8,
        twinkleSpeed: 0.02 + Math.random() * 0.05,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Generate clouds
    this.clouds = [];
    for (let i = 0; i < 7; i++) {
      this.clouds.push({
        x: Math.random() * 2000,
        y: 60 + Math.random() * 180,
        speed: 0.15 + Math.random() * 0.25,
        scale: 0.6 + Math.random() * 0.8,
        opacity: 0.35 + Math.random() * 0.45
      });
    }

    // Generate birds
    this.birds = [];
    for (let i = 0; i < 5; i++) {
      this.birds.push({
        x: Math.random() * 1600,
        y: 80 + Math.random() * 140,
        speed: 1.2 + Math.random() * 1.5,
        flapSpeed: 0.1 + Math.random() * 0.05,
        wingAngle: 0,
        size: 3 + Math.random() * 2
      });
    }

    // Generate fireflies
    this.fireflies = [];
    for (let i = 0; i < 35; i++) {
      this.fireflies.push({
        x: Math.random() * 1600,
        y: 400 + Math.random() * 300,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.4,
        size: 1.5 + Math.random() * 2,
        pulseSpeed: 0.03 + Math.random() * 0.04,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  generateTerrainFeatures() {
    // Fixed seed-based trees & flowers along hills
    this.trees = [];
    const treeCount = 45;
    for (let i = 0; i < treeCount; i++) {
      const xRatio = (i + 0.5 + (Math.sin(i * 32.1) * 0.3)) / treeCount;
      this.trees.push({
        xRatio: Math.min(0.98, Math.max(0.02, xRatio)),
        type: i % 3 === 0 ? "pine" : "oak",
        scale: 0.55 + Math.abs(Math.sin(i * 7.7)) * 0.65,
        layer: i % 2 // 0 = background, 1 = foreground
      });
    }

    this.flowers = [];
    const flowerCount = 80;
    const colors = ["#f43f5e", "#fbbf24", "#38bdf8", "#e879f9", "#ffffff", "#f97316"];
    for (let i = 0; i < flowerCount; i++) {
      this.flowers.push({
        xRatio: (i + Math.random() * 0.6) / flowerCount,
        color: colors[i % colors.length],
        height: 8 + Math.random() * 10
      });
    }
  }

  // Update environmental parameters from game state
  setHabitability(percent) {
    this.habitability = Math.max(0, Math.min(1.0, percent));
  }

  setWeather(sandstorm = 0, rain = 0) {
    this.sandstormIntensity = sandstorm;
    this.rainIntensity = rain;
  }

  update(dt = 1) {
    this.time += 0.02 * dt;
    this.wind = Math.sin(this.time * 0.6) * 1.5;
    this.timeOfDay = (this.timeOfDay + this.daySpeed * dt) % 1.0;

    // Move clouds
    for (const c of this.clouds) {
      c.x += c.speed * dt * (1 + this.wind * 0.2);
      if (c.x > this.width + 300) c.x = -300;
    }

    // Move birds (only if habitability > 0.4)
    if (this.habitability >= 0.4) {
      for (const b of this.birds) {
        b.x += b.speed * dt;
        b.wingAngle += b.flapSpeed * dt;
        b.y += Math.sin(b.x * 0.01) * 0.3;
        if (b.x > this.width + 100) {
          b.x = -80;
          b.y = 70 + Math.random() * 160;
        }
      }
    }

    // Move fireflies (at twilight and night if habitability > 0.25)
    for (const f of this.fireflies) {
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.phase += f.pulseSpeed * dt;
      if (f.x < 0) f.x = this.width;
      if (f.x > this.width) f.x = 0;
      if (f.y < this.height * 0.55) f.y = this.height * 0.85;
      if (f.y > this.height) f.y = this.height * 0.6;
    }
  }

  // Render complete procedural scene
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this.drawSky(ctx);
    this.drawCelestial(ctx);
    this.drawAurora(ctx);
    this.drawClouds(ctx);
    this.drawDistantMountains(ctx);
    this.drawMidHills(ctx);
    this.drawWater(ctx);
    this.drawForegroundHills(ctx);
    this.drawFlora(ctx);
    this.drawFauna(ctx);
    this.drawWeatherEffects(ctx);
  }

  // Sky color interpolation based on time of day & habitability
  drawSky(ctx) {
    const t = this.timeOfDay;
    const h = this.habitability;

    // Palette: Morning, Day, Sunset, Night
    let topColor, bottomColor;

    if (h < 0.15) {
      // Barren desolate sky (dusty maroon / void)
      topColor = "#18181b";
      bottomColor = "#3f3f46";
    } else {
      // Dynamic Earth-like sky
      if (t < 0.25) { // Night to Dawn
        const f = t / 0.25;
        topColor = this.lerpColor("#090a14", "#1e1b4b", f);
        bottomColor = this.lerpColor("#1e1b4b", "#ea580c", f);
      } else if (t < 0.5) { // Dawn to Noon
        const f = (t - 0.25) / 0.25;
        topColor = this.lerpColor("#1e1b4b", "#0284c7", f);
        bottomColor = this.lerpColor("#ea580c", "#bae6fd", f);
      } else if (t < 0.75) { // Noon to Sunset
        const f = (t - 0.5) / 0.25;
        topColor = this.lerpColor("#0284c7", "#431407", f);
        bottomColor = this.lerpColor("#bae6fd", "#f97316", f);
      } else { // Sunset to Night
        const f = (t - 0.75) / 0.25;
        topColor = this.lerpColor("#431407", "#090a14", f);
        bottomColor = this.lerpColor("#f97316", "#1e1b4b", f);
      }
    }

    const grad = ctx.createLinearGradient(0, 0, 0, this.height * 0.75);
    grad.addColorStop(0, topColor);
    grad.addColorStop(1, bottomColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  // Sun and Moon
  drawCelestial(ctx) {
    const t = this.timeOfDay;
    const isNight = t > 0.75 || t < 0.25;

    // Draw twinkling stars if dark
    if (isNight || this.habitability < 0.2) {
      const starAlpha = isNight ? (t > 0.8 || t < 0.2 ? 0.9 : 0.4) : (1 - this.habitability);
      ctx.fillStyle = "#ffffff";
      for (const s of this.stars) {
        const twinkle = Math.sin(this.time * 2 + s.phase) * 0.3 + 0.7;
        ctx.globalAlpha = starAlpha * twinkle;
        ctx.beginPath();
        ctx.arc(s.x * this.width, s.y * this.height, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    }

    // Sun position
    const sunAngle = (t - 0.25) * Math.PI * 2;
    const sunX = this.width * 0.5 + Math.cos(sunAngle) * (this.width * 0.45);
    const sunY = this.height * 0.55 + Math.sin(sunAngle) * (this.height * 0.42);

    if (sunY < this.height * 0.75) {
      ctx.save();
      const corona = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 90);
      corona.addColorStop(0, "rgba(254, 240, 138, 0.95)");
      corona.addColorStop(0.3, "rgba(251, 146, 60, 0.4)");
      corona.addColorStop(1, "rgba(251, 146, 60, 0)");
      ctx.fillStyle = corona;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 90, 0, Math.PI * 2);
      ctx.fill();

      // Sun core
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(sunX, sunY, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Moon position (opposite to sun)
    const moonAngle = sunAngle + Math.PI;
    const moonX = this.width * 0.5 + Math.cos(moonAngle) * (this.width * 0.45);
    const moonY = this.height * 0.55 + Math.sin(moonAngle) * (this.height * 0.42);

    if (moonY < this.height * 0.75) {
      ctx.save();
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 60);
      moonGlow.addColorStop(0, "rgba(224, 242, 254, 0.8)");
      moonGlow.addColorStop(0.4, "rgba(186, 230, 253, 0.2)");
      moonGlow.addColorStop(1, "rgba(186, 230, 253, 0)");
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 60, 0, Math.PI * 2);
      ctx.fill();

      // Moon body
      ctx.fillStyle = "#f1f5f9";
      ctx.beginPath();
      ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Shimmering Aurora Borealis (Unlocked at 70%+ habitability during night)
  drawAurora(ctx) {
    if (this.habitability < 0.65) return;
    const isNight = this.timeOfDay > 0.75 || this.timeOfDay < 0.25;
    if (!isNight) return;

    ctx.save();
    ctx.globalAlpha = 0.35 * (this.habitability);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, this.height * 0.25);
      for (let x = 0; x <= this.width; x += 30) {
        const wave = Math.sin(x * 0.003 + this.time * 0.4 + i) * 60 +
                     Math.cos(x * 0.007 - this.time * 0.3) * 30;
        ctx.lineTo(x, this.height * 0.2 + wave + i * 25);
      }
      ctx.lineTo(this.width, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 0, 0, this.height * 0.35);
      grad.addColorStop(0, "rgba(52, 211, 153, 0)");
      grad.addColorStop(0.5, i === 0 ? "rgba(56, 189, 248, 0.4)" : "rgba(168, 85, 247, 0.4)");
      grad.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = grad;
      ctx.fill();
    }
    ctx.restore();
  }

  // Soft drifting clouds
  drawClouds(ctx) {
    if (this.habitability < 0.1) return;
    ctx.save();
    for (const c of this.clouds) {
      ctx.globalAlpha = c.opacity;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      const cx = c.x, cy = c.y, s = c.scale;
      ctx.arc(cx, cy, 32 * s, 0, Math.PI * 2);
      ctx.arc(cx + 25 * s, cy - 12 * s, 38 * s, 0, Math.PI * 2);
      ctx.arc(cx + 60 * s, cy - 8 * s, 30 * s, 0, Math.PI * 2);
      ctx.arc(cx + 85 * s, cy + 2 * s, 25 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Distant Mountain Ranges
  drawDistantMountains(ctx) {
    const h = this.habitability;
    const baseColor = h < 0.2 ? "#27272a" : (h < 0.6 ? "#334155" : "#1e3a5f");

    ctx.save();
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(0, this.height);
    ctx.lineTo(0, this.height * 0.58);

    const peaks = [
      { x: 0.15, y: 0.38 },
      { x: 0.35, y: 0.45 },
      { x: 0.55, y: 0.34 },
      { x: 0.78, y: 0.42 },
      { x: 1.0, y: 0.39 }
    ];

    let prevX = 0, prevY = this.height * 0.58;
    for (const p of peaks) {
      const curX = p.x * this.width;
      const curY = p.y * this.height;
      ctx.lineTo((prevX + curX) * 0.5, (prevY + curY) * 0.5 - 20);
      ctx.lineTo(curX, curY);
      prevX = curX;
      prevY = curY;
    }

    ctx.lineTo(this.width, this.height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Mid-ground rolling hills
  drawMidHills(ctx) {
    const h = this.habitability;
    // Color evolves from ash-gray to lush dark-emerald
    let hillColor;
    if (h < 0.15) hillColor = "#3f3f46";
    else if (h < 0.4) hillColor = "#4d7c0f";
    else hillColor = "#15803d";

    ctx.save();
    ctx.fillStyle = hillColor;
    ctx.beginPath();
    ctx.moveTo(0, this.height);
    ctx.lineTo(0, this.height * 0.68);

    for (let x = 0; x <= this.width; x += 40) {
      const y = this.height * 0.68 + Math.sin(x * 0.003 + 1.2) * 45 + Math.cos(x * 0.006) * 20;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(this.width, this.height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Animated Water body (River / Lake)
  drawWater(ctx) {
    if (this.habitability < 0.2) return;

    ctx.save();
    const waterGrad = ctx.createLinearGradient(0, this.height * 0.72, 0, this.height * 0.85);
    waterGrad.addColorStop(0, "rgba(56, 189, 248, 0.85)");
    waterGrad.addColorStop(1, "rgba(14, 116, 144, 0.95)");
    ctx.fillStyle = waterGrad;

    ctx.beginPath();
    ctx.moveTo(0, this.height * 0.74);
    for (let x = 0; x <= this.width; x += 30) {
      const wave = Math.sin(x * 0.015 + this.time * 2.0) * 4 + Math.cos(x * 0.03 - this.time) * 2;
      ctx.lineTo(x, this.height * 0.74 + wave);
    }
    ctx.lineTo(this.width, this.height * 0.86);
    ctx.lineTo(0, this.height * 0.86);
    ctx.closePath();
    ctx.fill();

    // Water specular shimmer
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 30; x < this.width; x += 120) {
      const waveX = x + Math.sin(this.time + x) * 20;
      const waveY = this.height * 0.75 + Math.cos(this.time * 2 + x) * 3;
      ctx.moveTo(waveX, waveY);
      ctx.lineTo(waveX + 35, waveY);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Foreground rolling green meadow
  drawForegroundHills(ctx) {
    const h = this.habitability;
    let foreColor;
    if (h < 0.15) foreColor = "#27272a";
    else if (h < 0.4) foreColor = "#3f6212";
    else foreColor = "#16a34a";

    ctx.save();
    ctx.fillStyle = foreColor;
    ctx.beginPath();
    ctx.moveTo(0, this.height);
    ctx.lineTo(0, this.height * 0.78);

    for (let x = 0; x <= this.width; x += 30) {
      const y = this.height * 0.78 + Math.sin(x * 0.0025 + 3.0) * 55 + Math.cos(x * 0.005) * 25;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(this.width, this.height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Trees, Grass and Blooming Wildflowers
  drawFlora(ctx) {
    const h = this.habitability;
    if (h < 0.25) return;

    ctx.save();
    // Render trees according to habitability tier
    const activeTreeCount = Math.floor(this.trees.length * ((h - 0.25) / 0.75));

    for (let i = 0; i < activeTreeCount; i++) {
      const tree = this.trees[i];
      const x = tree.xRatio * this.width;
      const groundY = this.height * 0.76 + Math.sin(x * 0.0025 + 3.0) * 55 + Math.cos(x * 0.005) * 25;
      const s = tree.scale * Math.min(1.0, (h - 0.2) * 1.6);
      const sway = Math.sin(this.time + i) * 3 * s;

      if (tree.type === "pine") {
        // Pine trunk
        ctx.fillStyle = "#451a03";
        ctx.fillRect(x - 3 * s, groundY - 20 * s, 6 * s, 22 * s);

        // Pine needles (layered cones)
        ctx.fillStyle = h > 0.6 ? "#14532d" : "#166534";
        for (let l = 0; l < 3; l++) {
          ctx.beginPath();
          ctx.moveTo(x + sway * (l + 1) * 0.3, groundY - (45 + l * 20) * s);
          ctx.lineTo(x - (24 - l * 5) * s, groundY - (20 + l * 18) * s);
          ctx.lineTo(x + (24 - l * 5) * s, groundY - (20 + l * 18) * s);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        // Oak trunk
        ctx.fillStyle = "#78350f";
        ctx.fillRect(x - 4 * s, groundY - 25 * s, 8 * s, 28 * s);

        // Oak canopy
        ctx.fillStyle = h > 0.7 ? "#22c55e" : "#15803d";
        ctx.beginPath();
        ctx.arc(x + sway, groundY - 42 * s, 24 * s, 0, Math.PI * 2);
        ctx.arc(x - 14 * s + sway, groundY - 35 * s, 18 * s, 0, Math.PI * 2);
        ctx.arc(x + 14 * s + sway, groundY - 35 * s, 18 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Wildflowers popping up at higher habitability
    if (h >= 0.35) {
      const activeFlowerCount = Math.floor(this.flowers.length * ((h - 0.35) / 0.65));
      for (let i = 0; i < activeFlowerCount; i++) {
        const flower = this.flowers[i];
        const fx = flower.xRatio * this.width;
        const fy = this.height * 0.79 + Math.sin(fx * 0.0025 + 3.0) * 55 + Math.cos(fx * 0.005) * 25;
        const sway = Math.sin(this.time * 2 + i) * 2;

        // Stem
        ctx.strokeStyle = "#4ade80";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.quadraticCurveTo(fx + sway, fy - flower.height * 0.5, fx + sway, fy - flower.height);
        ctx.stroke();

        // Blossom
        ctx.fillStyle = flower.color;
        ctx.beginPath();
        ctx.arc(fx + sway, fy - flower.height, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // Flying birds & glowing twilight fireflies
  drawFauna(ctx) {
    const h = this.habitability;
    const isNight = this.timeOfDay > 0.75 || this.timeOfDay < 0.25;

    // Birds in daytime
    if (h >= 0.4 && !isNight) {
      ctx.save();
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1.8;
      for (const b of this.birds) {
        ctx.beginPath();
        const wingY = Math.sin(b.wingAngle) * (b.size * 1.2);
        ctx.moveTo(b.x - b.size * 2, b.y + wingY);
        ctx.quadraticCurveTo(b.x - b.size, b.y - b.size, b.x, b.y);
        ctx.quadraticCurveTo(b.x + b.size, b.y - b.size, b.x + b.size * 2, b.y + wingY);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Fireflies at night/twilight
    if (h >= 0.25 && isNight) {
      ctx.save();
      for (const f of this.fireflies) {
        const glow = Math.sin(f.phase) * 0.4 + 0.6;
        ctx.fillStyle = `rgba(250, 204, 21, ${glow})`;
        ctx.shadowColor = "#facc15";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Dynamic Weather: Sandstorm / Rain
  drawWeatherEffects(ctx) {
    // Sandstorm effect (PvP Cataclysm)
    if (this.sandstormIntensity > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(180, 83, 9, ${this.sandstormIntensity * 0.55})`;
      ctx.fillRect(0, 0, this.width, this.height);

      // Sand particle streaks
      ctx.strokeStyle = `rgba(251, 191, 36, ${this.sandstormIntensity * 0.7})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 60; i++) {
        const sx = ((this.time * 2000 + i * 37) % this.width);
        const sy = (i * 29) % this.height;
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 35, sy + 10);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Rain effect
    if (this.rainIntensity > 0) {
      ctx.save();
      ctx.strokeStyle = `rgba(186, 230, 253, ${this.rainIntensity * 0.5})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < 70; i++) {
        const rx = ((this.time * 400 + i * 43) % this.width);
        const ry = ((this.time * 1200 + i * 67) % this.height);
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 4, ry + 16);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  // Helper color interpolator
  lerpColor(a, b, amount) {
    const ah = parseInt(a.replace(/#/g, ""), 16),
      ar = ah >> 16, ag = (ah >> 8) & 0xff, ab = ah & 0xff,
      bh = parseInt(b.replace(/#/g, ""), 16),
      br = bh >> 16, bg = (bh >> 8) & 0xff, bb = bh & 0xff,
      rr = ar + amount * (br - ar),
      rg = ag + amount * (bg - ag),
      rb = ab + amount * (bb - ab);
    return `rgb(${Math.round(rr)}, ${Math.round(rg)}, ${Math.round(rb)})`;
  }
}
