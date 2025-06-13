/* Konfiguracija Phaser igre */
const config = {
    type: Phaser.AUTO, // Samodejna izbira WebGL ali Canvas rendererja
    pixelArt: false, // Onemogoči pixel art način za gladke slike
    roundPixels: false, // Onemogoči zaokroževanje pikslov
    width: window.innerWidth, // Širina platna enaka širini okna
    height: window.innerHeight, // Višina platna enaka višini okna
};

/* Razred za meni sceno, ki razširja Phaser.Scene */
class Menuscene extends Phaser.Scene {
    constructor() {
        super({ key: 'menuscene' }); // Inicializacija scene z imenom 'menuscene'
    }

    /* Metoda za inicializacijo scene */
    create() {
        // Nastavi prozorno ozadje kamere
        this.cameras.main.setBackgroundColor('#00000000');
        // Dodaj sliko ozadja menija na sredino zaslona
        this.add.image(window.innerWidth / 2, window.innerHeight / 2, 'menu_background').setScale(1).setOrigin(0.5);
        this.difficultyLevelButton; // Spremenljivka za gumb težavnosti
        this.difficultyLevel = 1; // Privzeta težavnostna stopnja

        // Izračun dimenzij za pozicioniranje elementov
        const gameWidth = window.innerWidth;
        const gameHeight = window.innerHeight;
        const halfWidthX = gameWidth / 2;
        const halfHeightY = gameHeight / 2;

        // Dodaj logotipa SpaceX in igre
        const spacexLogo = this.add.image(halfWidthX, 20, 'logo_spacex');
        const gameLogo = this.add.image(halfWidthX, gameHeight * 0.14, 'logo').setScale(1.2);

        // NAVODILA
        // Dodaj naslov navodil
        const instructionsTitle = this.add
            .text(halfWidthX, halfHeightY * 0.5, 'NAVODILA', {
                fontSize: 16,
                fontFamily: '"Press Start 2P"',
                color: '#FFFFFF',
                lineSpacing: 8,
            }).setOrigin(0.5, 0).setAlign('center');

        // Dodaj besedilo navodil
        const instructionsBody = this.add
            .text(halfWidthX, halfHeightY * 0.55, 'Poskusi pristati vesoljsko ladjo Starship na Mars\n Pazi, da ti ne zmanjka goriva\n Izogibaj se vesoljcem', {
                fontSize: 15,
                fontFamily: '"Press Start 2P"',
                color: '#ffffff',
                lineSpacing: 8,
            }).setOrigin(0.5, 0).setAlign('center');

        // Preveri, ali je naprava namizna
        this.isDesktop = document.body.classList.contains('isDesktop');
        let keyboardCopy;
        let keyboardImage;
        if (this.isDesktop) {
            // Dodaj naslov za krmiljenje na namiznih napravah
            keyboardCopy = this.add
                .text(halfWidthX, halfHeightY * 0.75, 'KRMILJENJE', {
                    fontSize: 16,
                    fontFamily: '"Press Start 2P"',
                    color: '#FFFFFF',
                    lineSpacing: 8,
                }).setOrigin(0.5, 0).setAlign('center');
            // Dodaj sliko krmiljenja
            keyboardImage = this.add.image(halfWidthX * 1.05, halfHeightY * 1.3, 'controls').setScale(1);
        }

        // TEŽAVNOST
        // Dodaj interaktivno območje za izbiro težavnosti
        const difficultyHitArea = this.add.zone(halfWidthX, gameHeight * 0.9, 200, 50).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
        // Dodaj oznako za težavnost
        const difficultyLabelButton = this.add
            .text(halfWidthX, gameHeight * 0.9, 'DIFFICULTY', {
                fontSize: 12,
                fontFamily: '"Press Start 2P"',
                color: '#FFFFFF',
                lineSpacing: 10,
            }).setOrigin(0.5, 0).setAlign('center');
        // Dodaj gumb za prikaz trenutne težavnosti
        this.difficultyLevelButton = this.add
            .text(halfWidthX, gameHeight * 0.92, 'EASY', {
                fontSize: 12,
                fontFamily: '"Press Start 2P"',
                color: '#FFFFFF',
                lineSpacing: 10,
            }).setOrigin(0.5, 0).setAlign('center');
        // Nastavi začetno težavnost
        this.setDifficulty();
        // Poslušalec za klik na območje težavnosti
        difficultyHitArea.on('pointerdown', () => {
            this.updateDifficulty();
        });

        // Dodaj gumb za začetek igre
        const playButton = this.add.image(halfWidthX, gameHeight * 0.97, 'button').setScale(3);
        playButton.setInteractive({ useHandCursor: true });
        // Poslušalec za klik na gumb za začetek
        playButton.on('pointerdown', () => {
            this.playIntroVideo();
        });
        // Dodaj besedilo na gumb za začetek
        const playText = this.add
            .text(halfWidthX, gameHeight * 0.97, 'PLAY', {
                fontSize: 18,
                fontFamily: '"Press Start 2P"',
                color: '#FFFFFF',
            }).setOrigin(0.5).setAlign('center');

        const that = this; // Shranjevanje konteksta za uporabo v poslušalcih
        // Sprememba barve besedila ob prehodu miške čez gumb
        playButton.on('pointerover', function() {
            switch(that.difficultyLevel) {
                case 1:
                    playText.setTint(0x00ff4c); // Zelena za EASY
                    break;
                case 2:
                    playText.setTint(0x00FFFF); // Cian za MEDIUM
                    break;
                case 3:
                    playText.setTint(0xFFBF00); // Oranžna za HARD
                    break;
                case 4:
                    playText.setTint(0xFF0000); // Rdeča za LUDICROUS
                    break;
            }
        });

        // Ponastavi barvo besedila, ko miška zapusti gumb
        playButton.on('pointerout', function() {
            playText.setTint(0x0FFFFFF); // Bela barva
        });

        // Animacija prikaza elementov menija z GSAP
        const menuAnimation = gsap.timeline({ paused: true, onComplete: function() {} });
        menuAnimation.from([spacexLogo, gameLogo], 1, { alpha: 0, ease: "linear" }, 0);
        menuAnimation.from(instructionsTitle, 1, { alpha: 0, ease: "linear" }, 0);
        menuAnimation.from(instructionsBody, 1, { alpha: 0, ease: "linear" }, 0.1);
        if (this.isDesktop) {
            menuAnimation.from(keyboardCopy, 1, { alpha: 0, ease: "linear" }, 0.2);
            menuAnimation.from(keyboardImage, 1, { alpha: 0, ease: "linear" }, 0.3);
        }
        menuAnimation.from(difficultyLabelButton, 1, { alpha: 0, ease: "linear" }, 0.4);
        menuAnimation.from(this.difficultyLevelButton, 1, { alpha: 0, ease: "linear" }, 0.5);
        menuAnimation.from([playText, playButton], 1, { alpha: 0, ease: "linear" }, 0.6);
        menuAnimation.timeScale(1);
        menuAnimation.play(0);

        // Preveri, ali je naprava mobilna
        this.isMobile = document.body.classList.contains('isMobile');
        if (!this.isMobile) {
            let flightCommands = '';
            // Poslušalec za vnos ukazov prek tipkovnice
            document.addEventListener("keydown", function(e) {
                flightCommands = e.keyCode + flightCommands;
                // Preveri, ali je vnesena pravilna koda
                if (flightCommands.substring(0, 24) === "666566653937393740403838") {
                    that.flightCommandAccepted();
                }
            });
        }
    }

