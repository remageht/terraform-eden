import { CONFIG } from "./config.js";
import { GameState } from "./state.js";
import { LandscapeRenderer } from "./landscape.js";
import { ParticleSystem } from "./particles.js";
import { sounds } from "./audio.js";
import { network } from "./network.js";
import { UIManager } from "./ui.js";

// Main Game Controller
class Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.state = new GameState();
    this.particles = new ParticleSystem();
    this.landscape = new LandscapeRenderer(this.canvas);
    this.sounds = sounds;
    this.network = network;
    this.ui = new UIManager(this.state, this.network, this.sounds);

    this.lastTime = performance.now();
    this.tickTimer = 0;
    this.saveTimer = 0;
    this.cometTimer = 20; // First comet spawns in 20s
    this.anomalyTimer = 35; // First anomaly spawns in 35s
    this.lastLocalClickTime = 0;

    this.init();
  }

  init() {
    // Load local save
    const { loaded, offlineGain } = this.state.load();
    if (loaded && offlineGain > 0) {
      setTimeout(() => {
        this.ui.showToast(`🌿 Добро пожаловать назад! Оффлайн-доход: +${offlineGain} 💧`, "info");
      }, 800);
    }

    // Set initial habitability
    this.landscape.setHabitability(this.state.habitability);

    // Bind canvas clicks & touches
    this.canvas.addEventListener("pointerdown", (e) => this.handlePointerDown(e));

    // Keyboard shortcuts (Space to click)
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" && e.target.tagName !== "INPUT") {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        this.handleClick(rect.width * 0.5, rect.height * 0.65);
      }
    });

    // Setup network handlers
    this.setupNetworkHandlers();

    // Check URL parameters for direct room joining
    this.checkUrlParams();

    // Initial UI render
    this.ui.render();

    // Start Main Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  setupNetworkHandlers() {
    this.network.onStatusChange = (status) => {
      if (this.ui.mpStatusText) this.ui.mpStatusText.textContent = status;
    };

    this.network.onConnected = ({ mode }) => {
      this.ui.showToast(`🎮 Подключено! Режим: ${mode === "coop" ? "Кооператив" : "PvP Дуэль"}`, "success");
      this.ui.mpModal.classList.add("hidden");
      this.ui.render();
      this.state.checkAchievements();
    };

    this.network.onDisconnected = () => {
      this.ui.showToast("Игрок покинул комнату.", "warning");
      this.ui.render();
    };

    // Remote player clicked
    this.network.onRemoteClick = ({ xRatio, yRatio, gained, isCrit }) => {
      const rx = xRatio * this.canvas.width;
      const ry = yRatio * this.canvas.height;

      if (this.network.mode === "coop") {
        this.state.energy += gained;
        this.state.totalEnergyEarned += gained;
        const { stageChanged, newStage } = this.state.recalculateStats();

        this.particles.burst(rx, ry, isCrit ? 18 : 8, "leaf");
        this.particles.addFloater(rx, ry, `Друг: +${gained}`, "#38bdf8", isCrit);
        this.sounds.playWaterDrop();

        if (stageChanged) {
          this.ui.showStoryPopup(newStage);
        }

        const now = Date.now();
        if (Math.abs(now - this.lastLocalClickTime) < 450) {
          this.state.triggerSyncCombo(6, 3.0);
          this.network.send("SYNC_COMBO", { duration: 6, mult: 3.0 });
          this.sounds.playMilestone();
          this.ui.showToast("⚡ СИНХРОННОЕ ЦВЕТЕНИЕ! Буст x3 ко всем доходам!", "success");
          this.particles.burst(this.canvas.width * 0.5, this.canvas.height * 0.5, 40, "sun");
        }
      }
    };

    this.network.onSyncCombo = ({ duration, mult }) => {
      this.state.triggerSyncCombo(duration, mult);
      this.sounds.playMilestone();
      this.ui.showToast("⚡ СИНХРОННОЕ ЦВЕТЕНИЕ! Буст x3!", "success");
    };

    this.network.onRemoteStateSync = () => {
      this.ui.render();
    };

    // Cataclysm received in PvP
    this.network.onCataclysmReceived = (type) => {
      this.sounds.playWarning();
      if (type === "sandstorm") {
        this.state.applyCataclysm("sandstorm");
        this.ui.showToast("🌪️ ВНИМАНИЕ: Противник наслал песчаную бурю! Доход снижен на 70%!", "warning");
      } else if (type === "drought") {
        this.state.applyCataclysm("drought");
        this.ui.showToast("☀️ ВНИМАНИЕ: Засуха! Кликайте быстрее, чтобы полить землю!", "warning");
      } else if (type === "meteor") {
        this.ui.showToast("☄️ ВНИМАНИЕ: Падает метеорит! Кликните по нему, чтобы сбить!", "warning");
        this.particles.spawnMeteor(
          () => {
            const lost = this.state.applyCataclysm("meteor_hit");
            this.sounds.playWarning();
            this.ui.showToast(`💥 Метеорит упал! Вы потеряли ${lost} 💧!`, "warning");
            this.ui.render();
          },
          () => {
            this.sounds.playPurchase();
            this.ui.showToast("🛡️ Метеорит успешно уничтожен!", "success");
          }
        );
      }
      this.ui.render();
    };

    // Modal UI buttons
    this.ui.createCoopBtn.addEventListener("click", () => this.handleCreateRoom("coop"));
    this.ui.createPvpBtn.addEventListener("click", () => this.handleCreateRoom("pvp"));
    this.ui.joinRoomBtn.addEventListener("click", () => {
      const code = this.ui.roomCodeInput.value.trim();
      if (code) this.handleJoinRoom(code);
    });
  }

  async handleCreateRoom(mode) {
    try {
      this.ui.mpStatusText.textContent = "Создание комнаты...";
      const code = await this.network.createRoom(mode);
      this.ui.shareCodeDisplay.textContent = code;
      this.ui.roomShareSection.classList.remove("hidden");
      this.ui.showToast(`Комната создана! Код: ${code}`, "info");
    } catch (e) {
      this.ui.showToast(`Ошибка создания: ${e.message}`, "warning");
    }
  }

  async handleJoinRoom(code) {
    try {
      this.ui.mpStatusText.textContent = "Подключение...";
      await this.network.joinRoom(code);
    } catch (e) {
      this.ui.showToast(`Не удалось подключиться к комнате ${code}`, "warning");
    }
  }

  checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    if (room) {
      setTimeout(() => {
        this.ui.roomCodeInput.value = room;
        this.handleJoinRoom(room);
      }, 500);
    }
  }

  // Pointer/Mouse Click on Game Canvas
  handlePointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 1. Check if clicking Lucky Comet!
    if (this.particles.catchCometAt(x, y)) {
      const bonus = this.state.claimCometBonus();
      this.sounds.playMilestone();
      this.particles.addFloater(x, y, bonus.text, "#fde047", true);
      this.ui.showToast(bonus.text, "success");
      this.ui.render();
      return;
    }

    // 2. Check if clicking Planetary Anomaly!
    if (this.particles.exploreAnomalyAt(x, y)) {
      // Handled in callback
      return;
    }

    // 3. Check if defending PvP meteor
    if (this.particles.defendMeteorAt(x, y)) {
      return;
    }

    // 4. Biome detection (Contextual click!)
    let zone = "earth";
    if (y < this.canvas.height * 0.42) {
      zone = "sky";
    } else if (y >= this.canvas.height * 0.72 && y <= this.canvas.height * 0.86) {
      zone = "water";
      this.particles.addRipple(x, y);
    }

    this.handleClick(x, y, zone);
  }

  // Execute click logic
  handleClick(x, y, zone = "earth") {
    this.lastLocalClickTime = Date.now();
    this.sounds.startAmbientWind();

    const result = this.state.click(zone);

    if (result.isDroughtClearing) {
      this.particles.burst(x, y, 15, "water");
      this.particles.addFloater(x, y, `Полив! Осталось: ${result.remainingDrought}`, "#38bdf8");
      this.sounds.playWaterDrop();
    } else {
      const isBuffed = this.state.effects.sunburstTimer > 0;
      
      // Determine particle theme by zone
      let theme = "spark";
      let prefix = "";
      if (zone === "sky") {
        theme = "sun";
        prefix = "☀️ ";
      } else if (zone === "water") {
        theme = "water";
        prefix = "💧 ";
      } else {
        theme = this.state.habitability > 0.35 ? "leaf" : "spark";
        prefix = "🌱 ";
      }

      if (result.isCrit) theme = "crit";

      this.particles.burst(x, y, result.isCrit ? 22 : 10, theme);
      
      let floaterText = `${prefix}+${result.gained}`;
      if (result.isCrit) floaterText = `КРИТ! +${result.gained}`;
      else if (result.biomeMultiplier > 1.0) floaterText = `${prefix}+${result.gained} (x${result.biomeMultiplier})`;

      this.particles.addFloater(
        x,
        y,
        floaterText,
        result.isCrit ? "#fbbf24" : (isBuffed ? "#fef08a" : (zone === "water" ? "#38bdf8" : (zone === "sky" ? "#fde047" : "#6ee7b7"))),
        result.isCrit || isBuffed
      );

      if (zone === "water") {
        this.sounds.playWaterDrop();
      } else {
        this.sounds.playClick(result.isCrit);
      }
    }

    if (result.stageChanged) {
      this.ui.showStoryPopup(result.newStage);
    }

    const newAchs = this.state.checkAchievements();
    newAchs.forEach((ach) => {
      this.sounds.playMilestone();
      this.ui.showToast(`🏆 Достижение: ${ach.icon} ${ach.name}!`, "success");
    });

    if (this.network.isMultiplayer) {
      this.network.broadcastClick(
        x / this.canvas.width,
        y / this.canvas.height,
        result.gained,
        result.isCrit
      );
    }

    this.ui.render();
  }

  // Main Loop
  loop(currentTime) {
    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    // Simulation updates
    this.tickTimer += dt;
    if (this.tickTimer >= CONFIG.TICK_RATE_MS / 1000) {
      const { stageChanged, newStage, autoclickGained } = this.state.tick(this.tickTimer);
      
      if (autoclickGained > 0) {
        this.particles.burst(this.canvas.width * 0.5, this.canvas.height * 0.75, 4, "leaf");
      }

      if (stageChanged) {
        this.ui.showStoryPopup(newStage);
      }
      this.tickTimer = 0;
      this.ui.render();
    }

    // Lucky Comet spawn timer
    this.cometTimer -= dt;
    if (this.cometTimer <= 0) {
      this.particles.spawnLuckyComet();
      this.sounds.playWaterDrop();
      this.cometTimer = CONFIG.COMET_INTERVAL_SEC + (Math.random() - 0.5) * 10;
    }

    // Planetary Anomaly spawn timer
    this.anomalyTimer -= dt;
    if (this.anomalyTimer <= 0) {
      const randomDef = CONFIG.ANOMALIES[Math.floor(Math.random() * CONFIG.ANOMALIES.length)];
      this.particles.spawnAnomaly(randomDef, (anomalyDef) => {
        this.ui.showAnomalyModal(anomalyDef);
      });
      this.sounds.playWarning();
      this.ui.showToast(`🌋 Обнаружена аномалия: ${randomDef.name}! Исследуйте её!`, "info");
      this.anomalyTimer = CONFIG.ANOMALY_INTERVAL_SEC + (Math.random() - 0.5) * 15;
    }

    // Autosave & Network sync interval
    this.saveTimer += dt;
    if (this.saveTimer >= 3.0) {
      this.state.save();
      if (this.network.isMultiplayer) {
        this.network.broadcastState(this.state);
      }
      this.saveTimer = 0;
    }

    // Update landscape state
    this.landscape.setHabitability(this.state.habitability);
    this.landscape.setWeather(
      this.state.effects.sandstormTimer > 0 ? 1 : 0,
      this.state.upgrades.spring_streams > 0 ? 0.3 : 0
    );

    // Update animation layers
    this.landscape.update(dt * 60);
    this.particles.update(dt * 60);

    // Draw scene
    this.landscape.draw();
    this.particles.draw(this.landscape.ctx);

    requestAnimationFrame((t) => this.loop(t));
  }
}

// Start game once DOM is loaded
window.addEventListener("DOMContentLoaded", () => {
  window.game = new Game();
});
