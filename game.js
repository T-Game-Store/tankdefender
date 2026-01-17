const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let isPaused = false;

const IMG_PLAYER = 'tank.png', IMG_ENEMY = 'quai.png', IMG_ENEMY_TANK = 'quai_trau.png',
      IMG_ENEMY_DASH = 'quai_nhanh.png', IMG_ENEMY_BOMB = 'quai_bom.png',
      IMG_EXPLOSION = 'explosion.png', IMG_BOSS = 'king_kong.png', IMG_BOSS_BULLET = 'king_kong_bullet.png';

const BGM_URL = 'bkgmusic.mp3'; 
let bgm = new Audio(BGM_URL);
bgm.loop = true; 
bgm.volume = 0.5;

const BOSS_SKILL_SOUND_URL = 'boss_skill.mp3'; 
const bossSkillSound = new Audio(BOSS_SKILL_SOUND_URL);
bossSkillSound.volume = 1.0;

const BUTTON_CLICK_URL = 'click.mp3';
const btnClickSound = new Audio(BUTTON_CLICK_URL);
btnClickSound.volume = 0.6; 

const SHOOT_SOUND_URL = 'shoot.mp3';

let player, bullets, enemies, explosions, boss, bossSpawned;
let keys = {}, gameActive = false, lives = 5, enemiesLeft = 20, enemiesSpawned = 0, spawnTimer = 0, currentLevel = 1;
let skillCooldown = 0; const SKILL_MAX_COOLDOWN = 600;

const stick = document.getElementById('joystickStick'), base = document.getElementById('joystickBase'),
      fireBtn = document.getElementById('fireButton'), skillBtn = document.getElementById('skillButton'),
      joystickZone = document.getElementById('joystickZone'), fireButtonZone = document.getElementById('fireButtonZone'),
      skillButtonZone = document.getElementById('skillButtonZone');

let isDragging = false, isFiring = false, joystickData = { x: 0, y: 0 };

function playClickSound() {
    btnClickSound.currentTime = 0; 
    btnClickSound.playbackRate = 2.5;
    btnClickSound.play().catch(e => {});
}

function resize() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    if (player) { player.x = canvas.width / 2; player.y = canvas.height - 150; }
}
window.addEventListener('resize', resize); resize();