    /* Metoda za obdelavo sprejetega ukaza */
    flightCommandAccepted() {
        console.log("FLIGHT COMMANDS ACCEPTED"); // Izpis v konzolo ob pravilnem vnosu kode
    }

    /* Metoda za posodabljanje scene (trenutno prazna) */
    update() {
        // Brez prehoda v igralno sceno s preslednico
    }

    /* Metoda za prehod v igralno sceno */
    goToGameScene() {
        this.scene.stop(); // Ustavi trenutno sceno
        this.scene.start('gamescene', {
            gameDifficulty: this.difficultyLevel // Prenese izbrano težavnost
        });
    }

    /* Metoda za posodobitev težavnosti */
    updateDifficulty() {
        this.difficultyLevel++; // Poveča težavnost
        if (this.difficultyLevel >= 5) this.difficultyLevel = 1; // Ponastavi na 1, če preseže 4
        this.setDifficulty(); // Posodobi prikaz težavnosti
    }

    /* Metoda za nastavitev prikaza težavnosti */
    setDifficulty() {
        let gameDifficultyLabel = "";
        switch(this.difficultyLevel) {
            case 1:
                gameDifficultyLabel = "EASY"; // Enostavna težavnost
                this.difficultyLevelButton.setTint(0x00ff4c); // Zelena barva
                break;
            case 2:
                gameDifficultyLabel = "MEDIUM"; // Srednja težavnost
                this.difficultyLevelButton.setTint(0x00FFFF); // Cian barva
                break;
            case 3:
                gameDifficultyLabel = "HARD"; // Težka težavnost
                this.difficultyLevelButton.setTint(0xFFBF00); // Oranžna barva
                break;
            case 4:
                gameDifficultyLabel = "LUDICROUS"; // Ekstremna težavnost
                this.difficultyLevelButton.setTint(0xFF0000); // Rdeča barva
                break;
        }
        this.difficultyLevelButton.setText(gameDifficultyLabel); // Posodobi besedilo gumba
    }

