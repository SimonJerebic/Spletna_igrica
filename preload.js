// KONFIGURACIJA IGRE
const config = {
    type: Phaser.AUTO,
    pixelArt: false,
    roundPixels: false,
    width: window.innerWidth, // Fixed width
    height: window.innerHeight, // Dynamic height
    contextAttributes: {
        willReadFrequently: true
    }
};

class PreloaderScene extends Phaser.Scene {
    constructor() {
        super({ key: 'preload' });
    }

    preload() {
        // NASTAVITEV ANIMACIJE PRELOADERJA
        gsap.set("#preloader-bar", { width: 0 + '%' });
        gsap.set("#preloader-text, #preloader-percent", { autoAlpha: 0 });
        const preloaderAnimationIn = gsap.timeline({
            paused: true,
            onComplete: function () {}
        });
        preloaderAnimationIn.fromTo("#preloader-inner", 1, { autoAlpha: 0 }, { autoAlpha: 1 }, 0.25);
        preloaderAnimationIn.fromTo("#preloader-text", 1, { autoAlpha: 0, y: -50 }, { autoAlpha: 1, y: 0, ease: "expo.out" }, 0.25);
        preloaderAnimationIn.fromTo("#preloader-percent", 1, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, ease: "expo.out" }, 0.25);
        preloaderAnimationIn.timeScale(1);
        preloaderAnimationIn.play(0);

        this.load.image('menu_background', './menu_background.png');
        this.load.image('logo_spacex', './logo_spacex.png');
        this.load.image('logo', './logo.png');
        this.load.image('controls', './controls.png');
        this.load.image('button', './button.png');

        this.load.video('introVideo', './4k-standard.mp4');

        this.load.image('bg_sky', './bg_sky.png');
        this.load.image('bg_clouds', './bg_clouds.png');
        this.load.image('bg_space', './bg_space.png');
        this.load.image('bg_full_sky', './bg_full_sky.png');
        this.load.image('cloud', './cloud.png');
        this.load.image('launch_mount', './launch_mount.png');
        this.load.image('tower', './tower.png');
        this.load.image('chopsticks', './chopsticks.png');
        this.load.image('iss', './iss.png');
        this.load.image('hopper', './hopper.png');
        this.load.image('viper', './viper.png');
        this.load.image('edgeguard', './gunstar.png');

        this.load.image('heatshield', './heatshield.png');

        this.load.spritesheet('sprite_stars', './stars.png', { frameWidth: 10, frameHeight: 10 });
        this.load.spritesheet('sprite_moon', './moon.png', { frameWidth: 30, frameHeight: 30 });
        this.load.spritesheet('sprite_flames', './flames.png', { frameWidth: 30, frameHeight: 30 });
        this.load.spritesheet('sprite_starship', './starship.png', { frameWidth: 30, frameHeight: 80 });
        this.load.spritesheet('sprite_booster', './booster.png', { frameWidth: 30, frameHeight: 110 });
        this.load.spritesheet('sprite_aliens', './aliens.png', { frameWidth: 25, frameHeight: 14 });
        this.load.spritesheet('sprite_rockets', './rockets.png', { frameWidth: 20, frameHeight: 20 });

        this.load.spritesheet('sprite_starship_collision', './starship_collision.png', { frameWidth: 30, frameHeight: 80 });
        this.load.spritesheet('sprite_booster_collision', './booster_collision.png', { frameWidth: 30, frameHeight: 110 });

        // NALAGANJE POWERUPS
        this.load.image('star', './star.png');
        this.load.image('astronaut', './astronaut.png');
        this.load.image('rocket1', './rocket1.png');
        this.load.image('rocket2', './rocket2.png');

        // NALAGANJE ZVOKA
        this.load.audio('engines', './engines.mp3');
        this.load.audio('sfx_powerup', './powerup.wav');
        this.load.audio('sfx_explosion', './explosion.wav');
        this.load.audio('sfx_powerup2', './powerup2.mp3');
        this.load.audio('sfx_explosion2', './explosion2.mp3');
        this.load.audio('sfx_alien', './alien.wav');
        this.load.audio('sfx_gameover', './gameover.mp3');
        this.load.audio('sfx_success', './success.mp3');

        let isFontLoaded = false;
        let isAssetsLoaded = false;

        // NALAGANJE PISAVE
        WebFont.load({
            google: {
                families: ['Press Start 2P'],
            },
            custom: {},
            active: () => {
                isFontLoaded = true;
                if (isAssetsLoaded) {
                    this.preloadClose();
                }
            },
        });

        // OBDELAVA NAPREJŠNEGA NALAGANJA
        this.load.on('progress', (value) => {
            gsap.set("#preloader-bar", { width: parseInt(value * 100) + '%' });
            document.getElementById('preloader-percent').innerHTML = parseInt(value * 100) + '%';
        });

        // OBDELAVA ZAKLJUČKA NALAGANJA
        this.load.on('complete', () => {
            isAssetsLoaded = true;
            if (isFontLoaded) {
                this.preloadClose();
            }
        });
    }

    preloadClose() {
        // ZAKLJUČEK NALAGANJA IN PREHOD NA MENUSCENE
        const preloaderAnimationOut = gsap.timeline({
            paused: true,
            onComplete: () => {
                this.scene.start('menuscene');
            }
        });
        preloaderAnimationOut.to("#preloader", 1, { autoAlpha: 0, immediateRender: false }, 1);
        preloaderAnimationOut.timeScale(1);
        preloaderAnimationOut.play(0);
    }
}

export default PreloaderScene;