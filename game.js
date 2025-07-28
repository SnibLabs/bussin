// --- Space Shooter Game ---
// SNIB AI: Method names are consistent, initialization is immediate!

class SpaceShooterGame {
    constructor(containerId) {
        this.width = 480;
        this.height = 640;
        this.container = document.getElementById(containerId);

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);

        this.score = 0;
        this.lives = 3;
        this.state = 'menu'; // 'menu', 'playing', 'gameover'
        this.keys = {};
        this.bullets = [];
        this.enemies = [];
        this.enemyTimer = 0;
        this.enemyInterval = 48; // frames between spawns

        this.player = {
            x: this.width/2,
            y: this.height-60,
            w: 36,
            h: 18,
            speed: 6,
            cooldown: 0
        };

        // Bind event handlers
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleStart = this.handleStart.bind(this);
        this.handleRestart = this.handleRestart.bind(this);

        // Menu UI
        this.createMenu();

        // Input listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);

        // Initial render
        this.render();
    }

    createMenu() {
        // Remove previous menu if present
        if (document.getElementById('startBtn')) {
            document.getElementById('startBtn').remove();
        }
        if (document.getElementById('restartBtn')) {
            document.getElementById('restartBtn').remove();
        }
        if (document.getElementById('gameTitle')) {
            document.getElementById('gameTitle').remove();
        }
        if (document.getElementById('scoreText')) {
            document.getElementById('scoreText').remove();
        }
        if (document.getElementById('gameOverText')) {
            document.getElementById('gameOverText').remove();
        }

        if (this.state === 'menu') {
            // Title
            const title = document.createElement('h1');
            title.id = 'gameTitle';
            title.textContent = '🚀 Space Shooter';
            this.container.insertBefore(title, this.canvas);

            // Start Button
            const btn = document.createElement('button');
            btn.id = 'startBtn';
            btn.textContent = 'Start Game';
            btn.addEventListener('click', this.handleStart);
            this.container.appendChild(btn);
        }

        if (this.state === 'gameover') {
            // Game Over Text
            const over = document.createElement('div');
            over.id = 'gameOverText';
            over.className = 'gameOverText';
            over.textContent = 'GAME OVER';
            this.container.insertBefore(over, this.canvas);

            // Score Text
            const scoreT = document.createElement('div');
            scoreT.id = 'scoreText';
            scoreT.className = 'scoreText';
            scoreT.textContent = `Score: ${this.score}`;
            this.container.insertBefore(scoreT, this.canvas);

            // Restart Button
            const btn = document.createElement('button');
            btn.id = 'restartBtn';
            btn.textContent = 'Restart';
            btn.addEventListener('click', this.handleRestart);
            this.container.appendChild(btn);
        }
    }

    handleKeyDown(e) {
        this.keys[e.code] = true;
        // Prevent arrow keys from scrolling
        if (["ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
    }
    handleKeyUp(e) {
        this.keys[e.code] = false;
    }
    handleStart() {
        this.state = 'playing';
        this.score = 0;
        this.lives = 3;
        this.bullets = [];
        this.enemies = [];
        this.enemyTimer = 0;

        // Remove menu UI
        this.createMenu();

        // Reset player position
        this.player.x = this.width/2;
        this.player.y = this.height-60;
        this.player.cooldown = 0;

        this.render();
        this._animationId = requestAnimationFrame(()=>this.render());
    }
    handleRestart() {
        this.handleStart();
    }

    render() {
        // Main game loop
        if (this.state === 'playing') {
            this.update();
        }
        this.draw();

        if (this.state === 'playing') {
            this._animationId = requestAnimationFrame(()=>this.render());
        }
    }

    update() {
        // Player Movement
        if (this.keys['ArrowLeft'] && this.player.x - this.player.w/2 > 0) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight'] && this.player.x + this.player.w/2 < this.width) {
            this.player.x += this.player.speed;
        }
        // Shooting
        if ((this.keys['Space'] || this.keys['KeyZ']) && this.player.cooldown <= 0) {
            this.bullets.push({
                x: this.player.x,
                y: this.player.y - this.player.h/2 - 8,
                r: 4,
                speed: 10
            });
            this.player.cooldown = 13;
        }
        if (this.player.cooldown > 0) this.player.cooldown--;

        // Bullets update
        this.bullets.forEach(b => b.y -= b.speed);
        this.bullets = this.bullets.filter(b => b.y > -20);

        // Enemies spawn
        this.enemyTimer++;
        if (this.enemyTimer >= this.enemyInterval) {
            this.spawnEnemy();
            this.enemyTimer = 0;
        }
        // Enemies update
        this.enemies.forEach(e => {
            e.y += e.speed;
            // Sine wave movement
            e.x += Math.sin(e.y/32) * e.sway;
        });

        // Collision detection: bullet hits enemy
        for (let i = this.enemies.length-1; i >= 0; i--) {
            let e = this.enemies[i];
            for (let j = this.bullets.length-1; j >= 0; j--) {
                let b = this.bullets[j];
                const dx = e.x - b.x;
                const dy = e.y - b.y;
                if (dx*dx + dy*dy < (e.r + b.r)*(e.r + b.r)) {
                    // Hit!
                    this.enemies.splice(i,1);
                    this.bullets.splice(j,1);
                    this.score += 10;
                    break;
                }
            }
        }
        // Enemy hits player or escapes
        for (let i = this.enemies.length-1; i >= 0; i--) {
            let e = this.enemies[i];
            if (e.y > this.height + 30) {
                // Out of screen, remove
                this.enemies.splice(i,1);
                continue;
            }
            // Collision with player
            const px = this.player.x, py = this.player.y;
            if (Math.abs(e.x-px) < e.r + this.player.w/2-4 &&
                Math.abs(e.y-py) < e.r + this.player.h/2-4) {
                // Player hit!
                this.enemies.splice(i,1);
                this.lives -= 1;
                if (this.lives <= 0) {
                    this.state = 'gameover';
                    cancelAnimationFrame(this._animationId);
                    this.createMenu();
                }
            }
        }
    }

    spawnEnemy() {
        // Random X, with some margin
        const margin = 30;
        const x = margin + Math.random() * (this.width - 2*margin);
        const y = -16;
        const r = 16 + Math.random()*8;
        const speed = 2.2 + Math.random()*1.5;
        const sway = 1 + Math.random()*2.5;
        this.enemies.push({x,y,r,speed,sway});
    }

    draw() {
        const ctx = this.ctx;
        // Clear
        ctx.clearRect(0,0,this.width,this.height);

        // Draw background stars
        ctx.save();
        for (let i=0;i<40;i++) {
            ctx.beginPath();
            ctx.arc(
                ((i*71)%this.width) + ((i%3)*15),
                ((i*53)%this.height) + ((i%5)*9),
                1.2+(i%2),
                0, 2*Math.PI
            );
            ctx.globalAlpha = 0.45+0.1*(i%3);
            ctx.fillStyle = "#b3e0ff";
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
        ctx.restore();

        // Draw player ship
        if (this.state !== 'gameover') {
            ctx.save();
            ctx.translate(this.player.x, this.player.y);
            // Glow
            ctx.shadowColor = "#00d8ff";
            ctx.shadowBlur = 14;
            // Body
            ctx.beginPath();
            ctx.moveTo(0,-this.player.h/2-6);
            ctx.lineTo(-this.player.w/2, this.player.h/2);
            ctx.lineTo(0, this.player.h/2-4);
            ctx.lineTo(this.player.w/2, this.player.h/2);
            ctx.closePath();
            ctx.fillStyle = "#32aaff";
            ctx.fill();

            // Cockpit
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.ellipse(0, -6, 7, 4, 0, 0, 2*Math.PI);
            ctx.fillStyle = "#e2faff";
            ctx.globalAlpha = 0.9;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }

        // Draw bullets
        ctx.save();
        this.bullets.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, 2*Math.PI);
            ctx.fillStyle = "#fffba7";
            ctx.shadowColor = "#ffee60";
            ctx.shadowBlur = 10;
            ctx.fill();
        });
        ctx.restore();

        // Draw enemies
        this.enemies.forEach(e => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.r, 0, 2*Math.PI);
            // Enemy gradient
            const grad = ctx.createRadialGradient(e.x, e.y, 2, e.x, e.y, e.r);
            grad.addColorStop(0, "#fff");
            grad.addColorStop(0.2, "#ffbbbb");
            grad.addColorStop(1, "#ff3264");
            ctx.fillStyle = grad;
            ctx.shadowColor = "#ff3264";
            ctx.shadowBlur = 16;
            ctx.fill();

            // Eyes
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(e.x-6, e.y-2, 2, 0, 2*Math.PI);
            ctx.arc(e.x+6, e.y-2, 2, 0, 2*Math.PI);
            ctx.fillStyle = "#fff";
            ctx.fill();
            ctx.restore();
        });

        // Draw UI
        ctx.save();
        ctx.font = "bold 18px Arial";
        ctx.fillStyle = "#e9f3ff";
        ctx.textAlign = "left";
        ctx.fillText("Score: "+this.score, 16, 28);
        ctx.textAlign = "right";
        ctx.fillText("Lives: "+this.lives, this.width-16, 28);
        ctx.restore();

        // Menu UI (drawn on canvas for fade)
        if (this.state === 'menu') {
            ctx.save();
            ctx.globalAlpha = 0.94;
            ctx.fillStyle = "#181828cc";
            ctx.fillRect(0,0,this.width,this.height);
            ctx.globalAlpha = 1;
            ctx.font = "bold 40px Arial";
            ctx.fillStyle = "#32aaff";
            ctx.textAlign = "center";
            ctx.fillText("SPACE SHOOTER", this.width/2, this.height/2-50);
            ctx.font = "20px Arial";
            ctx.fillStyle = "#fff";
            ctx.fillText("Arrow keys: Move", this.width/2, this.height/2+10);
            ctx.fillText("Space/Z: Shoot", this.width/2, this.height/2+44);
            ctx.fillStyle = "#00f0fa";
            ctx.font = "16px Arial";
            ctx.fillText("Click Start to Play!", this.width/2, this.height/2+94);
            ctx.restore();
        }
    }
}

// --- Initialization ---
function initGame() {
    new SpaceShooterGame('gameContainer');
}
window.addEventListener('DOMContentLoaded', initGame);