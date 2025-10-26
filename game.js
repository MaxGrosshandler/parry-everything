// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game states
const GAME_STATE = {
    PLAYING: 'playing',
    GAME_OVER: 'gameOver',
    WIN: 'win'
};

// Game class
class Game {
    constructor() {
        this.state = GAME_STATE.PLAYING;
        this.gravity = 0.6;
        this.friction = 0.8;

        // Input handling
        this.keys = {};
        this.mouseButtons = {};
        this.setupInputHandlers();

        // Create player
        this.player = new Player(100, 400, this);

        // Create level
        this.createLevel();

        // Game loop
        this.lastTime = Date.now();
        this.gameLoop();
    }

    setupInputHandlers() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.keys['attack'] = true;
            if (e.button === 2) this.keys['parry'] = true;
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.keys['attack'] = false;
            if (e.button === 2) this.keys['parry'] = false;
        });

        // Prevent right-click context menu
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    createLevel() {
        this.platforms = [
            // Ground
            new Platform(0, 550, 1200, 50, '#8B4513'),
            // Starting area platforms
            new Platform(300, 450, 200, 20, '#654321'),
            new Platform(600, 400, 200, 20, '#654321'),
            new Platform(900, 350, 200, 20, '#654321'),
            // Middle section
            new Platform(150, 300, 150, 20, '#654321'),
            new Platform(500, 250, 200, 20, '#654321'),
            new Platform(850, 200, 150, 20, '#654321'),
            // Final section with goal
            new Platform(1100, 150, 200, 20, '#654321'),
            new Platform(1100, 550, 100, 50, '#FFD700'), // Goal platform
        ];

        // Create enemies
        this.enemies = [
            new Enemy(400, 420, this),
            new Enemy(700, 370, this),
            new Enemy(1000, 320, this),
            new Enemy(300, 270, this),
            new Enemy(600, 220, this),
            new Enemy(900, 170, this),
        ];

        // Goal marker
        this.goal = {
            x: 1140,
            y: 500,
            width: 40,
            height: 40
        };
    }

    update(deltaTime) {
        if (this.state !== GAME_STATE.PLAYING) return;

        // Update player
        this.player.update(this.keys, deltaTime);

        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.update(this.player, deltaTime);
        });

        // Check collisions with platforms
        this.platforms.forEach(platform => {
            this.player.collideWithPlatform(platform);
            this.enemies.forEach(enemy => {
                enemy.collideWithPlatform(platform);
            });
        });

        // Check player attacks hitting enemies
        if (this.player.isAttacking) {
            this.enemies.forEach(enemy => {
                if (this.player.attackHitbox.intersects(enemy.hitbox)) {
                    enemy.takeDamage(15);
                    this.player.isAttacking = false;
                }
            });
        }

        // Check enemy attacks hitting player
        this.enemies.forEach(enemy => {
            if (enemy.isAttacking) {
                if (enemy.attackHitbox.intersects(this.player.hitbox)) {
                    // Check if player is parrying
                    if (this.player.isParrying) {
                        enemy.takeDamage(30);
                        enemy.isAttacking = false;
                    } else {
                        this.player.takeDamage(10);
                    }
                }
            }
        });

        // Check if player reached the goal
        if (this.player.hitbox.intersects(this.goal)) {
            this.state = GAME_STATE.WIN;
            this.showGameOver(true);
        }

        // Check if player is dead
        if (this.player.health <= 0) {
            this.state = GAME_STATE.GAME_OVER;
            this.showGameOver(false);
        }

        // Remove dead enemies
        this.enemies = this.enemies.filter(enemy => enemy.health > 0);

        // Update UI
        this.updateUI();
    }

    updateUI() {
        document.getElementById('playerHp').textContent = Math.max(0, this.player.health);
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('healthBar').style.width = healthPercent + '%';
    }

    showGameOver(isWin) {
        const gameOverScreen = document.getElementById('gameOverScreen');
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');

        if (isWin) {
            title.textContent = 'VICTORY!';
            title.className = 'win';
            message.textContent = 'You defeated all enemies and reached the castle!';
        } else {
            title.textContent = 'GAME OVER';
            title.className = 'loss';
            message.textContent = 'You were defeated. Try again!';
        }

        gameOverScreen.style.display = 'flex';
    }

    draw() {
        // Clear canvas
        ctx.fillStyle = 'rgba(135, 206, 235, 1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw platforms
        this.platforms.forEach(platform => platform.draw(ctx));

        // Draw goal
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.goal.x, this.goal.y, this.goal.width, this.goal.height);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.fillRect(this.goal.x - 50, this.goal.y - 80, 140, 80);
        ctx.fillStyle = '#FF6B6B';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CASTLE', this.goal.x + 20, this.goal.y - 55);

        // Draw enemies
        this.enemies.forEach(enemy => enemy.draw(ctx));

        // Draw player
        this.player.draw(ctx);

        // Draw debug hitboxes (comment out for cleaner visuals)
        // this.player.hitbox.draw(ctx);
        // this.enemies.forEach(enemy => enemy.hitbox.draw(ctx));
    }

    gameLoop() {
        const now = Date.now();
        const deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Hitbox class for collision detection
class Hitbox {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    intersects(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }

    draw(ctx) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

// Platform class
class Platform {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.hitbox = new Hitbox(x, y, width, height);
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

// Player class
class Player {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.width = 30;
        this.height = 40;
        this.hitbox = new Hitbox(x, y, this.width, this.height);

        // Physics
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 250; // pixels per second
        this.jumpPower = 400;

        // State
        this.health = 100;
        this.maxHealth = 100;
        this.isGrounded = false;
        this.isAttacking = false;
        this.isParrying = false;
        this.attackCooldown = 0;
        this.parryCooldown = 0;
        this.direction = 1; // 1 for right, -1 for left

        // Attack and parry hitboxes
        this.attackHitbox = new Hitbox(0, 0, 0, 0);
        this.parryHitbox = new Hitbox(0, 0, 0, 0);
    }

    update(keys, deltaTime) {
        // Movement
        this.velocityX = 0;
        if (keys['a']) {
            this.velocityX = -this.speed;
            this.direction = -1;
        }
        if (keys['d']) {
            this.velocityX = this.speed;
            this.direction = 1;
        }

        // Jumping
        if (keys[' '] && this.isGrounded) {
            this.velocityY = -this.jumpPower;
            this.isGrounded = false;
        }

        // Attack
        if (keys['attack'] && this.attackCooldown <= 0) {
            this.isAttacking = true;
            this.attackCooldown = 0.3; // 300ms cooldown
            const attackRange = 40;
            this.attackHitbox = new Hitbox(
                this.x + (this.direction > 0 ? this.width : -attackRange),
                this.y,
                attackRange,
                this.height
            );
        }

        // Parry
        if (keys['parry'] && this.parryCooldown <= 0) {
            this.isParrying = true;
            this.parryCooldown = 0.2;
        } else if (!keys['parry']) {
            this.isParrying = false;
        }

        // Apply gravity
        this.velocityY += this.game.gravity;

        // Apply velocity
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;

        // Update hitbox
        this.hitbox.x = this.x;
        this.hitbox.y = this.y;

        // Boundary check
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > 1200) this.x = 1200 - this.width;

        // Death boundary
        if (this.y > 700) {
            this.health = 0;
        }

        // Reset grounded state
        this.isGrounded = false;

        // Cool downs
        this.attackCooldown -= deltaTime;
        this.parryCooldown -= deltaTime;

        // Attack duration
        if (this.isAttacking) {
            this.attackCooldown = Math.max(this.attackCooldown, -0.1);
            if (this.attackCooldown < -0.1) {
                this.isAttacking = false;
            }
        }
    }

    collideWithPlatform(platform) {
        if (!this.hitbox.intersects(platform.hitbox)) return;

        const overlapLeft = (this.x + this.width) - platform.x;
        const overlapRight = (platform.x + platform.width) - this.x;
        const overlapTop = (this.y + this.height) - platform.y;
        const overlapBottom = (platform.y + platform.height) - this.y;

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop && this.velocityY > 0) {
            this.y = platform.y - this.height;
            this.velocityY = 0;
            this.isGrounded = true;
        } else if (minOverlap === overlapBottom && this.velocityY < 0) {
            this.y = platform.y + platform.height;
            this.velocityY = 0;
        } else if (minOverlap === overlapLeft && this.velocityX > 0) {
            this.x = platform.x - this.width;
        } else if (minOverlap === overlapRight && this.velocityX < 0) {
            this.x = platform.x + platform.width;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
    }

    draw(ctx) {
        // Draw body
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw head
        ctx.fillStyle = '#C19A6B';
        ctx.fillRect(this.x + 5, this.y - 10, 20, 15);
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 8, this.y - 8, 3, 3);
        ctx.fillRect(this.x + 17, this.y - 8, 3, 3);

        // Draw attack animation
        if (this.isAttacking) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            const attackRange = 40;
            if (this.direction > 0) {
                ctx.fillRect(this.x + this.width, this.y, attackRange, this.height);
            } else {
                ctx.fillRect(this.x - attackRange, this.y, attackRange, this.height);
            }
        }

        // Draw parry animation
        if (this.isParrying) {
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 3;
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 35, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw direction indicator
        ctx.fillStyle = '#000';
        ctx.fillRect(
            this.x + (this.direction > 0 ? this.width - 5 : 0),
            this.y + 5,
            5,
            5
        );
    }
}

