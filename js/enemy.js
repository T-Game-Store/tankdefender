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
        if (this.frozenTimer > 0) {
        // 1. Tạo hiệu ứng phát sáng neon quanh quái vật
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#00ffff";
        
        // 2. Vẽ hình ảnh quái vật gốc
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);

        // 3. Phủ lớp màu xanh băng giá (Dùng source-atop để chỉ phủ lên hình ảnh quái)
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 4. Vẽ các vết nứt băng (vẽ các đường line trắng ngẫu nhiên)
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        // Đường nứt 1
        ctx.moveTo(this.x + 5, this.y + 5);
        ctx.lineTo(this.x + this.width - 10, this.y + this.height - 5);
        // Đường nứt 2
        ctx.moveTo(this.x + this.width - 5, this.y + 10);
        ctx.lineTo(this.x + 10, this.y + this.height - 10);
        ctx.stroke();

        // 5. Vẽ viền băng dày xung quanh
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // 6. Hiệu ứng nhấp nháy hơi lạnh (Pulsing Effect)
        let pulse = Math.sin(Date.now() / 150) * 0.2 + 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
        ctx.fillRect(this.x, this.y, this.width, this.height);

    } else {
        // Vẽ quái vật bình thường khi không bị đóng băng
        ctx.shadowBlur = 0; // Đảm bảo không bị lem hiệu ứng sang quái khác
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
        ctx.restore();
        // Thêm vào cuối hàm draw() của Enemy/Boss

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
            this.dashTimer++; if (this.dashTimer > 150 && Math.random() < 0.3) { this.x += (Math.random() - 0.5) * 120; this.dashTimer = 0; }
        }
        const angle = Math.atan2(canvas.height - 50 - this.y, canvas.width / 2 - this.x);
        this.x += Math.cos(angle) * this.speed; this.y += Math.sin(angle) * this.speed;
       
    }
}
