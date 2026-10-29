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

    // Check URL parameters for direct room joining (e.g. ?room=xyz)
    this.checkUrlParams();

    // Initial UI render
    this.ui.render();

    // Start Main Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  // Network event bindings
  setupNetworkHandlers() {
    // Status message update
    this.network.onStatusChange = (status) => {
      if (this.ui.mpStatusText) this.ui.mpStatusText.textContent = status;
    };

    // Connection established
    this.network.onConnected = ({ mode, isHost }) => {
      this.ui.showToast(`🎮 Подключено! Режим: ${mode === "coop" ? "Кооператив" : "PvP Дуэль"}`, "success");
      this.ui.mpModal.classList.add("hidden");
      this.ui.render();
      this.state.checkAchievements();
    };

    // Disconnection
    this.network.onDisconnected = () => {
      this.ui.showToast("Игрок покинул комнату.", "warning");
      this.ui.render();
    };

    // Remote player clicked (Co-op & PvP)
    this.network.onRemoteClick = ({ xRatio, yRatio, gained, isCrit }) => {
      const rx = xRatio * this.canvas.width;
      const ry = yRatio * this.canvas.height;

      // In Co-op, add partner's energy to our shared pool
      if (this.network.mode === "coop") {
        this.state.energy += gained;
        this.state.totalEnergyEarned += gained;
        this.state.recalculateStats();
        this.ui.render();

        // Particles for partner click
        this.particles.burst(rx, ry, isCrit ? 18 : 8, "leaf");
        this.particles.addFloater(rx, ry, `Друг: +${gained}`, "#38bdf8", isCrit);
        this.sounds.playWaterDrop();

        // Check for Co-op Sync Combo (< 450ms between both clicks)
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

    // Sync combo triggered by partner
    this.network.onSyncCombo = ({ duration, mult }) => {
      this.state.triggerSyncCombo(duration, mult);
      this.sounds.playMilestone();
      this.ui.showToast("⚡ СИНХРОННОЕ ЦВЕТЕНИЕ! Буст x3!", "success");
    };

    // State sync received from peer
    this.network.onRemoteStateSync = (remoteData) => {
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
            // Meteor hit ground!
            const lost = this.state.applyCataclysm("meteor_hit");
            this.sounds.playWarning();
            this.ui.showToast(`💥 Метеорит упал! Вы потеряли ${lost} 💧!`, "warning");
            this.ui.render();
          },
          () => {
            // Meteor defended
            this.sounds.playPurchase();
            this.ui.showToast("🛡️ Метеорит успешно уничтожен!", "success");
          }
        );
      }
      this.ui.render();
    };

    // Wire Modal UI buttons
    this.ui.createCoopBtn.addEventListener("click", () => this.handleCreateRoom("coop"));
    this.ui.createPvpBtn.addEventListener("click", () => this.handleCreateRoom("pvp"));
    this.ui.joinRoomBtn.addEventListener("click", () => {
      const code = this.ui.roomCodeInput.value.trim();
      if (code) this.handleJoinRoom(code);
    });
  }

  // Create multiplayer room
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

  // Join multiplayer room
  async handleJoinRoom(code) {
    try {
      this.ui.mpStatusText.textContent = "Подключение...";
      await this.network.joinRoom(code);
    } catch (e) {
      this.ui.showToast(`Не удалось подключиться к комнате ${code}`, "warning");
    }
  }

  // Check URL query parameters
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

  // Pointer/Mouse Click on the Game Canvas
  handlePointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // First check if clicking on active PvP meteor
    if (this.particles.defendMeteorAt(x, y)) {
      return;
    }

    this.handleClick(x, y);
  }

  // Execute click logic
  handleClick(x, y) {
    this.lastLocalClickTime = Date.now();
    this.sounds.startAmbientWind();

    const result = this.state.click();

    if (result.isDroughtClearing) {
      // Drought clearing click
      this.particles.burst(x, y, 15, "water");
      this.particles.addFloater(x, y, `Полив! Осталось: ${result.remainingDrought}`, "#38bdf8");
      this.sounds.playWaterDrop();
    } else {
      // Normal click
      const theme = result.isCrit ? "crit" : (this.state.habitability > 0.4 ? "leaf" : "spark");
      this.particles.burst(x, y, result.isCrit ? 22 : 10, theme);
      this.particles.addFloater(
        x,
        y,
        result.isCrit ? `КРИТ! +${result.gained}` : `+${result.gained}`,
        result.isCrit ? "#fbbf24" : "#6ee7b7",
        result.isCrit
      );
      this.sounds.playClick(result.isCrit);
    }

    // Notify stage evolution
    if (result.stageChanged) {
      this.sounds.playMilestone();
      this.ui.showToast(`🌟 Эволюция Мира: ${result.newStage.name}!`, "success");
    }

    // Check achievements
    const newAchs = this.state.checkAchievements();
    newAchs.forEach((ach) => {
      this.sounds.playMilestone();
      this.ui.showToast(`🏆 Достижение: ${ach.icon} ${ach.name}!`, "success");
    });

    // Broadcast click to network if multiplayer
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

  // Main Loop (RAF)
  loop(currentTime) {
    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    // Simulation updates
    this.tickTimer += dt;
    if (this.tickTimer >= CONFIG.TICK_RATE_MS / 1000) {
      const { stageChanged, newStage } = this.state.tick(this.tickTimer);
      if (stageChanged) {
        this.sounds.playMilestone();
        this.ui.showToast(`🌟 Эволюция Мира: ${newStage.name}!`, "success");
      }
      this.tickTimer = 0;
      this.ui.render();
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
