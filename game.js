const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const IMG_PLAYER = 'tank.png'; 
const IMG_ENEMY = 'quai.png'; 
const IMG_ENEMY_TANK = 'quai_trau.png'; 
const IMG_ENEMY_DASH = 'quai_nhanh.png'; 
const IMG_ENEMY_BOMB = 'quai_bom.png';   
const IMG_EXPLOSION = 'explosion.png';

let player, bullets, enemies, explosions;
let keys = {};
let gameActive = false, lives = 5, enemiesLeft = 20, enemiesSpawned = 0, spawnTimer = 0, currentLevel = 1;

let skillCooldown = 0; 
const SKILL_MAX_COOLDOWN = 600; 

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

        // Xử lý Skill (Nhấn phím G hoặc bấm nút Skill)
        if (keys['g'] && skillCooldown <= 0 && currentLevel >= 3) {
            this.usePiercingShot();
            skillCooldown = SKILL_MAX_COOLDOWN;
            keys['g'] = false; // Ngắt nhấn giữ để không bắn liên tục
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
        b.isPiercing = true; b.size = 10;
        bullets.push(b);
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
        this.hp = 1; this.speed = 0.8; this.width = baseSize; this.height = baseSize; this.damage = 1;
        this.dashTimer = 0;

        if (type === 'tank') {
            this.hp = 2; this.speed = 0.5; this.width = baseSize * 1.3; this.height = baseSize * 1.3;
            this.img = new Image(); this.img.src = IMG_ENEMY_TANK; this.damage = 2;
        } else if (type === 'dash') {
            this.speed = 1.8; this.img = new Image(); this.img.src = IMG_ENEMY_DASH;
        } else if (type === 'bomb') {
            this.img = new Image(); this.img.src = IMG_ENEMY_BOMB; this.damage = 3;
        } else {
            this.img = new Image(); this.img.src = IMG_ENEMY;
        }

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
        if (this.type === 'tank') ctx.filter = "contrast(1.5)";
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        ctx.restore();
    }
    update() {
        if (this.type === 'dash') {
            this.dashTimer++;
            if (this.dashTimer > 150 && Math.random() < 0.3) {
                this.x += (Math.random() - 0.5) * 120; this.dashTimer = 0;
            }
        }
        const angle = Math.atan2(canvas.height - 50 - this.y, canvas.width / 2 - this.x);
        this.x += Math.cos(angle) * this.speed; this.y += Math.sin(angle) * this.speed;
    }
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
            if (d < 200) en.hp = 0;
        });
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 200);
    }
    draw() {
        ctx.save(); ctx.globalAlpha = this.opacity;
        ctx.drawImage(this.img, this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.restore();
    }
    update() { this.life--; this.opacity = this.life / 20; }
}

// --- CONTROLS ENGINE ---

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
    joystickData.x = (Math.cos(angle) * dist) / maxDist;
    joystickData.y = (Math.sin(angle) * dist) / maxDist;
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

// FIX LỖI SKILL: Sử dụng PointerDown hỗ trợ cả Touch và Click, gán trực tiếp vào keys
skillBtn.addEventListener('pointerdown', (e) => {
    if (skillCooldown <= 0 && currentLevel >= 3) {
        keys['g'] = true; 
    }
    e.preventDefault();
});

// --- CORE ---

function animate() {
    if (!gameActive) return;
    requestAnimationFrame(animate);
    ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

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

    spawnTimer++;
    const maxSpawn = currentLevel * 10 + 10;
    if (spawnTimer > 100 && enemiesSpawned < maxSpawn) {
        let type = 'normal'; let r = Math.random();
        if (currentLevel >= 2 && r < 0.25) type = 'tank';
        if (currentLevel >= 3) {
            if (r > 0.7 && r < 0.85) type = 'dash';
            if (r >= 0.85) type = 'bomb';
        }
        enemies.push(new Enemy(type));
        enemiesSpawned++; spawnTimer = 0;
    }

    enemies.forEach((en, i) => {
        en.update(); en.draw();
        let dP = Math.sqrt((en.x + en.width/2 - player.x)**2 + (en.y + en.height/2 - player.y)**2);
        if (dP < player.radius + en.width/2.5) {
            explosions.push(new Explosion(en.x + en.width/2, en.y + en.height/2, en.width, en.type === 'bomb'));
            lives -= en.damage; enemies.splice(i, 1); enemiesLeft--; updateHUD();
            if (lives <= 0) gameOver(false); return;
        }
        bullets.forEach((b, j) => {
            if (b.x > en.x && b.x < en.x + en.width && b.y > en.y && b.y < en.y + en.height) {
                if (b.isPiercing && b.hitEnemies.includes(en)) return;
                en.hp--;
                if (b.isPiercing) b.hitEnemies.push(en); else bullets.splice(j, 1);
                if (en.hp <= 0) {
                    explosions.push(new Explosion(en.x + en.width/2, en.y + en.height/2, en.width, en.type === 'bomb'));
                    enemies.splice(i, 1); enemiesLeft--; updateHUD();
                    if (enemiesLeft <= 0) gameOver(true);
                }
            }
        });
        if (en && en.y > canvas.height - 75) {
            enemies.splice(i, 1); lives--; enemiesLeft--; updateHUD();
            if (lives <= 0) gameOver(false); else if (enemiesLeft <= 0) gameOver(true);
        }
    });
}

function initGame(level) {
    currentLevel = level; resize();
    player = new Player(); bullets = []; enemies = []; explosions = [];
    lives = 5; enemiesLeft = level * 10 + 10;
    enemiesSpawned = 0; spawnTimer = 0; skillCooldown = 0;
    gameActive = true;
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
    document.getElementById('endStatus').innerText = isWin ? "MISSION ACCOMPLISHED" : "MISSION FAILED";
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

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
window.addEventListener("keydown", function(e) { if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) e.preventDefault(); }, false);