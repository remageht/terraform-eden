// Game Balance and Content Configuration
export const CONFIG = {
  GAME_TITLE: "Terraform: Genesis of Eden",
  TARGET_TERRAFORM_ENERGY: 1000000, // 100% Habitability milestone for standard run
  SAVE_KEY: "terraform_eden_save_v1",
  AUTOSAVE_INTERVAL_MS: 5000,
  TICK_RATE_MS: 50, // 20 updates per second
  COMET_INTERVAL_SEC: 35, // Lucky Comet spawns every ~35 seconds
  ANOMALY_INTERVAL_SEC: 45, // Planet Anomaly spawns every ~45 seconds

  // Storyline & Expedition Logs (AI E.D.E.N. Protocol)
  STAGES: [
    {
      threshold: 0,
      name: "Безжизненная Пустошь",
      icon: "🌑",
      description: "Серые безмолвные скалы и холодные космические ветра.",
      logTitle: "ГЛАВА 1: Пробуждение зонда",
      logDate: "СОЛ 001 // ТЕМП: -72°C",
      logText: "Бортовой ИИ 'ЭДЕМ' активирован на орбите планеты Кеплер-452. Сенсоры фиксируют абсолютную тишину. Почва мертва, атмосфера разрежена. Начните ручную генерацию тепла и первых искр жизни."
    },
    {
      threshold: 2500,
      name: "Первое Дыхание",
      icon: "💨",
      description: "Появление плотной атмосферы, конденсация влаги, легкий туман.",
      logTitle: "ГЛАВА 2: Атмосферный барьер",
      logDate: "СОЛ 048 // КИСЛОРОД: 4.2%",
      logText: "Термодинамический цикл запущен! Озоновый щит начинает сдерживать космическую радиацию. Над бескрайними каньонами сгущаются первые перистые облака. Планета делает свой первый вдох."
    },
    {
      threshold: 20000,
      name: "Пробуждение Воды",
      icon: "💧",
      description: "Первые дожди собираются в горные ручьи и лазурные озера.",
      logTitle: "ГЛАВА 3: Великий Дождь",
      logDate: "СОЛ 112 // ВЛАЖНОСТЬ: 68%",
      logText: "Водяной пар сконденсировался в миллионы дождевых капель! Впервые за миллиард лет по склонам древних скал зажурчали кристальные ручьи, наполняя лазурные чаши горных озер."
    },
    {
      threshold: 100000,
      name: "Зеленый Оазис",
      icon: "🌱",
      description: "Склоны покрываются изумрудным мхом, полевыми цветами и кустарниками.",
      logTitle: "ГЛАВА 4: Зеленая Волна",
      logDate: "СОЛ 230 // БИОМАССА: 12.8 Мт",
      logText: "Органический синтез превзошел расчеты! Склоны холмов укутаны ковром из бархатного мха и ярких полевых цветов. В ночной тишине замерцали первые огоньки светлячков."
    },
    {
      threshold: 350000,
      name: "Великий Лес",
      icon: "🌲",
      description: "Высокие кроны деревьев, порхающие птицы и чистейший воздух.",
      logTitle: "ГЛАВА 5: Пульс Жизни",
      logDate: "СОЛ 410 // БИОСФЕРА СТАБИЛЬНА",
      logText: "Кроны вековых сосен и дубов поднимаются к облакам. В утреннем небе слышны крики парящих птиц. Планета обрела собственный биогенный пульс и гармоничную смену сезонов."
    },
    {
      threshold: 1000000,
      name: "Цветущий Эдем",
      icon: "✨",
      description: "Полная гармония биосферы, сияющие авроры и райская природа.",
      logTitle: "ФИНАЛ: Райский Сад",
      logDate: "СОЛ 777 // ЭДЕМ ДОСТИГНУТ",
      logText: "МИССИЯ ВЫПОЛНЕНА. Ночное небо озарено изумрудными всполохами Северного Сияния. Некогда мертвая скала стала колыбелью райской жизни. Открыт протокол 'Космическое Вознесение'!"
    }
  ],

  // Upgrade definitions categorized by spheres of nature
  UPGRADES: [
    // 1. Атмосфера
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
      power: 0.05
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

    // 2. Гидросфера
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

    // 3. Биосфера
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

    // 4. Гармония
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
    },

    // 5. Генетические Мутации (Новые глубокие перки!)
    {
      id: "mut_chloroplast",
      name: "Гипер-хлоропласты",
      category: "mutations",
      icon: "🧬",
      desc: "Клик по небу дает удвоенную энергию (+100% в небесной зоне)",
      baseCost: 300,
      costMult: 1.8,
      type: "zone_sky",
      power: 1.0
    },
    {
      id: "mut_aquifer",
      name: "Артезианский горизонт",
      category: "mutations",
      icon: "💧",
      desc: "Клик по озеру или реке дает утроенную силу влаги (+200% в зоне воды)",
      baseCost: 1500,
      costMult: 2.0,
      type: "zone_water",
      power: 2.0
    },
    {
      id: "mut_mycelium",
      name: "Планетарный мицелий",
      category: "mutations",
      icon: "🍄",
      desc: "Автоматически кликает по миру 1 раз каждые 2 секунды",
      baseCost: 6000,
      costMult: 2.2,
      type: "autoclicker",
      power: 0.5 // clicks per sec
    },
    {
      id: "mut_magnetosphere",
      name: "Магнитная ловушка",
      category: "mutations",
      icon: "🧲",
      desc: "Золотые кометы пролетают на 40% медленнее и дают удвоенную награду",
      baseCost: 25000,
      costMult: 2.5,
      type: "comet_boost",
      power: 1.0
    }
  ],

  // Planetary Random Anomalies (Tactical mini-events with choices!)
  ANOMALIES: [
    {
      id: "geothermal_vent",
      name: "Геотермальный Гейзер",
      icon: "🌋",
      desc: "Из расщелины вырывается мощный столб минерализованного пара!",
      choices: [
        { label: "Собрать конденсат (+40 сек пассивного дохода)", action: "income_burst", multiplier: 40 },
        { label: "Усилить давление (Пассивный доход x2 на 15 сек)", action: "buff_temp", type: "passive", mult: 2.0, time: 15 }
      ]
    },
    {
      id: "ancient_monolith",
      name: "Древний Монолит",
      icon: "🗿",
      desc: "На склоне скалы обнаружена инопланетная структура из неизвестного сплава.",
      choices: [
        { label: "Активировать резонанс (Сила клика x4 на 20 сек)", action: "buff_temp", type: "click", mult: 4.0, time: 20 },
        { label: "Поглотить энергию (+1,200 💧 мгновенно)", action: "instant_energy", amount: 1200 }
      ]
    },
    {
      id: "crystal_cluster",
      name: "Жила Кристаллов Времени",
      icon: "💎",
      desc: "Мерцающие кристаллы преломляют пространственно-временной континуум.",
      choices: [
        { label: "Временной скачок (Мгновенно промотать 60 сек времени)", action: "time_warp", seconds: 60 },
        { label: "Зарядить биосферу (+20% к текущей энергии)", action: "percent_energy", percent: 0.2 }
      ]
    }
  ],

  // PvP Cataclysms
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
    { id: "comet_caught", name: "Ловец Звезд", desc: "Поймайте пролетающую Золотую Комету.", icon: "🌠" },
    { id: "anomaly_explored", name: "Исследователь Неизведанного", desc: "Изучите планетарную аномалию.", icon: "🔍" },
    { id: "clicks_100", name: "Неутомимый Создатель", desc: "Сделайте 100 кликов по миру.", icon: "👆" },
    { id: "energy_1k", name: "Пробуждение Почвы", desc: "Накопите 1,000 Энергии Жизни.", icon: "🌱" },
    { id: "energy_50k", name: "Цветущий Край", desc: "Накопите 50,000 Энергии Жизни.", icon: "🌸" },
    { id: "energy_1m", name: "Райский Сад", desc: "Достигните 100% терраформирования (1,000,000).", icon: "👑" },
    { id: "multiplayer_played", name: "Узы Миров", desc: "Сыграйте хотя бы одну партию в мультиплеере.", icon: "🌐" }
  ]
};
