class Player {
  constructor() {
    const config = SKINS_CONFIG[currentSkinKey];
    this.size = Math.min(canvas.width, canvas.height) * 0.12;
    this.width = this.size;
    this.height = this.size;
    this.x = canvas.width / 2;
    this.y = canvas.height - 150;
    this.speed = 5 + config.speedBoost;
    this.angle = 0;

    this.img = new Image();
    this.img.src = config.img;

    this.shootSfx = new Audio(config.shootSound);
    this.skillSfx = new Audio(config.skillSound);

    this.shootTimer = 0;
    this.radius = this.size * 0.35;
  }
  draw() {
    ctx.save();
    const grad = ctx.createRadialGradient(
      this.x,
      this.y,
      10,
      this.x,
      this.y,
      180
    );
    grad.addColorStop(0, "rgba(255, 255, 255, 0.15)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.globalCompositeOperation = "screen";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.shadowBlur = 15;
    ctx.shadowColor = "red";
    ctx.drawImage(
      this.img,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
    ctx.restore();
  }
  update() {
    let moveX = 0,
      moveY = 0;
    if (keys["w"] || keys["arrowup"]) moveY -= 1;
    if (keys["s"] || keys["arrowdown"]) moveY += 1;
    if (keys["a"] || keys["arrowleft"]) moveX -= 1;
    if (keys["d"] || keys["arrowright"]) moveX += 1;
    if (joystickData.x !== 0 || joystickData.y !== 0) {
      moveX = joystickData.x;
      moveY = joystickData.y;
    }

    if (moveX !== 0 || moveY !== 0) {
      this.angle = Math.atan2(moveY, moveX) + Math.PI / 2;
      let length = Math.sqrt(moveX * moveX + moveY * moveY);
      this.x += (moveX / length) * this.speed;
      this.y += (moveY / length) * this.speed;
    }
    this.x = Math.max(50, Math.min(canvas.width - 50, this.x));
    this.y = Math.max(
      canvas.height * 0.35,
      Math.min(canvas.height - 70, this.y)
    );

    if (keys["g"] && skillCooldown <= 0 && currentLevel >= 3) {
      this.usePiercingShot();
      skillCooldown = SKILL_MAX_COOLDOWN;
      keys["g"] = false;
    }

    if (keys["f"] || isFiring) {
      this.shootTimer++;
      if (this.shootTimer >= 12) {
        bullets.push(
          new Bullet(
            this.x,
            this.y,
            Math.sin(this.angle) * 12,
            -Math.cos(this.angle) * 12
          )
        );

        let sound = this.shootSfx.cloneNode(); 
        sound.volume = 0.5;
        sound.playbackRate = 2.5;
        sound.play();

        this.shootTimer = 0;
      }
    } else {
      this.shootTimer = 12;
    }
  }
  usePiercingShot() {
    let b = new Bullet(
      this.x,
      this.y,
      Math.sin(this.angle) * 15,
      -Math.cos(this.angle) * 15
    );
    b.isPiercing = true;
    b.size = 10;
    bullets.push(b);

    this.skillSfx.volume = 0.9;
    this.skillSfx.playbackRate = 1.2;
    this.skillSfx.play();
  }
}

