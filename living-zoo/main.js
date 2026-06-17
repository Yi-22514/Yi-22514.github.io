(function () {
  "use strict";

  const RESIZE_DELAY = 120;

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  }

  function localPoint(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function pulse(button) {
    button.classList.add("is-pressing");
    window.setTimeout(() => button.classList.remove("is-pressing"), 180);
  }

  ready(() => {
    const container = document.getElementById("zoo-container");
    const canvas = document.getElementById("zoo-canvas");
    if (!container || !canvas) return;

    if (!window.Matter || !window.ZooEngine) {
      console.error("[Living Zoo] Matter.js and zoo.js must load before main.js.");
      return;
    }

    const weatherBtn = document.getElementById("weather-btn");
    const nightBtn = document.getElementById("night-btn");
    const clearBtn = document.getElementById("clear-btn");
    const status = document.getElementById("zoo-status");
    const panelState = document.getElementById("panel-state");

    const zoo = new window.ZooEngine({
      canvas,
      Matter: window.Matter,
      animalCount: 10
    });

    const state = {
      rainy: false,
      night: false
    };

    function setStatus(message) {
      if (status) status.textContent = message;
    }

    function syncUi() {
      container.classList.toggle("is-raining", state.rainy);
      container.classList.toggle("is-night", state.night);
      container.dataset.weather = state.rainy ? "rain" : "clear";

      if (weatherBtn) {
        weatherBtn.classList.toggle("is-active", state.rainy);
        weatherBtn.setAttribute("aria-pressed", String(state.rainy));
      }

      if (nightBtn) {
        nightBtn.classList.toggle("is-active", state.night);
        nightBtn.setAttribute("aria-pressed", String(state.night));
        const label = nightBtn.querySelector("span:last-child");
        if (label) label.textContent = state.night ? "Day" : "Night";
      }

      if (panelState) {
        panelState.textContent = `${state.rainy ? "Raining" : "Sunny"} ${state.night ? "Night" : "Day"}`;
      }
    }

    weatherBtn?.addEventListener("click", () => {
      pulse(weatherBtn);
      state.rainy = !state.rainy;
      zoo.setRainyMode(state.rainy);
      setStatus(state.rainy ? "Rain is falling. The animals huddle and slow down." : "The rain stopped. The habitat is lively again.");
      syncUi();
    });

    nightBtn?.addEventListener("click", () => {
      pulse(nightBtn);
      state.night = !state.night;
      zoo.setNightMode(state.night);
      setStatus(state.night ? "Night mode is on. Most animals are getting sleepy." : "Morning light returns to the ecosystem.");
      syncUi();
    });

    clearBtn?.addEventListener("click", () => {
      pulse(clearBtn);
      zoo.clearZoo();
      setStatus("The habitat is clear. Tap the page refresh button to repopulate, or call zoo.seed(10).");
      syncUi();
    });

    canvas.addEventListener("pointerdown", (event) => {
      const point = localPoint(canvas, event);
      zoo.addFood(point.x, point.y);
      setStatus("Food dropped. Hungry animals are steering toward it.");
    });

    canvas.addEventListener("pointermove", (event) => {
      const point = localPoint(canvas, event);
      zoo.setPointer(point.x, point.y, true);
    }, { passive: true });

    canvas.addEventListener("pointerleave", () => {
      zoo.setPointer(0, 0, false);
    }, { passive: true });

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => zoo.resize(), RESIZE_DELAY);
    }, { passive: true });

    syncUi();
    zoo.start();

    window.zooEngine = zoo;
  });
})();
