class Explosion {
    constructor(x, y, size, isBomb = false) {
        this.x = x; this.y = y; this.size = size; this.life = 20; this.opacity = 1;
        this.img = new Image(); this.img.src = IMG_EXPLOSION;
        if (isBomb) this.bombDetonate();
    }
    bombDetonate() {
        enemies.forEach(en => {
            let d = Math.sqrt((en.x - this.x)**2 + (en.y - this.y)**2);
            if (d < 220) en.hp = 0;
        });
        document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 200);
    }
    draw() {
        ctx.save(); ctx.globalAlpha = this.opacity;
        ctx.drawImage(this.img, this.x - this.size/2, this.y - this.size/2, this.size, this.size); ctx.restore();
    }
    update() { this.life--; this.opacity = this.life / 20; }
}