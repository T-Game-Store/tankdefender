class Bullet {
    constructor(x, y, dx, dy, isFreezing = false, angle = 0) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        
        this.angle = angle; 
        
        this.isFreezing = isFreezing === true; 
        this.isPiercing = (currentSkinKey !== 'frozen' && isFreezing === false && keys['g']); 
        
        this.hitEnemies = [];
        this._dead = false;

        if (this.isFreezing) {
            this.size = 35; 
            this.img = new Image();
            this.img.src = 'frozen_bullet.png';
        } else {
            this.size = this.isPiercing ? 10 : 5;
        }
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
    }

    draw() {
        ctx.save();
        
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (this.isFreezing) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#00ffff";
            if (this.img.complete) {
                ctx.drawImage(this.img, -this.size, -this.size, this.size * 2, this.size * 2);
            }
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.isPiercing ? "blue" : "red";
            ctx.fill();
            ctx.closePath();
        }
        
        ctx.restore();
    }
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
