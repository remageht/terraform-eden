// Game Balance and Content Configuration
export const CONFIG = {
  GAME_TITLE: "Terraform: Genesis of Eden",
  TARGET_TERRAFORM_ENERGY: 1000000, // 100% Habitability milestone for standard run
  SAVE_KEY: "terraform_eden_save_v1",
  AUTOSAVE_INTERVAL_MS: 5000,
  TICK_RATE_MS: 50, // 20 updates per second

  // Stages of Terraforming that transform the visual landscape
  STAGES: [
    { threshold: 0, name: "Безжизненная Пустошь", icon: "🌑", description: "Серые безмолвные скалы и холодные космические ветра." },
    { threshold: 2500, name: "Первое Дыхание", icon: "💨", description: "Появление плотной атмосферы, конденсация влаги, легкий туман." },
    { threshold: 20000, name: "Пробуждение Воды", icon: "💧", description: "Первые дожди собираются в горные ручьи и лазурные озера." },
    { threshold: 100000, name: "Зеленый Оазис", icon: "🌱", description: "Склоны покрываются изумрудным мхом, полевыми цветами и кустарниками." },
    { threshold: 350000, name: "Великий Лес", icon: "🌲", description: "Высокие кроны деревьев, порхающие птицы и чистейший воздух." },
    { threshold: 1000000, name: "Цветущий Эдем", icon: "✨", description: "Полная гармония биосферы, сияющие авроры и райская природа." }
  ],

  // Upgrade definitions categorized by spheres of nature
  UPGRADES: [
    // 1. Атмосфера (Клики и активные бусты)
    {
      id: "solar_rays",
      name: "Солнечные лучи",
      category: "atmosphere",
      icon: "☀️",
      desc: "Увеличивает силу каждого клика на +1",
      baseCost: 15,
      costMult: 1.15,
      type: "click",
      power: 1
    },
    {
      id: "gentle_breeze",
      name: "Теплый бриз",
      category: "atmosphere",
      icon: "🍃",
      desc: "Увеличивает силу клика на +5",
      baseCost: 120,
      costMult: 1.18,
      type: "click",
      power: 5
    },
    {
      id: "ozone_layer",
      name: "Озоновый щит",
      category: "atmosphere",
      icon: "🛡️",
      desc: "Дает шанс критического клика с множителем x5",
      baseCost: 800,
      costMult: 1.25,
      type: "crit_chance",
      power: 0.05 // +5% крит
    },
    {
      id: "photosynthesis",
      name: "Квантовый фотосинтез",
      category: "atmosphere",
      icon: "⚡",
      desc: "Увеличивает силу клика на 1% от текущего пассивного дохода",
      baseCost: 5000,
      costMult: 1.35,
      type: "click_synergy",
      power: 0.01
    },

    // 2. Гидросфера (Пассивный приток воды и энергии)
    {
      id: "dew_drops",
      name: "Утренняя роса",
      category: "hydrosphere",
      icon: "💧",
      desc: "Конденсирует влагу. +1 энергии в секунду",
      baseCost: 20,
      costMult: 1.14,
      type: "passive",
      power: 1
    },
    {
      id: "spring_streams",
      name: "Горные ручьи",
      category: "hydrosphere",
      icon: "🌊",
      desc: "Журчащие потоки питают почву. +6 энергии в сек",
      baseCost: 150,
      costMult: 1.16,
      type: "passive",
      power: 6
    },
    {
      id: "azure_lakes",
      name: "Лазурные озера",
      category: "hydrosphere",
      icon: "🏞️",
      desc: "Резервуары жизни. +35 энергии в сек",
      baseCost: 1100,
      costMult: 1.18,
      type: "passive",
      power: 35
    },
    {
      id: "ocean_currents",
      name: "Глубинные течения",
      category: "hydrosphere",
      icon: "🌀",
      desc: "Глобальная циркуляция тепла. +200 энергии в сек",
      baseCost: 7500,
      costMult: 1.22,
      type: "passive",
      power: 200
    },

    // 3. Биосфера (Флора, фауна и автоматизация)
    {
      id: "moss_blanket",
      name: "Изумрудный мох",
      category: "biosphere",
      icon: "🌱",
      desc: "Смягчает каменистую породу. +2 энергии в сек",
      baseCost: 50,
      costMult: 1.15,
      type: "passive",
      power: 2
    },
    {
      id: "wildflowers",
      name: "Полевые цветы",
      category: "biosphere",
      icon: "🌸",
      desc: "Привлекают пыльцу и жизнь. +15 энергии в сек",
      baseCost: 350,
      costMult: 1.17,
      type: "passive",
      power: 15
    },
    {
      id: "ancient_grove",
      name: "Древняя роща",
      category: "biosphere",
      icon: "🌲",
      desc: "Могучие сосны и дубы. +120 энергии в сек",
      baseCost: 3200,
      costMult: 1.2,
      type: "passive",
      power: 120
    },
    {
      id: "spirit_fauna",
      name: "Лесные духи и птицы",
      category: "biosphere",
      icon: "🦌",
      desc: "Жизнь наполняет каждый уголок. +650 энергии в сек",
      baseCost: 22000,
      costMult: 1.25,
      type: "passive",
      power: 650
    },

    // 4. Гармония (Глобальные множители и магия природы)
    {
      id: "solar_bloom",
      name: "Солнечный расцвет",
      category: "harmony",
      icon: "🌻",
      desc: "Все доходы увеличиваются на +10%",
      baseCost: 12000,
      costMult: 1.5,
      type: "multiplier",
      power: 0.10
    },
    {
      id: "aurora_resonance",
      name: "Резонанс Авроры",
      category: "harmony",
      icon: "🌌",
      desc: "Все доходы увеличиваются на +25%",
      baseCost: 80000,
      costMult: 1.6,
      type: "multiplier",
      power: 0.25
    }
  ],

  // PvP Cataclysms (Sabotage abilities against opponents)
  CATACLYSMS: [
    {
      id: "sandstorm",
      name: "Песчаная буря",
      icon: "🌪️",
      cost: 400,
      durationSec: 8,
      desc: "Накрывает экран противника песком и снижает его доход на 70% на 8 сек."
    },
    {
      id: "drought",
      name: "Великая засуха",
      icon: "☀️",
      cost: 1200,
      requiredClicks: 8,
      desc: "Блокирует доход противника, пока тот не кликнет 8 раз для полива!"
    },
    {
      id: "meteor",
      name: "Метеоритный дождь",
      icon: "☄️",
      cost: 3000,
      defenseTimeSec: 4,
      stealPercent: 0.12,
      desc: "Запускает пылающий метеорит! Если противник не собьет его за 4 сек, он теряет 12% очков."
    }
  ],

  // Achievements
  ACHIEVEMENTS: [
    { id: "first_click", name: "Первая Искра", desc: "Сделайте свой самый первый клик.", icon: "✨" },
    { id: "clicks_100", name: "Неутомимый Создатель", desc: "Сделайте 100 кликов по миру.", icon: "👆" },
    { id: "energy_1k", name: "Пробуждение Почвы", desc: "Накопите 1,000 Энергии Жизни.", icon: "🌱" },
    { id: "energy_50k", name: "Цветущий Край", desc: "Накопите 50,000 Энергии Жизни.", icon: "🌸" },
    { id: "energy_1m", name: "Райский Сад", desc: "Достигните 100% терраформирования (1,000,000).", icon: "👑" },
    { id: "multiplayer_played", name: "Узы Миров", desc: "Сыграйте хотя бы одну партию в мультиплеере.", icon: "🌐" }
  ]
};
