class Boss {
    constructor() {
        this.width = 250; this.height = 200;
        this.x = canvas.width / 2 - this.width / 2; this.y = 50;
        this.hp = 30; this.maxHp = 30; this.speed = 2; this.direction = 1; 
        this.img = new Image(); this.img.src = IMG_BOSS;
        this.shootTimer = 0;
    }
    draw() {
        ctx.save(); ctx.shadowBlur = 30; ctx.shadowColor = "red";
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height); ctx.restore();
    }
    update() {
        this.x += this.speed * this.direction;
        if (this.x <= 50 || this.x >= canvas.width - this.width - 50) this.direction *= -1;
        this.shootTimer++;
        if (this.shootTimer >= 105) { // 1.75s
            let bX = this.x + this.width / 2; let bY = this.y + this.height - 20;
            for(let i = -1; i <= 1; i++) enemies.push(new BossBullet(bX, bY, i * 1.5, 4));
            this.shootTimer = 0;
        }
    }
}