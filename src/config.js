// Game Balance, Evolution Tree, Prestige and Content Configuration
export const CONFIG = {
  GAME_TITLE: "Terraform: Genesis of Eden",
  SAVE_KEY: "terraform_eden_save_v2",
  AUTOSAVE_INTERVAL_MS: 5000,
  TICK_RATE_MS: 50,
  COMET_INTERVAL_SEC: 35,
  ANOMALY_INTERVAL_SEC: 45,

  // 🧬 Линейка Эволюции Жизни (от ДНК до Человека и Космического Сверхразума)
  // В духе 'Cell to Singularity' и 'Evolution: Life Simulator'
  EVOLUTION_STAGES: [
    {
      id: "primordial_soup",
      threshold: 0,
      name: "Первичный Бульон & ДНК",
      organism: "Самореплицирующаяся молекула РНК",
      icon: "🧬",
      visualEntity: "dna_particles",
      description: "Химический хаос в горячих геотермальных источниках порождает первые цепочки органических полимеров.",
      storyText: "В глубинах кипящих кремниевых разломов молекулы углерода, азота и фосфора объединяются. Случайный термический всплеск замыкает связь: впервые в истории этой планеты материя научилась хранить и копировать информацию. Родилась ДНК."
    },
    {
      id: "prokaryotes",
      threshold: 1200,
      name: "Прокариоты & Первые Клетки",
      organism: "Бактерии и археи",
      icon: "🦠",
      visualEntity: "bacteria",
      description: "Формирование липидных мембран. Микроскопическая жизнь захватывает океаническое дно.",
      storyText: "Оболочка из жиров защитила хрупкий генетический код от внешней среды. Одноклеточные археи заселяют глубоководные термальные жерла. Они дышат серой и железом, запуская великий биохимический конвейер."
    },
    {
      id: "algae_photosynthesis",
      threshold: 8000,
      name: "Цианобактерии & Водоросли",
      organism: "Зеленые микроводоросли",
      icon: "🌿",
      visualEntity: "algae_swarms",
      description: "Великая Кислородная Революция. Водоросли улавливают кванты звездного света.",
      storyText: "Клетки научились питаться чистым светом звезды! Хлорофилл расщепляет воду, высвобождая реактивный газ — кислород. Океаны зеленеют, а атмосфера очищается от метановой дымки. Небо становится пронзительно голубым."
    },
    {
      id: "primitive_fish",
      threshold: 45000,
      name: "Древние Рыбы & Морская Фауна",
      organism: "Панцирные рыбы (Плакодермы)",
      icon: "🐟",
      visualEntity: "jumping_fish",
      description: "Многоклеточные организмы развивают глаза, жабры, чешую и мускулатуру.",
      storyText: "Эволюционный взрыв в теплых лагунах! Появились первые челюсти, скелет и зрение. Огромные косяки древних рыб бороздят лазурную гладь, а трилобиты исследуют песчаное дно. Океан стал колыбелью сложного поведения."
    },
    {
      id: "tetrapods_land",
      threshold: 180000,
      name: "Выход на Сушу (Тетраподы)",
      organism: "Ихтиостега и древние амфибии",
      icon: "🦎",
      visualEntity: "walking_tetrapod",
      description: "Плавники трансформируются в лапы. Первые позвоночные вступают на влажную землю.",
      storyText: "Плавники обрели костные суставы. Первое четвероногое существо сделало осторожный вдох атмосферным воздухом и выползло на мягкий моховой берег. Суша покорена: над землей звучат первые шаги позвоночных."
    },
    {
      id: "dinosaurs_era",
      threshold: 600000,
      name: "Эпоха Динозавров & Млекопитающие",
      organism: "Тираннозавры и первые прото-грызуны",
      icon: "🦖",
      visualEntity: "grazing_dinosaur",
      description: "Гигантские ящеры правят континентами. Под корнями деревьев зарождается теплокровность.",
      storyText: "Золотой век жизни! Земля сотрясается под поступью титанических зауроподов, а в кронах гигантских папоротников охотятся хищники. Но в тени великанов зарождается нечто более адаптивное — теплокровные зверьки с чутким слухом и заботой о потомстве."
    },
    {
      id: "human_dawn",
      threshold: 2000000,
      name: "Рассвет Человека (Homo Sapiens)",
      organism: "Первобытное племя охотников и собирателей",
      icon: "🚶‍♂️",
      visualEntity: "human_camp",
      description: "Появление речи, кремниевых орудий, искусства и укрощение первородного огня.",
      storyText: "Искра разума озарила вселенную. Человек взял в руки обожженный кремень и высек огонь. Пещеры наполнились наскальными рисунками, а в ночном небе люди впервые увидели созвездия и задались вопросом: 'Кто мы и зачем мы здесь?'."
    },
    {
      id: "singularity_age",
      threshold: 10000000,
      name: "Космическая Сингулярность",
      organism: "Межзвездный Кибер-Сверхразум",
      icon: "🌌",
      visualEntity: "cyber_monolith",
      description: "Слияние биологии, квантового ИИ и нанотехнологий. Цивилизация строит Сферу Дайсона.",
      storyText: "Человечество преодолело оковы планеты. Биология слилась с квантовыми кристаллами, породив планетарный Сверхразум. Планета стала узлом галактической сети сознания, готовой засевать жизнью другие миры."
    }
  ],

  // 🌀 Древо Реальности / Мета-Престиж (The Reality Engine)
  // Постоянные таланты, которые покупаются за ⭐ Звездную Пыль (Stardust) и сохраняются ВСЕГДА!
  PRESTIGE_TALENTS: [
    {
      id: "cosmic_spark",
      name: "Искры Сингулярности",
      icon: "✨",
      desc: "+30% к генерации всей энергии за каждый уровень",
      baseCost: 1,
      costMult: 2.0,
      maxLevel: 10,
      effect: (lvl) => 1.0 + lvl * 0.3
    },
    {
      id: "primordial_cache",
      name: "Генетическая Память",
      icon: "🧬",
      desc: "Стартовать каждое перерождение сразу с запасом энергии (+1,000 за ур.)",
      baseCost: 2,
      costMult: 2.5,
      maxLevel: 5,
      effect: (lvl) => lvl * 1000
    },
    {
      id: "temporal_rift",
      name: "Временной Разлом",
      icon: "⏳",
      desc: "Оффлайн-доход работает с 100% эффективностью (вместо 70%) и до 24 часов",
      baseCost: 3,
      costMult: 3.0,
      maxLevel: 3,
      effect: (lvl) => 0.7 + lvl * 0.1
    },
    {
      id: "comet_harvester",
      name: "Звездный Магнит",
      icon: "🌠",
      desc: "Золотые кометы появляются в 2 раза чаще и дают x3 награды",
      baseCost: 5,
      costMult: 3.5,
      maxLevel: 3,
      effect: (lvl) => lvl
    },
    {
      id: "ascended_mind",
      name: "Космическое Око",
      icon: "👁️",
      desc: "Шанс критического клика увеличен на +15%, крит множитель x10",
      baseCost: 8,
      costMult: 4.0,
      maxLevel: 3,
      effect: (lvl) => lvl * 0.05
    }
  ],

  // Upgrade definitions categorized by spheres of nature
  UPGRADES: [
    // 1. Атмосфера & Излучение
    {
      id: "solar_rays",
      name: "Звездная ионизация",
      category: "atmosphere",
      icon: "✨",
      desc: "Увеличивает силу каждого клика на +1",
      baseCost: 15,
      costMult: 1.15,
      type: "click",
      power: 1
    },
    {
      id: "gentle_breeze",
      name: "Солнечный ветер",
      category: "atmosphere",
      icon: "🌠",
      desc: "Увеличивает силу клика на +5",
      baseCost: 120,
      costMult: 1.18,
      type: "click",
      power: 5
    },
    {
      id: "ozone_layer",
      name: "Магнитный дефлектор",
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

    // 2. Гидросфера & Энергопотоки
    {
      id: "dew_drops",
      name: "Квантовая роса",
      category: "hydrosphere",
      icon: "🧪",
      desc: "Синтезирует первичные био-мономеры. +1 энергии в секунду",
      baseCost: 20,
      costMult: 1.14,
      type: "passive",
      power: 1
    },
    {
      id: "spring_streams",
      name: "Потоки плазмы",
      category: "hydrosphere",
      icon: "🌊",
      desc: "Энергетические артерии планеты. +6 энергии в сек",
      baseCost: 150,
      costMult: 1.16,
      type: "passive",
      power: 6
    },
    {
      id: "azure_lakes",
      name: "Био-резервуары",
      category: "hydrosphere",
      icon: "💠",
      desc: "Колыбели сложных макромолекул. +35 энергии в сек",
      baseCost: 1100,
      costMult: 1.18,
      type: "passive",
      power: 35
    },
    {
      id: "ocean_currents",
      name: "Планетарные леилинии",
      category: "hydrosphere",
      icon: "🌀",
      desc: "Глобальная энергосеть материков. +200 энергии в сек",
      baseCost: 7500,
      costMult: 1.22,
      type: "passive",
      power: 200
    },

    // 3. Биосфера & Нейросети
    {
      id: "moss_blanket",
      name: "Био-мицелий",
      category: "biosphere",
      icon: "🌱",
      desc: "Первичная полимерная сеть. +2 энергии в сек",
      baseCost: 50,
      costMult: 1.15,
      type: "passive",
      power: 2
    },
    {
      id: "wildflowers",
      name: "Кристаллические сады",
      category: "biosphere",
      icon: "🌸",
      desc: "Генерируют резонансную био-пыльцу. +15 энергии в сек",
      baseCost: 350,
      costMult: 1.17,
      type: "passive",
      power: 15
    },
    {
      id: "ancient_grove",
      name: "Силиконовые рощи",
      category: "biosphere",
      icon: "🌲",
      desc: "Живые антенны биосферы. +120 энергии в сек",
      baseCost: 3200,
      costMult: 1.2,
      type: "passive",
      power: 120
    },
    {
      id: "spirit_fauna",
      name: "Кибер-фауна и прото-сознания",
      category: "biosphere",
      icon: "🦌",
      desc: "Разумные био-сущности. +650 энергии в сек",
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

    // 5. Генетические Мутации
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
      name: "Крио-резервуар",
      category: "mutations",
      icon: "💎",
      desc: "Клик по океану дает утроенную силу эссенции (+200% в зоне воды)",
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
      power: 0.5
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

  // Planetary Random Anomalies
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
        { label: "Поглотить энергию (+1,200 🧬 мгновенно)", action: "instant_energy", amount: 1200 }
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
    { id: "evolution_fish", name: "Жизнь в Глубинах", desc: "Эволюционируйте до морских рыб.", icon: "🐟" },
    { id: "evolution_human", name: "Венец Эволюции", desc: "Приведите цивилизацию к эпохе Человека Разумного.", icon: "🚶‍♂️" },
    { id: "evolution_singularity", name: "Космический Разум", desc: "Достигните эры Сингулярности.", icon: "🌌" },
    { id: "first_prestige", name: "Перерождение Вселенной", desc: "Совершите свое первое Вознесение Реальности.", icon: "⭐" },
    { id: "multiplayer_played", name: "Узы Миров", desc: "Сыграйте хотя бы одну партию в мультиплеере.", icon: "🌐" }
  ]
};
