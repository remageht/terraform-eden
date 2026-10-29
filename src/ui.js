import { CONFIG } from "./config.js";

// Formats numbers cleanly (1.2k, 45.8M, etc.)
export function formatNumber(num) {
  if (num === null || num === undefined) return "0";
  if (num < 1000) return Math.floor(num).toLocaleString();
  const suffixes = ["", "k", "M", "B", "T", "Qa", "Qi"];
  const i = Math.floor(Math.log10(Math.max(1, num)) / 3);
  const formatted = (num / Math.pow(10, i * 3)).toFixed(i > 0 ? 1 : 0);
  return formatted + (suffixes[i] || "");
}

export class UIManager {
  constructor(state, network, sounds) {
    this.state = state;
    this.network = network;
    this.sounds = sounds;

    this.activeCategory = "all";
    this.initDOMElements();
    this.bindEvents();
  }

  initDOMElements() {
    // Top HUD
    this.energyDisplay = document.getElementById("energy-count");
    this.passiveDisplay = document.getElementById("passive-rate");
    this.clickDisplay = document.getElementById("click-rate");
    this.stageName = document.getElementById("stage-name");
    this.stageDesc = document.getElementById("stage-desc");
    this.habitabilityBar = document.getElementById("habitability-progress");
    this.habitabilityPercent = document.getElementById("habitability-percent");

    // Panels
    this.upgradesContainer = document.getElementById("upgrades-list");
    this.categoryTabs = document.querySelectorAll(".category-tab");
    this.prestigeBtn = document.getElementById("prestige-btn");
    this.soundToggleBtn = document.getElementById("sound-toggle-btn");

    // Multiplayer HUD elements
    this.mpPanel = document.getElementById("mp-hud");
    this.mpStatusText = document.getElementById("mp-status-text");
    this.pvpDuelBar = document.getElementById("pvp-duel-bar");
    this.pvpMyProgress = document.getElementById("pvp-my-progress");
    this.pvpEnemyProgress = document.getElementById("pvp-enemy-progress");
    this.cataclysmsContainer = document.getElementById("cataclysms-list");

    // Modals
    this.mpModal = document.getElementById("multiplayer-modal");
    this.openMpModalBtn = document.getElementById("open-mp-modal-btn");
    this.closeMpModalBtn = document.getElementById("close-mp-modal-btn");
    this.createCoopBtn = document.getElementById("btn-create-coop");
    this.createPvpBtn = document.getElementById("btn-create-pvp");
    this.joinRoomBtn = document.getElementById("btn-join-room");
    this.roomCodeInput = document.getElementById("room-code-input");
    this.roomShareSection = document.getElementById("room-share-section");
    this.shareCodeDisplay = document.getElementById("share-room-code");
    this.copyShareLinkBtn = document.getElementById("btn-copy-link");
    this.disconnectMpBtn = document.getElementById("btn-disconnect-mp");

    // Toast notifications
    this.toastContainer = document.getElementById("toast-container");
  }

