const SKINS_CONFIG = {
    'default': {
        name: 'Classic Tank',
        img: 'tank.png',
        shootSound: 'shoot.mp3',
        skillSound: 'skillshoot1.mp3',
        speedBoost: 0,
        description: 'Xe tăng tiêu chuẩn'
    },
    'mixi': {
        name: 'Mixi Tank',
        img: 'mixitank.png', 
        shootSound: 'chaovu.mp3',
        skillSound: 'choilamsaoduoc.mp3',
        speedBoost: 0,
        description: 'Âm thanh bộ pc mạnh mẽ'
    }
};

let currentSkinKey = 'default'; 