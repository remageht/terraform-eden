// Particle System for Clicks, Floaters, Nature Life, Meteors, Lucky Comets, and Planetary Anomalies
export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floaters = [];
    this.meteors = [];
    this.comets = [];
    this.ripples = [];
    this.anomalies = [];
    this.supernovaAlpha = 0;
  }

  // Trigger cosmic rebirth / Big Crunch flash
  triggerSupernova() {
    this.supernovaAlpha = 1.0;
    const cx = window.innerWidth * 0.5;
    const cy = window.innerHeight * 0.5;
    this.burst(cx, cy, 100, "gold");
    this.burst(cx, cy, 60, "sun");
    this.burst(cx, cy, 40, "anomaly");
  }

  // Floating text like "+1", "CRIT! +50", "COMBO x3"
  addFloater(x, y, text, color = "#a7f3d0", isBig = false) {
    this.floaters.push({
      x,
      y,
      text,
      color,
      isBig,
      alpha: 1.0,
      vy: isBig ? -2.0 : -1.3,
      vx: (Math.random() - 0.5) * 0.8,
      scale: isBig ? 1.4 : 1.0,
      life: 1.0
    });
  }

  // Water ripples on click
  addRipple(x, y) {
    this.ripples.push({
      x,
      y,
      radius: 4,
      maxRadius: 45 + Math.random() * 20,
      alpha: 0.8,
      speed: 1.6
    });
  }

  // Visual burst on click: seeds, light sparks, leaves, gold
  burst(x, y, count = 12, theme = "spark") {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 4.5;
      let color = "#34d399";
      let size = 2 + Math.random() * 3.5;

      if (theme === "water") {
        color = Math.random() > 0.5 ? "#38bdf8" : "#93c5fd";
      } else if (theme === "sun" || theme === "gold") {
        color = Math.random() > 0.5 ? "#fde047" : "#fbbf24";
        size += 1.5;
      } else if (theme === "crit") {
        color = Math.random() > 0.5 ? "#f43f5e" : "#fbbf24";
        size += 2;
      } else if (theme === "leaf") {
        color = Math.random() > 0.5 ? "#4ade80" : "#22c55e";
        size = 3 + Math.random() * 4;
      } else if (theme === "anomaly") {
        color = Math.random() > 0.5 ? "#c084fc" : "#e879f9";
        size += 2.5;
      }

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (theme === "leaf" ? 0.5 : 1.5),
        color,
        size,
        alpha: 1.0,
        decay: 0.015 + Math.random() * 0.02,
        gravity: theme === "leaf" ? 0.04 : 0.08,
        shape: theme === "leaf" ? "leaf" : "circle"
      });
    }
  }

  // Spawn Planetary Anomaly on the ground/hill slopes
  spawnAnomaly(def, onExplore) {
    if (this.anomalies.length > 0) return; // Only 1 anomaly at a time
    const anomaly = {
      id: Date.now(),
      def,
      x: 100 + Math.random() * (window.innerWidth - 200),
      y: window.innerHeight * 0.72 + (Math.random() - 0.5) * 80,
      radius: 30,
      pulse: 0,
      timer: 25.0, // Lasts 25 seconds before vanishing
      onExplore
    };
    this.anomalies.push(anomaly);
    return anomaly;
  }

  exploreAnomalyAt(clickX, clickY) {
    for (let i = this.anomalies.length - 1; i >= 0; i--) {
      const a = this.anomalies[i];
      const dist = Math.hypot(a.x - clickX, a.y - clickY);
      if (dist <= a.radius + 30) {
        this.burst(a.x, a.y, 40, "anomaly");
        if (a.onExplore) a.onExplore(a.def);
        this.anomalies.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  // Lucky Golden Comet entity that crosses the sky
  spawnLuckyComet(onCatch) {
    const fromLeft = Math.random() > 0.5;
    const comet = {
      id: Date.now() + Math.random(),
      x: fromLeft ? -60 : window.innerWidth + 60,
      y: 60 + Math.random() * (window.innerHeight * 0.35),
      vx: fromLeft ? (2.2 + Math.random() * 1.5) : -(2.2 + Math.random() * 1.5),
      vy: 0.4 + Math.random() * 0.6,
      radius: 20,
      onCatch
    };
    this.comets.push(comet);
    return comet;
  }

  catchCometAt(clickX, clickY) {
    for (let i = this.comets.length - 1; i >= 0; i--) {
      const c = this.comets[i];
      const dist = Math.hypot(c.x - clickX, c.y - clickY);
      if (dist <= c.radius + 35) {
        this.burst(c.x, c.y, 45, "gold");
        if (c.onCatch) c.onCatch(c.x, c.y);
        this.comets.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  // PvP Meteor attack entity
  spawnMeteor(onHit, onDefend) {
    const meteor = {
      id: Date.now() + Math.random(),
      x: 100 + Math.random() * (window.innerWidth - 200),
      y: -60,
      targetY: window.innerHeight * 0.65,
      radius: 28,
      speed: 3.5,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
      health: 1,
      exploded: false,
      onHit,
      onDefend
    };
    this.meteors.push(meteor);
    return meteor;
  }

  defendMeteorAt(clickX, clickY) {
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      const dist = Math.hypot(m.x - clickX, m.y - clickY);
      if (dist <= m.radius + 25) {
        this.burst(m.x, m.y, 35, "crit");
        this.addFloater(m.x, m.y, "МЕТЕОРИТ СБИТ! 🛡️", "#38bdf8", true);
        if (m.onDefend) m.onDefend();
        this.meteors.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  update(dt = 1) {
    if (this.supernovaAlpha > 0) {
      this.supernovaAlpha = Math.max(0, this.supernovaAlpha - 0.02 * dt);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.alpha -= p.decay * dt;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += r.speed * dt;
      r.alpha = Math.max(0, 1 - (r.radius / r.maxRadius));
      if (r.radius >= r.maxRadius || r.alpha <= 0) {
        this.ripples.splice(i, 1);
      }
    }

    // Update floaters
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.alpha -= 0.02 * dt;
      f.scale = Math.max(0.8, f.scale - 0.005 * dt);

      if (f.alpha <= 0) {
        this.floaters.splice(i, 1);
      }
    }

    // Update anomalies
    for (let i = this.anomalies.length - 1; i >= 0; i--) {
      const a = this.anomalies[i];
      a.pulse += 0.06 * dt;
      a.timer -= (dt / 60);

      // Sparkles around anomaly
      if (Math.random() < 0.4) {
        this.particles.push({
          x: a.x + (Math.random() - 0.5) * 40,
          y: a.y + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -0.8 - Math.random() * 0.8,
          color: "#c084fc",
          size: 2 + Math.random() * 3,
          alpha: 0.9,
          decay: 0.03,
          gravity: 0,
          shape: "circle"
        });
      }

      if (a.timer <= 0) {
        this.anomalies.splice(i, 1);
      }
    }

    // Update lucky comets
    for (let i = this.comets.length - 1; i >= 0; i--) {
      const c = this.comets[i];
      c.x += c.vx * dt;
      c.y += c.vy * dt;

      if (Math.random() < 0.8) {
        this.particles.push({
          x: c.x - c.vx * 3 + (Math.random() - 0.5) * 8,
          y: c.y - c.vy * 3 + (Math.random() - 0.5) * 8,
          vx: -c.vx * 0.2 + (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          color: Math.random() > 0.5 ? "#fde047" : "#fbbf24",
          size: 2.5 + Math.random() * 3,
          alpha: 0.9,
          decay: 0.03,
          gravity: 0.02,
          shape: "circle"
        });
      }

      if (c.x < -100 || c.x > window.innerWidth + 100) {
        this.comets.splice(i, 1);
      }
    }

    // Update meteors
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.x += Math.cos(m.angle) * m.speed * dt;
      m.y += Math.sin(m.angle) * m.speed * dt;

      if (Math.random() < 0.6) {
        this.particles.push({
          x: m.x + (Math.random() - 0.5) * 10,
          y: m.y + (Math.random() - 0.5) * 10,
          vx: -Math.cos(m.angle) * 1.5,
          vy: -Math.sin(m.angle) * 1.5,
          color: Math.random() > 0.5 ? "#f97316" : "#ef4444",
          size: 4 + Math.random() * 4,
          alpha: 0.8,
          decay: 0.04,
          gravity: 0,
          shape: "circle"
        });
      }

      if (m.y >= m.targetY) {
        this.burst(m.x, m.y, 40, "crit");
        if (m.onHit) m.onHit();
        this.meteors.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    // Draw ripples
    for (const r of this.ripples) {
      ctx.save();
      ctx.strokeStyle = `rgba(186, 230, 253, ${r.alpha * 0.7})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.radius * 1.6, r.radius * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Planetary Anomalies
    for (const a of this.anomalies) {
      ctx.save();
      const pulseSize = Math.sin(a.pulse) * 6;
      
      // Outer beacon aura
      const grad = ctx.createRadialGradient(a.x, a.y, 5, a.x, a.y, a.radius + pulseSize + 15);
      grad.addColorStop(0, "rgba(192, 132, 252, 0.9)");
      grad.addColorStop(0.5, "rgba(147, 51, 234, 0.4)");
      grad.addColorStop(1, "rgba(147, 51, 234, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius + pulseSize + 15, 0, Math.PI * 2);
      ctx.fill();

      // Icon & prompt
      ctx.font = "26px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(a.def.icon, a.x, a.y);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px 'Plus Jakarta Sans', system-ui, sans-serif";
      ctx.shadowColor = "#9333ea";
      ctx.shadowBlur = 8;
      ctx.fillText(`🔍 ${a.def.name}`, a.x, a.y - a.radius - 12);
      ctx.restore();
    }

    // Draw particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.shape === "leaf") {
        ctx.translate(p.x, p.y);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.4, 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw Lucky Comets
    for (const c of this.comets) {
      ctx.save();
      const glow = ctx.createRadialGradient(c.x, c.y, 3, c.x, c.y, c.radius * 2.2);
      glow.addColorStop(0, "#ffffff");
      glow.addColorStop(0.3, "#fde047");
      glow.addColorStop(0.7, "rgba(251, 191, 36, 0.5)");
      glow.addColorStop(1, "rgba(251, 191, 36, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fef08a";
      ctx.font = "bold 12px 'Plus Jakarta Sans', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✨ ПОЙМАЙ МЕНЯ!", c.x, c.y - c.radius - 8);
      ctx.restore();
    }

    // Draw meteors
    for (const m of this.meteors) {
      ctx.save();
      const grad = ctx.createRadialGradient(m.x, m.y, 5, m.x, m.y, m.radius * 1.6);
      grad.addColorStop(0, "#fde047");
      grad.addColorStop(0.4, "#ea580c");
      grad.addColorStop(1, "rgba(220, 38, 38, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius * 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px 'Plus Jakarta Sans', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("КЛИКНИ! ☄️", m.x, m.y - m.radius - 8);
      ctx.restore();
    }

    // Draw floating texts
    for (const f of this.floaters) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, f.alpha);
      ctx.fillStyle = f.color;
      ctx.font = f.isBig 
        ? `bold ${Math.round(20 * f.scale)}px 'Plus Jakarta Sans', system-ui, sans-serif`
        : `600 ${Math.round(15 * f.scale)}px 'Plus Jakarta Sans', system-ui, sans-serif`;
      ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
      ctx.shadowBlur = 6;
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }

    // Draw Supernova screen flash
    if (this.supernovaAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1.0, this.supernovaAlpha);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.restore();
    }
  }
}
