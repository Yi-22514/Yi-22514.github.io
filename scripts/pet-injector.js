hexo.extend.injector.register('body_end', `
  <style>
    .pets-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 60px; /* Height of the top bar */
      z-index: 999999;
      pointer-events: none;
      overflow: hidden;
    }
    .pet-mover {
      position: absolute;
      top: 15px; /* Vertical alignment in the top bar */
      left: 0;
      width: 30px;
      height: 30px;
      transition: transform 0.1s linear; /* smooth out tiny hiccups */
    }
    .pet-emoji {
      font-size: 26px;
      transform-origin: bottom center;
      display: inline-block;
    }
    /* 不同的动作状态 */
    .pet-emoji.walk {
      animation: petWalk 0.4s infinite alternate ease-in-out;
    }
    .pet-emoji.run {
      /* 跑步时有强烈的挤压拉伸(squash & stretch)效果 */
      animation: petRun 0.25s infinite alternate cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    .pet-emoji.idle {
      /* 停顿休息时的呼吸感 */
      animation: petIdle 1.5s infinite alternate ease-in-out;
    }

    /* 正常散步: 轻微弹跳 */
    @keyframes petWalk {
      0% { transform: translateY(0) rotate(-6deg); }
      100% { transform: translateY(-5px) rotate(6deg); }
    }
    /* 小跑: 幅度更大的跳跃和形变 */
    @keyframes petRun {
      0% { transform: translateY(0) scaleY(0.85) scaleX(1.05) rotate(-10deg); }
      100% { transform: translateY(-10px) scaleY(1.1) scaleX(0.95) rotate(10deg); }
    }
    /* 停顿徘徊: 微微起伏 */
    @keyframes petIdle {
      0% { transform: scaleY(1) translateY(0); }
      100% { transform: scaleY(0.95) translateY(1px); }
    }
  </style>

  <script>
    (function() {
      // Create pet container
      const container = document.createElement('div');
      container.className = 'pets-container';
      document.body.appendChild(container);

      // 更多的可爱动物大集合
      const pets = [
        '🐕', '🐈', '🐈‍⬛', '🐩', '🐾', // 经典的猫狗
        '🐇', '🦊', '🐢', '🦆', '🦢', // 兔子、狐狸、乌龟、鸭子、天鹅
        '🐑', '🐎', '🦖', '🦔', '🦡', // 小羊、马、霸王龙、小刺猬、蜜獾
        '🐅', '🐆', '🐁', '🐿️', '🐓'  // 老虎、豹子、老鼠、松鼠、公鸡
      ];      
      function spawnPet() {
        const mover = document.createElement('div');
        mover.className = 'pet-mover';
        
        const wrapper = document.createElement('div');
        
        const inner = document.createElement('div');
        inner.innerText = pets[Math.floor(Math.random() * pets.length)];
        inner.style.display = 'inline-block';
        inner.style.transition = 'transform 0.3s'; // 当它回头时会有平滑转向效果
        
        wrapper.appendChild(inner);
        mover.appendChild(wrapper);
        container.appendChild(mover);
        
        // 动物基础属性设定
        let isRightToLeft = Math.random() > 0.5;
        let direction = isRightToLeft ? -1 : 1; // 1向右, -1向左
        let currentX = direction === 1 ? -50 : window.innerWidth + 50;
        
        let state = 'walk'; // 状态: walk, run, idle
        let stateTimer = 0;
        let speed = 0;
        let isLookingBack = false;

        // 随机分配一个独立的状态
        function pickState() {
          const r = Math.random();
          if (r < 0.25) { 
            // 发呆停顿
            state = 'idle'; 
            speed = 0; 
            stateTimer = 1000 + Math.random() * 3000; 
            // 发呆时有一小半几率是在"四处张望"(回头看)
            isLookingBack = Math.random() < 0.4;
          }
          else if (r < 0.5) { 
            // 突然快跑飞奔
            state = 'run'; 
            speed = 250 + Math.random() * 200; 
            stateTimer = 1000 + Math.random() * 2000; 
            isLookingBack = false;
          }
          else { 
            // 悠闲溜达
            state = 'walk'; 
            speed = 60 + Math.random() * 60; 
            stateTimer = 2000 + Math.random() * 4000; 
            isLookingBack = false;
          }
          
          wrapper.className = 'pet-emoji ' + state;
          
          // 设置面部朝向 (emoji预设朝左，往右走时需要水平翻转)
          // 如果isLookingBack为真，则朝向反转
          let faceDirection = direction;
          if (isLookingBack) faceDirection = -direction;
          
          if (faceDirection === 1) { 
              inner.style.transform = 'scaleX(-1)';
          } else {
              inner.style.transform = 'scaleX(1)';
          }
        }
        
        pickState();
        let lastTime = null;

        function animate(time) {
          if (!lastTime) lastTime = time;
          let dt = (time - lastTime) / 1000;
          lastTime = time;
          
          // 防止切后台导致dt过大出现瞬间穿越
          if (dt > 0.1) dt = 0.1;

          // 扣除倒计时，倒计时结束切换状态
          stateTimer -= dt * 1000;
          if (stateTimer <= 0) {
            pickState();
          }

          // 更新坐标
          currentX += speed * direction * dt;
          mover.style.transform = \`translateX(\${currentX}px)\`;

          // 出界销毁
          if ((direction === 1 && currentX > window.innerWidth + 50) || 
              (direction === -1 && currentX < -50)) {
            mover.remove();
          } else {
            requestAnimationFrame(animate);
          }
        }
        
        requestAnimationFrame(animate);

        // 每隔一段时间再次生成新的动物
        setTimeout(spawnPet, 3000 + Math.random() * 6000);
      }

      // 初始化生成数量
      setTimeout(spawnPet, 500);
      setTimeout(spawnPet, 2500);
      setTimeout(spawnPet, 6000);
      
    })();
  </script>
`);
