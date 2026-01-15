const LEVEL_CONFIG = {
    1: { lives: 5, enemiesTarget: 20, spawnRate: 120, quaiTrauChance: 0, quaiNhanhChance: 0, quaiBomChance: 0 },
    2: { lives: 7, enemiesTarget: 25, spawnRate: 100, quaiTrauChance: 0.2, quaiNhanhChance: 0, quaiBomChance: 0 },
    3: { lives: 5, enemiesTarget: 30, spawnRate: 100, quaiTrauChance: 0.25, quaiNhanhChance: 0.15, quaiBomChance: 0.15 },
    4: { lives: 10, enemiesTarget: 35, spawnRate: 100, quaiTrauChance: 0.25, quaiNhanhChance: 0.15, quaiBomChance: 0.15, hasBoss: true }
};

function getSpawnType(level) {
    const config = LEVEL_CONFIG[level];
    let r = Math.random();
    if (level >= 2 && r < config.quaiTrauChance) return 'tank';
    if (level >= 3) {
        if (r > 0.7 && r < 0.7 + config.quaiNhanhChance) return 'dash';
        if (r > 0.85) return 'bomb';
    }
    return 'normal';
}