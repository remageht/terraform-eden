// Particle System for Clicks, Floaters, Nature Life and Meteors
export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floaters = [];
    this.meteors = [];
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
      vy: isBig ? -1.8 : -1.2,
      vx: (Math.random() - 0.5) * 0.8,
      scale: isBig ? 1.4 : 1.0,
      life: 1.0
    });
  }

  // Visual burst on click: seeds, light sparks, leaves
  burst(x, y, count = 12, theme = "spark") {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 4.5;
      let color = "#34d399";
      let size = 2 + Math.random() * 3.5;

      if (theme === "water") {
        color = Math.random() > 0.5 ? "#38bdf8" : "#93c5fd";
      } else if (theme === "sun") {
        color = Math.random() > 0.5 ? "#fde047" : "#fb923c";
      } else if (theme === "crit") {
        color = Math.random() > 0.5 ? "#f43f5e" : "#fbbf24";
        size += 2;
      } else if (theme === "leaf") {
        color = Math.random() > 0.5 ? "#4ade80" : "#22c55e";
        size = 3 + Math.random() * 4;
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
        // Successfully clicked and destroyed meteor
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

    // Update meteors
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.x += Math.cos(m.angle) * m.speed * dt;
      m.y += Math.sin(m.angle) * m.speed * dt;

      // Trail
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

      // Hit ground
      if (m.y >= m.targetY) {
        this.burst(m.x, m.y, 40, "crit");
        if (m.onHit) m.onHit();
        this.meteors.splice(i, 1);
      }
    }
  }

  draw(ctx) {
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

    // Draw meteors
    for (const m of this.meteors) {
      ctx.save();
      // Outer glow
      const grad = ctx.createRadialGradient(m.x, m.y, 5, m.x, m.y, m.radius * 1.6);
      grad.addColorStop(0, "#fde047");
      grad.addColorStop(0.4, "#ea580c");
      grad.addColorStop(1, "rgba(220, 38, 38, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Warning text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px 'Segoe UI', system-ui, sans-serif";
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
        ? `bold ${Math.round(20 * f.scale)}px 'Segoe UI', system-ui, sans-serif`
        : `600 ${Math.round(15 * f.scale)}px 'Segoe UI', system-ui, sans-serif`;
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 6;
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }
}
