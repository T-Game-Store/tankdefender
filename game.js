const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Cấu hình hình ảnh ---
const IMG_PLAYER = 'tank.png'; 
const IMG_ENEMY = 'quai.png'; 
const IMG_ENEMY_TANK = 'quai_trau.png'; 
const IMG_ENEMY_DASH = 'quai_nhanh.png'; 
const IMG_ENEMY_BOMB = 'quai_bom.png';   
const IMG_EXPLOSION = 'explosion.png';
const IMG_BOSS = 'king_kong.png';
const IMG_BOSS_BULLET = 'king_kong_bullet.png';

// --- Biến trạng thái Game ---
let player, bullets, enemies, explosions;
let boss = null;
let bossSpawned = false;
let keys = {};
let gameActive = false, lives = 5, enemiesLeft = 20, enemiesSpawned = 0, spawnTimer = 0, currentLevel = 1;

let skillCooldown = 0; 
const SKILL_MAX_COOLDOWN = 600; 

// --- Controls Elements ---
const stick = document.getElementById('joystickStick'), base = document.getElementById('joystickBase');
const fireBtn = document.getElementById('fireButton'), skillBtn = document.getElementById('skillButton');
const joystickZone = document.getElementById('joystickZone'), fireButtonZone = document.getElementById('fireButtonZone'), skillButtonZone = document.getElementById('skillButtonZone');

let isDragging = false, isFiring = false, joystickData = { x: 0, y: 0 };

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (player) { player.x = canvas.width / 2; player.y = canvas.height - 150; }
}
window.addEventListener('resize', resize);
resize();

// --- CLASSES ---

class Player {
    constructor() {
        this.size = Math.min(canvas.width, canvas.height) * 0.12;
        this.width = this.size; this.height = this.size;
        this.x = canvas.width / 2; this.y = canvas.height - 150;
        this.speed = 5; this.angle = 0;
        this.img = new Image(); this.img.src = IMG_PLAYER;
        this.shootTimer = 0; this.radius = this.size * 0.35; 
    }
    draw() {
        ctx.save();
        const grad = ctx.createRadialGradient(this.x, this.y, 10, this.x, this.y, 180);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)'); grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad; ctx.globalCompositeOperation = 'screen';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        ctx.save();
        ctx.translate(this.x, this.y); ctx.rotate(this.angle);
        ctx.shadowBlur = 15; ctx.shadowColor = "red";
        ctx.drawImage(this.img, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
    }
    update() {
        let dx = 0, dy = 0;
        if (keys['w'] || keys['arrowup']) dy = -this.speed;
        if (keys['s'] || keys['arrowdown']) dy = this.speed;
        if (keys['a'] || keys['arrowleft']) dx = -this.speed;
        if (keys['d'] || keys['arrowright']) dx = this.speed;
        if (dx === 0 && dy === 0 && (joystickData.x !== 0 || joystickData.y !== 0)) {
            dx = joystickData.x * this.speed; dy = joystickData.y * this.speed;
        }
        if (this.y + dy > canvas.height * 0.35 && this.y + dy < canvas.height - 70) this.y += dy;
        if (this.x + dx > 50 && this.x + dx < canvas.width - 50) this.x += dx;
        if (dx !== 0 || dy !== 0) this.angle = Math.atan2(dy, dx) + Math.PI / 2;

        if (keys['g'] && skillCooldown <= 0 && currentLevel >= 3) {
            this.usePiercingShot(); skillCooldown = SKILL_MAX_COOLDOWN; keys['g'] = false;
        }
        if (keys['f'] || isFiring) {
            this.shootTimer++;
            if (this.shootTimer >= 12) {
                bullets.push(new Bullet(this.x, this.y, Math.sin(this.angle) * 12, -Math.cos(this.angle) * 12));
                this.shootTimer = 0;
            }
        } else { this.shootTimer = 12; }
    }
    usePiercingShot() {
        let b = new Bullet(this.x, this.y, Math.sin(this.angle) * 15, -Math.cos(this.angle) * 15);
        b.isPiercing = true; b.size = 10; bullets.push(b);
    }
}

class Bullet {
    constructor(x, y, vx, vy) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.size = 4;
        this.isPiercing = false; this.hitEnemies = []; 
    }
    draw() {
        ctx.save();
        ctx.fillStyle = this.isPiercing ? "#00ffff" : "#ff0000";
        ctx.shadowBlur = 15; ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    update() { this.x += this.vx; this.y += this.vy; }
}

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
        if (this.shootTimer >= 105) { // 1.75 giây (60fps * 1.75 = 105)
            let bX = this.x + this.width / 2; let bY = this.y + this.height - 20;
            for(let i = -1; i <= 1; i++) enemies.push(new BossBullet(bX, bY, i * 1.5, 4));
            this.shootTimer = 0;
        }
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

