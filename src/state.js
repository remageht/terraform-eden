import { CONFIG } from "./config.js";

// Manages all game variables, math, upgrades and persistence
export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.energy = 0;
    this.totalEnergyEarned = 0;
    this.clicks = 0;
    this.prestigeCount = 0;
    this.stardustMultiplier = 1.0;

    // Upgrades level map
    this.upgrades = {};
    for (const u of CONFIG.UPGRADES) {
      this.upgrades[u.id] = 0;
    }

    // Unlocked achievements & story log indices
    this.achievements = {};
    this.unlockedLogs = [0];

    // Dynamic stats
    this.clickPower = 1;
    this.critChance = 0.0;
    this.critMultiplier = 5;
    this.passivePerSec = 0;
    this.globalMultiplier = 1.0;

    // Active status effects
    this.effects = {
      sandstormTimer: 0,
      droughtClicksNeeded: 0,
      syncComboTimer: 0,
      syncComboMult: 1.0,
      sunburstTimer: 0,
      sunburstMult: 5.0,
      anomalyPassiveTimer: 0,
      anomalyPassiveMult: 1.0,
      anomalyClickTimer: 0,
      anomalyClickMult: 1.0
    };

    // Autoclicker accumulator
    this.autoclickAccumulator = 0;

    // Current stage
    this.currentStageIndex = 0;
    this.habitability = 0.0;

    this.recalculateStats();
  }

  getUpgradeCost(upgradeId) {
    const def = CONFIG.UPGRADES.find(u => u.id === upgradeId);
    if (!def) return Infinity;
    const level = this.upgrades[upgradeId] || 0;
    return Math.floor(def.baseCost * Math.pow(def.costMult, level));
  }

  recalculateStats() {
    let baseClick = 1;
    let basePassive = 0;
    let critChance = 0.0;
    let clickSynergy = 0.0;
    let multiplierBonus = 0.0;

    for (const def of CONFIG.UPGRADES) {
      const level = this.upgrades[def.id] || 0;
      if (level === 0) continue;

      if (def.type === "click") {
        baseClick += def.power * level;
      } else if (def.type === "passive") {
        basePassive += def.power * level;
      } else if (def.type === "crit_chance") {
        critChance += def.power * level;
      } else if (def.type === "click_synergy") {
        clickSynergy += def.power * level;
      } else if (def.type === "multiplier") {
        multiplierBonus += def.power * level;
      }
    }

    this.globalMultiplier = (1.0 + multiplierBonus) * this.stardustMultiplier;
    
    // Effective passive income
    let effectivePassive = basePassive * this.globalMultiplier;
    if (this.effects.anomalyPassiveTimer > 0) {
      effectivePassive *= this.effects.anomalyPassiveMult;
    }
    this.passivePerSec = effectivePassive;

    // Effective click power
    let effectiveClick = (baseClick + (basePassive * clickSynergy)) * this.globalMultiplier;
    if (this.effects.sunburstTimer > 0) {
      effectiveClick *= this.effects.sunburstMult;
    }
    if (this.effects.anomalyClickTimer > 0) {
      effectiveClick *= this.effects.anomalyClickMult;
    }

    this.clickPower = Math.max(1, Math.round(effectiveClick));
    this.critChance = Math.min(0.75, critChance);

    // Compute habitability (0.0 to 1.0)
    this.habitability = Math.min(1.0, this.totalEnergyEarned / CONFIG.TARGET_TERRAFORM_ENERGY);

    // Stage progression
    let stageIdx = 0;
    for (let i = 0; i < CONFIG.STAGES.length; i++) {
      if (this.totalEnergyEarned >= CONFIG.STAGES[i].threshold) {
        stageIdx = i;
      }
    }

    const stageChanged = stageIdx !== this.currentStageIndex;
    if (stageChanged) {
      this.currentStageIndex = stageIdx;
      if (!this.unlockedLogs.includes(stageIdx)) {
        this.unlockedLogs.push(stageIdx);
      }
    }

    return { stageChanged, newStage: CONFIG.STAGES[stageIdx] };
  }

  // Perform click with contextual Biome multiplier!
  click(zone = "default") {
    this.clicks++;

    // Drought clear check
    if (this.effects.droughtClicksNeeded > 0) {
      this.effects.droughtClicksNeeded--;
      return {
        gained: 0,
        isCrit: false,
        isDroughtClearing: true,
        remainingDrought: this.effects.droughtClicksNeeded
      };
    }

    // Biome multipliers based on Mutation upgrades
    let biomeMultiplier = 1.0;
    if (zone === "sky" && this.upgrades.mut_chloroplast) {
      biomeMultiplier += this.upgrades.mut_chloroplast * 1.0;
    } else if (zone === "water" && this.upgrades.mut_aquifer) {
      biomeMultiplier += this.upgrades.mut_aquifer * 2.0;
    }

    // Roll for critical strike
    const isCrit = Math.random() < this.critChance;
    let gained = this.clickPower * (isCrit ? this.critMultiplier : 1.0) * biomeMultiplier;

    // Co-op sync boost
    if (this.effects.syncComboTimer > 0) {
      gained *= this.effects.syncComboMult;
    }

    // Sandstorm debuff
    if (this.effects.sandstormTimer > 0) {
      gained *= 0.5;
    }

    gained = Math.max(1, Math.round(gained));
    this.energy += gained;
    this.totalEnergyEarned += gained;

    const { stageChanged, newStage } = this.recalculateStats();

    return {
      gained,
      isCrit,
      zone,
      biomeMultiplier,
      stageChanged,
      newStage
    };
  }

  // Purchase an upgrade
  buyUpgrade(upgradeId) {
    const cost = this.getUpgradeCost(upgradeId);
    if (this.energy < cost) return false;

    this.energy -= cost;
    this.upgrades[upgradeId] = (this.upgrades[upgradeId] || 0) + 1;
    this.recalculateStats();
    return true;
  }

  // Periodic tick (called every dt seconds)
  tick(dt) {
    // Process status effects
    if (this.effects.sandstormTimer > 0) {
      this.effects.sandstormTimer = Math.max(0, this.effects.sandstormTimer - dt);
    }
    if (this.effects.syncComboTimer > 0) {
      this.effects.syncComboTimer = Math.max(0, this.effects.syncComboTimer - dt);
    }
    if (this.effects.sunburstTimer > 0) {
      this.effects.sunburstTimer = Math.max(0, this.effects.sunburstTimer - dt);
      if (this.effects.sunburstTimer === 0) this.recalculateStats();
    }
    if (this.effects.anomalyPassiveTimer > 0) {
      this.effects.anomalyPassiveTimer = Math.max(0, this.effects.anomalyPassiveTimer - dt);
      if (this.effects.anomalyPassiveTimer === 0) this.recalculateStats();
    }
    if (this.effects.anomalyClickTimer > 0) {
      this.effects.anomalyClickTimer = Math.max(0, this.effects.anomalyClickTimer - dt);
      if (this.effects.anomalyClickTimer === 0) this.recalculateStats();
    }

    // Autoclicker from mut_mycelium
    let autoclickGained = 0;
    if (this.upgrades.mut_mycelium > 0) {
      this.autoclickAccumulator += dt * this.upgrades.mut_mycelium * 0.5;
      if (this.autoclickAccumulator >= 1.0) {
        const clicksToExecute = Math.floor(this.autoclickAccumulator);
        this.autoclickAccumulator -= clicksToExecute;
        autoclickGained = this.clickPower * clicksToExecute;
        this.energy += autoclickGained;
        this.totalEnergyEarned += autoclickGained;
      }
    }

    // Passive energy income
    let passiveGain = this.passivePerSec * dt;

    if (this.effects.droughtClicksNeeded > 0) passiveGain = 0;
    if (this.effects.sandstormTimer > 0) passiveGain *= 0.3;
    if (this.effects.syncComboTimer > 0) passiveGain *= this.effects.syncComboMult;

    this.energy += passiveGain;
    this.totalEnergyEarned += passiveGain;

    const { stageChanged, newStage } = this.recalculateStats();
    return { passiveGain, autoclickGained, stageChanged, newStage };
  }

  // Handle choice from an explored Anomaly
  applyAnomalyChoice(choice) {
    this.achievements["anomaly_explored"] = true;
    let toastMsg = "";

    if (choice.action === "income_burst") {
      const burst = Math.max(500, Math.round(this.passivePerSec * choice.multiplier));
      this.energy += burst;
      this.totalEnergyEarned += burst;
      toastMsg = `🌋 Конденсат собран: +${burst} 💧!`;
    } else if (choice.action === "buff_temp") {
      if (choice.type === "passive") {
        this.effects.anomalyPassiveTimer = choice.time;
        this.effects.anomalyPassiveMult = choice.mult;
        toastMsg = `⚡ Давление повышено: Пассивный доход x${choice.mult} на ${choice.time}с!`;
      } else {
        this.effects.anomalyClickTimer = choice.time;
        this.effects.anomalyClickMult = choice.mult;
        toastMsg = `⚡ Резонанс монолита: Сила клика x${choice.mult} на ${choice.time}с!`;
      }
    } else if (choice.action === "instant_energy") {
      this.energy += choice.amount;
      this.totalEnergyEarned += choice.amount;
      toastMsg = `🗿 Энергия монолита: +${choice.amount} 💧!`;
    } else if (choice.action === "time_warp") {
      const warp = Math.max(1000, Math.round(this.passivePerSec * choice.seconds));
      this.energy += warp;
      this.totalEnergyEarned += warp;
      toastMsg = `⏳ Временной скачок: получено +${warp} 💧 (за 60с времени)!`;
    } else if (choice.action === "percent_energy") {
      const bonus = Math.max(800, Math.round(this.energy * choice.percent));
      this.energy += bonus;
      this.totalEnergyEarned += bonus;
      toastMsg = `💎 Кристальный заряд: +${bonus} 💧!`;
    }

    this.recalculateStats();
    return toastMsg;
  }

  // Lucky Comet bonuses
  claimCometBonus() {
    this.achievements["comet_caught"] = true;
    const rolls = ["biomass", "sunburst", "cosmic_gift"];
    const bonusType = rolls[Math.floor(Math.random() * rolls.length)];
    const boostMult = this.upgrades.mut_magnetosphere ? 2.0 : 1.0;

    let result = { type: bonusType, text: "" };

    if (bonusType === "biomass") {
      const bonusEnergy = Math.max(300, Math.round(this.passivePerSec * 30 * boostMult));
      this.energy += bonusEnergy;
      this.totalEnergyEarned += bonusEnergy;
      result.text = `🌿 ВСПЛЕСК БИОМАССЫ! +${bonusEnergy} 💧!`;
    } else if (bonusType === "sunburst") {
      this.effects.sunburstTimer = 15.0 * boostMult;
      this.recalculateStats();
      result.text = `⚡ СОЛНЕЧНАЯ ВСПЫШКА! Клик x5 на ${15 * boostMult}с!`;
    } else if (bonusType === "cosmic_gift") {
      const gift = Math.max(500, Math.round(this.energy * 0.25 * boostMult));
      this.energy += gift;
      this.totalEnergyEarned += gift;
      result.text = `✨ ЗВЕЗДНЫЙ ДАР! +${gift} 💧!`;
    }

    this.recalculateStats();
    return result;
  }

  // Apply PvP attacks
  applyCataclysm(type) {
    if (type === "sandstorm") {
      this.effects.sandstormTimer = 8.0;
    } else if (type === "drought") {
      this.effects.droughtClicksNeeded = 8;
    } else if (type === "meteor_hit") {
      const lost = Math.round(this.energy * 0.12);
      this.energy = Math.max(0, this.energy - lost);
      return lost;
    }
    return 0;
  }

  triggerSyncCombo(duration = 6, multiplier = 3.0) {
    this.effects.syncComboTimer = duration;
    this.effects.syncComboMult = multiplier;
  }

  canPrestige() {
    return this.totalEnergyEarned >= CONFIG.TARGET_TERRAFORM_ENERGY;
  }

  prestige() {
    if (!this.canPrestige()) return false;
    this.prestigeCount++;
    this.stardustMultiplier += 0.25;

    this.energy = 0;
    this.totalEnergyEarned = 0;
    for (const u of CONFIG.UPGRADES) {
      this.upgrades[u.id] = 0;
    }
    this.effects = {
      sandstormTimer: 0,
      droughtClicksNeeded: 0,
      syncComboTimer: 0,
      syncComboMult: 1.0,
      sunburstTimer: 0,
      sunburstMult: 5.0,
      anomalyPassiveTimer: 0,
      anomalyPassiveMult: 1.0,
      anomalyClickTimer: 0,
      anomalyClickMult: 1.0
    };
    this.recalculateStats();
    this.save();
    return true;
  }

  checkAchievements() {
    const newlyUnlocked = [];
    for (const ach of CONFIG.ACHIEVEMENTS) {
      if (this.achievements[ach.id]) continue;

      let unlocked = false;
      if (ach.id === "first_click" && this.clicks >= 1) unlocked = true;
      if (ach.id === "comet_caught" && this.achievements["comet_caught"]) unlocked = true;
      if (ach.id === "anomaly_explored" && this.achievements["anomaly_explored"]) unlocked = true;
      if (ach.id === "clicks_100" && this.clicks >= 100) unlocked = true;
      if (ach.id === "energy_1k" && this.totalEnergyEarned >= 1000) unlocked = true;
      if (ach.id === "energy_50k" && this.totalEnergyEarned >= 50000) unlocked = true;
      if (ach.id === "energy_1m" && this.totalEnergyEarned >= 1000000) unlocked = true;

      if (unlocked) {
        this.achievements[ach.id] = true;
        newlyUnlocked.push(ach);
      }
    }
    return newlyUnlocked;
  }

  save() {
    try {
      const data = {
        energy: this.energy,
        totalEnergyEarned: this.totalEnergyEarned,
        clicks: this.clicks,
        prestigeCount: this.prestigeCount,
        stardustMultiplier: this.stardustMultiplier,
        upgrades: this.upgrades,
        achievements: this.achievements,
        unlockedLogs: this.unlockedLogs,
        lastSaveTime: Date.now()
      };
      localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Save failed", e);
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(CONFIG.SAVE_KEY);
      if (!raw) return { loaded: false, offlineGain: 0 };
      const data = JSON.parse(raw);

      this.energy = data.energy || 0;
      this.totalEnergyEarned = data.totalEnergyEarned || 0;
      this.clicks = data.clicks || 0;
      this.prestigeCount = data.prestigeCount || 0;
      this.stardustMultiplier = data.stardustMultiplier || 1.0;
      this.upgrades = data.upgrades || this.upgrades;
      this.achievements = data.achievements || {};
      this.unlockedLogs = data.unlockedLogs || [0];

      this.recalculateStats();

      let offlineGain = 0;
      if (data.lastSaveTime) {
        const offlineSeconds = Math.min(8 * 3600, Math.floor((Date.now() - data.lastSaveTime) / 1000));
        if (offlineSeconds > 5 && this.passivePerSec > 0) {
          offlineGain = Math.round(offlineSeconds * this.passivePerSec * 0.7);
          this.energy += offlineGain;
          this.totalEnergyEarned += offlineGain;
          this.recalculateStats();
        }
      }

      return { loaded: true, offlineGain };
    } catch (e) {
      console.warn("Load failed", e);
      return { loaded: false, offlineGain: 0 };
    }
  }
}
