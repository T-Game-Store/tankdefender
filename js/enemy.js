class Enemy {
    constructor(type = 'normal') {
        this.type = type;
        const baseSize = Math.min(canvas.width, canvas.height) * 0.15;
        if (type === 'tank') {
            this.hp = 5; this.maxHp = 5; this.speed = 1.0; this.width = baseSize * 1.3; this.height = baseSize * 1.3;
            this.img = new Image(); this.img.src = IMG_ENEMY_TANK; this.damage = 2;
        } else if (type === 'dash') {
            this.hp = 3; this.maxHp = 3; this.speed = 1.7; this.width = baseSize; this.height = baseSize;
            this.img = new Image(); this.img.src = IMG_ENEMY_DASH; this.damage = 1;
        } else if (type === 'bomb') {
            this.hp = 2; this.maxHp = 2; this.speed = 1.0; this.width = baseSize; this.height = baseSize;
            this.img = new Image(); this.img.src = IMG_ENEMY_BOMB; this.damage = 3;
        } else {
            this.hp = 3; this.maxHp = 3; this.speed = 1.0; this.width = baseSize; this.height = baseSize;
            this.img = new Image(); this.img.src = IMG_ENEMY; this.damage = 1;
        }
        this.dashTimer = 0;
        if (currentLevel >= 2) {
            this.y = Math.random() < 0.5 ? canvas.height * 0.2 : canvas.height * 0.5;
            this.x = Math.random() < 0.5 ? -100 : canvas.width + 100;
        } else {
            const side = Math.floor(Math.random() * 3);
            if (side === 0) { this.x = Math.random() * canvas.width; this.y = -100; }
            else if (side === 1) { this.x = canvas.width + 100; this.y = Math.random() * 300; }
            else { this.x = -100; this.y = Math.random() * 300; }
        }
    }
    draw() {
        ctx.save();
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        if (this.hp > 0) {
            const barW = this.width * 0.8; const barH = 6;
            const barX = this.x + (this.width - barW) / 2; const barY = this.y - 12;
            ctx.fillStyle = "rgba(255, 0, 0, 0.7)"; ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = "#4ade80"; ctx.fillRect(barX, barY, (this.hp / this.maxHp) * barW, barH);
            ctx.strokeStyle = "white"; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barW, barH);
        }
        ctx.restore();
    }
    update() {
        if (this.type === 'dash') {
            this.dashTimer++; if (this.dashTimer > 150 && Math.random() < 0.3) { this.x += (Math.random() - 0.5) * 120; this.dashTimer = 0; }
        }
        const angle = Math.atan2(canvas.height - 50 - this.y, canvas.width / 2 - this.x);
        this.x += Math.cos(angle) * this.speed; this.y += Math.sin(angle) * this.speed;
    }
}