// --- ENGINE & CONTROLS ---

function handleJoystick(e) {
    if (!isDragging) return;
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2, centerY = rect.top + rect.height / 2;
    const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
    const clientY = (e.touches ? e.touches[0].clientY : e.clientY);
    const deltaX = clientX - centerX, deltaY = clientY - centerY;
    const maxDist = rect.width / 2;
    const dist = Math.min(Math.sqrt(deltaX**2 + deltaY**2), maxDist);
    const angle = Math.atan2(deltaY, deltaX);
    stick.style.transform = `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px)`;
    joystickData.x = (Math.cos(angle) * dist) / maxDist; joystickData.y = (Math.sin(angle) * dist) / maxDist;
}

base.addEventListener('mousedown', () => isDragging = true);
base.addEventListener('touchstart', (e) => { isDragging = true; e.preventDefault(); }, {passive: false});
window.addEventListener('mousemove', handleJoystick);
window.addEventListener('touchmove', handleJoystick, {passive: false});
window.addEventListener('mouseup', () => { isDragging = false; stick.style.transform = 'translate(0,0)'; joystickData = {x:0, y:0}; });
window.addEventListener('touchend', () => { isDragging = false; stick.style.transform = 'translate(0,0)'; joystickData = {x:0, y:0}; });
fireBtn.addEventListener('mousedown', () => isFiring = true);
fireBtn.addEventListener('touchstart', (e) => { isFiring = true; e.preventDefault(); }, {passive: false});
window.addEventListener('mouseup', () => isFiring = false);
window.addEventListener('touchend', () => isFiring = false);
skillBtn.addEventListener('pointerdown', (e) => { if (skillCooldown <= 0 && currentLevel >= 3) { keys['g'] = true; } e.preventDefault(); });

function animate() {
    if (!gameActive) return;
    requestAnimationFrame(animate);
    ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

    // Skill Cooldown UI
    if (skillCooldown > 0) {
        skillCooldown--;
        document.getElementById('skillCooldownOverlay').style.height = (skillCooldown / SKILL_MAX_COOLDOWN) * 100 + "%";
        document.getElementById('skillTimerText').innerText = Math.ceil(skillCooldown/60) + "s";
    } else {
        document.getElementById('skillCooldownOverlay').style.height = "0%";
        document.getElementById('skillTimerText').innerText = "G";
    }

    player.update(); player.draw();
    explosions.forEach((ex, i) => { ex.update(); ex.draw(); if (ex.life <= 0) explosions.splice(i, 1); });
    bullets.forEach((b, i) => {
        b.update(); b.draw();
        if (b.y < -50 || b.y > canvas.height + 50 || b.x < -50 || b.x > canvas.width + 50) bullets.splice(i, 1);
    });

    // --- LOGIC SPAWN BOSS LEVEL 4 ---
    spawnTimer++;
    if (currentLevel === 4 && !bossSpawned && spawnTimer > 300) {
        boss = new Boss(); bossSpawned = true;
        document.getElementById('bossHUD').classList.remove('hidden');
    }

    if (boss) {
        boss.update(); boss.draw();
        bullets.forEach((b, j) => {
            if (b.x > boss.x && b.x < boss.x + boss.width && b.y > boss.y && b.y < boss.y + boss.height) {
                // Sát thương từ đạn thường là 1, đạn Skill xuyên thấu là 2
                let damage = b.isPiercing ? 2 : 1;
                boss.hp -= damage; bullets.splice(j, 1);
                
                let hpP = (boss.hp / boss.maxHp) * 100;
                document.getElementById('bossHPBar').style.width = hpP + "%";
                document.getElementById('bossHPText').innerText = boss.hp + "/" + boss.maxHp;
                
                if (boss.hp <= 0) {
                    explosions.push(new Explosion(boss.x + boss.width/2, boss.y + boss.height/2, boss.width));
                    boss = null; enemiesLeft = 0; updateHUD(); gameOver(true);
                }
            }
        });
    }

    // Spawn quái thường
    const maxSpawn = currentLevel === 4 ? 35 : (currentLevel * 10 + 10);
    if (enemiesSpawned < maxSpawn && spawnTimer % 100 === 0) {
        let type = 'normal'; let r = Math.random();
        if (currentLevel >= 2 && r < 0.25) type = 'tank';
        if (currentLevel >= 3) { if (r > 0.7 && r < 0.85) type = 'dash'; if (r >= 0.85) type = 'bomb'; }
        enemies.push(new Enemy(type));
        enemiesSpawned++; 
    }

    enemies.forEach((en, i) => {
        en.update(); en.draw();
        let dP = Math.sqrt((en.x + en.width/2 - player.x)**2 + (en.y + en.height/2 - player.y)**2);
        if (dP < player.radius + en.width/2.5) {
            explosions.push(new Explosion(en.x + en.width/2, en.y + en.height/2, en.width, en.type === 'bomb'));
            lives -= (en.damage || 1); enemies.splice(i, 1); enemiesLeft--; updateHUD();
            if (lives <= 0) gameOver(false); return;
        }
        bullets.forEach((b, j) => {
            if (b.x > en.x && b.x < en.x + en.width && b.y > en.y && b.y < en.y + en.height) {
                if (b.isPiercing && b.hitEnemies.includes(en)) return;
                
                // Sát thương từ đạn thường là 1, đạn Skill xuyên thấu là 2
                let damage = b.isPiercing ? 2 : 1;
                en.hp -= damage; 

                if (b.isPiercing) b.hitEnemies.push(en); else bullets.splice(j, 1);
                
                if (en.hp <= 0) {
                    explosions.push(new Explosion(en.x + en.width/2, en.y + en.height/2, en.width, en.type === 'bomb'));
                    enemies.splice(i, 1); enemiesLeft--; updateHUD();
                    if (enemiesLeft <= 0 && !boss) gameOver(true);
                }
            }
        });
        if (en && en.y > canvas.height - 75 && en.type !== 'bullet') {
            enemies.splice(i, 1); lives--; enemiesLeft--; updateHUD();
            if (lives <= 0) gameOver(false); else if (enemiesLeft <= 0 && !boss) gameOver(true);
        }
    });
}