  bindEvents() {
    // Category tabs
    this.categoryTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        this.categoryTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        this.activeCategory = tab.dataset.category;
        this.renderUpgrades();
      });
    });

    // Sound toggle
    if (this.soundToggleBtn) {
      this.soundToggleBtn.addEventListener("click", () => {
        const enabled = this.sounds.toggleSound();
        this.soundToggleBtn.textContent = enabled ? "🔊 Звук: ВКЛ" : "🔇 Звук: ВЫКЛ";
        this.soundToggleBtn.classList.toggle("muted", !enabled);
      });
    }

    // Prestige button
    if (this.prestigeBtn) {
      this.prestigeBtn.addEventListener("click", () => {
        if (confirm("Вы готовы совершить Вознесение Эдема? Весь текущий прогресс сбросится в обмен на постоянный бонус +25% к добыче!")) {
          if (this.state.prestige()) {
            this.sounds.playMilestone();
            this.showToast("🌟 Вознесение свершилось! Множитель усилен!", "success");
            this.render();
          }
        }
      });
    }

    // Multiplayer Modal triggers
    if (this.openMpModalBtn) {
      this.openMpModalBtn.addEventListener("click", () => {
        this.mpModal.classList.remove("hidden");
      });
    }

    if (this.closeMpModalBtn) {
      this.closeMpModalBtn.addEventListener("click", () => {
        this.mpModal.classList.add("hidden");
      });
    }

    // Copy link button
    if (this.copyShareLinkBtn) {
      this.copyShareLinkBtn.addEventListener("click", () => {
        const code = this.shareCodeDisplay.textContent;
        const url = `${window.location.origin}${window.location.pathname}?room=${code}&mode=${this.network.mode}`;
        navigator.clipboard.writeText(url).then(() => {
          this.showToast("Ссылка-приглашение скопирована в буфер обмена! Отправьте её другу 📋", "info");
        });
      });
    }

    // Disconnect MP
    if (this.disconnectMpBtn) {
      this.disconnectMpBtn.addEventListener("click", () => {
        this.network.disconnect();
        this.mpPanel.classList.add("hidden");
        this.roomShareSection.classList.add("hidden");
        this.showToast("Мультиплеер отключен. Возврат в одиночный режим.", "info");
        this.render();
      });
    }
  }

  // Toast notification
  showToast(message, type = "info") {
    if (!this.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  // Render upgrade cards
  renderUpgrades() {
    if (!this.upgradesContainer) return;
    this.upgradesContainer.innerHTML = "";

    const filtered = CONFIG.UPGRADES.filter(u => {
      if (this.activeCategory === "all") return true;
      return u.category === this.activeCategory;
    });

    filtered.forEach(u => {
      const level = this.state.upgrades[u.id] || 0;
      const cost = this.state.getUpgradeCost(u.id);
      const canAfford = this.state.energy >= cost;

      const card = document.createElement("div");
      card.className = `upgrade-card ${canAfford ? "affordable" : "locked"}`;
      card.innerHTML = `
        <div class="upgrade-icon">${u.icon}</div>
        <div class="upgrade-info">
          <div class="upgrade-title-row">
            <span class="upgrade-name">${u.name}</span>
            <span class="upgrade-level">ур. ${level}</span>
          </div>
          <div class="upgrade-desc">${u.desc}</div>
          <div class="upgrade-cost-row">
            <span class="upgrade-cost">${formatNumber(cost)} 💧</span>
          </div>
        </div>
      `;

      card.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.state.buyUpgrade(u.id)) {
          this.sounds.playPurchase();
          this.render();
          if (this.network.isMultiplayer) {
            this.network.broadcastState(this.state);
          }
        }
      });

      this.upgradesContainer.appendChild(card);
    });
  }

  // Render PvP Cataclysms
  renderCataclysms() {
    if (!this.cataclysmsContainer) return;
    this.cataclysmsContainer.innerHTML = "";

    if (!this.network.isMultiplayer || this.network.mode !== "pvp") {
      this.cataclysmsContainer.classList.add("hidden");
      return;
    }

    this.cataclysmsContainer.classList.remove("hidden");

    CONFIG.CATACLYSMS.forEach(cat => {
      const canAfford = this.state.energy >= cat.cost;
      const btn = document.createElement("button");
      btn.className = `cataclysm-btn ${canAfford ? "active" : "disabled"}`;
      btn.innerHTML = `
        <span class="cat-icon">${cat.icon}</span>
        <span class="cat-name">${cat.name}</span>
        <span class="cat-cost">${formatNumber(cat.cost)} 💧</span>
      `;
      btn.title = cat.desc;

      btn.addEventListener("click", () => {
        if (this.state.energy >= cat.cost) {
          this.state.energy -= cat.cost;
          this.network.launchCataclysm(cat.id);
          this.sounds.playWarning();
          this.showToast(`Вы запустили атаку: ${cat.name}! ⚔️`, "warning");
          this.render();
        }
      });

      this.cataclysmsContainer.appendChild(btn);
    });
  }

  // Update complete UI
  render() {
    // Energy & stats
    this.energyDisplay.textContent = formatNumber(this.state.energy);
    this.passiveDisplay.textContent = `+${formatNumber(this.state.passivePerSec)} /сек`;
    this.clickDisplay.textContent = `+${formatNumber(this.state.clickPower)} /клик`;

    // Habitability
    const currentStage = CONFIG.STAGES[this.state.currentStageIndex];
    if (this.stageName) this.stageName.textContent = `${currentStage.icon} ${currentStage.name}`;
    if (this.stageDesc) this.stageDesc.textContent = currentStage.description;

    const percent = Math.floor(this.state.habitability * 100);
    if (this.habitabilityBar) this.habitabilityBar.style.width = `${percent}%`;
    if (this.habitabilityPercent) this.habitabilityPercent.textContent = `${percent}%`;

    // Prestige button visibility
    if (this.prestigeBtn) {
      this.prestigeBtn.classList.toggle("hidden", !this.state.canPrestige());
    }

    // Multiplayer HUD
    if (this.network.isMultiplayer) {
      this.mpPanel.classList.remove("hidden");

      if (this.network.mode === "pvp") {
        this.pvpDuelBar.classList.remove("hidden");
        const myP = Math.floor(this.state.habitability * 100);
        const enemyP = Math.floor(this.network.remoteHabitability * 100);
        if (this.pvpMyProgress) this.pvpMyProgress.style.width = `${myP}%`;
        if (this.pvpEnemyProgress) this.pvpEnemyProgress.style.width = `${enemyP}%`;
      } else {
        this.pvpDuelBar.classList.add("hidden");
      }
    } else {
      this.mpPanel.classList.add("hidden");
    }

    this.renderUpgrades();
    this.renderCataclysms();
  }
}
