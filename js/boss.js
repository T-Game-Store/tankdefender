class Boss {
    constructor() {
        const config = LEVEL_CONFIG[currentLevel];
        this.width = 250; this.height = 200;
        this.x = canvas.width / 2 - this.width / 2; this.y = 50;
        this.hp = config.bossHp || 30; 
        this.maxHp = this.hp;
        this.speed = 2; this.direction = 1; 
        this.img = new Image(); this.img.src = IMG_BOSS;
        
        this.shootTimer = 0;
        this.earthquakeTimer = 0; 
        this.isSmashing = false; 
    }

    draw() {
        ctx.save();
        if (this.isSmashing) {
            ctx.shadowBlur = 50; ctx.shadowColor = "orange";
        } else {
            ctx.shadowBlur = 30; ctx.shadowColor = "red";
        }
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        ctx.restore();
    }

update() {
    if (currentLevel === 5 && !this.isSmashing) {
        this.earthquakeTimer++;
        if (this.earthquakeTimer >= 600) {
            this.performEarthquake();
            this.earthquakeTimer = 0;
        }
    }
    if (this.isSmashing) return; 

    this.x += this.speed * this.direction;
    if (this.x <= 50 || this.x >= canvas.width - this.width - 50) this.direction *= -1;

    this.shootTimer++;
    if (this.shootTimer >= 105) {
        let bX = this.x + this.width / 2;
        let bY = this.y + this.height - 20;
        for(let i = -1; i <= 1; i++) enemies.push(new BossBullet(bX, bY, i * 1.5, 4));
        this.shootTimer = 0;
    }
}

performEarthquake() {
    this.isSmashing = true;
    
    setTimeout(() => {
        if (!gameActive || isPaused) {
            this.isSmashing = false;
            return;
        }

        const crackX = this.x + this.width / 2;
        explosions.push(new GroundShatter(crackX));

        bossSkillSound.currentTime = 0; 
        bossSkillSound.play();

        document.body.classList.add('shake-heavy');
        if (Math.abs(player.x - crackX) < 70) { 
            lives -= 3;
            updateHUD();
            if (lives <= 0) gameOver(false);
        }

        setTimeout(() => {
            document.body.classList.remove('shake-heavy');
            document.body.style.transform = "none";
            this.isSmashing = false;
        }, 1000);
        
    }, 500); 
}
}
