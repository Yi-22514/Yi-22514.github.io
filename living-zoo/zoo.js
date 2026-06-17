(function (global) {
  "use strict";

  const DEFAULT_OPTIONS = {
    animalCount: 9,
    gravity: 0.012,
    wallThickness: 160,
    maxSpeed: 2.35,
    rainyMaxSpeed: 0.72,
    foodLifetime: 16000,
    socialDistance: 108,
    hoverRadius: 270,
    curiosityThreshold: 0.62,
    huddlePadding: 120,
    animalCatalog: [
      { name: "Fox", emoji: "🦊", imageUrl: "/images/animals/fox.png" },
      { name: "Panda", emoji: "🐼", imageUrl: "/images/animals/panda.png" },
      { name: "Lion", emoji: "🦁", imageUrl: "/images/animals/lion.png" },
      { name: "Penguin", emoji: "🐧", imageUrl: "/images/animals/penguin.png" },
      { name: "Turtle", emoji: "🐢", imageUrl: "/images/animals/turtle.png" },
      { name: "Rabbit", emoji: "🐇", imageUrl: "/images/animals/rabbit.png" },
      { name: "Koala", emoji: "🐨", imageUrl: "/images/animals/koala.png" },
      { name: "Zebra", emoji: "🦓", imageUrl: "/images/animals/zebra.png" }
    ]
  };

  const STATES = {
    WANDER: "wander",
    SEEK_FOOD: "seek_food",
    SOCIALIZE: "socialize",
    SLEEP: "sleep"
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const random = (min, max) => min + Math.random() * (max - min);
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function normalize(vector) {
    const length = Math.hypot(vector.x, vector.y) || 1;
    return { x: vector.x / length, y: vector.y / length };
  }

  function makePersonality() {
    return {
      curiosity: random(0.28, 1),
      energy: random(0.36, 1),
      sociability: random(0.25, 1),
      patience: random(0.2, 0.95)
    };
  }

  class Food {
    constructor(engine, x, y) {
      this.engine = engine;
      this.createdAt = performance.now();
      this.life = 1;
      this.body = engine.Matter.Bodies.circle(x, y, 12, {
        isStatic: true,
        isSensor: true,
        label: "food",
        render: { visible: false }
      });
      engine.Matter.World.add(engine.world, this.body);
    }

    get position() {
      return this.body.position;
    }

    update(now) {
      this.life = clamp(1 - (now - this.createdAt) / this.engine.options.foodLifetime, 0, 1);
      return this.life > 0;
    }

    destroy() {
      this.engine.Matter.World.remove(this.engine.world, this.body);
    }
  }

  class Animal {
    constructor(engine, options) {
      this.engine = engine;
      this.Matter = engine.Matter;
      this.profile = options.profile;
      this.image = options.image || null;
      this.emoji = this.profile.emoji;
      this.size = options.size || random(34, 52);
      this.state = STATES.WANDER;
      this.previousState = this.state;
      this.personality = Object.assign(makePersonality(), options.personality || {});
      this.hunger = random(12, 54);
      this.socialNeed = random(8, 52);
      this.restNeed = random(0, 28);
      this.wanderTarget = null;
      this.wanderTimer = 0;
      this.sleepTimer = 0;
      this.emote = 0;

      this.body = this.Matter.Bodies.circle(options.x, options.y, this.size * 0.42, {
        label: "animal",
        frictionAir: 0.075,
        restitution: 0.86,
        density: 0.001,
        render: { visible: false }
      });

      this.body.plugin = Object.assign({}, this.body.plugin, { animal: this });
      this.Matter.World.add(engine.world, this.body);
    }

    get position() {
      return this.body.position;
    }

    /*
      State Machine Tuning Guide
      --------------------------
      This update loop chooses exactly one high-level behavior each frame.
      Adjust the thresholds below to change the ecosystem personality:
      - hunger > 58 makes animals seek food sooner.
      - socialNeed > 62 makes animals gather and play more often.
      - restNeed > 90 makes animals sleep more aggressively.
      Rain and night are global overrides from ZooEngine.
    */
    update(delta, context) {
      const seconds = delta / 1000;

      this.hunger = clamp(this.hunger + seconds * (2.8 - this.personality.patience), 0, 100);
      this.socialNeed = clamp(this.socialNeed + seconds * (2.4 - this.personality.sociability), 0, 100);
      this.restNeed = clamp(this.restNeed + seconds * (this.state === STATES.SLEEP ? -18 : 4.8), 0, 100);
      this.emote = Math.max(0, this.emote - seconds * 2.6);

      if (context.rainy) {
        this.setState(STATES.SOCIALIZE);
        this.steerTo(context.huddlePoint, context.rainyMaxSpeed, 0.00092);
        this.limitSpeed(context.rainyMaxSpeed);
        return;
      }

      if (context.night && this.sleepTimer > 0) {
        this.sleepTimer -= delta;
        this.setState(STATES.SLEEP);
        this.dampen(0.9);
        return;
      }

      const food = this.closestFood(context.foods);
      if (food && this.hunger > 58) {
        this.setState(STATES.SEEK_FOOD);
        this.steerTo(food.position, context.maxSpeed, 0.00135);
        this.tryEat(food);
        return;
      }

      const friend = this.closestFriend(context.animals);
      if (friend && this.socialNeed > 62) {
        this.socialize(friend);
        this.steerTo(friend.position, context.maxSpeed * 0.78, 0.00082);
        return;
      }

      if (this.restNeed > 90) {
        this.sleepTimer = random(3500, 8500);
        this.setState(STATES.SLEEP);
        this.dampen(0.9);
        return;
      }

      const hover = this.hoverTarget(context.pointer);
      if (hover) {
        this.setState(STATES.WANDER);
        this.steerTo(hover, context.maxSpeed * 0.58, 0.00058);
        return;
      }

      this.setState(STATES.WANDER);
      this.wander(delta, context.bounds);
    }

    setState(nextState) {
      if (this.state === nextState) return;
      this.previousState = this.state;
      this.state = nextState;
      this.emote = 1;
    }

    closestFood(foods) {
      let best = null;
      let bestDistance = Infinity;
      for (const food of foods) {
        const d = distance(this.position, food.position);
        if (d < bestDistance) {
          best = food;
          bestDistance = d;
        }
      }
      return best;
    }

    closestFriend(animals) {
      let best = null;
      let bestDistance = Infinity;
      for (const animal of animals) {
        if (animal === this || animal.state === STATES.SLEEP) continue;
        const d = distance(this.position, animal.position);
        if (d < this.engine.options.socialDistance && d < bestDistance) {
          best = animal;
          bestDistance = d;
        }
      }
      return best;
    }

    hoverTarget(pointer) {
      if (!pointer.active || this.personality.curiosity < this.engine.options.curiosityThreshold) return null;
      if (distance(this.position, pointer) > this.engine.options.hoverRadius) return null;
      return pointer;
    }

    wander(delta, bounds) {
      this.wanderTimer -= delta;
      if (!this.wanderTarget || this.wanderTimer <= 0 || distance(this.position, this.wanderTarget) < 44) {
        this.wanderTimer = random(1000, 3200) * (1.35 - this.personality.curiosity * 0.3);
        this.wanderTarget = {
          x: random(bounds.left + 84, bounds.right - 84),
          y: random(bounds.top + 120, bounds.bottom - 96)
        };
      }
      this.steerTo(this.wanderTarget, this.engine.options.maxSpeed * this.personality.energy, 0.00052);
    }

    steerTo(target, maxSpeed, force) {
      const direction = normalize({
        x: target.x - this.position.x,
        y: target.y - this.position.y
      });

      this.Matter.Body.applyForce(this.body, this.position, {
        x: direction.x * force * this.personality.energy,
        y: direction.y * force * this.personality.energy
      });

      this.limitSpeed(maxSpeed);
    }

    socialize(friend) {
      this.setState(STATES.SOCIALIZE);
      friend.setState(STATES.SOCIALIZE);
      this.socialNeed = clamp(this.socialNeed - 0.55, 0, 100);
      friend.socialNeed = clamp(friend.socialNeed - 0.34, 0, 100);
      this.emote = 1;
      friend.emote = Math.max(friend.emote, 0.7);
    }

    tryEat(food) {
      if (distance(this.position, food.position) > this.size * 0.88) return;
      this.hunger = clamp(this.hunger - 52, 0, 100);
      this.restNeed = clamp(this.restNeed + 7, 0, 100);
      this.emote = 1;
      this.engine.removeFood(food);
    }

    dampen(multiplier) {
      this.Matter.Body.setVelocity(this.body, {
        x: this.body.velocity.x * multiplier,
        y: this.body.velocity.y * multiplier
      });
    }

    limitSpeed(maxSpeed) {
      const velocity = this.body.velocity;
      const speed = Math.hypot(velocity.x, velocity.y);
      if (speed <= maxSpeed) return;
      const direction = normalize(velocity);
      this.Matter.Body.setVelocity(this.body, {
        x: direction.x * maxSpeed,
        y: direction.y * maxSpeed
      });
    }

    destroy() {
      this.Matter.World.remove(this.engine.world, this.body);
    }
  }

  class ZooEngine {
    constructor(options) {
      if (!options || !options.canvas) {
        throw new Error("ZooEngine requires a canvas element.");
      }

      this.options = Object.assign({}, DEFAULT_OPTIONS, options);
      this.canvas = options.canvas;
      this.ctx = this.canvas.getContext("2d");
      this.Matter = options.Matter || global.Matter;
      if (!this.Matter) throw new Error("Matter.js must be loaded before zoo.js.");

      this.engine = this.Matter.Engine.create();
      this.world = this.engine.world;
      this.world.gravity.x = 0;
      this.world.gravity.y = this.options.gravity;

      this.animals = [];
      this.foods = [];
      this.walls = [];
      this.images = new Map();
      this.pointer = { x: 0, y: 0, active: false };
      this.bounds = { left: 0, top: 0, right: 0, bottom: 0 };
      this.huddlePoint = { x: 120, y: 120 };
      this.rainy = false;
      this.night = false;
      this.running = false;
      this.lastTime = performance.now();
      this.raf = 0;

      this.resize();
      this.loadImages();
      this.createWalls();
      this.seed(this.options.animalCount);
    }

    loadImages() {
      for (const profile of this.options.animalCatalog) {
        if (!profile.imageUrl) continue;
        const image = new Image();
        image.onload = () => this.images.set(profile.imageUrl, image);
        image.onerror = () => this.images.set(profile.imageUrl, null);
        image.src = profile.imageUrl;
      }
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.width = rect.width || this.canvas.clientWidth || global.innerWidth;
      this.height = rect.height || this.canvas.clientHeight || global.innerHeight;
      this.dpr = Math.min(global.devicePixelRatio || 1, 2);
      this.canvas.width = Math.floor(this.width * this.dpr);
      this.canvas.height = Math.floor(this.height * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.bounds = { left: 0, top: 0, right: this.width, bottom: this.height };
      this.huddlePoint = {
        x: this.options.huddlePadding,
        y: this.height - this.options.huddlePadding
      };
      this.rebuildWalls();
    }

    createWalls() {
      this.rebuildWalls();
    }

    rebuildWalls() {
      if (!this.world || !this.width || !this.height) return;
      for (const wall of this.walls) this.Matter.World.remove(this.world, wall);
      this.walls.length = 0;

      const t = this.options.wallThickness;
      const h = t / 2;
      const settings = { isStatic: true, label: "zoo-wall", render: { visible: false } };
      this.walls.push(
        this.Matter.Bodies.rectangle(this.width / 2, -h, this.width + t * 2, t, settings),
        this.Matter.Bodies.rectangle(this.width / 2, this.height + h, this.width + t * 2, t, settings),
        this.Matter.Bodies.rectangle(-h, this.height / 2, t, this.height + t * 2, settings),
        this.Matter.Bodies.rectangle(this.width + h, this.height / 2, t, this.height + t * 2, settings)
      );
      this.Matter.World.add(this.world, this.walls);
    }

    seed(count) {
      for (let i = 0; i < count; i += 1) {
        this.addAnimal({
          x: random(90, Math.max(120, this.width - 90)),
          y: random(this.height * 0.36, Math.max(this.height * 0.38, this.height - 110))
        });
      }
    }

    addAnimal(options = {}) {
      const profile = options.profile || this.options.animalCatalog[Math.floor(Math.random() * this.options.animalCatalog.length)];
      const animal = new Animal(this, {
        x: options.x == null ? this.width / 2 : options.x,
        y: options.y == null ? this.height / 2 : options.y,
        profile,
        image: this.images.get(profile.imageUrl),
        size: options.size,
        personality: options.personality
      });
      this.animals.push(animal);
      return animal;
    }

    addFood(x, y) {
      const food = new Food(this, x, y);
      this.foods.push(food);
      return food;
    }

    removeFood(food) {
      const index = this.foods.indexOf(food);
      if (index === -1) return;
      food.destroy();
      this.foods.splice(index, 1);
    }

    setPointer(x, y, active = true) {
      this.pointer.x = x;
      this.pointer.y = y;
      this.pointer.active = active;
    }

    setRainyMode(enabled) {
      this.rainy = Boolean(enabled);
      if (this.rainy) {
        for (const animal of this.animals) {
          animal.setState(STATES.SOCIALIZE);
          animal.dampen(0.35);
        }
      }
    }

    setNightMode(enabled) {
      this.night = Boolean(enabled);
      for (const animal of this.animals) {
        if (this.night && Math.random() < 0.7) {
          animal.sleepTimer = random(9000, 24000);
          animal.setState(STATES.SLEEP);
        } else if (!this.night && animal.state === STATES.SLEEP) {
          animal.sleepTimer = 0;
          animal.setState(STATES.WANDER);
        }
      }
    }

    clearZoo() {
      for (const animal of this.animals) animal.destroy();
      for (const food of this.foods) food.destroy();
      this.animals.length = 0;
      this.foods.length = 0;
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.lastTime = performance.now();
      this.raf = requestAnimationFrame((time) => this.tick(time));
    }

    stop() {
      this.running = false;
      cancelAnimationFrame(this.raf);
    }

    tick(time) {
      if (!this.running) return;
      const delta = clamp(time - this.lastTime, 8, 48);
      this.lastTime = time;
      this.update(delta, time);
      this.render(time);
      this.raf = requestAnimationFrame((next) => this.tick(next));
    }

    update(delta, now) {
      for (let i = this.foods.length - 1; i >= 0; i -= 1) {
        if (!this.foods[i].update(now)) this.removeFood(this.foods[i]);
      }

      const context = {
        animals: this.animals,
        foods: this.foods,
        pointer: this.pointer,
        bounds: this.bounds,
        huddlePoint: this.huddlePoint,
        rainy: this.rainy,
        night: this.night,
        maxSpeed: this.options.maxSpeed,
        rainyMaxSpeed: this.options.rainyMaxSpeed
      };

      for (const animal of this.animals) animal.update(delta, context);
      this.Matter.Engine.update(this.engine, delta);
    }

    render(time) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);
      this.drawLandscape(ctx);
      ctx.save();
      ctx.globalAlpha = this.night ? 0.66 : 1;
      this.drawFood(ctx, time);
      this.drawAnimals(ctx, time);
      ctx.restore();
    }

    drawLandscape(ctx) {
      const groundY = this.height * 0.68;
      const sky = ctx.createLinearGradient(0, 0, 0, this.height);
      if (this.night) {
        sky.addColorStop(0, "#15172f");
        sky.addColorStop(0.55, "#27315f");
        sky.addColorStop(1, "#314654");
      } else {
        sky.addColorStop(0, "#8bdfff");
        sky.addColorStop(0.52, "#b8b8ff");
        sky.addColorStop(1, "#b8f4d1");
      }
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = this.night ? "rgba(247,251,255,0.72)" : "rgba(255,255,255,0.54)";
      ctx.beginPath();
      ctx.arc(this.width * 0.78, this.height * 0.18, this.night ? 34 : 46, 0, Math.PI * 2);
      ctx.fill();

      const hill = ctx.createLinearGradient(0, groundY, 0, this.height);
      hill.addColorStop(0, this.night ? "#375a58" : "#8fe6a7");
      hill.addColorStop(1, this.night ? "#233b3e" : "#4cc47a");
      ctx.fillStyle = hill;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.bezierCurveTo(this.width * 0.18, groundY - 78, this.width * 0.34, groundY + 48, this.width * 0.52, groundY - 24);
      ctx.bezierCurveTo(this.width * 0.7, groundY - 90, this.width * 0.88, groundY + 24, this.width, groundY - 44);
      ctx.lineTo(this.width, this.height);
      ctx.lineTo(0, this.height);
      ctx.closePath();
      ctx.fill();
    }

    drawFood(ctx, time) {
      for (const food of this.foods) {
        const pulse = 1 + Math.sin(time * 0.009) * 0.08;
        ctx.save();
        ctx.globalAlpha = food.life;
        ctx.fillStyle = "#ffca66";
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(food.position.x, food.position.y, 12 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.font = "16px Apple Color Emoji, Segoe UI Emoji, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🍎", food.position.x, food.position.y + 1);
        ctx.restore();
      }
    }

    drawAnimals(ctx, time) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const animal of this.animals) {
        const p = animal.position;
        const sleeping = animal.state === STATES.SLEEP;
        const bob = sleeping ? 0 : Math.sin(time * 0.004 + animal.size) * 4;
        const scale = 1 + animal.emote * 0.12;
        const image = this.images.get(animal.profile.imageUrl);

        ctx.save();
        ctx.globalAlpha = sleeping ? 0.6 : 1;
        ctx.fillStyle = "rgba(10, 20, 35, 0.18)";
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + animal.size * 0.48, animal.size * 0.42, animal.size * 0.14, 0, 0, Math.PI * 2);
        ctx.fill();

        if (image) {
          const drawSize = animal.size * 1.18 * scale;
          ctx.drawImage(image, p.x - drawSize / 2, p.y + bob - drawSize / 2, drawSize, drawSize);
        } else {
          ctx.font = `${animal.size * scale}px Apple Color Emoji, Segoe UI Emoji, sans-serif`;
          ctx.fillText(animal.emoji, p.x, p.y + bob);
        }

        if (animal.state === STATES.SOCIALIZE) {
          ctx.font = "14px Apple Color Emoji, Segoe UI Emoji, sans-serif";
          ctx.fillText("✨", p.x + animal.size * 0.48, p.y - animal.size * 0.44);
        }

        if (sleeping) {
          ctx.fillStyle = "rgba(255,255,255,0.84)";
          ctx.font = "700 14px Arial, sans-serif";
          ctx.fillText("Zz", p.x + animal.size * 0.42, p.y - animal.size * 0.48);
        }
        ctx.restore();
      }
    }

    destroy() {
      this.stop();
      this.clearZoo();
      for (const wall of this.walls) this.Matter.World.remove(this.world, wall);
      this.Matter.Engine.clear(this.engine);
    }
  }

  global.ZooEngine = ZooEngine;
  global.ZooAnimal = Animal;
})(window);