function initGame(level) {
    currentLevel = level; resize();
    player = new Player(); bullets = []; enemies = []; explosions = [];
    boss = null; bossSpawned = false;
    lives = level === 4 ? 10 : 5; 
    enemiesLeft = level === 4 ? 35 : (level * 10 + 10);
    enemiesSpawned = 0; spawnTimer = 0; skillCooldown = 0;
    gameActive = true;
    
    document.getElementById('bossHUD').classList.add('hidden');
    document.getElementById('bossHPBar').style.width = "100%";
    document.getElementById('bossHPText').innerText = "30/30";

    [joystickZone, fireButtonZone].forEach(z => z.classList.remove('hidden'));
    if (level >= 3) skillButtonZone.classList.remove('hidden'); else skillButtonZone.classList.add('hidden');
    updateHUD(); animate();
}

function updateHUD() {
    document.getElementById('enemyCount').innerText = Math.max(0, enemiesLeft);
    const container = document.getElementById('livesContainer');
    container.innerHTML = '';
    for (let i = 0; i < lives; i++) {
        const heart = document.createElement('div'); heart.className = 'heart';
        container.appendChild(heart);
    }
}

function gameOver(isWin) {
    gameActive = false;
    document.getElementById('endScreen').style.display = 'flex';
    [joystickZone, fireButtonZone, skillButtonZone].forEach(z => z.classList.add('hidden'));
    const status = document.getElementById('endStatus');
    const nextBtn = document.getElementById('nextLevelBtn');
    if (isWin) { status.innerText = "MISSION ACCOMPLISHED"; status.style.color = "#4ade80"; nextBtn.classList.remove('hidden'); }
    else { status.innerText = "MISSION FAILED"; status.style.color = "#ef4444"; nextBtn.classList.add('hidden'); }
}

function showMenu() { 
    document.getElementById('mainMenu').style.display = 'flex'; 
    ['levelSelect', 'endScreen', 'gameHUD'].forEach(id => document.getElementById(id).style.display = 'none');
    [joystickZone, fireButtonZone, skillButtonZone].forEach(z => z.classList.add('hidden'));
    gameActive = false; 
}
function showLevelSelect() { document.getElementById('mainMenu').style.display = 'none'; document.getElementById('levelSelect').style.display = 'flex'; }
function startGame(level) { document.getElementById('levelSelect').style.display = 'none'; document.getElementById('gameHUD').style.display = 'block'; initGame(level); }
function restartLevel() { document.getElementById('endScreen').style.display = 'none'; initGame(currentLevel); }
function nextLevel() { document.getElementById('endScreen').style.display = 'none'; currentLevel++; initGame(currentLevel); }

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
window.addEventListener("keydown", function(e) { if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) e.preventDefault(); }, false);
