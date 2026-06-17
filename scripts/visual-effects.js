hexo.extend.injector.register('body_end', `
  <canvas id="yi-sky-canvas" aria-hidden="true"></canvas>
  <div class="cursor-dot" aria-hidden="true"></div>
  <div class="cursor-jelly" aria-hidden="true"></div>

  <script>
    (function() {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function initDynamicSky() {
        if (prefersReducedMotion) return;

        const canvas = document.getElementById('yi-sky-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const colors = ['#a1c4fd', '#c2e9fb', '#fbc2eb', '#fef9d7', '#ffffff'];
        const particles = [];
        const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
        let width = 0;
        let height = 0;
        let dpr = 1;

        function resize() {
          dpr = Math.min(window.devicePixelRatio || 1, 2);
          width = window.innerWidth;
          height = window.innerHeight;
          canvas.width = Math.floor(width * dpr);
          canvas.height = Math.floor(height * dpr);
          canvas.style.width = width + 'px';
          canvas.style.height = height + 'px';
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          const targetCount = Math.max(38, Math.min(96, Math.floor(width * height / 18000)));
          while (particles.length < targetCount) particles.push(createParticle(true));
          if (particles.length > targetCount) particles.length = targetCount;
        }

        function createParticle(randomY) {
          const radius = 10 + Math.random() * 36;
          return {
            x: Math.random() * width,
            y: randomY ? Math.random() * height : height + radius,
            radius,
            speed: 0.08 + Math.random() * 0.22,
            drift: (Math.random() - 0.5) * 0.16,
            alpha: 0.12 + Math.random() * 0.3,
            color: colors[Math.floor(Math.random() * colors.length)],
            phase: Math.random() * Math.PI * 2
          };
        }

        function drawParticle(p, time) {
          const breathe = Math.sin(time * 0.001 + p.phase) * 0.08 + 1;
          const parallaxX = mouse.x * (p.radius / 70);
          const parallaxY = mouse.y * (p.radius / 90);
          const x = p.x + parallaxX;
          const y = p.y + parallaxY;
          const r = p.radius * breathe;
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
          gradient.addColorStop(0, p.color);
          gradient.addColorStop(0.48, p.color + '55');
          gradient.addColorStop(1, p.color + '00');
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }

        function animate(time) {
          mouse.x += (mouse.tx - mouse.x) * 0.045;
          mouse.y += (mouse.ty - mouse.y) * 0.045;

          ctx.clearRect(0, 0, width, height);
          ctx.globalCompositeOperation = 'lighter';

          for (const p of particles) {
            p.y -= p.speed;
            p.x += p.drift;

            if (p.y < -p.radius) {
              Object.assign(p, createParticle(false));
            }
            if (p.x < -p.radius) p.x = width + p.radius;
            if (p.x > width + p.radius) p.x = -p.radius;

            drawParticle(p, time);
          }

          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
          requestAnimationFrame(animate);
        }

        window.addEventListener('resize', resize, { passive: true });
        window.addEventListener('mousemove', function(event) {
          mouse.tx = -(event.clientX / window.innerWidth - 0.5) * 28;
          mouse.ty = -(event.clientY / window.innerHeight - 0.5) * 20;
        }, { passive: true });

        resize();
        requestAnimationFrame(animate);
      }

      function initScrollReveal() {
        const selector = [
          '.reveal-on-scroll',
          '.trm-scroll-animation',
          '.trm-blog-card',
          '.trm-card',
          '.trm-blog-categories',
          '.trm-footer-card',
          '.trm-post-content > *'
        ].join(',');

        const elements = Array.from(document.querySelectorAll(selector));
        elements.forEach(function(el, index) {
          el.classList.add('reveal-on-scroll');
          el.style.setProperty('--reveal-delay', Math.min(index % 6, 5) * 55 + 'ms');
        });

        if (!('IntersectionObserver' in window) || prefersReducedMotion) {
          elements.forEach(function(el) { el.classList.add('is-visible'); });
          return;
        }

        const observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

        elements.forEach(function(el) { observer.observe(el); });
      }

      function initCursor() {
        if (prefersReducedMotion || !window.matchMedia('(pointer: fine)').matches) return;

        const dot = document.querySelector('.cursor-dot');
        const jelly = document.querySelector('.cursor-jelly');
        if (!dot || !jelly) return;

        document.body.classList.add('reactive-cursor');

        const clickableSelector = [
          'a',
          'button',
          'input',
          'textarea',
          'select',
          '[role="button"]',
          '.article-card',
          '.trm-blog-card',
          '.trm-btn'
        ].join(',');

        const pointer = {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          lastX: window.innerWidth / 2,
          lastY: window.innerHeight / 2,
          vx: 0,
          vy: 0
        };

        const jellyState = {
          x: pointer.x,
          y: pointer.y,
          w: 42,
          h: 42,
          radius: 999,
          angle: 0,
          stretch: 0
        };

        let magneticTarget = null;
        let previousTarget = null;
        let clickPulse = 0;
        let lastFrame = performance.now();

        function clamp(value, min, max) {
          return Math.max(min, Math.min(max, value));
        }

        function lerp(current, target, amount) {
          return current + (target - current) * amount;
        }

        function getTargetRadius(target) {
          const radius = parseFloat(window.getComputedStyle(target).borderRadius);
          return Number.isFinite(radius) ? Math.min(radius + 12, 30) : 24;
        }

        function setMagneticTarget(target) {
          if (target === previousTarget) return;

          if (previousTarget) previousTarget.classList.remove('cursor-magnetic-target');
          previousTarget = target;
          magneticTarget = target;

          document.body.classList.toggle('cursor-magnetic', Boolean(target));

          if (target) {
            target.classList.remove('cursor-magnetic-target');
            void target.offsetWidth;
            target.classList.add('cursor-magnetic-target');
          }
        }

        function clearDetachedTarget() {
          if (magneticTarget && !document.documentElement.contains(magneticTarget)) {
            setMagneticTarget(null);
          }
        }

        function animateCursor(now) {
          const dt = Math.max(16, Math.min(48, now - lastFrame));
          lastFrame = now;

          pointer.vx = (pointer.x - pointer.lastX) / dt * 16.67;
          pointer.vy = (pointer.y - pointer.lastY) / dt * 16.67;
          pointer.lastX = pointer.x;
          pointer.lastY = pointer.y;

          const speed = Math.hypot(pointer.vx, pointer.vy);
          const angle = Math.atan2(pointer.vy, pointer.vx || 0.001);
          const pulseScale = 1 + clickPulse;

          clearDetachedTarget();

          let targetX = pointer.x;
          let targetY = pointer.y;
          let targetW = 42;
          let targetH = 42;
          let targetRadius = 999;
          let targetAngle = angle;
          let stretchX = 1 + clamp(speed / 42, 0, 1.1);
          let stretchY = 1 - clamp(speed / 160, 0, 0.34);
          let followEase = 0.18;

          if (magneticTarget) {
            const rect = magneticTarget.getBoundingClientRect();
            targetX = rect.left + rect.width / 2;
            targetY = rect.top + rect.height / 2;
            targetW = rect.width + 20;
            targetH = rect.height + 20;
            targetRadius = getTargetRadius(magneticTarget);
            targetAngle = 0;
            stretchX = 1;
            stretchY = 1;
            followEase = 0.34;
          }

          jellyState.x = lerp(jellyState.x, targetX, followEase);
          jellyState.y = lerp(jellyState.y, targetY, followEase);
          jellyState.w = lerp(jellyState.w, targetW, magneticTarget ? 0.38 : 0.24);
          jellyState.h = lerp(jellyState.h, targetH, magneticTarget ? 0.38 : 0.24);
          jellyState.radius = lerp(jellyState.radius, targetRadius, 0.28);
          jellyState.angle = lerp(jellyState.angle, targetAngle, 0.24);
          jellyState.stretch = lerp(jellyState.stretch, speed, 0.16);

          dot.style.transform =
            'translate3d(' + pointer.x + 'px,' + pointer.y + 'px,0) translate(-50%, -50%) scale(' + (1 + clickPulse * 1.65).toFixed(3) + ')';

          jelly.style.width = jellyState.w + 'px';
          jelly.style.height = jellyState.h + 'px';
          jelly.style.borderRadius = jellyState.radius + 'px';
          jelly.style.transform =
            'translate3d(' + jellyState.x + 'px,' + jellyState.y + 'px,0) translate(-50%, -50%) rotate(' + jellyState.angle + 'rad) scale(' +
            (stretchX * (1 + clickPulse * 0.32)).toFixed(3) + ',' +
            (stretchY * (1 + clickPulse * 0.32)).toFixed(3) + ')';

          clickPulse *= 0.82;
          if (clickPulse < 0.01) {
            clickPulse = 0;
            document.body.classList.remove('cursor-clicking');
          }

          requestAnimationFrame(animateCursor);
        }

        window.addEventListener('mousemove', function(event) {
          pointer.x = event.clientX;
          pointer.y = event.clientY;
          document.body.classList.add('cursor-ready');
        }, { passive: true });

        document.addEventListener('mouseover', function(event) {
          setMagneticTarget(event.target.closest(clickableSelector));
        });

        document.addEventListener('mouseout', function(event) {
          if (!magneticTarget) return;
          const next = event.relatedTarget;
          if (!next || !magneticTarget.contains(next)) {
            setMagneticTarget(null);
          }
        });

        document.addEventListener('pointerdown', function() {
          clickPulse = 1;
          document.body.classList.add('cursor-clicking');
        }, { passive: true });

        requestAnimationFrame(animateCursor);
      }

      function initDynamicAge() {
        const age = document.getElementById('dynamic-age');
        if (!age) return;
        age.textContent = String(new Date().getFullYear() - 2004);
      }

      function initEffects() {
        initDynamicAge();
        initDynamicSky();
        initScrollReveal();
        initCursor();
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEffects);
      } else {
        initEffects();
      }
    })();
  </script>
`);