function handleJoystick(e) {
    if (!isDragging || isPaused) return;
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

base.addEventListener('mousedown', () => { if(!isPaused) isDragging = true; });
base.addEventListener('touchstart', (e) => { if(!isPaused) { isDragging = true; e.preventDefault(); } }, {passive: false});
window.addEventListener('mousemove', handleJoystick);
window.addEventListener('touchmove', handleJoystick, {passive: false});
window.addEventListener('mouseup', () => { isDragging = false; stick.style.transform = 'translate(0,0)'; joystickData = {x:0, y:0}; });
window.addEventListener('touchend', () => { isDragging = false; stick.style.transform = 'translate(0,0)'; joystickData = {x:0, y:0}; });

fireBtn.addEventListener('mousedown', () => { if(!isPaused) isFiring = true; });
fireBtn.addEventListener('touchstart', (e) => { if(!isPaused) { isFiring = true; e.preventDefault(); } }, {passive: false});
window.addEventListener('mouseup', () => isFiring = false);
window.addEventListener('touchend', () => isFiring = false);

skillBtn.addEventListener('pointerdown', (e) => { 
    if (!isPaused && skillCooldown <= 0 && (currentLevel >= 3 || currentSkinKey === 'frozen' || currentSkinKey === 'mixi')) { 
        keys['g'] = true; 
    } 
    e.preventDefault(); 
});

function animate() {
    if (!gameActive || isPaused) return;

    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (skillCooldown > 0) {
        skillCooldown--;
        document.getElementById('skillCooldownOverlay').style.height = (skillCooldown / 600) * 100 + "%";
        document.getElementById('skillTimerText').innerText = Math.ceil(skillCooldown / 60) + "s";
    } else {
        document.getElementById('skillCooldownOverlay').style.height = "0%";
        document.getElementById('skillTimerText').innerText = "G";
        if (keys['g']) {
            const skinData = SKINS_CONFIG[currentSkinKey];
            const skillSfx = new Audio(skinData.skillSound);
            skillSfx.play().catch(e => {});

            if (currentSkinKey === 'frozen') {
                bullets.push(new Bullet(player.x, player.y, Math.sin(player.angle) * 12, -Math.cos(player.angle) * 12, true, player.angle));
            } else {
                bullets.push(new Bullet(player.x, player.y, Math.sin(player.angle) * 15, -Math.cos(player.angle) * 15, false, player.angle));
            }
            skillCooldown = 600;
            keys['g'] = false;
        }
    }

    player.update();
    player.draw();

    bullets.forEach(b => {
        b.update();
        b.draw();
        if (b.y < -50 || b.y > canvas.height + 50 || b.x < -50 || b.x > canvas.width + 50) b._dead = true;
    });

    if (boss) {
        boss.update();
        boss.draw();
        bullets.forEach(b => {
            if (b._dead) return;
            if (b.x > boss.x && b.x < boss.x + boss.width && b.y > boss.y && b.y < boss.y + boss.height) {
                if (b.isFreezing === true) {
                    boss.frozenTimer = 120;
                    b._dead = true;
                } else {
                    let damage = b.isPiercing ? 2 : 1;
                    boss.hp -= damage;
                    b._dead = true;
                    document.getElementById('bossHPBar').style.width = (boss.hp / boss.maxHp) * 100 + "%";
                    document.getElementById('bossHPText').innerText = Math.max(0, boss.hp) + "/" + boss.maxHp;
                    if (boss.hp <= 0) {
                        explosions.push(new Explosion(boss.x + boss.width / 2, boss.y + boss.height / 2, boss.width));
                        boss = null; enemiesLeft = 0; updateHUD(); gameOver(true);
                    }
                }
            }
        });
    }

    spawnTimer++;
    const config = LEVEL_CONFIG[currentLevel];
    if (config.hasBoss && !bossSpawned && spawnTimer > 300) {
        boss = new Boss();
        bossSpawned = true;
        document.getElementById('bossHUD').classList.remove('hidden');
    }

    if (enemiesSpawned < config.enemiesTarget && spawnTimer % config.spawnRate === 0) {
        enemies.push(new Enemy(getSpawnType(currentLevel)));
        enemiesSpawned++;
    }

    enemies.forEach(en => {
        en.update();
        en.draw();

        bullets.forEach(b => {
            if (b._dead || en._dead) return;
            if (b.x > en.x && b.x < en.x + en.width && b.y > en.y && b.y < en.y + en.height) {
                if (b.isFreezing === true) {
                    en.frozenTimer = 120; 
                    b._dead = true;
                } else {
                    if (b.isPiercing && b.hitEnemies.includes(en)) return;
                    en.hp -= b.isPiercing ? 2 : 1;
                    if (b.isPiercing) b.hitEnemies.push(en); else b._dead = true;

                    if (en.hp <= 0) {
                        explosions.push(new Explosion(en.x + en.width / 2, en.y + en.height / 2, en.width));
                        en._dead = true;
                        enemiesLeft--;
                        updateHUD();
                        if (enemiesLeft <= 0 && !boss) gameOver(true);
                    }
                }
            }
        });

        if (!en._dead && en.y > canvas.height - 85 && en.type !== 'bullet') {
            en._dead = true;
            lives -= (en.damage || 1);
            updateHUD();
            const line = document.getElementById('defenseLine');
            if (line) {
                line.classList.add('defense-hit');
                setTimeout(() => line.classList.remove('defense-hit'), 200);
            }
            if (lives <= 0) gameOver(false);
            else if (enemiesLeft <= 0 && !boss) gameOver(true);
        }
        
        let dP = Math.sqrt((en.x + en.width / 2 - player.x) ** 2 + (en.y + en.height / 2 - player.y) ** 2);
        if (!en._dead && dP < player.radius + en.width / 2.5) {
            explosions.push(new Explosion(en.x + en.width / 2, en.y + en.height / 2, en.width, en.type === 'bomb'));
            lives -= (en.damage || 1);
            en._dead = true;
            enemiesLeft--;
            updateHUD();
            if (lives <= 0) gameOver(false);
        }
    });

    explosions.forEach(ex => { ex.update(); ex.draw(); });
    bullets = bullets.filter(b => !b._dead);
    enemies = enemies.filter(en => !en._dead);
    explosions = explosions.filter(ex => ex.life > 0);
}

function initGame(level) {
    currentLevel = level;
    resize();
    const config = LEVEL_CONFIG[level];

    player = new Player();
    bullets = []; enemies = []; explosions = [];
    boss = null; bossSpawned = false; 

    lives = config.lives;
    enemiesLeft = config.enemiesTarget;
    enemiesSpawned = 0;
    spawnTimer = 0;
    skillCooldown = 0;
    gameActive = true;
    isPaused = false; 

    document.body.classList.remove('shake-heavy', 'shake');
    document.body.style.transform = "none";

    document.getElementById('gameHUD').style.display = 'block';
    document.getElementById('pauseMenu').classList.add('hidden');
    document.getElementById('pauseMenu').style.display = 'none';
    
    joystickZone.classList.remove('hidden');
    fireButtonZone.classList.remove('hidden');
    
    const skillBtn = document.getElementById('skillButton');
    if (level >= 3 || currentSkinKey === 'frozen' || currentSkinKey === 'mixi') {
        skillButtonZone.classList.remove('hidden');
        if (currentSkinKey === 'frozen') {
            skillBtn.classList.add('frozen-skill');
        } else {
            skillBtn.classList.remove('frozen-skill');
        }
    } else {
        skillButtonZone.classList.add('hidden');
    }

    document.getElementById('bossHUD').classList.add('hidden');
    if (config.hasBoss) {
        let maxHp = config.bossHp || 30;
        document.getElementById('bossHPBar').style.width = "100%";
        document.getElementById('bossHPText').innerText = maxHp + "/" + maxHp;
    }

    updateHUD();
    animate();
}

function updateHUD() {
    document.getElementById('enemyCount').innerText = Math.max(0, enemiesLeft);
    const container = document.getElementById('livesContainer');
    if (container) {
        container.innerHTML = '';
        for (let i = 0; i < lives; i++) {
            const heart = document.createElement('div'); heart.className = 'heart';
            container.appendChild(heart);
        }
    }
}

function gameOver(isWin) {
    stopMusic();
    gameActive = false; 
    document.getElementById('endScreen').style.display = 'flex';
    
    joystickZone.classList.add('hidden');
    fireButtonZone.classList.add('hidden');
    skillButtonZone.classList.add('hidden');

    const status = document.getElementById('endStatus'), nextBtn = document.getElementById('nextLevelBtn');
    if (isWin) { 
        status.innerText = "MISSION ACCOMPLISHED"; 
        status.style.color = "#4ade80"; 
        nextBtn.classList.remove('hidden'); 
    } else { 
        status.innerText = "MISSION FAILED"; 
        status.style.color = "#ef4444"; 
        nextBtn.classList.add('hidden'); 
    }
}

function showMenu() { 
    stopMusic();
    document.getElementById('mainMenu').style.display = 'flex'; 
    ['levelSelect', 'endScreen', 'gameHUD', 'pauseMenu', 'skinMenu'].forEach(id => {
        let el = document.getElementById(id);
        if(el) {
            el.style.display = 'none';
            el.classList.add('hidden');
        }
    });
    joystickZone.classList.add('hidden');
    fireButtonZone.classList.add('hidden');
    skillButtonZone.classList.add('hidden');
    gameActive = false; 
    isPaused = false;
}

function playMusic(level) {
    bgm.pause();
    if (level === 4 || level === 5) {
        bgm.src = 'kingkong.mp3';
    } else {
        bgm.src = BGM_URL;
    }
    bgm.play().catch(e => {});
}

function stopMusic() {
    bgm.pause();
    bgm.currentTime = 0; 
}

function openSkinMenu() {
    const menu = document.getElementById('skinMenu');
    const list = document.getElementById('skinList');
    menu.style.display = 'flex';
    menu.classList.remove('hidden');
    list.innerHTML = ''; 

    Object.keys(SKINS_CONFIG).forEach(key => {
        const skin = SKINS_CONFIG[key];
        const isSelected = currentSkinKey === key;
        
        const card = document.createElement('div');
        card.className = `p-4 border-2 transition-all cursor-pointer flex flex-col items-center ${isSelected ? 'border-blue-500 bg-blue-500/20' : 'border-white/10 bg-white/5'}`;
        card.innerHTML = `
            <img src="${skin.img}" class="w-20 h-20 mb-2 object-contain">
            <div class="text-[10px] font-bold text-white">${skin.name}</div>
            <div class="text-[8px] opacity-50 text-white">${skin.description}</div>
        `;
        card.onclick = (e) => {
            e.stopPropagation();
            playClickSound();
            currentSkinKey = key;
            openSkinMenu();
        };
        list.appendChild(card);
    });
}

function closeSkinMenu() {
    const menu = document.getElementById('skinMenu');
    menu.style.display = 'none';
    menu.classList.add('hidden');
}

function pauseGame() {
    if (!gameActive || isPaused) return;
    isPaused = true;
    const pMenu = document.getElementById('pauseMenu');
    pMenu.style.display = 'flex';
    pMenu.classList.remove('hidden');
    
    joystickZone.classList.add('hidden');
    fireButtonZone.classList.add('hidden');
    skillButtonZone.classList.add('hidden');
    
    bgm.pause();
    playClickSound();
}

function resumeGame() {
    if (!isPaused) return;
    isPaused = false;
    const pMenu = document.getElementById('pauseMenu');
    pMenu.style.display = 'none';
    pMenu.classList.add('hidden');
    
    joystickZone.classList.remove('hidden');
    fireButtonZone.classList.remove('hidden');
    if (currentLevel >= 3 || currentSkinKey === 'frozen' || currentSkinKey === 'mixi') skillButtonZone.classList.remove('hidden');

    bgm.play().catch(e => {});
    playClickSound();
    requestAnimationFrame(animate); 
}

function showLevelSelect() { 
    document.getElementById('mainMenu').style.display = 'none'; 
    document.getElementById('levelSelect').style.display = 'flex'; 
}

function startGame(level) { 
    document.getElementById('levelSelect').style.display = 'none'; 
    document.getElementById('gameHUD').style.display = 'block'; 
    playMusic(level); 
    initGame(level); 
}

function restartLevel() { 
    document.getElementById('endScreen').style.display = 'none'; 
    const pMenu = document.getElementById('pauseMenu');
    pMenu.classList.add('hidden'); 
    pMenu.style.display = 'none'; 
    playMusic(currentLevel); 
    initGame(currentLevel); 
}

function nextLevel() { 
    document.getElementById('endScreen').style.display = 'none'; 
    currentLevel++; 
    playMusic(currentLevel); 
    initGame(currentLevel); 
}

window.addEventListener('keydown', e => {
    if (e.key === "Escape") {
        if (gameActive) {
            if (!isPaused) pauseGame();
            else resumeGame();
        }
    }
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

window.addEventListener("keydown", function(e) { 
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) e.preventDefault(); 
}, false);

document.addEventListener('click', function(e) {
    if (e.target.tagName === 'BUTTON') {
        if (e.target.id !== 'fireButton' && e.target.id !== 'skillButton') {
            playClickSound();
        }
    }
});
