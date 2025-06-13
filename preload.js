// Konfiguracija Phaser igre za prednalagalno sceno
const config = {
    type: Phaser.AUTO, // Samodejna izbira WebGL ali Canvas rendererja
    pixelArt: false, // Onemogoči pixel art način za gladke slike
    roundPixels: false, // Onemogoči zaokroževanje pikslov
    width: window.innerWidth, // Širina platna enaka širini okna
    height: window.innerHeight, // Višina platna enaka višini okna
    contextAttributes: {
        willReadFrequently: true // Optimizacija za pogosto branje platna
    }
};

/* Razred za prednalagalno sceno, ki razširja Phaser.Scene */
class PreloaderScene extends Phaser.Scene {
    constructor() {
        super({ key: 'preload' }); // Inicializacija scene z imenom 'preload'
    }

    /* Metoda za prednalaganje virov */
    preload() {
        // Inicializacija animacije preloaderja z GSAP
        gsap.set("#preloader-bar", { width: 0 + '%' }); // Nastavi začetno širino nalagalnega traku na 0%
        gsap.set("#preloader-text, #preloader-percent", { autoAlpha: 0 }); // Skrij besedilo in odstotek
        const preloaderAnimationIn = gsap.timeline({
            paused: true, // Animacija je sprva zaustavljena
            onComplete: function () {} // Prazna povratna funkcija ob zaključku
        });
        // Animacija prikaza notranjega dela preloaderja
        preloaderAnimationIn.fromTo("#preloader-inner", 1, { autoAlpha: 0 }, { autoAlpha: 1 }, 0.25);
        // Animacija prikaza besedila preloaderja z gibanjem navzdol
        preloaderAnimationIn.fromTo("#preloader-text", 1, { autoAlpha: 0, y: -50 }, { autoAlpha: 1, y: 0, ease: "expo.out" }, 0.25);
        // Animacija prikaza odstotka z gibanjem navzgor
        preloaderAnimationIn.fromTo("#preloader-percent", 1, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, ease: "expo.out" }, 0.25);
        preloaderAnimationIn.timeScale(1); // Nastavi hitrost animacije
        preloaderAnimationIn.play(0); // Začni animacijo

        // Nalaganje slik za meni
        this.load.image('menu_background', './menu_background.png'); // Ozadje menija
        this.load.image('logo_spacex', './logo_spacex.png'); // Logotip SpaceX
        this.load.image('logo', './logo.png'); // Logotip igre
        this.load.image('controls', './controls.png'); // Slika krmiljenja
        this.load.image('button', './button.png'); // Slika gumba

        // Nalaganje uvodnega videa
        this.load.video('introVideo', './4k-standard.mp4');

        // Nalaganje slik za igralno sceno
        this.load.image('bg_sky', './bg_sky.png'); // Nebo kot ozadje
        this.load.image('bg_clouds', './bg_clouds.png'); // Oblaki kot ozadje
        this.load.image('bg_space', './bg_space.png'); // Vesolje kot ozadje
        this.load.image('bg_full_sky', './bg_full_sky.png'); // Celotno nebo
        this.load.image('cloud', './cloud.png'); // Posamezen oblak
        this.load.image('launch_mount', './launch_mount.png'); // Izstrelitvena ploščad
        this.load.image('tower', './tower.png'); // Stolp
        this.load.image('chopsticks', './chopsticks.png'); // Mehanizem za lovljenje rakete
        this.load.image('iss', './iss.png'); // Mednarodna vesoljska postaja
        this.load.image('hopper', './hopper.png'); // Vesoljsko plovilo Hopper
        this.load.image('viper', './viper.png'); // Vesoljsko plovilo Viper
        this.load.image('edgeguard', './gunstar.png'); // Obrambno plovilo

        // Nalaganje slike za toplotni ščit
        this.load.image('heatshield', './heatshield.png');

