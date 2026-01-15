class Bullet {
    constructor(x, y, vx, vy) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.size = 4;
        this.isPiercing = false; this.hitEnemies = []; 
    }
    draw() {
        ctx.save();
        ctx.fillStyle = this.isPiercing ? "#00ffff" : "#ff0000"; ctx.shadowBlur = 15; ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    update() { this.x += this.vx; this.y += this.vy; }
}

class BossBullet {
    constructor(x, y, vx, vy) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.width = 50; this.height = 50; this.damage = 1; this.type = 'bullet';
        this.img = new Image(); this.img.src = IMG_BOSS_BULLET;
    }
    draw() { ctx.drawImage(this.img, this.x, this.y, this.width, this.height); }
    update() { this.x += this.vx; this.y += this.vy; }
}