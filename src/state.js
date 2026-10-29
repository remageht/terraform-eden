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

    // Unlocked achievements
    this.achievements = {};

    // Dynamic stats
    this.clickPower = 1;
    this.critChance = 0.0;
    this.critMultiplier = 5;
    this.passivePerSec = 0;
    this.globalMultiplier = 1.0;

    // Active status effects (PvP attacks, Co-op sync buffs)
    this.effects = {
      sandstormTimer: 0,
      droughtClicksNeeded: 0,
      syncComboTimer: 0,
      syncComboMult: 1.0
    };

    // Current stage
    this.currentStageIndex = 0;
    this.habitability = 0.0;

    this.recalculateStats();
  }

  // Calculate costs and power
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
    this.passivePerSec = basePassive * this.globalMultiplier;
    this.clickPower = (baseClick + (basePassive * clickSynergy)) * this.globalMultiplier;
    this.critChance = Math.min(0.75, critChance);

    // Compute habitability (0.0 to 1.0)
    this.habitability = Math.min(1.0, this.totalEnergyEarned / CONFIG.TARGET_TERRAFORM_ENERGY);

    // Compute current visual stage
    let stageIdx = 0;
    for (let i = 0; i < CONFIG.STAGES.length; i++) {
      if (this.totalEnergyEarned >= CONFIG.STAGES[i].threshold) {
        stageIdx = i;
      }
    }
    const stageChanged = stageIdx !== this.currentStageIndex;
    this.currentStageIndex = stageIdx;

    return { stageChanged, newStage: CONFIG.STAGES[stageIdx] };
  }

  // Perform click action
  click() {
    this.clicks++;

    // Check if drought is active
    if (this.effects.droughtClicksNeeded > 0) {
      this.effects.droughtClicksNeeded--;
      return {
        gained: 0,
        isCrit: false,
        isDroughtClearing: true,
        remainingDrought: this.effects.droughtClicksNeeded
      };
    }

    // Roll for critical strike
    const isCrit = Math.random() < this.critChance;
    let gained = this.clickPower * (isCrit ? this.critMultiplier : 1.0);

    // Apply co-op sync combo multiplier if active
    if (this.effects.syncComboTimer > 0) {
      gained *= this.effects.syncComboMult;
    }

    // Apply sandstorm debuff
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

    // Passive energy income
    let passiveGain = this.passivePerSec * dt;

    // Drought blocks passive income completely
    if (this.effects.droughtClicksNeeded > 0) {
      passiveGain = 0;
    }

    // Sandstorm cuts passive income by 70%
    if (this.effects.sandstormTimer > 0) {
      passiveGain *= 0.3;
    }

    // Co-op sync boost
    if (this.effects.syncComboTimer > 0) {
      passiveGain *= this.effects.syncComboMult;
    }

    this.energy += passiveGain;
    this.totalEnergyEarned += passiveGain;

    const { stageChanged, newStage } = this.recalculateStats();
    return { passiveGain, stageChanged, newStage };
  }

  // Apply PvP attack effects
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

  // Trigger Co-op sync combo
  triggerSyncCombo(duration = 6, multiplier = 3.0) {
    this.effects.syncComboTimer = duration;
    this.effects.syncComboMult = multiplier;
  }

  // Prestige / Cosmic Ascension
  canPrestige() {
    return this.totalEnergyEarned >= CONFIG.TARGET_TERRAFORM_ENERGY;
  }

  prestige() {
    if (!this.canPrestige()) return false;
    this.prestigeCount++;
    this.stardustMultiplier += 0.25; // +25% permanent multiplier per ascension

    // Reset current run
    this.energy = 0;
    this.totalEnergyEarned = 0;
    for (const u of CONFIG.UPGRADES) {
      this.upgrades[u.id] = 0;
    }
    this.effects = {
      sandstormTimer: 0,
      droughtClicksNeeded: 0,
      syncComboTimer: 0,
      syncComboMult: 1.0
    };
    this.recalculateStats();
    this.save();
    return true;
  }

  // Check achievements
  checkAchievements() {
    const newlyUnlocked = [];
    for (const ach of CONFIG.ACHIEVEMENTS) {
      if (this.achievements[ach.id]) continue;

      let unlocked = false;
      if (ach.id === "first_click" && this.clicks >= 1) unlocked = true;
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

  // Save to localStorage
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
        lastSaveTime: Date.now()
      };
      localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Save failed", e);
    }
  }

  // Load from localStorage & calculate offline gains
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

      this.recalculateStats();

      // Offline gains (up to 8 hours max)
      let offlineGain = 0;
      if (data.lastSaveTime) {
        const offlineSeconds = Math.min(8 * 3600, Math.floor((Date.now() - data.lastSaveTime) / 1000));
        if (offlineSeconds > 5 && this.passivePerSec > 0) {
          offlineGain = Math.round(offlineSeconds * this.passivePerSec * 0.7); // 70% offline efficiency
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
