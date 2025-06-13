const config = {
    type: Phaser.AUTO,
    pixelArt: false,
    roundPixels: false,
    width: window.innerWidth,
    height: window.innerHeight,
};

class Menuscene extends Phaser.Scene {
    constructor() {
        super({ key: 'menuscene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#00000000');
        this.add.image(window.innerWidth / 2, window.innerHeight / 2, 'menu_background').setScale(1).setOrigin(0.5);
        this.difficultyLevelButton;
        this.difficultyLevel = 1;

        const gameWidth = window.innerWidth;
        const gameHeight = window.innerHeight;
        const halfWidthX = gameWidth / 2;
        const halfHeightY = gameHeight / 2;

        const spacexLogo = this.add.image(halfWidthX, 20, 'logo_spacex');
        const gameLogo = this.add.image(halfWidthX, gameHeight * 0.14, 'logo').setScale(1.2);

        // INSTRUCTIONS
        const instructionsTitle = this.add
            .text(halfWidthX, halfHeightY * 0.5, 'NAVODILA', {
                fontSize: 16,
                fontFamily: '"Press Start 2P"',
                color: '#FFFFFF',
                lineSpacing: 8,
            }).setOrigin(0.5, 0).setAlign('center');

        const instructionsBody = this.add
            .text(halfWidthX, halfHeightY * 0.55, 'Poskusi pristati vesoljsko ladjo Starship na Mars\n Pazi, da ti ne zmanjka goriva\n Izogibaj se vesoljcem', {
                fontSize: 15,
                fontFamily: '"Press Start 2P"',
                color: '#ffffff',
                lineSpacing: 8,
            }).setOrigin(0.5, 0).setAlign('center');

        this.isDesktop = document.body.classList.contains('isDesktop');
        let keyboardCopy;
        let keyboardImage;
        if (this.isDesktop) {
            keyboardCopy = this.add
                .text(halfWidthX, halfHeightY * 0.75, 'KRMILJENJE', {
                    fontSize: 16,
                    fontFamily: '"Press Start 2P"',
                    color: '#FFFFFF',
                    lineSpacing: 8,
                }).setOrigin(0.5, 0).setAlign('center');
            keyboardImage = this.add.image(halfWidthX * 1.05, halfHeightY * 1.3, 'controls').setScale(1);
        }

        // DIFFICULTY
        const difficultyHitArea = this.add.zone(halfWidthX, gameHeight * 0.9, 200, 50).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
        const difficultyLabelButton = this.add
            .text(halfWidthX, gameHeight * 0.9, 'DIFFICULTY', {
                fontSize: 12,
                fontFamily: '"Press Start 2P"',
                color: '#FFFFFF',
                lineSpacing: 10,
            }).setOrigin(0.5, 0).setAlign('center');
        this.difficultyLevelButton = this.add
            .text(halfWidthX, gameHeight * 0.92, 'EASY', {
                fontSize: 12,
                fontFamily: '"Press Start 2P"',
                color: '#FFFFFF',
                lineSpacing: 10,
            }).setOrigin(0.5, 0).setAlign('center');
        this.setDifficulty();
        difficultyHitArea.on('pointerdown', () => {
            this.updateDifficulty();
        });

        const playButton = this.add.image(halfWidthX, gameHeight * 0.97, 'button').setScale(3);
        playButton.setInteractive({ useHandCursor: true });
        playButton.on('pointerdown', () => {
            this.playIntroVideo();
        });
        const playText = this.add
            .text(halfWidthX, gameHeight * 0.97, 'PLAY', {
                fontSize: 18,
                fontFamily: '"Press Start 2P"',
                color: '#FFFFFF',
            }).setOrigin(0.5).setAlign('center');

        const that = this;
        playButton.on('pointerover', function() {
            switch(that.difficultyLevel) {
                case 1:
                    playText.setTint(0x00ff4c);
                    break;
                case 2:
                    playText.setTint(0x00FFFF);
                    break;
                case 3:
                    playText.setTint(0xFFBF00);
                    break;
                case 4:
                    playText.setTint(0xFF0000);
                    break;
            }
        });

        playButton.on('pointerout', function() {
            playText.setTint(0x0FFFFFF);
        });

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

        this.isMobile = document.body.classList.contains('isMobile');
        if (!this.isMobile) {
            let flightCommands = '';
            document.addEventListener("keydown", function(e) {
                flightCommands = e.keyCode + flightCommands;
                if (flightCommands.substring(0, 24) === "666566653937393740403838") {
                    that.flightCommandAccepted();
                }
            });
        }
    }

    flightCommandAccepted() {
        console.log("FLIGHT COMMANDS ACCEPTED");
    }

    update() {
        // No spacebar transition to gamescene
    }

    goToGameScene() {
        this.scene.stop();
        this.scene.start('gamescene', {
            gameDifficulty: this.difficultyLevel
        });
    }

    updateDifficulty() {
        this.difficultyLevel++;
        if (this.difficultyLevel >= 5) this.difficultyLevel = 1;
        this.setDifficulty();
    }

    setDifficulty() {
        let gameDifficultyLabel = "";
        switch(this.difficultyLevel) {
            case 1:
                gameDifficultyLabel = "EASY";
                this.difficultyLevelButton.setTint(0x00ff4c);
                break;
            case 2:
                gameDifficultyLabel = "MEDIUM";
                this.difficultyLevelButton.setTint(0x00FFFF);
                break;
            case 3:
                gameDifficultyLabel = "HARD";
                this.difficultyLevelButton.setTint(0xFFBF00);
                break;
            case 4:
                gameDifficultyLabel = "LUDICROUS";
                this.difficultyLevelButton.setTint(0xFF0000);
                break;
        }
        this.difficultyLevelButton.setText(gameDifficultyLabel);
    }

    playIntroVideo() {
        const video = this.add.video(window.innerWidth / 2, window.innerHeight / 2, 'introVideo');
        
        // Calculate the scale to cover the entire window
        const videoAspectRatio = 3840 / 2160; // Native video aspect ratio (16:9)
        const windowAspectRatio = window.innerWidth / window.innerHeight;
        
        let scale;
        if (windowAspectRatio > videoAspectRatio) {
            scale = window.innerWidth / 3840;
        } else {
            scale = window.innerHeight / 2160;
        }
        
        video.setScale(scale);
        video.setOrigin(0.5);
        video.setDepth(1000);
        video.play();

        // Create skip text (initially invisible)
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

        // Show skip text after 10 seconds
        this.time.delayedCall(14000, () => {
            console.log('Showing skip text after 10 seconds');
            skipText.setAlpha(1);
        }, [], this);

        // Handle spacebar press to skip video
        const skipKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        skipKey.on('down', () => {
            console.log('Video skipped via spacebar, transitioning to gamescene');
            video.destroy();
            skipText.destroy();
            this.scene.resume();
            this.goToGameScene();
        }, this);

        // Listen for video completion
        video.on('complete', () => {
            console.log('Video completed, transitioning to gamescene');
            video.destroy();
            skipText.destroy();
            this.scene.resume();
            this.goToGameScene();
        });
    }
}

export default Menuscene;