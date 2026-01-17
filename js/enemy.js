class Enemy {
    constructor(type = 'normal') {
        this.type = type;
        this.frozenTimer = 0; 
        this._dead = false;
        const baseSize = Math.min(canvas.width, canvas.height) * 0.15;
        this.img = new Image();

        if (type === 'tank') {
            this.hp = 5; this.maxHp = 5; this.speed = 1.0; this.width = baseSize * 1.3; this.height = baseSize * 1.3;
            this.img.src = IMG_ENEMY_TANK; this.damage = 2;
        } else if (type === 'dash') {
            this.hp = 3; this.maxHp = 3; this.speed = 1.7; this.width = baseSize; this.height = baseSize;
            this.img.src = IMG_ENEMY_DASH; this.damage = 1;
        } else if (type === 'bomb') {
            this.hp = 2; this.maxHp = 2; this.speed = 1.0; this.width = baseSize; this.height = baseSize;
            this.img.src = IMG_ENEMY_BOMB; this.damage = 3;
        } else if (type === 'skeleton') {
            this.hp = 2; this.maxHp = 2; this.speed = 1.0; this.width = baseSize * 1.2; this.height = baseSize * 1.2;
            this.img.src = 'skeleton.png'; this.damage = 1;
        } else {
            this.hp = 3; this.maxHp = 3; this.speed = 1.0; this.width = baseSize; this.height = baseSize;
            this.img.src = IMG_ENEMY; this.damage = 1;
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
        if (this.frozenTimer > 0) {
            ctx.shadowBlur = 20; ctx.shadowColor = "#00ffff";
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(this.x + 5, this.y + 5); ctx.lineTo(this.x + this.width - 10, this.y + this.height - 5);
            ctx.moveTo(this.x + this.width - 5, this.y + 10); ctx.lineTo(this.x + 10, this.y + this.height - 10);
            ctx.stroke();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(this.x, this.y, this.width, this.height);
            let pulse = Math.sin(Date.now() / 150) * 0.2 + 0.3;
            ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`; ctx.fillRect(this.x, this.y, this.width, this.height);
        } else {
            ctx.shadowBlur = 0; ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        }

        if (this.hp > 0 && this.type !== 'bullet') {
            const barW = this.width * 0.8; const barH = 6;
            const barX = this.x + (this.width - barW) / 2; const barY = this.y - 12;
            ctx.fillStyle = "rgba(255, 0, 0, 0.7)"; ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = "#4ade80"; ctx.fillRect(barX, barY, (this.hp / this.maxHp) * barW, barH);
            ctx.strokeStyle = "white"; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barW, barH);
        }
        ctx.restore();
    }

    update() {
        if (this.frozenTimer > 0) {
            this.frozenTimer--;
            if (this.frozenTimer === 1) {
                explosions.push(new Explosion(this.x + this.width/2, this.y + this.height/2, this.width / 2, false, "#ffffff"));
            }
            return; 
        }
        
        if (this.type === 'dash') {
            this.dashTimer++; 
            if (this.dashTimer > 150 && Math.random() < 0.3) { 
                this.x += (Math.random() - 0.5) * 120; this.dashTimer = 0; 
            }
        }
        
        const angle = Math.atan2(canvas.height - 50 - this.y, canvas.width / 2 - this.x);
        this.x += Math.cos(angle) * this.speed; 
        this.y += Math.sin(angle) * this.speed;
    }
}

class SkeletonBullet {
    constructor(x, y, vx, vy) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.width = 50; this.height = 50;
        this.type = 'bullet';
        this.damage = 1;
        this._dead = false;
        this.img = new Image();
        this.img.src = 'bone_bullet.png';
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.y > canvas.height + 50 || this.y < -100 || this.x < -100 || this.x > canvas.width + 100) {
            this._dead = true;
        }
    }

    draw() {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
}

class Skeleton extends Enemy {
    constructor() {
        super('skeleton');
        this.hp = 2;
        this.maxHp = 2;
        this.speed = 1.1; 
        this.shootTimer = 0;
        const baseSize = Math.min(canvas.width, canvas.height) * 0.15;
        this.width = baseSize * 1.2;
        this.height = baseSize * 1.2;
    }

    update() {
        super.update();
        if (this.frozenTimer > 0 || this._dead) return;

        this.shootTimer++;
        if (this.shootTimer >= 50) { 
            const bulletSpeed = 10;
            const originX = this.x + this.width / 2;
            const originY = this.y + this.height / 2;
            const dx = player.x - originX;
            const dy = player.y - originY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const timeToTarget = dist / bulletSpeed;

            let pMoveX = 0, pMoveY = 0;
            if (keys["w"] || keys["arrowup"]) pMoveY -= 1;
            if (keys["s"] || keys["arrowdown"]) pMoveY += 1;
            if (keys["a"] || keys["arrowleft"]) pMoveX -= 1;
            if (keys["d"] || keys["arrowright"]) pMoveX += 1;
            if (joystickData.x !== 0 || joystickData.y !== 0) {
                pMoveX = joystickData.x; pMoveY = joystickData.y;
            }
            
            let pVx = 0, pVy = 0;
            if (pMoveX !== 0 || pMoveY !== 0) {
                let pLen = Math.sqrt(pMoveX * pMoveX + pMoveY * pMoveY);
                pVx = (pMoveX / pLen) * player.speed;
                pVy = (pMoveY / pLen) * player.speed;
            }

            const targetX = player.x + (pVx * timeToTarget);
            const targetY = player.y + (pVy * timeToTarget);
            
            const angle = Math.atan2(targetY - originY, targetX - originX);
            const vx = Math.cos(angle) * bulletSpeed;
            const vy = Math.sin(angle) * bulletSpeed;
            
            enemies.push(new SkeletonBullet(originX - 15, originY - 15, vx, vy));
            this.shootTimer = 0;
        }
    }
}