// Enemy class
class Enemy {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.width = 28;
        this.height = 36;
        this.hitbox = new Hitbox(x, y, this.width, this.height);

        // Physics
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 100;
        this.jumpPower = 300;

        // State
        this.health = 30;
        this.maxHealth = 30;
        this.isGrounded = false;
        this.isAttacking = false;
        this.direction = 1;

        // AI
        this.patrolRange = 300;
        this.patrolLeft = x - this.patrolRange / 2;
        this.patrolRight = x + this.patrolRange / 2;
        this.attackCooldown = 0;
        this.chaseDistance = 400;
        this.stateTimer = 0;

        // Attack hitbox
        this.attackHitbox = new Hitbox(0, 0, 0, 0);
    }

    update(player, deltaTime) {
        const distToPlayer = Math.abs(player.x - this.x);
        const playerDirX = player.x > this.x ? 1 : -1;

        // AI behavior
        if (distToPlayer < this.chaseDistance) {
            // Chase player
            this.velocityX = playerDirX * this.speed;
            this.direction = playerDirX;

            // Try to jump when necessary
            if (player.y < this.y - 50 && this.isGrounded) {
                this.velocityY = -this.jumpPower;
                this.isGrounded = false;
            }

            // Attack when close
            if (distToPlayer < 60 && this.attackCooldown <= 0) {
                this.isAttacking = true;
                this.attackCooldown = 0.8;
                const attackRange = 40;
                this.attackHitbox = new Hitbox(
                    this.x + (this.direction > 0 ? this.width : -attackRange),
                    this.y,
                    attackRange,
                    this.height
                );
            }
        } else {
            // Patrol
            this.velocityX = this.direction * this.speed * 0.7;

            if (this.x < this.patrolLeft || this.x > this.patrolRight) {
                this.direction *= -1;
            }
        }

        // Apply gravity
        this.velocityY += this.game.gravity;

        // Apply velocity
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;

        // Update hitbox
        this.hitbox.x = this.x;
        this.hitbox.y = this.y;

        // Boundary check
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > 1200) this.x = 1200 - this.width;

        // Death boundary
        if (this.y > 700) {
            this.health = 0;
        }

        this.isGrounded = false;
        this.attackCooldown -= deltaTime;

        // Attack duration
        if (this.isAttacking) {
            if (this.attackCooldown < 0.5) {
                this.isAttacking = false;
            }
        }
    }

    collideWithPlatform(platform) {
        if (!this.hitbox.intersects(platform.hitbox)) return;

        const overlapLeft = (this.x + this.width) - platform.x;
        const overlapRight = (platform.x + platform.width) - this.x;
        const overlapTop = (this.y + this.height) - platform.y;
        const overlapBottom = (platform.y + platform.height) - this.y;

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop && this.velocityY > 0) {
            this.y = platform.y - this.height;
            this.velocityY = 0;
            this.isGrounded = true;
        } else if (minOverlap === overlapBottom && this.velocityY < 0) {
            this.y = platform.y + platform.height;
            this.velocityY = 0;
        } else if (minOverlap === overlapLeft && this.velocityX > 0) {
            this.x = platform.x - this.width;
        } else if (minOverlap === overlapRight && this.velocityX < 0) {
            this.x = platform.x + platform.width;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
    }

    draw(ctx) {
        // Draw body
        ctx.fillStyle = '#C62828';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw head
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(this.x + 4, this.y - 10, 20, 15);

        // Draw eyes
        ctx.fillStyle = '#FFF';
        ctx.fillRect(this.x + 7, this.y - 8, 3, 3);
        ctx.fillRect(this.x + 16, this.y - 8, 3, 3);

        // Draw attack animation
        if (this.isAttacking) {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
            const attackRange = 40;
            if (this.direction > 0) {
                ctx.fillRect(this.x + this.width, this.y, attackRange, this.height);
            } else {
                ctx.fillRect(this.x - attackRange, this.y, attackRange, this.height);
            }
        }

        // Draw health bar above enemy
        const barWidth = 25;
        const barHeight = 3;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x + (this.width - barWidth) / 2, this.y - 12, barWidth, barHeight);
        ctx.fillStyle = '#FF0000';
        const healthPercent = (this.health / this.maxHealth);
        ctx.fillRect(this.x + (this.width - barWidth) / 2, this.y - 12, barWidth * healthPercent, barHeight);
    }
}

// Start the game
window.addEventListener('load', () => {
    new Game();
});
