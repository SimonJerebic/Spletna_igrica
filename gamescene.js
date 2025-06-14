// Konfiguracija igre
const config = {
    type: Phaser.AUTO,
    pixelArt: false,
    roundPixels: false,
    width: 800,
    height: window.innerHeight,
};

// Dimenzije igre
const gameWidth = 800;
const gameHeight = window.innerHeight;
const gameHeightMax = 25000;

// Parametri za tla in booster
const groundHeight = 1;
const boosterWidth = 18;
const boosterHeight = 110;
const boosterFuelBase = 0; // Začetno gorivo je nič
const launchMountHeight = 70;
const spawnX = gameWidth / 2; // Središče zaslona
const spawnY = 0; // Začetek na vrhu
const framesBooster = [];
const toRAD = Math.PI / 180;

// Spremenljivke za igro
let gameDifficulty = 1; // Privzeta težavnost
let keyA, keyS, keyD, keyW;
let isTouchingLaunchMount = false;
let isTouchingChopsticks = false;

// Razred za glavno igralno sceno
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "gamescene" });
    }

    // Inicializacija podatkov
    init(data) {
        gameDifficulty = data.gameDifficulty || 1; // Privzeto 1, če ni podano
    }

    // Ustvarjanje igralnih elementov
    create() {
        try {
            this.isGameReady = false;
            this.isRaptorUIVisible = false;
            this.isRaptorButtonPressed = false;
            this.isStarshipFlipped = true; // Booster je obrnjen za spust
            this.isRaptorsFiring = false;
            this.isLeftButtonDown = false;
            this.isRightButtonDown = false;
            this.isDragging = false;

            // Inicializacija statistike
            this.altitudeRecord = 0;
            this.totalScore = 0;
            this.boosterFuel = boosterFuelBase;
            this.starshipDirection = "going_down";
            this.gameVelocityMax = 500 * gameDifficulty;
            this.gameState = "flying";
            this.gameDuration = 0;
            this.powerupsCollected = 0;
            this.lastVelocity = 0;
            this.dragPower = 0;

            // Ustvarjanje zvočnih efektov
            this.createSoundEffects();
            // Ustvarjanje okolja
            this.createEnvironment();
            // Ustvarjanje power-up elementov
            this.createPowerups();
            // Ustvarjanje boosterja
            this.createBooster();
            // Ustvarjanje stolpa
            this.createTower();

            // Nastavitev kamere
            this.cameras.main.setBounds(0, 0, gameWidth, gameHeightMax);
            this.physics.world.setBounds(0, 0, gameWidth, gameHeightMax);
            this.cameras.main.startFollow(this.boosterContainer, true, 1, 1, 0, -Math.ceil(boosterHeight * 1.25));
            this.cameras.main.setZoom(1);

            // Tipkovnični vhodi
            this.keyboardInput = this.input.keyboard.createCursorKeys();
            keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
            keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
            keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);

            // Gumb za zvok
            const btnAudio = document.getElementById("btn-audio");
            if (btnAudio) {
                btnAudio.addEventListener("click", () => this.toggleAudio());
            }

            // Gumb za meni
            const btnMenu = document.getElementById("btn-menu");
            if (btnMenu) {
                btnMenu.addEventListener("click", () => this.hideGameUI());
            }

            // Gumb za ponovno igro
            const btnGameOver = document.getElementById("gameover-play-again");
            if (btnGameOver) {
                btnGameOver.addEventListener("click", () => this.resetGame());
            }

            // Gumb za raptors
            const btnRaptors = document.getElementById("btn-raptors");
            if (btnRaptors) {
                // Namizne kontrole
                btnRaptors.addEventListener("mousedown", () => {
                    this.isRaptorButtonPressed = true;
                });
                btnRaptors.addEventListener("mouseup", () => {
                    this.isRaptorButtonPressed = false;
                });
                // Mobilne kontrole
                btnRaptors.addEventListener("touchstart", (event) => {
                    this.isRaptorButtonPressed = true;
                    event.preventDefault();
                    event.stopPropagation();
                });
                btnRaptors.addEventListener("touchend", () => {
                    this.isRaptorButtonPressed = false;
                });
            }

            // Draggable kontrole
            const clipperControls = this.clipAtRadius(30, 0, 0);
            if (typeof Draggable !== "undefined") {
                Draggable.create("#controls-move .control-container", {
                    type: "x",
                    liveSnap: { points: clipperControls },
                    onDrag: () => {
                        this.isDragging = true;
                        this.dragPower = Draggable.get("#controls-move .control-container").x * 6;
                    },
                    onDragEnd: () => {
                        this.isDragging = false;
                        this.dragPower = 0;
                        gsap.to("#controls-move .control-container", 1, { x: 0, y: 0, ease: "expo.out" });
                    }
                });
            }

            // Časovnik igre
            this.timer = this.time.addEvent({
                delay: 1000,
                callback: this.updateTimer,
                callbackScope: this,
                loop: true
            });

            // Prikaz uporabniškega vmesnika
            this.showGameUI();
            this.showRaptorUI();
        } catch (error) {
            console.error("Napaka pri ustvarjanju GameScene:", error);
        }
    }

    // Omejevanje drsanja na radij
    clipAtRadius(radius, offsetX, offsetY) {
        return point => {
            let x = point.x - offsetX,
                y = point.y - offsetY,
                length = Math.sqrt(x * x + y * y),
                angle;
            if (length > radius) {
                angle = Math.atan2(y, x);
                point.x = radius * Math.cos(angle);
                point.y = radius * Math.sin(angle);
            }
            return point;
        };
    }

    // Posodabljanje časovnika
    updateTimer() {
        if (this.gameState === "flying") {
            this.gameDuration += 1;
        }
    }

    // Ustvarjanje igralnega okolja
    createEnvironment() {
        const centerX = gameWidth / 2;
        const starRangeHigh = 0;
        const starRangeLow = gameHeightMax / 2;
        const cloudRangeHigh = starRangeLow;
        const cloudRangeLow = gameHeightMax - 500;

        // Ozadje in oblaki
        const bgScale = Math.ceil(gameHeightMax / 1266);
        this.backgroundGradient = this.add.image(centerX, 0, 'bg_full_sky').setOrigin(0.5, 0).setScale(800 / 585, bgScale);
        this.add.image(centerX, gameHeightMax - groundHeight, 'bg_clouds').setOrigin(0.5, 1).setScale(800 / 585, 15);

        // Ustvarjanje oblakov
        const cloudTotal = 100;
        this.clouds = this.physics.add.staticGroup();
        this.clouds.createMultiple({ key: 'cloud', frame: 0, quantity: cloudTotal, visible: true, active: false });
        this.clouds.children.entries.forEach(target => {
            const x = Phaser.Math.Between(100, 700);
            const y = Phaser.Math.Between(cloudRangeHigh, cloudRangeLow);
            const alpha = this.calculatePercentage(y, cloudRangeHigh, cloudRangeLow);
            target.setPosition(x, y).setAlpha(alpha);
        });

        // Ustvarjanje zvezd
        this.stars = this.add.group();
        const starsTotal = 150;
        for (let i = 0; i < starsTotal; i++) {
            const x = Phaser.Math.Between(100, 700);
            const y = Phaser.Math.Between(starRangeLow, starRangeHigh);
            const alpha = 1 - this.calculatePercentage(y, starRangeHigh, starRangeLow);
            this.stars.create(x, y, 'sprite_stars', Phaser.Math.Between(0, 7)).setAlpha(alpha).setScale(2);
        }

        // Velike zvezde
        const bigStarsTotal = starsTotal * 0.25;
        for (let i = 0; i < bigStarsTotal; i++) {
            const x = Phaser.Math.Between(100, 700);
            const y = Phaser.Math.Between(starRangeLow, starRangeHigh);
            const alpha = 1 - this.calculatePercentage(y, starRangeHigh, starRangeLow);
            this.stars.create(x, y, 'sprite_stars', Phaser.Math.Between(8, 17)).setAlpha(alpha).setScale(2);
        }

        // Dodajanje lune in drugih objektov
        this.add.image(300, 200, 'sprite_moon', Phaser.Math.Between(0, 7)).setScale(2);
        this.add.image(500, 500, 'iss').setScale(2);
        this.add.image(475, 100, 'viper');
    }

    // Ustvarjanje boosterja
    createBooster() {
        this.boosterContainer = this.add.container(spawnX, spawnY).setScale(2);
        this.boosterContainer.width = boosterWidth;
        this.boosterContainer.height = boosterHeight;
        this.physics.world.enable([this.boosterContainer]);
        this.boosterContainer.body.setGravityY(500);
        this.boosterContainer.body.setCollideWorldBounds(true);
        this.boosterContainer.body.setSize(boosterWidth + 4, boosterHeight).setOffset(-2, 0);

        const boosterInnerContainer = this.add.container(0, boosterHeight / 2);
        this.boosterContainer.add(boosterInnerContainer);

        // Plameni boosterja
        this.spriteBoosterFlames = this.add.sprite(0, boosterHeight / 2, 'sprite_flames').setOrigin(0.5, 0);
        boosterInnerContainer.add(this.spriteBoosterFlames);
        this.spriteBoosterFlames.setVisible(false);

        this.spriteBoosterFlames.anims.create({
            key: 'raptors_descent',
            frames: this.anims.generateFrameNumbers('sprite_flames', { frames: [2, 3] }),
            frameRate: 16,
            repeat: -1
        });

        // Sprite boosterja
        this.spriteBooster = this.add.sprite(0, -boosterHeight / 2, 'sprite_booster').setOrigin(0.5, 0);
        boosterInnerContainer.add(this.spriteBooster);
        framesBooster.push(this.textures.getFrame('sprite_booster', 0));
        framesBooster.push(this.textures.getFrame('sprite_booster', 1));
        framesBooster.push(this.textures.getFrame('sprite_booster', 2));

        // Kolizija boosterja
        this.spriteBoosterCollision = this.add.sprite(0, -boosterHeight / 2, 'sprite_booster_collision').setOrigin(0.5, 0);
        boosterInnerContainer.add(this.spriteBoosterCollision);
        this.spriteBoosterCollision.anims.create({
            key: 'powerup_explosion',
            frames: this.anims.generateFrameNumbers('sprite_booster_collision', { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8] }),
            frameRate: 30
        });
        this.spriteBoosterCollision.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            this.spriteBoosterCollision.setVisible(false);
        });
        this.spriteBoosterCollision.setVisible(false);

        // Prekrivanje z power-up elementi
        this.physics.add.overlap(this.boosterContainer, this.powerups, this.collectPowerups, null, this);
        this.physics.add.overlap(this.boosterContainer, this.aliens, this.collectPowerups, null, this);
        this.physics.add.overlap(this.boosterContainer, this.rockets, this.collectPowerups, null, this);
        if (this.edgeguards) {
            this.physics.add.overlap(this.boosterContainer, this.edgeguards, this.collectPowerups, null, this);
        }
    }

    // Posodabljanje boosterja
    updateBooster() {
        this.calculateDirection();

        if (this.boosterContainer.body.touching.down && isTouchingLaunchMount) {
            this.resetBoosterXMovement();
            if (this.gameState === "flying" && this.lastVelocity > 0) {
                this.gameOver('velocity');
                return;
            }
            this.gameState = "startup";
        } else {
            this.lastVelocity = this.boosterContainer.body.velocity.y;

            // Premikanje levo/desno
            if (this.isLeftButtonDown || this.keyboardInput.left.isDown || keyA.isDown || this.isDragging) {
                this.spriteBooster.frame = framesBooster[1];
                this.boosterContainer.body.velocity.x = this.isDragging ? this.dragPower : -210;
            } else if (this.isRightButtonDown || this.keyboardInput.right.isDown || keyD.isDown || this.isDragging) {
                this.spriteBooster.frame = framesBooster[2];
                this.boosterContainer.body.velocity.x = this.isDragging ? this.dragPower : 210;
            } else {
                this.resetBoosterXMovement();
            }

            // Aktivacija raptors
            if (this.boosterFuel > 0 && (this.keyboardInput.space.isDown || this.keyboardInput.up.isDown || this.isRaptorButtonPressed || keyW.isDown)) {
                this.isRaptorsFiring = true;
                this.boosterContainer.body.velocity.y -= 20;
                this.boosterFuel -= 0.05;
                console.log(`Raptors aktivirani! Gorivo: ${this.boosterFuel}, Hitrost Y: ${this.boosterContainer.body.velocity.y}`);
            } else {
                this.isRaptorsFiring = false;
            }

            // Omejitev hitrosti
            if (this.boosterContainer.body.velocity.y > this.gameVelocityMax) {
                this.boosterContainer.body.velocity.y = this.gameVelocityMax;
            }

            // Prikaz plamenov
            if (this.isRaptorsFiring && this.boosterFuel > 0) {
                this.showBoosterFlames();
            } else {
                this.hideBoosterFlames();
            }

            // Preverjanje ulova
            if (this.gameState === "flying" && isTouchingChopsticks) {
                if (this.lastVelocity <= 250 && this.lastVelocity >= -250) {
                    this.gameOver('catch');
                    console.log(`Uspešen ulov! Booster Y: ${this.boosterContainer.y}, BoosterHit Y: ${this.boosterHit.y}`);
                    return;
                }
            }
        }

        isTouchingLaunchMount = false;
        isTouchingChopsticks = false;
    }

    // Prikaz plamenov boosterja
    showBoosterFlames() {
        if (!this.spriteBoosterFlames.anims.isPlaying) {
            this.spriteBoosterFlames.play('raptors_descent');
            this.spriteBoosterFlames.setVisible(true);
            if (this.sfxBoosterEngines) {
                this.sfxBoosterEngines.play();
            }
        }
    }

    // Skrivanje plamenov boosterja
    hideBoosterFlames() {
        if (this.spriteBoosterFlames.anims.isPlaying) {
            this.spriteBoosterFlames.stop('raptors_descent');
            this.spriteBoosterFlames.setVisible(false);
            if (this.sfxBoosterEngines) {
                this.sfxBoosterEngines.stop();
            }
        }
    }

    // Ponastavitev gibanja boosterja
    resetBoosterXMovement() {
        this.boosterContainer.body.velocity.x = 0;
        this.spriteBooster.frame = framesBooster[0];
    }

    // Ustvarjanje stolpa
    createTower() {
        const centerX = gameWidth / 2;

        // Izhodiščna ploščad
        const launch_mount = this.add.image(centerX, gameHeightMax - groundHeight, 'launch_mount').setScale(2).setOrigin(0.5, 1);
        const launch_mount_hit = this.add.rectangle(centerX, gameHeightMax, 60, launchMountHeight, 0x000000).setOrigin(0.5, 1).setAlpha(0);
        this.physics.world.enable(launch_mount_hit);
        launch_mount_hit.body.setImmovable(true);
        launch_mount_hit.body.setAllowGravity(false);
        this.physics.add.collider(this.boosterContainer, launch_mount_hit, () => {
            isTouchingLaunchMount = true;
        });

        // Hopper
        const hopperX = 50;
        const hopperY = gameHeightMax - groundHeight;
        const hopper = this.add.image(hopperX, hopperY, 'hopper').setScale(2).setOrigin(0, 1);
        const hopperHit = this.add.rectangle(hopperX, hopperY, 22, 25, 0x000000).setScale(2).setOrigin(0, 1).setAlpha(0);
        this.physics.world.enable(hopperHit);
        hopperHit.body.setImmovable(true);
        hopperHit.body.setAllowGravity(false);
        this.physics.add.collider(this.boosterContainer, hopperHit, () => {
            this.gameOver('hopper');
        }, null, this);

        // Stolp
        const towerX = 135;
        const towerY = gameHeightMax - groundHeight;
        const tower = this.add.image(towerX, towerY, 'tower').setScale(2).setOrigin(0, 1);
        const towerHit = this.add.rectangle(towerX + 23, towerY, 34, 235, 0x000000).setScale(2).setOrigin(0, 1).setAlpha(0);
        this.physics.world.enable(towerHit);
        towerHit.body.setImmovable(true);
        towerHit.body.setAllowGravity(false);
        this.physics.add.collider(this.boosterContainer, towerHit, () => {
            this.gameOver('tower');
        }, null, this);

        // Chopsticks
        const chopsticks = this.add.image(towerX + 44, gameHeightMax - groundHeight - 385, 'chopsticks').setScale(2).setOrigin(0, 0);
        const chopsticksHit = this.add.rectangle(towerX + 44, gameHeightMax - groundHeight - 385, 65, 1, 0x000000).setScale(2).setOrigin(0, 0).setAlpha(0);
        this.physics.world.enable(chopsticksHit);
        chopsticksHit.body.setImmovable(true);
        chopsticksHit.body.setAllowGravity(false);

        // Tla
        const ground = this.add.rectangle(0, gameHeightMax + 1, gameWidth, groundHeight + 1, 0x333333).setOrigin(0, 1);
        this.physics.world.enable(ground);
        ground.body.setImmovable(true);
        ground.body.setAllowGravity(false);
        this.physics.add.collider(this.boosterContainer, ground, () => {
            this.gameOver('ground');
            console.log(`Trk v tla! Booster Y: ${this.boosterContainer.y}`);
        }, null, this);

        // Booster hit točka
        this.boosterHit = this.add.rectangle(spawnX, spawnY, boosterWidth, 1, 0x000000).setScale(2).setOrigin(0.5, 1).setAlpha(0);
        this.physics.world.enable(this.boosterHit);
        this.boosterHit.body.setImmovable(true);
        this.boosterHit.body.setAllowGravity(false);
        this.physics.add.overlap(this.boosterHit, chopsticksHit, () => {
            isTouchingChopsticks = true;
            console.log(`Prekrivanje s chopsticks! Booster Y: ${this.boosterContainer.y}, BoosterHit Y: ${this.boosterHit.y}`);
        }, null, this);
    }

    // Prikaz uporabniškega vmesnika
    showGameUI() {
        try {
            gsap.set("#game-ui, #high-score", { autoAlpha: 1 });
            const introAnimation = gsap.timeline({
                paused: true,
                onComplete: () => {
                    this.isGameReady = true;
                }
            });
            introAnimation.fromTo("#high-score", 0.5, { y: -50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: "expo.out" }, 0);
            introAnimation.timeScale(1);
            introAnimation.play(0);
        } catch (error) {
            console.error("Napaka pri prikazu GameUI:", error);
        }
    }

    // Skrivanje uporabniškega vmesnika
    hideGameUI() {
        this.hideRaptorUI();
        gsap.set("#game-ui, #high-score", { autoAlpha: 0 });
        this.scene.stop();
        this.scene.start('menuscene');
        this.game.sound.stopAll();
    }

    // Posodabljanje stanja igre
    updateStatus() {
        let altitude = gameHeightMax - Math.floor(this.boosterContainer.y) - launchMountHeight - boosterHeight;
        if (altitude < 50) altitude = 0;
        if (altitude >= this.altitudeRecord) {
            this.altitudeRecord = altitude;
        }

        const powerUpScore = this.powerupsCollected * (100 * gameDifficulty);
        this.totalScore = Math.max(0, Math.floor(powerUpScore));
        console.log(`Rezultat posodobljen: PowerUpScore=${powerUpScore}, TotalScore=${this.totalScore}`);

        gsap.to("#score", {
            innerText: this.totalScore,
            ease: "linear",
            duration: 0.5,
            snap: { innerText: 1 }
        });

        const altitudeSize = 148;
        const altitudePosition = Math.ceil(altitudeSize * (1 - (altitude / gameHeightMax)));
        gsap.set("#altitude .marker", { y: altitudePosition, transformOrigin: "0% 50%" });

        let currentVelocity = this.boosterContainer.body.velocity.y;
        const maxVelocity = 1000;
        if (currentVelocity > maxVelocity) currentVelocity = maxVelocity;
        if (currentVelocity < -maxVelocity) currentVelocity = -maxVelocity;

        const velocitySize = 49;
        const velocityPosition = currentVelocity > 0
            ? velocitySize * (currentVelocity / maxVelocity)
            : -velocitySize * (-currentVelocity / maxVelocity);

        gsap.to("#velocity .marker", 0.25, { y: velocityPosition, transformOrigin: "0% 50%" });

        const fuelSizeY = 148;
        let fuelStatusY = Math.ceil(fuelSizeY * (1 - (this.boosterFuel / 100)));
        if (fuelStatusY > fuelSizeY) fuelStatusY = fuelSizeY;
        gsap.to("#fuel .marker", 1, { y: fuelStatusY, transformOrigin: "0% 50%" });
    }

    // Konec igre
    gameOver(reason) {
        this.gameState = "gameover";
        this.physics.pause();
        this.spriteBooster.frame = framesBooster[0];
        this.hideBoosterFlames();

        this.title = 'Konec igre';
        this.message = '';
        switch (reason) {
            case 'ground':
                this.message = "Brez pristajalnih nog na tem boosterju. Naslednjič ciljaj na chopsticks.";
                this.sound.play('sfx_gameover');
                break;
            case 'tower':
                this.message = "Chopsticks so tamle...";
                this.sound.play('sfx_gameover');
                break;
            case 'velocity':
                this.message = "Zmanjkalo ti je goriva ali si pozabil, da ga imaš.";
                this.sound.play('sfx_gameover');
                break;
            case 'hopper':
                this.message = "Hopper!!!<br>NE!!!!!!!!";
                this.sound.play('sfx_gameover');
                break;
            case 'catch':
                this.title = 'Uspeh!!!';
                this.message = "Ujel si booster!<br>Naslednja postaja: hitra ponovna uporaba.";
                this.sound.play('sfx_success');
                break;
        }

        const gameOverTitle = document.getElementById('gameover-title');
        const gameOverMessage = document.getElementById('gameover-message');
        if (gameOverTitle) gameOverTitle.innerHTML = this.title;
        if (gameOverMessage) gameOverMessage.innerHTML = this.message;

        const outroAnimation = gsap.timeline({ paused: true });
        outroAnimation.fromTo("#gameover", 1, { autoAlpha: 0 }, { autoAlpha: 1, ease: "expo.out" }, 0);
        outroAnimation.fromTo("#gameover .overlay-inner div", 1, { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.25, ease: "expo.out" }, 0);
        outroAnimation.to("#altitude", 1, { autoAlpha: 0, ease: "expo.out" }, 0);
        outroAnimation.to("#fuel", 1, { autoAlpha: 0, ease: "expo.out" }, 0);
        outroAnimation.to("#btn-audio, #btn-menu", 1, { autoAlpha: 0, ease: "expo.out" }, 0);
        outroAnimation.timeScale(1);
        outroAnimation.play(0);

        this.hideRaptorUI();
    }

    // Ponastavitev igre
    resetGame() {
        this.gameState = "flying";
        this.gameDuration = 0;
        this.altitudeRecord = 0;
        this.totalScore = 0;
        this.powerupsCollected = 0;
        this.lastVelocity = 0;
        this.boosterContainer.setX(spawnX);
        this.boosterContainer.setY(spawnY);
        this.boosterFuel = boosterFuelBase;
        this.physics.resume();
        gsap.set("#gameover", { autoAlpha: 0 });
        gsap.to("#altitude", 1, { autoAlpha: 1, ease: "expo.out" });
        gsap.to("#fuel", 1, { autoAlpha: 1, ease: "expo.out" });
        gsap.to("#btn-audio, #btn-menu", 1, { autoAlpha: 1, ease: "expo.out" });

        this.resetPowerups();
        this.showRaptorUI();
    }

    // Prikaz Raptor UI
    showRaptorUI() {
        if (!this.isRaptorUIVisible) {
            this.isRaptorUIVisible = true;
            gsap.fromTo("#btn-raptors, #btn-shield, #controls-move", 1, { autoAlpha: 0 }, { autoAlpha: 1, ease: "expo.out" });
        }
    }

    // Skrivanje Raptor UI
    hideRaptorUI() {
        this.isRaptorUIVisible = false;
        this.isRaptorsFiring = false;
        this.isRaptorButtonPressed = false;
        gsap.set("#btn-raptors, #btn-shield, #controls-move", { autoAlpha: 0 });
    }

    // Izračun odstotka
    calculatePercentage(value, min, max) {
        return (value - min) / (max - min);
    }

    // Izračun smeri boosterja
    calculateDirection() {
        const velocityY = this.boosterContainer.body.velocity.y;
        this.starshipDirection = velocityY < 0 ? "going_up" : velocityY > 0 ? "going_down" : "idle";

        if (this.boosterHit) {
            this.boosterHit.setX(this.boosterContainer.x);
            this.boosterHit.setY(this.boosterContainer.y - boosterHeight * 1.8);
        }
    }

    // Posodabljanje igre
    update() {
        if (!this.isGameReady || this.gameState === "gameover") return;
        this.updateBooster();
        this.updateStatus();
    }

    // Ustvarjanje zvočnih efektov
    createSoundEffects() {
        this.sfxBoosterEngines = this.sound.add('engines', { volume: 1, loop: true });
    }

    // Ustvarjanje power-up elementov
    createPowerups() {
        const centerX = gameWidth / 2;

        // Zvezde
        const powerupTotal = 50 * gameDifficulty;
        this.powerups = this.physics.add.group({ immovable: true, allowGravity: false });
        this.powerups.createMultiple({ key: 'star', frame: 0, quantity: powerupTotal, visible: true, active: true });
        this.powerups.children.entries.forEach(target => {
            const x = Phaser.Math.Between(100, 700);
            const y = Phaser.Math.Between(0, gameHeightMax - gameHeight);
            target.setPosition(x, y);
            if (gameDifficulty >= 2) {
                target.setBounce(1).setCollideWorldBounds(true);
                const speedFactor = gameDifficulty === 3 ? 75 : gameDifficulty === 4 ? 150 : 25;
                target.setVelocity(Phaser.Math.Between(-speedFactor * gameDifficulty, speedFactor * gameDifficulty), 0);
            }
        });

        // Vesoljci
        let alienTotal = gameDifficulty === 1 ? 25 : gameDifficulty === 4 ? 75 * gameDifficulty : 50 * gameDifficulty;
        this.aliens = this.physics.add.group({ immovable: true, allowGravity: false });
        for (let i = 0; i < alienTotal; i++) {
            this.aliens.create(0, 0, 'sprite_aliens', Phaser.Math.Between(0, 7));
        }
        this.aliens.children.entries.forEach(target => {
            const x = Phaser.Math.Between(100, 700);
            const y = Phaser.Math.Between(0, gameHeightMax - gameHeight - 100);
            target.setPosition(x, y).setBounce(1).setScale(2).setCollideWorldBounds(true);
            const speedFactor = gameDifficulty === 2 ? 50 : gameDifficulty === 3 ? 100 : gameDifficulty === 4 ? 150 : 25;
            target.setVelocity(Phaser.Math.Between(-speedFactor * gameDifficulty, speedFactor * gameDifficulty), 0);
        });

        // Rakete
        let rocketTotal = gameDifficulty === 4 ? 50 * gameDifficulty : 25 * gameDifficulty;
        this.rockets = this.physics.add.group({ immovable: true, allowGravity: false });
        this.rockets.createMultiple({ key: 'rocket1', frame: 0, quantity: rocketTotal, visible: true, active: true });
        this.rockets.createMultiple({ key: 'rocket2', frame: 0, quantity: rocketTotal, visible: true, active: true });
        this.rockets.children.entries.forEach(target => {
            const x = Phaser.Math.Between(100, 700);
            const y = Phaser.Math.Between(0, gameHeightMax - gameHeight - 100);
            target.setPosition(x, y).setScale(2).setBounce(1).setCollideWorldBounds(true);
            const speedFactor = gameDifficulty === 2 ? 50 : gameDifficulty === 3 ? 100 : gameDifficulty === 4 ? 150 : 25;
            target.setVelocity(Phaser.Math.Between(-speedFactor * gameDifficulty, speedFactor * gameDifficulty), 0);
        });

        // Astronavti
        const astronautTotal = 5;
        this.astronauts = this.physics.add.group({ immovable: true, allowGravity: false });
        this.astronauts.createMultiple({ key: 'astronaut', frame: 0, quantity: astronautTotal, visible: true, active: true });
        this.astronauts.children.entries.forEach(target => {
            const x = Phaser.Math.Between(100, 700);
            const y = Phaser.Math.Between(0, gameHeightMax - gameHeight - 100);
            target.setPosition(x, y).setScale(1);
        });

        // Ograje na robovih
        if (gameDifficulty === 4) {
            const edgeGuardTotal = 100;
            const edgeGuardSpread = (gameHeightMax - 1000) / edgeGuardTotal;
            this.edgeguards = this.physics.add.group({ immovable: true, allowGravity: false });
            this.edgeguards.createMultiple({ key: 'edgeguard', frame: 0, quantity: edgeGuardTotal, visible: true, active: true });
            this.edgeguards.children.entries.forEach((target, i) => {
                const x = Phaser.Math.Between(100, 700);
                const y = i * edgeGuardSpread;
                target.setPosition(x, y).setScale(2).setCollideWorldBounds(true);
            });
        }
    }

    // Ponastavitev power-up elementov
    resetPowerups() {
        [this.powerups, this.aliens, this.rockets, this.astronauts, this.edgeguards].forEach(group => {
            if (group && group.children) {
                group.children.entries.forEach(target => {
                    target.enableBody(false, 0, 0, true, true);
                });
            }
        });
    }

    // Zbiranje power-up elementov
    collectPowerups(booster, objects) {
        objects.disableBody(true, true);
        switch (objects.texture.key) {
            case 'star':
                this.powerupsCollected += 1;
                this.sound.play('sfx_powerup2');
                this.updateFuel("booster", 10);
                console.log(`Zbrana zvezda! Gorivo: ${this.boosterFuel}, Powerups: ${this.powerupsCollected}`);
                break;
            case 'sprite_aliens':
            case 'rocket1':
            case 'rocket2':
            case 'edgeguard':
                this.powerupsCollected -= 1;
                this.sound.play('sfx_alien');
                this.sound.play('sfx_explosion');
                this.spriteBoosterCollision.setVisible(true);
                this.spriteBoosterCollision.play('powerup_explosion');
                this.updateFuel("booster", -5);
                console.log(`Zadet ovira! Gorivo: ${this.boosterFuel}, Powerups: ${this.powerupsCollected}, Booster Y: ${this.boosterContainer.y}, Objekt Y: ${objects.y}`);
                break;
        }
    }

    // Posodabljanje goriva
    updateFuel(vehicle, number) {
        if (vehicle === "booster") {
            this.boosterFuel = Math.max(0, Math.min(100, this.boosterFuel + number));
        }
    }

    // Preklop zvoka
    toggleAudio() {
        this.sound.mute = !this.sound.mute;
        const btnAudio = document.getElementById('btn-audio');
        if (btnAudio) {
            btnAudio.innerHTML = this.sound.mute ? "ZVOK<br>IZKLOP" : "ZVOK<br>VKLOP";
        }
    }
}

export default GameScene;