        // Nalaganje sprite sheetov za animacije
        this.load.spritesheet('sprite_stars', './stars.png', { frameWidth: 10, frameHeight: 10 }); // Zvezde
        this.load.spritesheet('sprite_moon', './moon.png', { frameWidth: 30, frameHeight: 30 }); // Luna
        this.load.spritesheet('sprite_flames', './flames.png', { frameWidth: 30, frameHeight: 30 }); // Plameni
        this.load.spritesheet('sprite_starship', './starship.png', { frameWidth: 30, frameHeight: 80 }); // Vesoljska ladja Starship
        this.load.spritesheet('sprite_booster', './booster.png', { frameWidth: 30, frameHeight: 110 }); // Pospeševalnik
        this.load.spritesheet('sprite_aliens', './aliens.png', { frameWidth: 25, frameHeight: 14 }); // Vesoljci
        this.load.spritesheet('sprite_rockets', './rockets.png', { frameWidth: 20, frameHeight: 20 }); // Rakete

        // Nalaganje sprite sheetov za kolizije
        this.load.spritesheet('sprite_starship_collision', './starship_collision.png', { frameWidth: 30, frameHeight: 80 }); // Kolizija Starship
        this.load.spritesheet('sprite_booster_collision', './booster_collision.png', { frameWidth: 30, frameHeight: 110 }); // Kolizija pospeševalnika

        // Nalaganje slik za bonuse (power-ups)
        this.load.image('star', './star.png'); // Zvezda
        this.load.image('astronaut', './astronaut.png'); // Astronavt
        this.load.image('rocket1', './rocket1.png'); // Raketa 1
        this.load.image('rocket2', './rocket2.png'); // Raketa 2

        // Nalaganje zvočnih datotek
        this.load.audio('engines', './engines.mp3'); // Zvok motorjev
        this.load.audio('sfx_powerup', './powerup.wav'); // Zvok za bonus 1
        this.load.audio('sfx_explosion', './explosion.wav'); // Zvok eksplozije 1
        this.load.audio('sfx_powerup2', './powerup2.mp3'); // Zvok za bonus 2
        this.load.audio('sfx_explosion2', './explosion2.mp3'); // Zvok eksplozije 2
        this.load.audio('sfx_alien', './alien.wav'); // Zvok vesoljcev
        this.load.audio('sfx_gameover', './gameover.mp3'); // Zvok ob koncu igre
        this.load.audio('sfx_success', './success.mp3'); // Zvok ob uspehu

        // Spremenljivki za sledenje nalaganja pisave in virov
        let isFontLoaded = false;
        let isAssetsLoaded = false;

        // Nalaganje pisave iz Google Fonts
        WebFont.load({
            google: {
                families: ['Press Start 2P'], // Pisava Press Start 2P
            },
            custom: {},
            active: () => {
                isFontLoaded = true; // Označi, da je pisava naložena
                if (isAssetsLoaded) {
                    this.preloadClose(); // Zapri preloader, če so tudi viri naloženi
                }
            },
        });

        // Poslušalec za posodobitev napredka nalaganja
        this.load.on('progress', (value) => {
            gsap.set("#preloader-bar", { width: parseInt(value * 100) + '%' }); // Posodobi širino nalagalnega traku
            document.getElementById('preloader-percent').innerHTML = parseInt(value * 100) + '%'; // Posodobi odstotek
        });

        // Poslušalec za zaključek nalaganja virov
        this.load.on('complete', () => {
            isAssetsLoaded = true; // Označi, da so viri naloženi
            if (isFontLoaded) {
                this.preloadClose(); // Zapri preloader, če je tudi pisava naložena
            }
        });
    }

    /* Metoda za zapiranje preloaderja in prehod v meni sceno */
    preloadClose() {
        // Animacija izginjanja preloaderja z GSAP
        const preloaderAnimationOut = gsap.timeline({
            paused: true, // Animacija je sprva zaustavljena
            onComplete: () => {
                this.scene.start('menuscene'); // Prehod v meni sceno po zaključku
            }
        });
        // Animacija izginjanja preloaderja
        preloaderAnimationOut.to("#preloader", 1, { autoAlpha: 0, immediateRender: false }, 1);
        preloaderAnimationOut.timeScale(1); // Nastavi hitrost animacije
        preloaderAnimationOut.play(0); // Začni animacijo
    }
}

/* Izvoz razreda PreloaderScene */
export default PreloaderScene;