    /* Metoda za predvajanje uvodnega videa */
    playIntroVideo() {
        // Dodaj video na sredino zaslona
        const video = this.add.video(window.innerWidth / 2, window.innerHeight / 2, 'introVideo');
        
        // Izračun razmerja za prilagajanje videa
        const videoAspectRatio = 3840 / 2160; // Razmerje videa (16:9)
        const windowAspectRatio = window.innerWidth / window.innerHeight;
        
        let scale;
        if (windowAspectRatio > videoAspectRatio) {
            scale = window.innerWidth / 3840; // Prilagodi glede na širino
        } else {
            scale = window.innerHeight / 2160; // Prilagodi glede na višino
        }
        
        video.setScale(scale); // Nastavi merilo videa
        video.setOrigin(0.5); // Centriraj video
        video.setDepth(1000); // Postavi video nad ostale elemente
        video.play(); // Začni predvajanje videa

        // Dodaj besedilo za preskok videa (sprva nevidno)
        const skipText = this.add
            .text(window.innerWidth * 0.95, window.innerHeight * 0.05, 'Press space to skip', {
                fontSize: 16,
                fontFamily: '"Press Start 2P", Arial',
                color: '#FFFFFF',
                align: 'right',
                shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 2, fill: true }
            })
            .setOrigin(1, 0)
            .setDepth(1001)
            .setAlpha(0);
        console.log('Skip text created at:', skipText.x, skipText.y);

        // Prikaz besedila za preskok po 14 sekundah
        this.time.delayedCall(14000, () => {
            console.log('Showing skip text after 10 seconds');
            skipText.setAlpha(1);
        }, [], this);

        // Poslušalec za preslednico za preskok videa
        const skipKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        skipKey.on('down', () => {
            console.log('Video skipped via spacebar, transitioning to gamescene');
            video.destroy(); // Uniči video
            skipText.destroy(); // Uniči besedilo za preskok
            this.scene.resume(); // Nadaljuj sceno
            this.goToGameScene(); // Preidi v igralno sceno
        }, this);

        // Poslušalec za konec videa
        video.on('complete', () => {
            console.log('Video completed, transitioning to gamescene');
            video.destroy(); // Uniči video
            skipText.destroy(); // Uniči besedilo za preskok
            this.scene.resume(); // Nadaljuj sceno
            this.goToGameScene(); // Preidi v igralno sceno
        });
    }
}

/* Izvoz razreda Menuscene */
export default Menuscene;
