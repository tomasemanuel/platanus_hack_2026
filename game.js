const W = 800;
const H = 600;

class TitleScene extends Phaser.Scene {
  constructor() { super('title'); }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a');
    drawStars(this, 100);

    this.add.text(W / 2, 180, 'PAMPA BLASTER', {
      fontFamily: 'Courier New, monospace',
      fontSize: '64px',
      color: '#66ccff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(W / 2, 250, 'Defendé la pampa del invasor cósmico', {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: '#ffcc66'
    }).setOrigin(0.5);

    this.add.text(W / 2, 360, 'MOVER:    ← →   /   A  D', {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(W / 2, 390, 'DISPARAR: ESPACIO', {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const start = this.add.text(W / 2, 490, 'PRESIONÁ ENTER PARA JUGAR', {
      fontFamily: 'Courier New, monospace',
      fontSize: '22px',
      color: '#66ff66'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: start,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('play'));
    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('play'));
  }
}

class PlayScene extends Phaser.Scene {
  constructor() { super('play'); }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.starLayer = this.add.group();
    drawStars(this, 80, this.starLayer);

    this.score = 0;
    this.lives = 3;
    this.wave = 0;
    this.lastShot = 0;
    this.shotCooldown = 220;

    this.player = this.add.triangle(W / 2, H - 70, 0, 36, 18, 0, 36, 36, 0x66ccff);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setSize(36, 36);
    this.player.body.setOffset(0, 0);

    this.bullets = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,SPACE,W,S');

    this.scoreText = this.add.text(20, 16, 'PUNTOS: 0', {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: '#ffffff'
    });

    this.waveText = this.add.text(W / 2, 16, 'OLA 1', {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: '#ffcc66'
    }).setOrigin(0.5, 0);

    this.livesText = this.add.text(W - 20, 16, 'VIDAS: 3', {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(1, 0);

    this.physics.add.overlap(this.bullets, this.enemies, (b, e) => this.hitEnemy(b, e));
    this.physics.add.overlap(this.player, this.enemies, (p, e) => this.hitPlayer(e, true));
    this.physics.add.overlap(this.player, this.enemyBullets, (p, b) => this.hitPlayer(b, false));

    this.spawnTimer = this.time.addEvent({
      delay: 2400,
      loop: true,
      callback: () => this.spawnWave()
    });
    this.spawnWave();
  }

  update(t) {
    const speed = 340;
    let vx = 0;
    if (this.cursors.left.isDown || this.keys.A.isDown) vx = -speed;
    else if (this.cursors.right.isDown || this.keys.D.isDown) vx = speed;
    this.player.body.setVelocityX(vx);

    if ((this.keys.SPACE.isDown || this.cursors.up.isDown) && t - this.lastShot > this.shotCooldown) {
      this.shoot();
      this.lastShot = t;
    }

    this.starLayer.children.each(s => {
      s.y += s.getData('speed');
      if (s.y > H) {
        s.y = 0;
        s.x = Phaser.Math.Between(0, W);
      }
    });

    this.bullets.children.each(b => { if (b.y < -20) b.destroy(); });
    this.enemyBullets.children.each(b => { if (b.y > H + 20) b.destroy(); });

    this.enemies.children.each(e => {
      if (!e.active) return;
      if (e.y > H + 30) {
        this.lives--;
        this.updateHUD();
        e.destroy();
        beep(160, 0.15, 'sawtooth');
        if (this.lives <= 0) this.gameOver();
        return;
      }
      if (e.canShoot && Phaser.Math.Between(0, 1000) < 4) {
        this.enemyShoot(e);
      }
    });
  }

  shoot() {
    const b = this.add.rectangle(this.player.x, this.player.y - 22, 4, 16, 0x66ff66);
    this.physics.add.existing(b);
    b.body.setVelocityY(-560);
    this.bullets.add(b);
    beep(880, 0.04, 'square');
  }

  enemyShoot(e) {
    const b = this.add.rectangle(e.x, e.y + 14, 4, 12, 0xff6666);
    this.physics.add.existing(b);
    b.body.setVelocityY(280);
    this.enemyBullets.add(b);
    beep(220, 0.05, 'sawtooth');
  }

  spawnWave() {
    this.wave++;
    this.waveText.setText('OLA ' + this.wave);

    const count = Math.min(4 + this.wave, 12);
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(40, W - 40);
      const y = -20 - i * 36;
      const tough = this.wave > 2 && Phaser.Math.Between(0, 100) < 35;
      const color = tough ? 0xffcc66 : 0xff6666;
      const e = this.add.rectangle(x, y, 30, 26, color);
      this.physics.add.existing(e);
      e.body.setVelocityY(70 + Math.min(this.wave * 8, 90));
      e.body.setVelocityX(Phaser.Math.Between(-40, 40));
      e.canShoot = tough;
      e.hp = tough ? 2 : 1;
      e.points = tough ? 30 : 10;
      this.enemies.add(e);
    }

    if (this.spawnTimer.delay > 800) {
      this.spawnTimer.delay = Math.max(800, this.spawnTimer.delay - 60);
    }
    if (this.shotCooldown > 130 && this.wave % 3 === 0) {
      this.shotCooldown -= 15;
    }
  }

  hitEnemy(b, e) {
    explode(this, b.x, b.y, 0x66ff66, 5);
    b.destroy();
    e.hp--;
    if (e.hp <= 0) {
      explode(this, e.x, e.y, 0xffff88, 16);
      this.score += e.points;
      e.destroy();
      this.updateHUD();
      beep(440, 0.08, 'square');
    } else {
      beep(660, 0.03, 'square');
    }
  }

  hitPlayer(obj, isEnemyShip) {
    explode(this, this.player.x, this.player.y, 0x66ccff, 22);
    if (isEnemyShip) {
      explode(this, obj.x, obj.y, 0xff6666, 12);
    }
    obj.destroy();
    this.lives--;
    this.updateHUD();
    beep(110, 0.25, 'sawtooth');
    this.cameras.main.shake(220, 0.012);
    if (this.lives <= 0) this.gameOver();
  }

  updateHUD() {
    this.scoreText.setText('PUNTOS: ' + this.score);
    this.livesText.setText('VIDAS: ' + Math.max(0, this.lives));
  }

  gameOver() {
    this.scene.start('over', { score: this.score, wave: this.wave });
  }
}

class OverScene extends Phaser.Scene {
  constructor() { super('over'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalWave = data.wave || 0;
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a');
    drawStars(this, 80);

    this.add.text(W / 2, 190, 'GAME OVER', {
      fontFamily: 'Courier New, monospace',
      fontSize: '64px',
      color: '#ff6666',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(W / 2, 290, 'PUNTOS: ' + this.finalScore, {
      fontFamily: 'Courier New, monospace',
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(W / 2, 330, 'OLAS SUPERADAS: ' + this.finalWave, {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: '#ffcc66'
    }).setOrigin(0.5);

    const restart = this.add.text(W / 2, 460, 'ENTER PARA REINTENTAR', {
      fontFamily: 'Courier New, monospace',
      fontSize: '22px',
      color: '#66ff66'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: restart,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('play'));
    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('play'));
  }
}

function drawStars(scene, count, group) {
  for (let i = 0; i < count; i++) {
    const x = Phaser.Math.Between(0, W);
    const y = Phaser.Math.Between(0, H);
    const size = Phaser.Math.Between(1, 2);
    const alpha = Phaser.Math.FloatBetween(0.3, 1);
    const star = scene.add.rectangle(x, y, size, size, 0xffffff, alpha);
    if (group) {
      star.setData('speed', Phaser.Math.FloatBetween(0.3, 1.5));
      group.add(star);
    }
  }
}

function explode(scene, x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const p = scene.add.rectangle(x, y, 3, 3, color);
    const ang = Math.random() * Math.PI * 2;
    const sp = 60 + Math.random() * 160;
    scene.tweens.add({
      targets: p,
      x: x + Math.cos(ang) * sp,
      y: y + Math.sin(ang) * sp,
      alpha: 0,
      duration: 450,
      onComplete: () => p.destroy()
    });
  }
}

let audioCtx;
function beep(freq, dur, type) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.value = 0.06;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}

const config = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: 'game',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 } }
  },
  scene: [TitleScene, PlayScene, OverScene]
};

new Phaser.Game(config);
