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
    this.upgradeCardElements = new Map();
    this.cataclysmElements = new Map();

    this.initDOMElements();
    this.bindEvents();
    this.buildUpgradesList();
    this.buildCataclysmsList();
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

    // Buffs banner
    this.activeBuffsContainer = document.getElementById("active-buffs-bar");

    // Panels
    this.upgradesContainer = document.getElementById("upgrades-list");
    this.categoryTabs = document.querySelectorAll(".category-tab");
    this.prestigeBtn = document.getElementById("prestige-btn");
    this.soundToggleBtn = document.getElementById("sound-toggle-btn");
    this.logbookBtn = document.getElementById("open-logbook-btn");

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

    // Story Logbook Modal
    this.logbookModal = document.getElementById("logbook-modal");
    this.closeLogbookBtn = document.getElementById("close-logbook-btn");
    this.logbookEntriesContainer = document.getElementById("logbook-entries");

    // Story Popup Dialog
    this.storyPopup = document.getElementById("story-popup");
    this.storyPopupTitle = document.getElementById("story-popup-title");
    this.storyPopupDate = document.getElementById("story-popup-date");
    this.storyPopupText = document.getElementById("story-popup-text");
    this.closeStoryPopupBtn = document.getElementById("close-story-popup-btn");

    // Anomaly Event Modal
    this.anomalyModal = document.getElementById("anomaly-modal");
    this.anomalyTitle = document.getElementById("anomaly-title");
    this.anomalyIcon = document.getElementById("anomaly-icon");
    this.anomalyDesc = document.getElementById("anomaly-desc");
    this.anomalyChoicesContainer = document.getElementById("anomaly-choices");
    this.closeAnomalyBtn = document.getElementById("close-anomaly-btn");

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
        this.buildUpgradesList();
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

    // Logbook Modal
    if (this.logbookBtn) {
      this.logbookBtn.addEventListener("click", () => {
        this.renderLogbook();
        this.logbookModal.classList.remove("hidden");
      });
    }
    if (this.closeLogbookBtn) {
      this.closeLogbookBtn.addEventListener("click", () => {
        this.logbookModal.classList.add("hidden");
      });
    }

    // Story Popup close
    if (this.closeStoryPopupBtn) {
      this.closeStoryPopupBtn.addEventListener("click", () => {
        this.storyPopup.classList.add("hidden");
      });
    }

    // Anomaly Modal close
    if (this.closeAnomalyBtn) {
      this.closeAnomalyBtn.addEventListener("click", () => {
        this.anomalyModal.classList.add("hidden");
      });
    }

    // Prestige button
    if (this.prestigeBtn) {
      this.prestigeBtn.addEventListener("click", () => {
        if (confirm("Вы готовы совершить Вознесение Эдема? Весь текущий прогресс сбросится в обмен на постоянный бонус +25% к добыче!")) {
          if (this.state.prestige()) {
            this.sounds.playMilestone();
            this.showToast("🌟 Вознесение свершилось! Множитель усилен!", "success");
            this.buildUpgradesList();
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

  // Build upgrade cards in DOM ONCE per category switch (NEVER wipe innerHTML in loop!)
  buildUpgradesList() {
    if (!this.upgradesContainer) return;
    this.upgradesContainer.innerHTML = "";
    this.upgradeCardElements.clear();

    const filtered = CONFIG.UPGRADES.filter(u => {
      if (this.activeCategory === "all") return true;
      return u.category === this.activeCategory;
    });

    filtered.forEach(u => {
      const card = document.createElement("div");
      card.className = "upgrade-card locked";

      card.innerHTML = `
        <div class="upgrade-icon">${u.icon}</div>
        <div class="upgrade-info">
          <div class="upgrade-title-row">
            <span class="upgrade-name">${u.name}</span>
            <span class="upgrade-level js-level">ур. 0</span>
          </div>
          <div class="upgrade-desc">${u.desc}</div>
          <div class="upgrade-cost-row">
            <span class="upgrade-cost js-cost">0 💧</span>
          </div>
        </div>
      `;

      // Single permanent click handler with shake feedback
      card.addEventListener("click", (e) => {
        e.stopPropagation();
        const cost = this.state.getUpgradeCost(u.id);

        if (this.state.energy < cost) {
          card.classList.remove("shake");
          void card.offsetWidth;
          card.classList.add("shake");
          this.sounds.playWaterDrop();
          this.showToast(`Не хватает ${formatNumber(cost - this.state.energy)} 💧 для покупки "${u.name}"!`, "warning");
          return;
        }

        if (this.state.buyUpgrade(u.id)) {
          this.sounds.playPurchase();
          this.updateUpgradesDisplay();
          this.updateStatsDisplay();

          if (this.network.isMultiplayer) {
            this.network.broadcastState(this.state);
          }
        }
      });

      this.upgradeCardElements.set(u.id, {
        cardEl: card,
        levelEl: card.querySelector(".js-level"),
        costEl: card.querySelector(".js-cost"),
        def: u
      });

      this.upgradesContainer.appendChild(card);
    });

    this.updateUpgradesDisplay();
  }

  // Update upgrade cards without touching DOM structure
  updateUpgradesDisplay() {
    this.upgradeCardElements.forEach(({ cardEl, levelEl, costEl, def }) => {
      const level = this.state.upgrades[def.id] || 0;
      const cost = this.state.getUpgradeCost(def.id);
      const canAfford = this.state.energy >= cost;

      levelEl.textContent = `ур. ${level}`;
      costEl.textContent = `${formatNumber(cost)} 💧`;

      if (canAfford) {
        cardEl.classList.add("affordable");
        cardEl.classList.remove("locked");
      } else {
        cardEl.classList.remove("affordable");
        cardEl.classList.add("locked");
      }
    });
  }

  buildCataclysmsList() {
    if (!this.cataclysmsContainer) return;
    this.cataclysmsContainer.innerHTML = "";
    this.cataclysmElements.clear();

    CONFIG.CATACLYSMS.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "cataclysm-btn disabled";
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
        } else {
          this.showToast(`Не хватает ${formatNumber(cat.cost - this.state.energy)} 💧 для атаки!`, "warning");
        }
      });

      this.cataclysmElements.set(cat.id, { btn, def: cat });
      this.cataclysmsContainer.appendChild(btn);
    });
  }

  updateCataclysmsDisplay() {
    if (!this.network.isMultiplayer || this.network.mode !== "pvp") {
      this.cataclysmsContainer.classList.add("hidden");
      return;
    }

    this.cataclysmsContainer.classList.remove("hidden");
    this.cataclysmElements.forEach(({ btn, def }) => {
      const canAfford = this.state.energy >= def.cost;
      btn.classList.toggle("active", canAfford);
      btn.classList.toggle("disabled", !canAfford);
    });
  }

  // Planetary Anomaly Modal with choices
  showAnomalyModal(anomalyDef) {
    if (!this.anomalyModal || !anomalyDef) return;
    this.anomalyIcon.textContent = anomalyDef.icon;
    this.anomalyTitle.textContent = anomalyDef.name;
    this.anomalyDesc.textContent = anomalyDef.desc;
    this.anomalyChoicesContainer.innerHTML = "";

    anomalyDef.choices.forEach(choice => {
      const btn = document.createElement("button");
      btn.className = "btn btn-primary anomaly-choice-btn";
      btn.textContent = choice.label;
      btn.addEventListener("click", () => {
        const toastResult = this.state.applyAnomalyChoice(choice);
        this.sounds.playMilestone();
        this.showToast(toastResult, "success");
        this.anomalyModal.classList.add("hidden");
        this.render();
      });
      this.anomalyChoicesContainer.appendChild(btn);
    });

    this.anomalyModal.classList.remove("hidden");
    this.sounds.playWarning();
  }

  // Story Popup for unlocked stage
  showStoryPopup(stage) {
    if (!this.storyPopup || !stage) return;
    this.storyPopupTitle.textContent = stage.logTitle || stage.name;
    this.storyPopupDate.textContent = stage.logDate || "ЗАПИСЬ ЭКСПЕДИЦИИ";
    this.storyPopupText.textContent = stage.logText || stage.description;
    this.storyPopup.classList.remove("hidden");
    this.sounds.playMilestone();
  }

  // Render Logbook entries
  renderLogbook() {
    if (!this.logbookEntriesContainer) return;
    this.logbookEntriesContainer.innerHTML = "";

    CONFIG.STAGES.forEach((stage, idx) => {
      const isUnlocked = this.state.unlockedLogs.includes(idx);
      const entry = document.createElement("div");
      entry.className = `logbook-entry ${isUnlocked ? "unlocked" : "locked-entry"}`;

      if (isUnlocked) {
        entry.innerHTML = `
          <div class="entry-header">
            <span class="entry-icon">${stage.icon}</span>
            <span class="entry-title">${stage.logTitle || stage.name}</span>
            <span class="entry-date">${stage.logDate || ""}</span>
          </div>
          <div class="entry-body">${stage.logText || stage.description}</div>
        `;
      } else {
        entry.innerHTML = `
          <div class="entry-header">
            <span class="entry-icon">🔒</span>
            <span class="entry-title">Запись зашифрована [Порог: ${formatNumber(stage.threshold)} 💧]</span>
          </div>
          <div class="entry-body locked-text">Сенсорные данные заблокированы до достижения следующей фазы биосферы.</div>
        `;
      }

      this.logbookEntriesContainer.appendChild(entry);
    });
  }

  // Update active buffs visual banner
  updateActiveBuffs() {
    if (!this.activeBuffsContainer) return;
    let buffs = [];

    if (this.state.effects.sunburstTimer > 0) {
      buffs.push(`⚡ Вспышка: клик x5 (${Math.ceil(this.state.effects.sunburstTimer)}с)`);
    }
    if (this.state.effects.anomalyClickTimer > 0) {
      buffs.push(`🗿 Монолит: клик x${this.state.effects.anomalyClickMult} (${Math.ceil(this.state.effects.anomalyClickTimer)}с)`);
    }
    if (this.state.effects.anomalyPassiveTimer > 0) {
      buffs.push(`🌋 Гейзер: доход x${this.state.effects.anomalyPassiveMult} (${Math.ceil(this.state.effects.anomalyPassiveTimer)}с)`);
    }
    if (this.state.effects.syncComboTimer > 0) {
      buffs.push(`✨ Цветение: x3 (${Math.ceil(this.state.effects.syncComboTimer)}с)`);
    }
    if (this.state.effects.sandstormTimer > 0) {
      buffs.push(`🌪️ Буря: -70% (${Math.ceil(this.state.effects.sandstormTimer)}с)`);
    }
    if (this.state.effects.droughtClicksNeeded > 0) {
      buffs.push(`☀️ Засуха: нужно ${this.state.effects.droughtClicksNeeded} кликов!`);
    }

    if (buffs.length > 0) {
      this.activeBuffsContainer.innerHTML = buffs.map(b => `<span class="buff-pill">${b}</span>`).join("");
      this.activeBuffsContainer.classList.remove("hidden");
    } else {
      this.activeBuffsContainer.classList.add("hidden");
    }
  }

  // Update stats counters
  updateStatsDisplay() {
    this.energyDisplay.textContent = formatNumber(this.state.energy);
    this.passiveDisplay.textContent = `+${formatNumber(this.state.passivePerSec)} /сек`;
    this.clickDisplay.textContent = `+${formatNumber(this.state.clickPower)} /клик`;

    const currentStage = CONFIG.STAGES[this.state.currentStageIndex];
    if (this.stageName) this.stageName.textContent = `${currentStage.icon} ${currentStage.name}`;
    if (this.stageDesc) this.stageDesc.textContent = currentStage.description;

    const percent = Math.floor(this.state.habitability * 100);
    if (this.habitabilityBar) this.habitabilityBar.style.width = `${percent}%`;
    if (this.habitabilityPercent) this.habitabilityPercent.textContent = `${percent}%`;

    if (this.prestigeBtn) {
      this.prestigeBtn.classList.toggle("hidden", !this.state.canPrestige());
    }

    // Multiplayer progress in PvP
    if (this.network.isMultiplayer && this.network.mode === "pvp") {
      const myP = Math.floor(this.state.habitability * 100);
      const enemyP = Math.floor(this.network.remoteHabitability * 100);
      if (this.pvpMyProgress) this.pvpMyProgress.style.width = `${myP}%`;
      if (this.pvpEnemyProgress) this.pvpEnemyProgress.style.width = `${enemyP}%`;
    }
  }

  // Periodic render
  render() {
    this.updateStatsDisplay();
    this.updateUpgradesDisplay();
    this.updateCataclysmsDisplay();
    this.updateActiveBuffs();
  }
}
