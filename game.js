const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- 1. Khai báo hình ảnh (Dùng chung cho các file con) ---
const IMG_PLAYER = 'tank.png', IMG_ENEMY = 'quai.png', IMG_ENEMY_TANK = 'quai_trau.png',
      IMG_ENEMY_DASH = 'quai_nhanh.png', IMG_ENEMY_BOMB = 'quai_bom.png',
      IMG_EXPLOSION = 'explosion.png', IMG_BOSS = 'king_kong.png', IMG_BOSS_BULLET = 'king_kong_bullet.png';

// --- 2. Biến trạng thái Game ---
let player, bullets, enemies, explosions, boss, bossSpawned;
let keys = {}, gameActive = false, lives = 5, enemiesLeft = 20, enemiesSpawned = 0, spawnTimer = 0, currentLevel = 1;
let skillCooldown = 0; const SKILL_MAX_COOLDOWN = 600;

// --- 3. Elements giao diện ---
const stick = document.getElementById('joystickStick'), base = document.getElementById('joystickBase'),
      fireBtn = document.getElementById('fireButton'), skillBtn = document.getElementById('skillButton'),
      joystickZone = document.getElementById('joystickZone'), fireButtonZone = document.getElementById('fireButtonZone'),
      skillButtonZone = document.getElementById('skillButtonZone');

let isDragging = false, isFiring = false, joystickData = { x: 0, y: 0 };

// --- 4. Hệ thống Responsive ---
function resize() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    if (player) { player.x = canvas.width / 2; player.y = canvas.height - 150; }
}
window.addEventListener('resize', resize); resize();

// --- 5. Hệ thống Điều khiển (Controls) ---
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

// --- 6. Vòng lặp Game (Main Loop) ---
function animate() {
    if (!gameActive) return;
    requestAnimationFrame(animate);
    ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

    // Xử lý UI Skill
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
    bullets.forEach((b, i) => { b.update(); b.draw(); if (b.y < -50 || b.y > canvas.height + 50 || b.x < -50 || b.x > canvas.width + 50) bullets.splice(i, 1); });

    spawnTimer++;
    const config = LEVEL_CONFIG[currentLevel];

    // Logic Boss Level 4
    if (config.hasBoss && !bossSpawned && spawnTimer > 300) {
        boss = new Boss(); bossSpawned = true;
        document.getElementById('bossHUD').classList.remove('hidden');
    }

    if (boss) {
        boss.update(); boss.draw();
        bullets.forEach((b, j) => {
            if (b.x > boss.x && b.x < boss.x + boss.width && b.y > boss.y && b.y < boss.y + boss.height) {
                let damage = b.isPiercing ? 2 : 1;
                boss.hp -= damage; bullets.splice(j, 1);
                document.getElementById('bossHPBar').style.width = (boss.hp / boss.maxHp) * 100 + "%";
                document.getElementById('bossHPText').innerText = Math.max(0, boss.hp) + "/" + boss.maxHp;
                if (boss.hp <= 0) {
                    explosions.push(new Explosion(boss.x + boss.width/2, boss.y + boss.height/2, boss.width));
                    boss = null; enemiesLeft = 0; updateHUD(); gameOver(true);
                }
            }
        });
    }

    // Spawn quái
    if (enemiesSpawned < config.enemiesTarget && spawnTimer % config.spawnRate === 0) {
        enemies.push(new Enemy(getSpawnType(currentLevel)));
        enemiesSpawned++; 
    }

    enemies.forEach((en, i) => {
        en.update(); en.draw();
        // Va chạm Player
        let dP = Math.sqrt((en.x + en.width/2 - player.x)**2 + (en.y + en.height/2 - player.y)**2);
        if (dP < player.radius + en.width/2.5) {
            explosions.push(new Explosion(en.x + en.width/2, en.y + en.height/2, en.width, en.type === 'bomb'));
            lives -= (en.damage || 1); enemies.splice(i, 1); enemiesLeft--; updateHUD();
            if (lives <= 0) gameOver(false); return;
        }
        // Va chạm Đạn
        bullets.forEach((b, j) => {
            if (b.x > en.x && b.x < en.x + en.width && b.y > en.y && b.y < en.y + en.height) {
                if (b.isPiercing && b.hitEnemies.includes(en)) return;
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
        // Chạm thành
        if (en && en.y > canvas.height - 75 && en.type !== 'bullet') {
            enemies.splice(i, 1); lives--; enemiesLeft--; updateHUD();
            if (lives <= 0) gameOver(false); else if (enemiesLeft <= 0 && !boss) gameOver(true);
        }
    });
}

// --- 7. Hàm hỗ trợ (Helper Functions) ---
function initGame(level) {
    currentLevel = level; resize();
    const config = LEVEL_CONFIG[level];
    player = new Player(); bullets = []; enemies = []; explosions = [];
    boss = null; bossSpawned = false;
    lives = config.lives; enemiesLeft = config.enemiesTarget;
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
    gameActive = false; document.getElementById('endScreen').style.display = 'flex';
    [joystickZone, fireButtonZone, skillButtonZone].forEach(z => z.classList.add('hidden'));
    const status = document.getElementById('endStatus'), nextBtn = document.getElementById('nextLevelBtn');
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

// --- 8. Lắng nghe phím ---
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
window.addEventListener("keydown", function(e) { if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) e.preventDefault(); }, false);