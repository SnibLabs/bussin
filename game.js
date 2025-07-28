// --- Tropical Shooter Game ---
// SNIB AI: Method names are consistent, initialization is immediate!

class TropicalShooterGame {
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
            title.textContent = '🏝️ Tropical Shooter';
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
        // Add a "coconut" and "pineapple" style for tropical theme!
        const type = Math.random() < 0.5 ? 'coconut' : 'pineapple';
        this.enemies.push({x,y,r,speed,sway,type});
    }

    draw() {
        const ctx = this.ctx;
        // Draw tropical background (sky, sea, sand)
        ctx.clearRect(0,0,this.width,this.height);

        // Sky gradient
        let skyGrad = ctx.createLinearGradient(0, 0, 0, this.height * 0.6);
        skyGrad.addColorStop(0, "#48c6ef");
        skyGrad.addColorStop(1, "#6fedd6");
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.width, this.height * 0.6);

        // Sun
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.width - 70, 90, 38, 0, 2 * Math.PI);
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "#fff39e";
        ctx.shadowColor = "#ffe066";
        ctx.shadowBlur = 24;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.restore();

        // Ocean
        let seaGrad = ctx.createLinearGradient(0, this.height * 0.6, 0, this.height * 0.8);
        seaGrad.addColorStop(0, "#4fc3f7");
        seaGrad.addColorStop(1, "#1976d2");
        ctx.fillStyle = seaGrad;
        ctx.fillRect(0, this.height * 0.6, this.width, this.height * 0.2);

        // Sand/beach
        ctx.fillStyle = "#ffe7a0";
        ctx.fillRect(0, this.height * 0.8, this.width, this.height * 0.2);

        // Draw palm trees (decorative, fixed positions)
        this.drawPalmTree(ctx, 60, this.height * 0.92, 1.2, -1);
        this.drawPalmTree(ctx, this.width-80, this.height * 0.95, 1.1, 1);

        // Draw tropical clouds
        this.drawCloud(ctx, 110, 80, 48, 1);
        this.drawCloud(ctx, 300, 65, 34, 0.7);
        this.drawCloud(ctx, 200, 110, 40, 0.8);

        // Draw player "surfboard" style ship
        if (this.state !== 'gameover') {
            ctx.save();
            ctx.translate(this.player.x, this.player.y);
            // Shadow under ship
            ctx.save();
            ctx.globalAlpha = 0.19;
            ctx.beginPath();
            ctx.ellipse(0, this.player.h/2+7, this.player.w/1.8, 6, 0, 0, 2*Math.PI);
            ctx.fillStyle = "#000";
            ctx.fill();
            ctx.restore();

            // Surfboard body
            ctx.beginPath();
            ctx.ellipse(0, 0, this.player.w/2, this.player.h, 0, 0, 2*Math.PI);
            ctx.fillStyle = "#ffb700";
            ctx.shadowColor = "#ffe066";
            ctx.shadowBlur = 14;
            ctx.fill();

            // Surfboard stripe
            ctx.shadowBlur = 0;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(0, 0, this.player.w/4.2, this.player.h-2, 0, 0, 2*Math.PI);
            ctx.fillStyle = "#fff";
            ctx.globalAlpha = 0.6;
            ctx.fill();
            ctx.restore();

            // Tropical flower
            ctx.save();
            for(let i=0;i<5;i++){
                ctx.rotate((Math.PI*2/5)*i);
                ctx.beginPath();
                ctx.ellipse(0, -6, 3.5, 7, 0, 0, 2*Math.PI);
                ctx.fillStyle = "#ff4a4a";
                ctx.globalAlpha = 0.82;
                ctx.fill();
            }
            ctx.restore();

            // Cockpit (blue glass)
            ctx.beginPath();
            ctx.ellipse(0, -3, 7, 4, 0, 0, 2*Math.PI);
            ctx.fillStyle = "#9eefff";
            ctx.globalAlpha = 0.95;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }

        // Draw water splash bullets
        ctx.save();
        this.bullets.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, 2*Math.PI);
            let grad = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, b.r);
            grad.addColorStop(0, "#fff");
            grad.addColorStop(1, "#24e0ff");
            ctx.fillStyle = grad;
            ctx.shadowColor = "#24e0ff";
            ctx.shadowBlur = 9;
            ctx.fill();
        });
        ctx.restore();

        // Draw tropical enemies (coconut and pineapple)
        this.enemies.forEach(e => {
            ctx.save();
            if (e.type === 'coconut') {
                // Coconut: brown circle + face
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.r, 0, 2*Math.PI);
                let grad = ctx.createRadialGradient(e.x, e.y, 3, e.x, e.y, e.r);
                grad.addColorStop(0, "#fff3");
                grad.addColorStop(0.3, "#ad6e2f");
                grad.addColorStop(1, "#6b3b14");
                ctx.fillStyle = grad;
                ctx.shadowColor = "#ad6e2f";
                ctx.shadowBlur = 10;
                ctx.fill();

                // Eyes
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.arc(e.x-5, e.y-3, 2, 0, 2*Math.PI);
                ctx.arc(e.x+5, e.y-3, 2, 0, 2*Math.PI);
                ctx.fillStyle = "#fff";
                ctx.fill();

                // Mouth (smile)
                ctx.beginPath();
                ctx.arc(e.x, e.y+4, 4, 0, Math.PI, false);
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = "#fff";
                ctx.stroke();
            } else {
                // Pineapple: yellow oval w/ green crown
                ctx.save();
                ctx.beginPath();
                ctx.ellipse(e.x, e.y+2, e.r*0.9, e.r*1.1, 0, 0, 2*Math.PI);
                let grad = ctx.createRadialGradient(e.x, e.y+4, 3, e.x, e.y+2, e.r);
                grad.addColorStop(0, "#fff7");
                grad.addColorStop(0.2, "#ffe066");
                grad.addColorStop(1, "#e0b400");
                ctx.fillStyle = grad;
                ctx.shadowColor = "#ffe066";
                ctx.shadowBlur = 12;
                ctx.fill();

                // Pineapple pattern (criss-cross)
                ctx.shadowBlur = 0;
                ctx.strokeStyle = "#e0b400cc";
                ctx.lineWidth = 1;
                for(let i=-3;i<=3;i++){
                    ctx.beginPath();
                    ctx.moveTo(e.x-10, e.y-4+i*4);
                    ctx.lineTo(e.x+10, e.y+12+i*3);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(e.x-10, e.y+12+i*3);
                    ctx.lineTo(e.x+10, e.y-4+i*4);
                    ctx.stroke();
                }

                // Crown
                ctx.fillStyle = "#2bbd27";
                ctx.beginPath();
                ctx.moveTo(e.x, e.y-e.r*1.1);
                ctx.lineTo(e.x-6, e.y-e.r*0.8);
                ctx.lineTo(e.x-2, e.y-e.r*0.7);
                ctx.lineTo(e.x+2, e.y-e.r*0.9);
                ctx.lineTo(e.x+6, e.y-e.r*0.7);
                ctx.lineTo(e.x+2, e.y-e.r*0.8);
                ctx.closePath();
                ctx.fill();

                // Eyes
                ctx.beginPath();
                ctx.arc(e.x-5, e.y+2, 2, 0, 2*Math.PI);
                ctx.arc(e.x+5, e.y+2, 2, 0, 2*Math.PI);
                ctx.fillStyle = "#fff";
                ctx.fill();

                // Mouth (smile)
                ctx.beginPath();
                ctx.arc(e.x, e.y+8, 4, 0, Math.PI, false);
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = "#fff";
                ctx.stroke();
                ctx.restore();
            }
            ctx.restore();
        });

        // Draw UI
        ctx.save();
        ctx.font = "bold 18px Arial";
        ctx.fillStyle = "#065c1d";
        ctx.textAlign = "left";
        ctx.fillText("Score: "+this.score, 16, 28);
        ctx.textAlign = "right";
        ctx.fillText("Lives: "+this.lives, this.width-16, 28);
        ctx.restore();

        // Menu UI (drawn on canvas for fade)
        if (this.state === 'menu') {
            ctx.save();
            ctx.globalAlpha = 0.92;
            ctx.fillStyle = "#001e1ecc";
            ctx.fillRect(0,0,this.width,this.height);
            ctx.globalAlpha = 1;
            ctx.font = "bold 40px Arial";
            ctx.fillStyle = "#20b573";
            ctx.textAlign = "center";
            ctx.fillText("TROPICAL SHOOTER", this.width/2, this.height/2-50);
            ctx.font = "20px Arial";
            ctx.fillStyle = "#fff";
            ctx.fillText("Arrow keys: Move", this.width/2, this.height/2+10);
            ctx.fillText("Space/Z: Shoot", this.width/2, this.height/2+44);
            ctx.fillStyle = "#ffe066";
            ctx.font = "16px Arial";
            ctx.fillText("Click Start to Play!", this.width/2, this.height/2+94);
            ctx.restore();
        }
    }

    drawPalmTree(ctx, baseX, baseY, scale, flip=1) {
        ctx.save();
        ctx.translate(baseX, baseY);
        ctx.scale(scale*flip, scale);

        // Trunk
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(5, -16, -10, -70, 0, -100);
        ctx.lineWidth = 12;
        ctx.strokeStyle = "#9e7a35";
        ctx.shadowColor = "#eac785";
        ctx.shadowBlur = 5;
        ctx.stroke();
        ctx.restore();

        // Leaves
        const colors = ["#5edc6c", "#34a853", "#2cbb66"];
        for(let l=0;l<5;l++){
            ctx.save();
            ctx.rotate((-Math.PI/2.2)+l*(Math.PI/6));
            ctx.beginPath();
            ctx.moveTo(0, -100);
            ctx.bezierCurveTo(8, -116, 34, -110, 24, -130);
            ctx.lineWidth = 7;
            ctx.strokeStyle = colors[l%colors.length];
            ctx.shadowColor = colors[l%colors.length];
            ctx.shadowBlur = 18;
            ctx.stroke();
            ctx.restore();
        }

        // Coconuts
        ctx.save();
        ctx.globalAlpha = 0.76;
        ctx.beginPath();
        ctx.arc(0, -93, 6, 0, 2*Math.PI);
        ctx.arc(7, -97, 5, 0, 2*Math.PI);
        ctx.arc(-6, -97, 5, 0, 2*Math.PI);
        ctx.fillStyle = "#8b5c2d";
        ctx.fill();
        ctx.restore();

        ctx.restore();
    }

    drawCloud(ctx, x, y, r, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2*Math.PI);
        ctx.arc(x+r*0.9, y+4, r*0.8, 0, 2*Math.PI);
        ctx.arc(x-r*0.7, y+7, r*0.7, 0, 2*Math.PI);
        ctx.arc(x+r*0.3, y+11, r*0.7, 0, 2*Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.restore();
    }
}

// --- Initialization ---
function initGame() {
    new TropicalShooterGame('gameContainer');
}
window.addEventListener('DOMContentLoaded', initGame);