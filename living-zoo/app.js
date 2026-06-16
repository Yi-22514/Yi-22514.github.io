(function () {
  const container = document.getElementById("zoo-container");
  const canvas = document.getElementById("world-canvas");
  const ctx = canvas.getContext("2d");
  const panelState = document.getElementById("panel-state");
  const worldStatus = document.getElementById("world-status");
  const buttons = Array.from(document.querySelectorAll(".control-button"));
  const weatherButton = document.querySelector('[data-action="weather"]');
  const dayButton = document.querySelector('[data-action="day-night"]');

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animals = [];
  const rainDrops = [];
  const sparkles = [];
  const animalFaces = ["🐘", "🦊", "🐼", "🦁", "🐧", "🦒", "🐢", "🐇"];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let isNight = false;
  let weather = "clear";
  let lastTime = performance.now();

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createAnimal(x, y, face) {
    const size = random(30, 46);
    animals.push({
      face: face || animalFaces[Math.floor(Math.random() * animalFaces.length)],
      x: x == null ? random(70, Math.max(90, width - 70)) : x,
      y: y == null ? random(height * 0.48, height - 124) : y,
      vx: random(-26, 26),
      vy: random(-8, 8),
      size,
      bob: random(0, Math.PI * 2),
      mood: random(0.85, 1.15)
    });
  }

  function seedWorld() {
    animals.length = 0;
    const count = width < 600 ? 5 : 8;
    for (let i = 0; i < count; i += 1) createAnimal();
  }

  function createRain() {
    rainDrops.length = 0;
    const count = width < 600 ? 90 : 150;
    for (let i = 0; i < count; i += 1) {
      rainDrops.push({
        x: random(-width * 0.2, width * 1.05),
        y: random(-height, height),
        length: random(12, 26),
        speed: random(520, 760),
        drift: random(-80, -30),
        alpha: random(0.18, 0.42)
      });
    }
  }

  function addSparkle(x, y) {
    sparkles.push({
      x,
      y,
      size: random(10, 18),
      life: 1,
      hue: Math.random() > 0.5 ? "#74ebd5" : "#ff8fa3"
    });
  }

  function drawSky() {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (isNight) {
      gradient.addColorStop(0, "#15172f");
      gradient.addColorStop(0.55, "#27315f");
      gradient.addColorStop(1, "#314654");
    } else {
      gradient.addColorStop(0, "#8bdfff");
      gradient.addColorStop(0.52, "#b8b8ff");
      gradient.addColorStop(1, "#b8f4d1");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = isNight ? 0.7 : 0.35;
    ctx.fillStyle = isNight ? "#f7fbff" : "#ffffff";
    const orbX = width * 0.78;
    const orbY = height * 0.18;
    ctx.beginPath();
    ctx.arc(orbX, orbY, isNight ? 34 : 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawHills() {
    const groundY = height * 0.68;
    const hill = ctx.createLinearGradient(0, groundY, 0, height);
    hill.addColorStop(0, isNight ? "#375a58" : "#8fe6a7");
    hill.addColorStop(1, isNight ? "#233b3e" : "#4cc47a");

    ctx.fillStyle = hill;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.bezierCurveTo(width * 0.18, groundY - 78, width * 0.34, groundY + 48, width * 0.52, groundY - 24);
    ctx.bezierCurveTo(width * 0.7, groundY - 90, width * 0.88, groundY + 24, width, groundY - 44);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isNight ? "rgba(116, 235, 213, 0.1)" : "rgba(255, 255, 255, 0.22)";
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.78, width * 0.36, 42, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawAnimals(dt, time) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    animals.forEach((animal) => {
      animal.bob += dt * 0.005 * animal.mood;
      animal.x += animal.vx * dt * 0.001;
      animal.y += animal.vy * dt * 0.001;

      const minY = height * 0.48;
      const maxY = height - 96;
      if (animal.x < 34 || animal.x > width - 34) animal.vx *= -1;
      if (animal.y < minY || animal.y > maxY) animal.vy *= -1;
      animal.x = Math.max(34, Math.min(width - 34, animal.x));
      animal.y = Math.max(minY, Math.min(maxY, animal.y));

      const bobY = Math.sin(animal.bob + time * 0.001) * 5;
      const shadowScale = 1 + Math.sin(animal.bob) * 0.08;

      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#142034";
      ctx.beginPath();
      ctx.ellipse(animal.x, animal.y + animal.size * 0.56, animal.size * 0.42 * shadowScale, animal.size * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.font = `${animal.size}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
      ctx.fillText(animal.face, animal.x, animal.y + bobY);
    });
  }

  function drawWeather(dt) {
    if (weather !== "rain") return;

    ctx.save();
    ctx.strokeStyle = "rgba(180, 230, 255, 0.55)";
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";

    rainDrops.forEach((drop) => {
      drop.y += drop.speed * dt * 0.001;
      drop.x += drop.drift * dt * 0.001;
      if (drop.y > height + 40) {
        drop.y = random(-160, -20);
        drop.x = random(-width * 0.2, width * 1.05);
      }

      ctx.globalAlpha = drop.alpha;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - drop.length * 0.35, drop.y + drop.length);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawSparkles(dt) {
    for (let i = sparkles.length - 1; i >= 0; i -= 1) {
      const sparkle = sparkles[i];
      sparkle.life -= dt * 0.0018;
      if (sparkle.life <= 0) {
        sparkles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = sparkle.life;
      ctx.translate(sparkle.x, sparkle.y);
      ctx.rotate((1 - sparkle.life) * Math.PI);
      ctx.fillStyle = sparkle.hue;
      ctx.beginPath();
      ctx.moveTo(0, -sparkle.size);
      ctx.lineTo(sparkle.size * 0.28, -sparkle.size * 0.28);
      ctx.lineTo(sparkle.size, 0);
      ctx.lineTo(sparkle.size * 0.28, sparkle.size * 0.28);
      ctx.lineTo(0, sparkle.size);
      ctx.lineTo(-sparkle.size * 0.28, sparkle.size * 0.28);
      ctx.lineTo(-sparkle.size, 0);
      ctx.lineTo(-sparkle.size * 0.28, -sparkle.size * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function render(time) {
    const dt = Math.min(48, time - lastTime);
    lastTime = time;

    drawSky();
    drawHills();
    drawAnimals(prefersReducedMotion ? 0 : dt, time);
    drawSparkles(dt);
    drawWeather(dt);

    requestAnimationFrame(render);
  }

  function updateUiState() {
    container.classList.toggle("is-night", isNight);
    container.classList.toggle("is-raining", weather === "rain");
    container.dataset.weather = weather;

    weatherButton.classList.toggle("is-active", weather === "rain");
    weatherButton.setAttribute("aria-pressed", String(weather === "rain"));
    dayButton.classList.toggle("is-active", isNight);
    dayButton.setAttribute("aria-pressed", String(isNight));

    const weatherText = weather === "rain" ? "Raining" : "Sunny";
    const timeText = isNight ? "Night" : "Day";
    panelState.textContent = `${weatherText} ${timeText}`;
  }

  function spring(button) {
    button.classList.add("is-pressing");
    window.setTimeout(() => button.classList.remove("is-pressing"), 180);
  }

  function handleAction(action) {
    if (action === "weather") {
      weather = weather === "rain" ? "clear" : "rain";
      if (weather === "rain") createRain();
      worldStatus.textContent = weather === "rain" ? "A soft rain is falling over the habitat." : "The sky cleared up again.";
    }

    if (action === "day-night") {
      isNight = !isNight;
      worldStatus.textContent = isNight ? "Night mode makes the zoo glow quietly." : "Daylight is back across the world.";
    }

    if (action === "clear") {
      weather = "clear";
      rainDrops.length = 0;
      animals.length = 0;
      sparkles.length = 0;
      worldStatus.textContent = "The field is clear. Tap anywhere to invite animals back.";
    }

    updateUiState();
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      spring(button);
      handleAction(button.dataset.action);
    });
  });

  canvas.addEventListener("pointerdown", (event) => {
    createAnimal(event.clientX, event.clientY);
    addSparkle(event.clientX, event.clientY - 22);
    worldStatus.textContent = "A new friend joined the living zoo.";
  });

  window.addEventListener("resize", () => {
    resize();
    if (weather === "rain") createRain();
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }

  resize();
  seedWorld();
  updateUiState();
  requestAnimationFrame(render);
})();
