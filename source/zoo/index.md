---
title: 🦁 互动动物园
type: custom
comment: false
aside: false
---

<style>
  /* ===== 页面整体布局 ===== */
  .zoo-page {
    position: relative;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    user-select: none;
  }

  .zoo-header {
    text-align: center;
    margin-bottom: 20px;
  }
  .zoo-header h2 {
    font-size: 2em;
    margin: 0 0 6px 0;
    background: linear-gradient(135deg, #f6d365, #fda085, #a18cd1);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .zoo-header p {
    color: #888;
    font-size: 0.95em;
    margin: 0;
  }

  /* ===== 工具栏 ===== */
  .zoo-toolbar {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin-bottom: 16px;
  }
  .zoo-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border: none;
    border-radius: 30px;
    font-size: 1em;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 3px 10px rgba(0,0,0,0.08);
    background: linear-gradient(135deg, #fdfcfb, #e2d1c3);
    color: #555;
  }
  .zoo-btn:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 6px 20px rgba(0,0,0,0.12);
  }
  .zoo-btn:active {
    transform: scale(0.96);
  }
  .zoo-btn.danger {
    background: linear-gradient(135deg, #ff9a9e, #fad0c4);
    color: #a33;
  }
  .zoo-btn.food-btn {
    background: linear-gradient(135deg, #a1c4fd, #c2e9fb);
    color: #336;
  }
  .zoo-btn.weather-btn {
    background: linear-gradient(135deg, #d4fc79, #96e6a1);
    color: #353;
  }

  /* ===== 动物选择面板 ===== */
  .zoo-animal-picker {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-bottom: 16px;
    padding: 14px;
    background: rgba(255,255,255,0.6);
    border-radius: 16px;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.4);
    box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  }
  html.dark .zoo-animal-picker {
    background: rgba(30,30,40,0.6);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .animal-pick-btn {
    font-size: 2em;
    padding: 6px 10px;
    border: 2px solid transparent;
    border-radius: 14px;
    background: rgba(255,255,255,0.5);
    cursor: pointer;
    transition: all 0.25s ease;
    line-height: 1.2;
  }
  .animal-pick-btn:hover {
    border-color: #fda085;
    transform: scale(1.2);
    background: rgba(253,160,133,0.15);
  }
  .animal-pick-btn:active {
    transform: scale(0.9);
  }
  html.dark .animal-pick-btn {
    background: rgba(60,60,80,0.5);
  }

  /* ===== 动物园场地 ===== */
  .zoo-field {
    position: relative;
    width: 100%;
    height: 520px;
    border-radius: 20px;
    overflow: hidden;
    cursor: crosshair;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    transition: background 1.5s ease;
  }
  .zoo-field.day {
    background:
      radial-gradient(ellipse at 30% 90%, rgba(144,238,144,0.4), transparent 50%),
      radial-gradient(ellipse at 70% 85%, rgba(255,255,200,0.3), transparent 40%),
      linear-gradient(180deg, #87ceeb 0%, #e0f7e0 60%, #8fbc8f 80%, #6b8e4e 100%);
  }
  .zoo-field.night {
    background:
      radial-gradient(ellipse at 50% 10%, rgba(200,200,255,0.15), transparent 60%),
      linear-gradient(180deg, #0b1026 0%, #1a1a3e 40%, #1e3a2f 75%, #2d4a2e 100%);
  }

  /* 场地装饰 */
  .zoo-ground-line {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 30%;
    pointer-events: none;
    border-top: 2px dashed rgba(255,255,255,0.15);
  }

  /* ===== 动物实体 ===== */
  .zoo-animal {
    position: absolute;
    font-size: 42px;
    transition: font-size 0.3s;
    cursor: grab;
    z-index: 10;
    filter: drop-shadow(0 3px 6px rgba(0,0,0,0.15));
  }
  .zoo-animal:hover {
    z-index: 100;
    filter: drop-shadow(0 6px 12px rgba(0,0,0,0.25));
  }
  .zoo-animal .animal-body {
    display: inline-block;
    transform-origin: bottom center;
  }
  .zoo-animal .animal-body.walk {
    animation: zooWalk 0.4s ease-in-out infinite alternate;
  }
  .zoo-animal .animal-body.run {
    animation: zooRun 0.22s ease-in-out infinite alternate;
  }
  .zoo-animal .animal-body.idle {
    animation: zooIdle 1.8s ease-in-out infinite alternate;
  }
  .zoo-animal .animal-body.eat {
    animation: zooEat 0.35s ease-in-out infinite;
  }
  .zoo-animal .animal-body.sleep {
    animation: zooSleep 2s ease-in-out infinite alternate;
    opacity: 0.7;
  }
  .zoo-animal .animal-body.play {
    animation: zooPlay 0.3s ease-in-out infinite alternate;
  }

  @keyframes zooWalk {
    0% { transform: translateY(0) rotate(-5deg); }
    100% { transform: translateY(-6px) rotate(5deg); }
  }
  @keyframes zooRun {
    0% { transform: translateY(0) scaleY(0.85) scaleX(1.08) rotate(-10deg); }
    100% { transform: translateY(-12px) scaleY(1.1) scaleX(0.92) rotate(10deg); }
  }
  @keyframes zooIdle {
    0% { transform: scaleY(1) translateY(0); }
    100% { transform: scaleY(0.96) translateY(1px); }
  }
  @keyframes zooEat {
    0%   { transform: rotate(0deg) translateY(0); }
    25%  { transform: rotate(10deg) translateY(4px); }
    50%  { transform: rotate(0deg) translateY(0); }
    75%  { transform: rotate(-8deg) translateY(4px); }
    100% { transform: rotate(0deg) translateY(0); }
  }
  @keyframes zooSleep {
    0% { transform: scaleY(1) rotate(-2deg); }
    100% { transform: scaleY(0.92) rotate(2deg); }
  }
  @keyframes zooPlay {
    0% { transform: rotate(-15deg) translateY(0); }
    100% { transform: rotate(15deg) translateY(-14px); }
  }

  /* ===== 浮动特效 ===== */
  .float-effect {
    position: absolute;
    pointer-events: none;
    font-size: 22px;
    z-index: 200;
    animation: floatUp 1.2s ease-out forwards;
  }
  @keyframes floatUp {
    0% { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(-50px) scale(1.4); }
  }

  /* 食物 */
  .zoo-food {
    position: absolute;
    font-size: 28px;
    z-index: 5;
    animation: foodDrop 0.4s ease-out;
    pointer-events: none;
  }
  @keyframes foodDrop {
    0% { transform: translateY(-30px) scale(0.5); opacity: 0; }
    100% { transform: translateY(0) scale(1); opacity: 1; }
  }
  .zoo-food.eaten {
    animation: foodEaten 0.3s ease-in forwards;
  }
  @keyframes foodEaten {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(0); opacity: 0; }
  }

  /* ===== 状态信息栏 ===== */
  .zoo-stats {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 16px;
    margin-top: 16px;
    font-size: 0.95em;
    color: #777;
  }
  .zoo-stats span {
    padding: 6px 14px;
    background: rgba(255,255,255,0.5);
    border-radius: 20px;
    backdrop-filter: blur(6px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  html.dark .zoo-stats span {
    background: rgba(40,40,55,0.5);
    color: #aaa;
  }

  /* ===== 天气系统 ===== */
  .weather-particle {
    position: absolute;
    pointer-events: none;
    z-index: 150;
  }
  .rain-drop {
    width: 2px;
    height: 14px;
    background: linear-gradient(transparent, rgba(100,150,255,0.6));
    border-radius: 0 0 2px 2px;
    animation: rainFall linear infinite;
  }
  @keyframes rainFall {
    0% { transform: translateY(-20px); opacity: 1; }
    100% { transform: translateY(520px); opacity: 0.3; }
  }
  .snow-flake {
    width: 6px; height: 6px;
    background: rgba(255,255,255,0.9);
    border-radius: 50%;
    animation: snowFall linear infinite;
  }
  @keyframes snowFall {
    0% { transform: translateY(-10px) translateX(0); opacity: 1; }
    50% { transform: translateY(260px) translateX(20px); }
    100% { transform: translateY(520px) translateX(-10px); opacity: 0.4; }
  }

  /* ===== 提示气泡 ===== */
  .zoo-tooltip {
    position: absolute;
    background: rgba(0,0,0,0.7);
    color: #fff;
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 13px;
    pointer-events: none;
    z-index: 300;
    white-space: nowrap;
    animation: tooltipIn 0.3s ease-out;
  }
  @keyframes tooltipIn {
    0% { opacity: 0; transform: translateY(6px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  /* 响应式 */
  @media (max-width: 640px) {
    .zoo-field { height: 380px; }
    .zoo-animal { font-size: 32px; }
    .animal-pick-btn { font-size: 1.5em; }
  }
</style>

<div class="zoo-page">
  <div class="zoo-header">
    <h2>🌿 互动动物园 🌿</h2>
    <p>点击动物放入园区 · 在场地点击投喂食物 · 看小动物们自由互动</p>
  </div>

  <div class="zoo-animal-picker" id="zoo-picker"></div>

  <div class="zoo-toolbar">
    <button class="zoo-btn food-btn" onclick="ZOO.toggleFeedMode()">🍖 投喂模式</button>
    <button class="zoo-btn weather-btn" onclick="ZOO.cycleWeather()">☀️ 切换天气</button>
    <button class="zoo-btn" onclick="ZOO.toggleDayNight()">🌙 日夜切换</button>
    <button class="zoo-btn danger" onclick="ZOO.clearAll()">🧹 清空园区</button>
  </div>

  <div class="zoo-field day" id="zoo-field">
    <div class="zoo-ground-line"></div>
  </div>

  <div class="zoo-stats" id="zoo-stats">
    <span>🐾 动物数量: <b id="stat-count">0</b></span>
    <span>❤️ 互动次数: <b id="stat-interactions">0</b></span>
    <span>🍖 投喂次数: <b id="stat-feeds">0</b></span>
    <span>☁️ 天气: <b id="stat-weather">晴天</b></span>
  </div>
</div>

<script>
const ZOO = (function() {

  // ===== 动物数据定义 =====
  const ANIMAL_DEFS = [
    { emoji: '🐕', name: '小狗',   type: 'dog',     speed: 100, friends: ['cat','rabbit','dog'],  chases: ['mouse'], flees: ['tiger'] },
    { emoji: '🐈', name: '小猫',   type: 'cat',     speed: 80,  friends: ['cat','dog'],           chases: ['mouse','bird'], flees: ['tiger','leopard'] },
    { emoji: '🐈‍⬛', name: '黑猫',  type: 'cat',     speed: 85,  friends: ['cat'],                 chases: ['mouse','bird'], flees: ['tiger'] },
    { emoji: '🐩', name: '贵宾犬', type: 'dog',     speed: 95,  friends: ['dog','sheep'],         chases: ['mouse'], flees: ['tiger'] },
    { emoji: '🐇', name: '兔子',   type: 'rabbit',  speed: 130, friends: ['rabbit','sheep','deer'], chases: [], flees: ['fox','dog','tiger'] },
    { emoji: '🦊', name: '狐狸',   type: 'fox',     speed: 120, friends: ['fox'],                 chases: ['rabbit','mouse','bird'], flees: ['tiger'] },
    { emoji: '🐢', name: '乌龟',   type: 'turtle',  speed: 25,  friends: ['turtle','duck'],       chases: [], flees: [] },
    { emoji: '🦆', name: '鸭子',   type: 'duck',    speed: 60,  friends: ['duck','swan','turtle'],chases: [], flees: ['fox','cat'] },
    { emoji: '🦢', name: '天鹅',   type: 'swan',    speed: 55,  friends: ['swan','duck'],         chases: [], flees: ['fox'] },
    { emoji: '🐑', name: '小羊',   type: 'sheep',   speed: 50,  friends: ['sheep','rabbit','deer'], chases: [], flees: ['fox','tiger','leopard'] },
    { emoji: '🐎', name: '骏马',   type: 'horse',   speed: 160, friends: ['horse','deer'],        chases: [], flees: ['tiger'] },
    { emoji: '🦖', name: '小恐龙', type: 'dino',    speed: 70,  friends: ['dino','turtle'],       chases: ['mouse','bird'], flees: [] },
    { emoji: '🦔', name: '刺猬',   type: 'hedgehog',speed: 40,  friends: ['hedgehog','rabbit'],   chases: [], flees: ['fox'] },
    { emoji: '🐅', name: '老虎',   type: 'tiger',   speed: 140, friends: ['tiger'],               chases: ['rabbit','deer','sheep','dog','cat'], flees: [] },
    { emoji: '🐆', name: '豹子',   type: 'leopard', speed: 170, friends: ['leopard'],             chases: ['rabbit','deer','sheep'], flees: ['tiger'] },
    { emoji: '🐁', name: '小鼠',   type: 'mouse',   speed: 110, friends: ['mouse','hamster'],     chases: [], flees: ['cat','fox','dog','dino'] },
    { emoji: '🐿️', name: '松鼠',  type: 'hamster', speed: 105, friends: ['mouse','hamster','rabbit'], chases: [], flees: ['cat','fox'] },
    { emoji: '🐓', name: '公鸡',   type: 'bird',    speed: 65,  friends: ['bird','duck'],         chases: [], flees: ['cat','fox'] },
    { emoji: '🦌', name: '小鹿',   type: 'deer',    speed: 135, friends: ['deer','rabbit','sheep','horse'], chases: [], flees: ['tiger','leopard','fox'] },
    { emoji: '🐘', name: '大象',   type: 'elephant',speed: 45,  friends: ['elephant','turtle'],   chases: [], flees: [] },
    { emoji: '🐧', name: '企鹅',   type: 'penguin', speed: 50,  friends: ['penguin','duck','swan'], chases: [], flees: ['fox'] },
    { emoji: '🦋', name: '蝴蝶',   type: 'butterfly',speed: 35, friends: ['butterfly','bird'],    chases: [], flees: ['cat','bird'] },
    { emoji: '🐻', name: '棕熊',   type: 'bear',    speed: 75,  friends: ['bear'],                chases: ['mouse','rabbit'], flees: [] },
    { emoji: '🐼', name: '熊猫',   type: 'panda',   speed: 40,  friends: ['panda','bear'],        chases: [], flees: ['tiger'] },
  ];

  const FOODS = ['🍖', '🥕', '🐟', '🌿', '🍎', '🌽', '🍌'];

  // ===== 状态 =====
  let animals = [];
  let foods = [];
  let interactions = 0;
  let feedCount = 0;
  let isNight = false;
  let feedMode = false;
  let weatherState = 'clear'; // clear, rain, snow
  let weatherParticles = [];
  let animFrameId = null;

  const field = document.getElementById('zoo-field');
  const picker = document.getElementById('zoo-picker');

  // ===== 初始化动物选择面板 =====
  ANIMAL_DEFS.forEach((def, i) => {
    const btn = document.createElement('button');
    btn.className = 'animal-pick-btn';
    btn.innerHTML = def.emoji;
    btn.title = '放入: ' + def.name;
    btn.onclick = () => addAnimal(def);
    picker.appendChild(btn);
  });

  // ===== 场地点击事件 =====
  field.addEventListener('click', function(e) {
    const rect = field.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (feedMode) {
      dropFood(x, y);
    }
  });

  // ===== 添加动物 =====
  function addAnimal(def) {
    const fieldRect = field.getBoundingClientRect();
    const a = {
      id: Date.now() + Math.random(),
      def: def,
      x: 40 + Math.random() * (fieldRect.width - 100),
      y: 100 + Math.random() * (fieldRect.height - 160),
      vx: 0, vy: 0,
      state: 'idle',
      stateTimer: 1000 + Math.random() * 2000,
      direction: Math.random() > 0.5 ? 1 : -1,
      el: null,
      bodyEl: null,
      targetFood: null,
      interactCooldown: 0,
      sleepTimer: 0,
    };

    // Create DOM elements
    const el = document.createElement('div');
    el.className = 'zoo-animal';
    const body = document.createElement('span');
    body.className = 'animal-body idle';
    body.textContent = def.emoji;
    el.appendChild(body);
    el.style.left = a.x + 'px';
    el.style.top = a.y + 'px';

    // 点击动物显示名称气泡
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      showTooltip(a.x, a.y - 10, def.name + ' ' + def.emoji);
    });

    field.appendChild(el);
    a.el = el;
    a.bodyEl = body;
    animals.push(a);
    updateStats();
  }

  // ===== 投喂食物 =====
  function dropFood(x, y) {
    const food = {
      id: Date.now() + Math.random(),
      x: x, y: y,
      emoji: FOODS[Math.floor(Math.random() * FOODS.length)],
      el: null,
      eaten: false,
    };
    const el = document.createElement('div');
    el.className = 'zoo-food';
    el.textContent = food.emoji;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    field.appendChild(el);
    food.el = el;
    foods.push(food);
    feedCount++;
    updateStats();
  }

  // ===== 浮动特效 =====
  function spawnEffect(x, y, emoji) {
    const el = document.createElement('div');
    el.className = 'float-effect';
    el.textContent = emoji;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    field.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  // ===== 提示气泡 =====
  function showTooltip(x, y, text) {
    const el = document.createElement('div');
    el.className = 'zoo-tooltip';
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = (y - 30) + 'px';
    field.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  // ===== AI行为决策 =====
  function decideState(a, dt) {
    const def = a.def;
    const fieldW = field.clientWidth;
    const fieldH = field.clientHeight;

    // 1. 逃跑检测：有天敌在附近吗？
    if (def.flees.length > 0) {
      let closestThreat = null, minDist = Infinity;
      animals.forEach(b => {
        if (b === a) return;
        if (def.flees.includes(b.def.type)) {
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 180 && dist < minDist) { closestThreat = b; minDist = dist; }
        }
      });
      if (closestThreat) {
        // 反方向逃跑
        const dx = a.x - closestThreat.x;
        const dy = a.y - closestThreat.y;
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        a.vx = (dx / len) * def.speed * 1.6;
        a.vy = (dy / len) * def.speed * 0.8;
        a.state = 'run';
        a.stateTimer = 600;
        a.direction = a.vx > 0 ? 1 : -1;
        spawnEffect(a.x + 20, a.y - 10, '😨');
        return;
      }
    }

    // 2. 追逐检测：有猎物在附近吗？
    if (def.chases.length > 0) {
      let closestPrey = null, minDist = Infinity;
      animals.forEach(b => {
        if (b === a) return;
        if (def.chases.includes(b.def.type)) {
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 250 && dist < minDist) { closestPrey = b; minDist = dist; }
        }
      });
      if (closestPrey && Math.random() < 0.4) {
        const dx = closestPrey.x - a.x;
        const dy = closestPrey.y - a.y;
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        a.vx = (dx / len) * def.speed * 1.3;
        a.vy = (dy / len) * def.speed * 0.6;
        a.state = 'run';
        a.stateTimer = 800;
        a.direction = a.vx > 0 ? 1 : -1;
        return;
      }
    }

    // 3. 食物吸引
    let closestFood = null, minFoodDist = Infinity;
    foods.forEach(f => {
      if (f.eaten) return;
      const dx = f.x - a.x, dy = f.y - a.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 300 && dist < minFoodDist) { closestFood = f; minFoodDist = dist; }
    });
    if (closestFood) {
      if (minFoodDist < 30) {
        // 吃掉！
        a.state = 'eat';
        a.stateTimer = 800;
        a.vx = 0; a.vy = 0;
        closestFood.eaten = true;
        closestFood.el.classList.add('eaten');
        setTimeout(() => {
          closestFood.el.remove();
          foods = foods.filter(f => f !== closestFood);
        }, 300);
        spawnEffect(a.x + 10, a.y - 5, '😋');
        return;
      } else {
        const dx = closestFood.x - a.x, dy = closestFood.y - a.y;
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        a.vx = (dx / len) * def.speed;
        a.vy = (dy / len) * def.speed * 0.5;
        a.state = 'walk';
        a.stateTimer = 500;
        a.direction = a.vx > 0 ? 1 : -1;
        return;
      }
    }

    // 4. 朋友互动
    if (a.interactCooldown <= 0) {
      animals.forEach(b => {
        if (b === a || b.interactCooldown > 0) return;
        if (def.friends.includes(b.def.type)) {
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 60) {
            // 互动!
            a.state = 'play';
            b.state = 'play';
            a.stateTimer = 1200;
            b.stateTimer = 1200;
            a.vx = 0; a.vy = 0;
            b.vx = 0; b.vy = 0;
            a.interactCooldown = 5000;
            b.interactCooldown = 5000;
            interactions++;
            updateStats();
            const mx = (a.x + b.x) / 2;
            const my = Math.min(a.y, b.y);
            const hearts = ['❤️','💕','✨','💖','🎵'];
            spawnEffect(mx, my - 10, hearts[Math.floor(Math.random() * hearts.length)]);
          }
        }
      });
    }

    // 5. 随机行为切换
    const r = Math.random();
    if (r < 0.15) {
      a.state = 'idle';
      a.vx = 0; a.vy = 0;
      a.stateTimer = 1500 + Math.random() * 3000;
    } else if (r < 0.25) {
      a.state = 'sleep';
      a.vx = 0; a.vy = 0;
      a.stateTimer = 3000 + Math.random() * 4000;
      spawnEffect(a.x + 20, a.y - 15, '💤');
    } else if (r < 0.55) {
      a.state = 'run';
      const angle = Math.random() * Math.PI * 2;
      a.vx = Math.cos(angle) * def.speed * 1.2;
      a.vy = Math.sin(angle) * def.speed * 0.5;
      a.stateTimer = 1000 + Math.random() * 1500;
      a.direction = a.vx > 0 ? 1 : -1;
    } else {
      a.state = 'walk';
      const angle = Math.random() * Math.PI * 2;
      a.vx = Math.cos(angle) * def.speed * 0.5;
      a.vy = Math.sin(angle) * def.speed * 0.25;
      a.stateTimer = 2000 + Math.random() * 4000;
      a.direction = a.vx > 0 ? 1 : -1;
    }
  }

  // ===== 主循环 =====
  let lastTime = null;

  function update(time) {
    if (!lastTime) lastTime = time;
    let dt = (time - lastTime) / 1000;
    lastTime = time;
    if (dt > 0.1) dt = 0.1;

    const fieldW = field.clientWidth;
    const fieldH = field.clientHeight;

    animals.forEach(a => {
      // 状态计时
      a.stateTimer -= dt * 1000;
      a.interactCooldown -= dt * 1000;
      if (a.stateTimer <= 0) {
        decideState(a, dt);
      }

      // 更新位置
      a.x += a.vx * dt;
      a.y += a.vy * dt;

      // 边界检测，反弹
      if (a.x < 10) { a.x = 10; a.vx = Math.abs(a.vx); a.direction = 1; }
      if (a.x > fieldW - 50) { a.x = fieldW - 50; a.vx = -Math.abs(a.vx); a.direction = -1; }
      if (a.y < 60) { a.y = 60; a.vy = Math.abs(a.vy); }
      if (a.y > fieldH - 50) { a.y = fieldH - 50; a.vy = -Math.abs(a.vy); }

      // 更新DOM
      a.el.style.left = a.x + 'px';
      a.el.style.top = a.y + 'px';
      a.bodyEl.className = 'animal-body ' + a.state;
      a.bodyEl.style.transform = a.direction === 1 ? 'scaleX(-1)' : 'scaleX(1)';
    });

    animFrameId = requestAnimationFrame(update);
  }

  animFrameId = requestAnimationFrame(update);

  // ===== 天气系统 =====
  let weatherInterval = null;

  function clearWeather() {
    weatherParticles.forEach(el => el.remove());
    weatherParticles = [];
    if (weatherInterval) clearInterval(weatherInterval);
    weatherInterval = null;
  }

  function startRain() {
    clearWeather();
    weatherInterval = setInterval(() => {
      if (weatherParticles.length > 60) return;
      const drop = document.createElement('div');
      drop.className = 'weather-particle rain-drop';
      drop.style.left = Math.random() * 100 + '%';
      drop.style.animationDuration = (0.6 + Math.random() * 0.4) + 's';
      field.appendChild(drop);
      weatherParticles.push(drop);
      setTimeout(() => { drop.remove(); weatherParticles = weatherParticles.filter(p => p !== drop); }, 1200);
    }, 40);
  }

  function startSnow() {
    clearWeather();
    weatherInterval = setInterval(() => {
      if (weatherParticles.length > 40) return;
      const flake = document.createElement('div');
      flake.className = 'weather-particle snow-flake';
      flake.style.left = Math.random() * 100 + '%';
      flake.style.animationDuration = (3 + Math.random() * 3) + 's';
      flake.style.width = flake.style.height = (4 + Math.random() * 5) + 'px';
      field.appendChild(flake);
      weatherParticles.push(flake);
      setTimeout(() => { flake.remove(); weatherParticles = weatherParticles.filter(p => p !== flake); }, 6000);
    }, 120);
  }

  // ===== 统计更新 =====
  function updateStats() {
    document.getElementById('stat-count').textContent = animals.length;
    document.getElementById('stat-interactions').textContent = interactions;
    document.getElementById('stat-feeds').textContent = feedCount;
  }

  // ===== 对外暴露API =====
  return {
    toggleFeedMode() {
      feedMode = !feedMode;
      const btn = document.querySelector('.food-btn');
      btn.textContent = feedMode ? '🍖 投喂中...(点击场地)' : '🍖 投喂模式';
      btn.style.boxShadow = feedMode ? '0 0 15px rgba(100,150,255,0.5)' : '';
      field.style.cursor = feedMode ? 'cell' : 'crosshair';
    },

    cycleWeather() {
      const weatherBtn = document.querySelector('.weather-btn');
      const statEl = document.getElementById('stat-weather');
      if (weatherState === 'clear') {
        weatherState = 'rain';
        startRain();
        weatherBtn.textContent = '🌧️ 切换天气';
        statEl.textContent = '雨天';
      } else if (weatherState === 'rain') {
        weatherState = 'snow';
        clearWeather();
        startSnow();
        weatherBtn.textContent = '❄️ 切换天气';
        statEl.textContent = '下雪';
      } else {
        weatherState = 'clear';
        clearWeather();
        weatherBtn.textContent = '☀️ 切换天气';
        statEl.textContent = '晴天';
      }
    },

    toggleDayNight() {
      isNight = !isNight;
      field.className = 'zoo-field ' + (isNight ? 'night' : 'day');
      const btn = document.querySelectorAll('.zoo-btn')[2];
      btn.textContent = isNight ? '☀️ 日夜切换' : '🌙 日夜切换';
    },

    clearAll() {
      animals.forEach(a => a.el.remove());
      animals = [];
      foods.forEach(f => f.el.remove());
      foods = [];
      interactions = 0;
      feedCount = 0;
      clearWeather();
      weatherState = 'clear';
      updateStats();
      document.getElementById('stat-weather').textContent = '晴天';
      const weatherBtn = document.querySelector('.weather-btn');
      weatherBtn.textContent = '☀️ 切换天气';
    }
  };

})();
</script>
