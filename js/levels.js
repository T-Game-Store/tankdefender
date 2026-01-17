const LEVEL_CONFIG = {
    1: { lives: 5, enemiesTarget: 20, spawnRate: 120, quaiTrauChance: 0, quaiNhanhChance: 0, quaiBomChance: 0 },
    2: { lives: 5, enemiesTarget: 25, spawnRate: 100, quaiTrauChance: 0.2, quaiNhanhChance: 0, quaiBomChance: 0 },
    3: { lives: 5, enemiesTarget: 30, spawnRate: 100, quaiTrauChance: 0.25, quaiNhanhChance: 0.15, quaiBomChance: 0.15 },
    4: { lives: 5, enemiesTarget: 35, spawnRate: 100, quaiTrauChance: 0.25, quaiNhanhChance: 0.15, quaiBomChance: 0.15, hasBoss: true },
    5: { 
        lives: 5, 
        enemiesTarget: 25, 
        spawnRate: 80, 
        quaiTrauChance: 0.4, 
        quaiNhanhChance: 0.3, 
        quaiBomChance: 0.3, 
        hasBoss: true,
        bossHp: 50 
    },
    6: {
        enemiesTarget: 40,
        spawnRate: 80, 
        lives: 5,
        hasBoss: false,
        enemyTypes: ['bomb', 'tank', 'skeleton'] 
    }
};

function getSpawnType(level) {
    const config = LEVEL_CONFIG[level];
    let r = Math.random();
    if (level >= 2 && r < config.quaiTrauChance) return 'tank';
    if (level >= 3) {
        if (r > 0.7 && r < 0.7 + config.quaiNhanhChance) return 'dash';
        if (r > 0.85) return 'bomb';
    }
    if (level === 6) {
        const rand = Math.random();
        if (rand < 0.4) return 'skeleton'; 
        if (rand < 0.7) return 'tank';    
        return 'bomb';                     
    }
    return 'normal';
}
