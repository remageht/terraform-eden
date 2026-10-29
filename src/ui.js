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
  constructor(state, network, sounds, particles) {
    this.state = state;
    this.network = network;
    this.sounds = sounds;
    this.particles = particles;

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
    this.stardustHeaderDisplay = document.getElementById("stardust-counter");

    // Progression Tracker (Tier & Milestone Pace)
    this.tierBadge = document.getElementById("tier-badge");
    this.evolutionPaceDisplay = document.getElementById("evolution-pace");
    this.milestoneEtaFill = document.getElementById("milestone-eta-fill");
    this.archetypeToggleBtn = document.getElementById("archetype-toggle-btn");

    // Buffs banner
    this.activeBuffsContainer = document.getElementById("active-buffs-bar");

    // Panels
    this.upgradesContainer = document.getElementById("upgrades-list");
    this.categoryTabs = document.querySelectorAll(".category-tab");
    this.prestigeBtn = document.getElementById("prestige-btn");
    this.soundToggleBtn = document.getElementById("sound-toggle-btn");
    this.soundIcon = this.soundToggleBtn?.querySelector(".btn-icon");
    this.soundLabel = this.soundToggleBtn?.querySelector(".btn-label");
    this.logbookBtn = document.getElementById("open-logbook-btn");
    this.realityEngineBtn = document.getElementById("open-reality-engine-btn");
    this.shopDrawer = document.getElementById("shop-drawer");
    this.drawerToggleBtn = document.getElementById("drawer-toggle-btn");
    this.drawerToggleIcon = this.drawerToggleBtn?.querySelector(".toggle-icon");
    this.clickHint = document.getElementById("click-hint");

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

    // Evolution Era Showcase Modal (DNA to Human)
    this.evolutionModal = document.getElementById("evolution-modal");
    this.evolutionIcon = document.getElementById("evolution-big-icon");
    this.evolutionName = document.getElementById("evolution-name");
    this.evolutionOrganism = document.getElementById("evolution-organism");
    this.evolutionStoryText = document.getElementById("evolution-story-text");
    this.closeEvolutionBtn = document.getElementById("close-evolution-btn");

    // Reality Engine / Prestige Modal
    this.realityModal = document.getElementById("reality-modal");
    this.closeRealityBtn = document.getElementById("close-reality-btn");
    this.stardustBalanceDisplay = document.getElementById("stardust-balance");
    this.pendingStardustDisplay = document.getElementById("pending-stardust-count");
    this.btnExecuteRebirth = document.getElementById("btn-execute-rebirth");
    this.talentsContainer = document.getElementById("talents-list");

    // Story Logbook Modal
    this.logbookModal = document.getElementById("logbook-modal");
    this.closeLogbookBtn = document.getElementById("close-logbook-btn");
    this.logbookEntriesContainer = document.getElementById("logbook-entries");

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
    // Drawer collapse / expand toggle
    if (this.drawerToggleBtn) {
      this.drawerToggleBtn.addEventListener("click", () => {
        this.toggleShopDrawer();
      });
    }

    // Global Hotkeys: Tab = toggle shop, Escape = close modals
    window.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        this.toggleShopDrawer();
      } else if (e.key === "Escape") {
        this.closeAllModals();
      }
    });

    // Dismiss modals by clicking on backdrop
    document.querySelectorAll(".modal-backdrop").forEach(modal => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.add("hidden");
        }
      });
    });

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
        if (this.soundIcon) this.soundIcon.textContent = enabled ? "🔊" : "🔇";
        if (this.soundLabel) this.soundLabel.textContent = enabled ? "Звук" : "Выкл";
        this.soundToggleBtn.classList.toggle("muted", !enabled);
      });
    }

    // Evolution Modal close
    if (this.closeEvolutionBtn) {
      this.closeEvolutionBtn.addEventListener("click", () => {
        this.evolutionModal.classList.add("hidden");
      });
    }

    // Reality Engine Modal open / close
    if (this.realityEngineBtn) {
      this.realityEngineBtn.addEventListener("click", () => {
        this.renderRealityEngine();
        this.realityModal.classList.remove("hidden");
      });
    }
    if (this.prestigeBtn) {
      this.prestigeBtn.addEventListener("click", () => {
        this.renderRealityEngine();
        this.realityModal.classList.remove("hidden");
      });
    }
    if (this.closeRealityBtn) {
      this.closeRealityBtn.addEventListener("click", () => {
        this.realityModal.classList.add("hidden");
      });
    }

    // Execute Big Crunch Rebirth
    if (this.btnExecuteRebirth) {
      this.btnExecuteRebirth.addEventListener("click", () => {
        const pending = this.state.getPendingStardust();
        if (pending <= 0) {
          this.showToast("Накопите минимум 50,000 энергии для первого перерождения!", "warning");
          return;
        }

        if (confirm(`Запустить Большой Взрыв? Текущая Вселенная свернется, а вы получите +${pending} ⭐ Звездной Пыли для мета-исследований!`)) {
          const earned = this.state.prestige();
          if (earned > 0) {
            this.realityModal.classList.add("hidden");
            this.sounds.playSupernova();
            if (this.particles) this.particles.triggerSupernova();
            this.showToast(`🌌 БОЛЬШОЙ ВЗРЫВ! Получено +${earned} ⭐ Звездной Пыли!`, "success");
            const achs = this.state.checkAchievements();
            achs.forEach(ach => {
              this.sounds.playMilestone();
              this.showToast(`🏆 Достижение: ${ach.icon} ${ach.name}!`, "success");
            });
            this.buildUpgradesList();
            this.render();
          }
        }
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

    // Anomaly Modal close
    if (this.closeAnomalyBtn) {
      this.closeAnomalyBtn.addEventListener("click", () => {
        this.anomalyModal.classList.add("hidden");
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

    if (this.copyShareLinkBtn) {
      this.copyShareLinkBtn.addEventListener("click", () => {
        const code = this.shareCodeDisplay.textContent;
        const url = `${window.location.origin}${window.location.pathname}?room=${code}&mode=${this.network.mode}`;
        navigator.clipboard.writeText(url).then(() => {
          this.showToast("Ссылка-приглашение скопирована в буфер обмена! Отправьте её другу 📋", "info");
        });
      });
    }

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

  toggleShopDrawer() {
    if (!this.shopDrawer) return;
    const isCollapsed = this.shopDrawer.classList.toggle("collapsed");
    if (this.drawerToggleIcon) {
      this.drawerToggleIcon.textContent = isCollapsed ? "◂" : "▸";
    }
  }

  closeAllModals() {
    [
      this.evolutionModal,
      this.realityModal,
      this.logbookModal,
      this.anomalyModal,
      this.mpModal
    ].forEach(m => {
      if (m) m.classList.add("hidden");
    });
  }

  // Display Cinematic Evolution Modal
  showEvolutionModal(stageDef) {
    if (!this.evolutionModal || !stageDef) return;
    this.evolutionIcon.textContent = stageDef.icon;
    this.evolutionName.textContent = stageDef.name;
    this.evolutionOrganism.textContent = `Организм: ${stageDef.organism}`;
    this.evolutionStoryText.textContent = stageDef.storyText;

    this.evolutionModal.classList.remove("hidden");
    this.sounds.playEvolutionUnlock();
  }

  // Render Reality Engine (Prestige Talents Tree)
  renderRealityEngine() {
    if (!this.realityModal) return;
    const pending = this.state.getPendingStardust();
    this.stardustBalanceDisplay.textContent = formatNumber(this.state.stardust);
    this.pendingStardustDisplay.textContent = `+${pending} ⭐`;

    if (this.talentsContainer) {
      this.talentsContainer.innerHTML = "";
      CONFIG.PRESTIGE_TALENTS.forEach(talent => {
        const currentLvl = this.state.prestigeTalents[talent.id] || 0;
        const isMax = currentLvl >= talent.maxLevel;
        const cost = this.state.getPrestigeTalentCost(talent.id);
        const canAfford = !isMax && this.state.stardust >= cost;

        const card = document.createElement("div");
        card.className = `talent-card ${isMax ? "maxed" : (canAfford ? "affordable-talent" : "locked-talent")}`;
        card.innerHTML = `
          <div class="talent-icon">${talent.icon}</div>
          <div class="talent-info">
            <div class="talent-title-row">
              <span class="talent-name">${talent.name}</span>
              <span class="talent-level">${currentLvl} / ${talent.maxLevel}</span>
            </div>
            <div class="talent-desc">${talent.desc}</div>
            <div class="talent-cost-row">
              ${isMax ? '<span class="talent-maxed-badge">МАКС. УРОВЕНЬ</span>' : `<span class="talent-cost">${cost} ⭐ Пыли</span>`}
            </div>
          </div>
        `;

        if (!isMax) {
          card.addEventListener("click", () => {
            if (this.state.buyPrestigeTalent(talent.id)) {
              this.sounds.playPurchase();
              this.showToast(`Исследование "${talent.name}" усилено! ✨`, "success");
              this.renderRealityEngine();
              this.render();
            } else {
              this.showToast(`Не хватает ⭐ Звездной Пыли!`, "warning");
            }
          });
        }

        this.talentsContainer.appendChild(card);
      });
    }
  }

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
        <div class="upgrade-card-main">
          <div class="upgrade-icon">${u.icon}</div>
          <div class="upgrade-info">
            <div class="upgrade-title-row">
              <span class="upgrade-name">${u.name}</span>
              <span class="upgrade-level js-level">LVL 0</span>
            </div>
            <div class="upgrade-desc">${u.desc}</div>
            <div class="upgrade-cost-row">
              <span class="upgrade-cost js-cost">0 🧬</span>
            </div>
          </div>
        </div>
        <div class="upgrade-progress-track">
          <div class="upgrade-progress-bar js-progress"></div>
        </div>
      `;

      card.addEventListener("click", (e) => {
        e.stopPropagation();
        const cost = this.state.getUpgradeCost(u.id);

        if (this.state.energy < cost) {
          card.classList.remove("shake");
          void card.offsetWidth;
          card.classList.add("shake");
          this.sounds.playWaterDrop();
          this.showToast(`Не хватает ${formatNumber(cost - this.state.energy)} 🧬 для "${u.name}"!`, "warning");
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
        progressEl: card.querySelector(".js-progress"),
        def: u
      });

      this.upgradesContainer.appendChild(card);
    });

    this.updateUpgradesDisplay();
  }

  updateUpgradesDisplay() {
    this.upgradeCardElements.forEach(({ cardEl, levelEl, costEl, progressEl, def }) => {
      const level = this.state.upgrades[def.id] || 0;
      const cost = this.state.getUpgradeCost(def.id);
      const canAfford = this.state.energy >= cost;

      levelEl.textContent = `LVL ${level}`;
      costEl.textContent = `${formatNumber(cost)} 🧬`;

      const pct = Math.min(100, Math.floor((this.state.energy / Math.max(1, cost)) * 100));
      if (progressEl) {
        progressEl.style.width = `${pct}%`;
      }

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
        <span class="cat-cost">${formatNumber(cat.cost)} 🧬</span>
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
          this.showToast(`Не хватает ${formatNumber(cat.cost - this.state.energy)} 🧬 для атаки!`, "warning");
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
        const achs = this.state.checkAchievements();
        achs.forEach(ach => {
          this.sounds.playMilestone();
          this.showToast(`🏆 Достижение: ${ach.icon} ${ach.name}!`, "success");
        });
        this.anomalyModal.classList.add("hidden");
        this.render();
      });
      this.anomalyChoicesContainer.appendChild(btn);
    });

    this.anomalyModal.classList.remove("hidden");
    this.sounds.playWarning();
  }

  renderLogbook() {
    if (!this.logbookEntriesContainer) return;
    this.logbookEntriesContainer.innerHTML = "";

    // Section 1: Story Epochs
    const epochsTitle = document.createElement("div");
    epochsTitle.className = "logbook-section-title";
    epochsTitle.innerHTML = `<span>📜 Эпохи Эволюции Биосферы</span><span class="badge-mini">${this.state.unlockedEvolutionStages.length}/${CONFIG.EVOLUTION_STAGES.length}</span>`;
    this.logbookEntriesContainer.appendChild(epochsTitle);

    CONFIG.EVOLUTION_STAGES.forEach((stage) => {
      const isUnlocked = this.state.unlockedEvolutionStages.includes(stage.id);
      const entry = document.createElement("div");
      entry.className = `logbook-entry ${isUnlocked ? "unlocked" : "locked-entry"}`;

      if (isUnlocked) {
        entry.innerHTML = `
          <div class="entry-header">
            <span class="entry-icon">${stage.icon}</span>
            <span class="entry-title">${stage.name}</span>
            <span class="entry-date">${stage.organism}</span>
          </div>
          <div class="entry-body">${stage.storyText}</div>
        `;
      } else {
        entry.innerHTML = `
          <div class="entry-header">
            <span class="entry-icon">🔒</span>
            <span class="entry-title">Эпоха еще не открыта [Порог: ${formatNumber(stage.threshold)} 🧬]</span>
          </div>
          <div class="entry-body locked-text">Генетический код заблокирован. Развивайте биосферу.</div>
        `;
      }

      this.logbookEntriesContainer.appendChild(entry);
    });

    // Section 2: Achievements Hall of Fame
    const unlockedAchsCount = Object.keys(this.state.achievements).filter(k => this.state.achievements[k]).length;
    const achSectionTitle = document.createElement("div");
    achSectionTitle.className = "logbook-section-title mt-4";
    achSectionTitle.innerHTML = `<span>🏆 Зал Славы (Достижения)</span><span class="badge-mini">${unlockedAchsCount}/${CONFIG.ACHIEVEMENTS.length}</span>`;
    this.logbookEntriesContainer.appendChild(achSectionTitle);

    const achGrid = document.createElement("div");
    achGrid.className = "achievements-grid";

    CONFIG.ACHIEVEMENTS.forEach(ach => {
      const isDone = !!this.state.achievements[ach.id];
      const card = document.createElement("div");
      card.className = `ach-card ${isDone ? "unlocked" : "locked"}`;
      card.innerHTML = `
        <div class="ach-icon">${isDone ? ach.icon : "🔒"}</div>
        <div class="ach-info">
          <div class="ach-name">${isDone ? ach.name : "Секретное достижение"}</div>
          <div class="ach-desc">${isDone ? ach.desc : "Разблокируйте в процессе эволюции"}</div>
        </div>
        <div class="ach-status">${isDone ? "✓ Выполнено" : "—"}</div>
      `;
      achGrid.appendChild(card);
    });
    this.logbookEntriesContainer.appendChild(achGrid);
  }

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

  updateStatsDisplay() {
    this.energyDisplay.textContent = formatNumber(this.state.energy);
    this.passiveDisplay.textContent = `+${formatNumber(this.state.passivePerSec)} /сек`;
    this.clickDisplay.textContent = `+${formatNumber(this.state.clickPower)} /клик`;

    // Evolution stage in header
    const evoIdx = this.state.currentEvolutionIndex;
    const stages = CONFIG.EVOLUTION_STAGES;
    const currentEvo = stages[evoIdx] || stages[0];
    const nextEvo = stages[evoIdx + 1];

    if (this.stageName) this.stageName.textContent = `${currentEvo.name}`;
    if (this.stageDesc) this.stageDesc.textContent = currentEvo.description;

    // Progression Tracker (Tier & Milestone ETA)
    if (this.tierBadge) {
      const romanTiers = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
      const tierNumeral = romanTiers[evoIdx] || `${evoIdx + 1}`;
      this.tierBadge.textContent = `УРОВЕНЬ ${tierNumeral} • ${currentEvo.name.toUpperCase()}`;
    }

    if (this.milestoneEtaFill) {
      if (nextEvo) {
        const prevThreshold = currentEvo.threshold || 0;
        const nextThreshold = nextEvo.threshold;
        const span = Math.max(1, nextThreshold - prevThreshold);
        const progress = Math.min(100, Math.max(0, ((this.state.energy - prevThreshold) / span) * 100));
        this.milestoneEtaFill.style.width = `${progress.toFixed(1)}%`;
      } else {
        this.milestoneEtaFill.style.width = "100%";
      }
    }

    if (this.evolutionPaceDisplay) {
      if (nextEvo) {
        const prevThreshold = currentEvo.threshold || 0;
        const span = Math.max(1, nextEvo.threshold - prevThreshold);
        if (this.state.passivePerSec > 0) {
          const pacePerMin = Math.min(999.9, (this.state.passivePerSec * 60 / span) * 100);
          const remainingEnergy = Math.max(0, nextEvo.threshold - this.state.energy);
          const etaSec = Math.ceil(remainingEnergy / this.state.passivePerSec);
          const etaText = etaSec < 60 ? `${etaSec}с` : `${Math.floor(etaSec / 60)}м ${etaSec % 60}с`;
          this.evolutionPaceDisplay.textContent = `⚡ +${pacePerMin.toFixed(1)}%/мин (~${etaText})`;
        } else {
          this.evolutionPaceDisplay.textContent = `⚡ Кликайте для ускорения`;
        }
      } else {
        this.evolutionPaceDisplay.textContent = `⚡ МАКСИМАЛЬНАЯ ЭВОЛЮЦИЯ`;
      }
    }

    const percent = Math.floor(this.state.habitability * 100);
    if (this.habitabilityBar) this.habitabilityBar.style.width = `${percent}%`;
    if (this.habitabilityPercent) this.habitabilityPercent.textContent = `${percent}%`;

    // Stardust display in header
    if (this.stardustHeaderDisplay) {
      if (this.state.stardust > 0 || this.state.totalStardustEarned > 0) {
        this.stardustHeaderDisplay.textContent = `⭐ ${formatNumber(this.state.stardust)}`;
        this.stardustHeaderDisplay.classList.remove("hidden");
      } else {
        this.stardustHeaderDisplay.classList.add("hidden");
      }
    }

    // Prestige Rebirth Button indicator
    const pendingStardust = this.state.getPendingStardust();
    if (this.prestigeBtn) {
      if (pendingStardust > 0) {
        this.prestigeBtn.classList.remove("hidden");
        const label = this.prestigeBtn.querySelector(".btn-label");
        if (label) {
          label.textContent = `Сжатие (+${pendingStardust})`;
        } else {
          this.prestigeBtn.innerHTML = `<span class="btn-icon">⭐</span><span class="btn-label">Сжатие (+${pendingStardust})</span>`;
        }
      } else {
        this.prestigeBtn.classList.add("hidden");
      }
    }

    // Auto-fade click hint
    if (this.clickHint) {
      if (this.state.totalClicks > 6 || this.state.energy > 30) {
        this.clickHint.classList.add("hidden-hint");
      }
    }

    // Multiplayer progress in PvP
    if (this.network.isMultiplayer && this.network.mode === "pvp") {
      const myP = Math.floor(this.state.habitability * 100);
      const enemyP = Math.floor(this.network.remoteHabitability * 100);
      if (this.pvpMyProgress) this.pvpMyProgress.style.width = `${myP}%`;
      if (this.pvpEnemyProgress) this.pvpEnemyProgress.style.width = `${enemyP}%`;
    }
  }

  render() {
    this.updateStatsDisplay();
    this.updateUpgradesDisplay();
    this.updateCataclysmsDisplay();
    this.updateActiveBuffs();
  }
}
