# Parry Everything - Design Diagrams & Visual Architecture

## Table of Contents
1. [Class Hierarchy Diagram](#class-hierarchy-diagram)
2. [State Machine Diagram](#state-machine-diagram)
3. [Sequence Diagrams](#sequence-diagrams)
4. [Entity Relationship Diagram](#entity-relationship-diagram)
5. [Data Flow Diagram](#data-flow-diagram)
6. [Combat System Flowchart](#combat-system-flowchart)
7. [AI Decision Tree](#ai-decision-tree)
8. [Memory Layout](#memory-layout)

---

## Class Hierarchy Diagram

### Inheritance Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Parent Scope (window)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ CONFIG (Object - Game Constants)                     │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ CANVAS_WIDTH: 1200                                   │  │
│  │ CANVAS_HEIGHT: 600                                   │  │
│  │ GRAVITY: 0.6                                         │  │
│  │ FRICTION: 0.8                                        │  │
│  │ PLAYER: { SPEED, JUMP_POWER, MAX_HEALTH, ... }     │  │
│  │ ENEMY: { SPEED, MAX_HEALTH, PATROL_RANGE, ... }    │  │
│  │ DAMAGE: { ENEMY_TO_PLAYER, PLAYER_TO_ENEMY, ... }  │  │
│  │ BOUNDARIES: { DEATH_Y: 700 }                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ GAME_STATE (Object - State Constants)               │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ PLAYING: 'playing'                                   │  │
│  │ GAME_OVER: 'gameOver'                               │  │
│  │ WIN: 'win'                                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Game (Class - Main Game Controller)                  │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Properties:                                          │  │
│  │ ├─ state: string (PLAYING | GAME_OVER | WIN)       │  │
│  │ ├─ gravity: number                                   │  │
│  │ ├─ friction: number                                  │  │
│  │ ├─ keys: { [key]: boolean }                         │  │
│  │ ├─ mouseButtons: { [button]: boolean }              │  │
│  │ ├─ player: Player                                    │  │
│  │ ├─ platforms: Platform[]                            │  │
│  │ ├─ enemies: Enemy[]                                 │  │
│  │ ├─ goal: { x, y, width, height }                   │  │
│  │ ├─ lastTime: number                                 │  │
│  │                                                      │  │
│  │ Methods:                                             │  │
│  │ ├─ constructor()                                     │  │
│  │ ├─ setupInputHandlers()                             │  │
│  │ ├─ createLevel()                                     │  │
│  │ ├─ update(deltaTime)                                │  │
│  │ ├─ updateUI()                                        │  │
│  │ ├─ showGameOver(isWin)                              │  │
│  │ ├─ draw()                                            │  │
│  │ └─ gameLoop()                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│         ▲                    ▲                   ▲           │
│         │ creates           │ creates            │ uses      │
│         │ (1:1)            │ (1:n)              │ (n:m)     │
│         │                   │                    │           │
│  ┌──────┴──────┐    ┌───────┴──────┐    ┌───────┴──────┐   │
│  │   Player    │    │    Enemy     │    │  Platform    │   │
│  ├─────────────┤    ├──────────────┤    ├──────────────┤   │
│  │ Properties: │    │ Properties:  │    │ Properties:  │   │
│  │ ├─ x,y      │    │ ├─ x,y       │    │ ├─ x,y       │   │
│  │ ├─ vx,vy    │    │ ├─ vx,vy     │    │ ├─ w,h       │   │
│  │ ├─ w,h      │    │ ├─ w,h       │    │ └─ color     │   │
│  │ ├─ health   │    │ ├─ health    │    │              │   │
│  │ ├─ isAttack │    │ ├─ isAttack  │    │ Methods:     │   │
│  │ ├─ isParry  │    │ ├─ direction │    │ ├─ draw()    │   │
│  │ └─ direction│    │ └─ AI state  │    └──────────────┘   │
│  │              │    │              │                       │
│  │ Methods:    │    │ Methods:     │                       │
│  │ ├─ update() │    │ ├─ update()  │                       │
│  │ ├─ collide()│    │ ├─ collide() │                       │
│  │ ├─ attack() │    │ ├─ attack()  │                       │
│  │ ├─ parry()  │    │ ├─ takeDmg() │                       │
│  │ └─ draw()   │    │ └─ draw()    │                       │
│  └─────────────┘    └──────────────┘                       │
│         ▲                    ▲                               │
│         │ has              │ has                             │
│         │ (1 per entity)   │ (1 per entity)                │
│         │                   │                               │
│  ┌──────┴──────────────────┴──────┐                        │
│  │        Hitbox (Class)          │                        │
│  ├───────────────────────────────┤                        │
│  │ Properties:                    │                        │
│  │ ├─ x,y (top-left)             │                        │
│  │ └─ width, height              │                        │
│  │                                │                        │
│  │ Methods:                        │                        │
│  │ ├─ intersects(other): boolean  │                        │
│  │ └─ draw(ctx) [debug]           │                        │
│  └───────────────────────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Legend:
┌─┐ Class/Constructor
├─┤ Properties or Methods
└─┘
```

### Class Composition

```
Game (1)
├── Player (1)
│   └── Hitbox (main body)
│   └── Hitbox (attack)
│   └── Hitbox (parry)
│
├── Enemy (6 instances)
│   ├── Hitbox (body)
│   └── Hitbox (attack)
│
├── Platform (8 instances)
│   └── Hitbox (collision)
│
└── Goal (1)
    └── { x, y, width, height }
```

---

## State Machine Diagram

### Game States

```
                    ┌────────────────────────────────┐
                    │      PLAYING (Initial)         │
                    │                                │
                    │  • Update all entities         │
                    │  • Check collisions            │
                    │  • Check win/lose conditions   │
                    │  • Render frame                │
                    └────────────────────────────────┘
                             │
                ┌────────────┴──────────────┐
                │                           │
                ▼                           ▼
      ┌──────────────────┐        ┌──────────────────┐
      │  WIN             │        │  GAME_OVER       │
      │                  │        │                  │
      │ • No updates     │        │ • No updates     │
      │ • Show victory   │        │ • Show defeat    │
      │ • Allow replay   │        │ • Allow replay   │
      └──────────────────┘        └──────────────────┘

Transitions:
PLAYING → WIN       when player touches goal
PLAYING → GAME_OVER when player.health <= 0 OR player.y > 700
WIN/GAME_OVER       can restart by reloading page
```

### Player Combat States

```
                    ┌────────────────┐
                    │   IDLE         │
                    │                │
                    │ No attacks or  │
                    │ parries active │
                    └────────────────┘
                             │
                ┌────────────┴─────────────┐
                │                          │
                ▼                          ▼
      ┌──────────────────┐        ┌──────────────────┐
      │  ATTACKING       │        │  PARRYING        │
      │                  │        │                  │
      │ Duration: 0.15s  │        │ Duration: held   │
      │ Cooldown: 0.3s   │        │ Cooldown: 0.4s   │
      │ Can't parry      │        │ Can't attack     │
      │                  │        │                  │
      └──────────────────┘        └──────────────────┘
              │                            │
              └────────────┬───────────────┘
                           │
                           ▼
                    ┌────────────────┐
                    │   IDLE         │
                    │ (Cooldowns)    │
                    └────────────────┘

Attack Flow:
IDLE →[Left Click + cooldown ready] ATTACKING →[0.15s] IDLE →[0.3s cooldown] ready again

Parry Flow:
IDLE →[Right Click + cooldown ready] PARRYING →[Release] IDLE →[0.4s cooldown] ready
```

### Enemy AI States

```
                    ┌────────────────────────────┐
                    │  PATROL                    │
                    │                            │
                    │  Distance to Player > 400px│
                    │  • Move 70% speed          │
                    │  • Patrol left/right       │
                    │  • Watch for player        │
                    └────────────────────────────┘
                             │
                             │ Player enters range (< 400px)
                             ▼
                    ┌────────────────────────────┐
                    │  CHASE                     │
                    │                            │
                    │  Distance to Player < 400px│
                    │  • Move 100% speed         │
                    │  • Face player             │
                    │  • Jump if needed          │
                    └────────────────────────────┘
                             │
                    ┌────────┘
                    │ If distance >= 400px
                    │
                    ▼
            (Back to PATROL)

Attack Trigger:
Chase State → [distance < 60px AND cooldown = 0] → ATTACK [0.8s] → Resume Chase
```

---

## Sequence Diagrams

### Attack Collision Sequence

```
Player                Game              Enemy
  │                    │                  │
  │─ Left Click ───────>│                  │
  │                     │                  │
  │ Create attackHitbox │                  │
  │<────────────────────│                  │
  │                     │                  │
  │ Update position     │                  │
  │<────────────────────│                  │
  │                     │                  │
  │                     │ Loop through     │
  │                     │ enemies...       │
  │                     │──────────────────>│
  │                     │                  │
  │                     │ Check intersection
  │                     │<──────────────────│
  │                     │ (HIT!)           │
  │                     │                  │
  │                     │ takeDamage(15)   │
  │                     │──────────────────>│
  │                     │                  │
  │                     │ health -= 15     │
  │                     │ (30 → 15)        │
  │                     │<──────────────────│
  │                     │                  │
  │ isAttacking = false │                  │
  │<────────────────────│                  │
  │                     │ Draw health bar  │
  │                     │──────────────────>│
  │                     │                  │
```

### Parry Success Sequence

```
Player                Game              Enemy
  │                    │                  │
  │ Right Click (Parry)│                  │
  │────────────────────>│                  │
  │ isParrying = true   │                  │
  │<────────────────────│                  │
  │                     │                  │
  │                     │ Enemy attacks    │
  │                     │<─────────────────│
  │                     │ isAttacking=true │
  │                     │                  │
  │                     │ Check enemy      │
  │                     │ attack vs player │
  │                     │ (INTERSECTION!)  │
  │                     │                  │
  │                     │ Check if parrying
  │                     │<────────────────│
  │                     │ (YES - PARRY!)  │
  │                     │                  │
  │                     │ takeDamage(20)  │
  │                     │──────────────────>│
  │                     │ (Parried damage) │
  │                     │ health = 30→10   │
  │                     │<──────────────────│
  │                     │                  │
  │                     │ Take damage = -  │
  │                     │<────────────────│
  │                     │ (Avoided!)       │
  │                     │                  │
```

### Game Loop Iteration

```
Frame Start
    │
    ├─ Get current time (now)
    │
    ├─ Calculate deltaTime = (now - lastTime) / 1000
    │
    ├─ UPDATE PHASE
    │  ├─ player.update(keys, deltaTime)
    │  │  ├─ Read input (A, D, Space, mouse)
    │  │  ├─ Update velocity
    │  │  ├─ Apply gravity
    │  │  ├─ Update position
    │  │  └─ Update attack/parry cooldowns
    │  │
    │  ├─ for each enemy:
    │  │  ├─ Calculate distance to player
    │  │  ├─ Decide: Patrol or Chase
    │  │  ├─ Update velocity
    │  │  ├─ Apply gravity
    │  │  ├─ Update position
    │  │  └─ Check attack trigger
    │  │
    │  ├─ Collision Detection Phase
    │  │  ├─ for each platform:
    │  │  │  ├─ Check player vs platform
    │  │  │  ├─ Resolve collision (land, bounce, wall)
    │  │  │  └─ for each enemy vs platform
    │  │  │
    │  │  ├─ Combat Detection
    │  │  │  ├─ If player attacking:
    │  │  │  │  └─ Check each enemy for hit
    │  │  │  │
    │  │  │  └─ If enemy attacking:
    │  │  │     ├─ Check player hit
    │  │  │     ├─ If parrying: Reflect damage
    │  │  │     └─ Else: Take damage
    │  │  │
    │  │  └─ Win/Lose Conditions
    │  │     ├─ Check goal collision
    │  │     └─ Check health and boundaries
    │  │
    │  ├─ Cleanup
    │  │  └─ Remove dead enemies
    │  │
    │  └─ Update UI
    │     └─ Update health bar display
    │
    ├─ RENDER PHASE
    │  ├─ Clear canvas (sky blue)
    │  ├─ Draw platforms
    │  ├─ Draw goal
    │  ├─ Draw enemies (with health bars)
    │  └─ Draw player (with attack/parry visuals)
    │
    ├─ Store current time (lastTime = now)
    │
    └─ Schedule next frame with requestAnimationFrame
         (Loop back to Frame Start)
```

---

## Entity Relationship Diagram

### Entity Connections

```
┌─────────────────────────────────────────────────────────────────┐
│                        Game Instance                             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     WORLD SETUP                          │   │
│  │                                                          │   │
│  │  platforms[] = [                                         │   │
│  │    Platform(0, 550, 1200, 50),    // Ground            │   │
│  │    Platform(300, 450, 200, 20),   // Mid-left          │   │
│  │    Platform(600, 400, 200, 20),   // Mid               │   │
│  │    Platform(900, 350, 200, 20),   // Mid-right         │   │
│  │    Platform(1100, 150, 200, 20),  // Final             │   │
│  │    Platform(1100, 550, 100, 50)   // GOAL              │   │
│  │  ]                                                      │   │
│  │                                                          │   │
│  │  enemies[] = [                                           │   │
│  │    Enemy(400, 420),  // Patrol left section            │   │
│  │    Enemy(700, 370),  // Patrol mid section             │   │
│  │    Enemy(1000, 320), // Patrol right section           │   │
│  │    Enemy(300, 270),  // Patrol mid-left section        │   │
│  │    Enemy(600, 220),  // Patrol center section          │   │
│  │    Enemy(900, 170)   // Patrol final section           │   │
│  │  ]                                                      │   │
│  │                                                          │   │
│  │  player = Player(100, 400)  // Spawn left side         │   │
│  │                                                          │   │
│  │  goal = { x: 1140, y: 500 }  // Far right              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              COLLISION DETECTION MAP                    │   │
│  │                                                          │   │
│  │  Player:                                               │   │
│  │  ├─ player.hitbox <-> each platform.hitbox [8×]      │   │
│  │  ├─ player.attackHitbox <-> each enemy.hitbox [6×]    │   │
│  │  ├─ player.hitbox <-> goal [1×]                       │   │
│  │  └─ player.parryHitbox <-> enemy.attackHitbox [6×]    │   │
│  │                                                          │   │
│  │  Enemies:                                              │   │
│  │  ├─ each enemy.hitbox <-> each platform.hitbox [6×8]  │   │
│  │  └─ each enemy.attackHitbox <-> player.hitbox [6×]    │   │
│  │                                                          │   │
│  │  Total per frame:                                      │   │
│  │  ├─ Platform collisions: 14 checks (player + enemies) │   │
│  │  ├─ Combat checks: 20 checks (attack/parry detection) │   │
│  │  └─ Win condition: 1 check (goal collision)          │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Input to Output Flow

```
INPUTS
│
├─ Keyboard Events
│  └─ window.addEventListener('keydown')
│     └─ this.keys[e.key] = true/false
│
├─ Mouse Events
│  ├─ mousedown → this.keys['attack'/'parry'] = true
│  └─ mouseup → this.keys['attack'/'parry'] = false
│
└─ System Time
   └─ Date.now() → deltaTime calculation

                        │
                        ▼
            ┌─────────────────────────┐
            │   Game.update()         │
            │                         │
            │ Process all input and   │
            │ update game state       │
            └─────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
    Player           Enemies        Platforms
    Update           Update         (Static)
        │               │
        ├─ Check col. ──┼─ Check col.
        │   with plat.  │   with plat.
        │               │
        ├─ Update state ├─ Update state
        │ - Position    │ - Position
        │ - Velocity    │ - Velocity
        │ - Health      │ - Health
        │ - Cooldowns   │ - Cooldowns
        │               │
        └───────────────┼───────────────┘
                        │
                        ▼
            ┌─────────────────────────┐
            │ Collision Resolution    │
            │                         │
            │ • Attack hit detection  │
            │ • Parry mechanics       │
            │ • Win/Lose checks       │
            │ • Damage application    │
            └─────────────────────────┘
                        │
                        ▼
            ┌─────────────────────────┐
            │   Game.draw()           │
            │                         │
            │ Render all game         │
            │ elements to canvas      │
            └─────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
    Clear         Draw Entities    Draw UI
    Canvas        (Platforms,      (Health
    (Background)  Enemies,         Bar,
                  Player)          HP Number)

                        │
                        ▼
        OUTPUT: Canvas Pixels (60 FPS)
```

---

## Combat System Flowchart

### Attack Resolution

```
Player Presses Left Click
        │
        ▼
Is attackCooldown <= 0?
    │
    ├─ NO → Skip this frame
    │
    └─ YES
        │
        ▼
    isAttacking = true
    Create attackHitbox (40px extending)
    attackCooldown = 0.3s
    attackDuration = 0.15s
        │
        ▼
    Each Frame (while attacking):
    │
    ├─ For each enemy:
    │  │
    │  └─ Does attackHitbox.intersects(enemy.hitbox)?
    │     │
    │     ├─ NO → Continue to next enemy
    │     │
    │     └─ YES
    │        │
    │        ├─ enemy.takeDamage(15)
    │        ├─ isAttacking = false
    │        └─ Remove attack hitbox
    │
    └─ attackDuration -= deltaTime
       If attackDuration <= 0:
       └─ isAttacking = false

Result: Enemy health 30 → 15 (or dies at 0)
```

### Parry Mechanics

```
Player Presses Right Click
        │
        ▼
Is parryCooldown <= 0?
    │
    ├─ NO → Skip parry
    │
    └─ YES
        │
        ▼
    isParrying = true
    parryCooldown = 0.4s
        │
        ▼
    While Right Click Held:
    isParrying stays true
        │
        ▼
    Enemy Attacks Player
    enemyAttackHitbox created
        │
        ▼
    Does enemyAttackHitbox.intersects(player.hitbox)?
        │
        ├─ NO → No collision, move on
        │
        └─ YES (Collision!)
            │
            ├─ Is player.isParrying?
            │  │
            │  ├─ NO → Player takes damage
            │  │       player.takeDamage(10)
            │  │       damageFlash = 0.15s
            │  │
            │  └─ YES (PARRY SUCCESS!)
            │     │
            │     ├─ Enemy takes parry damage
            │     ├─ enemy.takeDamage(20)
            │     ├─ enemy.isAttacking = false
            │     └─ Parry radius visual appears
            │
            └─ Player can parry again after cooldown

Parry Rewards:
• Avoid 10 damage (normal hit)
• Deal 20 damage back (parried hit)
• Total swing: 30 damage difference!
• Strategic: Timing-based, riskier than dodging
```

### Damage Flow

```
Source → Hit Detection → Damage Application → Effect

Player Attack
    └─ attackHitbox intersects enemy
        └─ takeDamage(15)
            └─ health -= 15
                └─ If health <= 0: Enemy dies
                   Else: Health bar updates

Enemy Attack (Not Parried)
    └─ enemyAttackHitbox intersects player
        └─ takeDamage(10)
            └─ health -= 10
                └─ damageFlash = 0.15s (red overlay)
                └─ If health <= 0: Game Over

Enemy Attack (Parried)
    └─ enemyAttackHitbox intersects player
        ├─ player.isParrying = true
        │   └─ takeDamage(20) [Applied to ENEMY]
        │       └─ enemy.health -= 20
        │
        └─ player.isParrying = false
            └─ takeDamage(10) [Applied to PLAYER]
                └─ player.health -= 10
```

---

## AI Decision Tree

### Enemy AI Logic (Per Frame)

```
                    ENEMY AI UPDATE
                            │
                    ┌───────┴───────┐
                    │               │
                Calculate distance to player
                    │
                Distance < 400px?
                    │
        ┌───────────┴──────────────┐
        │ NO                       │ YES
        │ (Patrol Range)           │ (Chase Range)
        │                          │
        ▼                          ▼
    PATROL STATE              CHASE STATE
        │                          │
    ┌───┴───┐                  ┌───┴────────────┐
    │       │                  │                │
    ▼       ▼                  ▼                ▼
Move @ Set direction       Move toward     Determine
70% speed based on         player at       direction
patrol bounds             100% speed       toward player
    │                          │                │
    │                          ▼                ▼
    │                    player.y <          Set direction
    │                    enemy.y - 50?        = sign(playerX
    │                          │              - enemyX)
    │                    ┌─────┴─────┐        │
    │                    │ YES       │ NO     │
    │                    │           │        │
    │                    ▼           ▼        │
    │                Jump toward   Normal    │
    │                player        movement  │
    │                              │         │
    │                    ┌─────────┴────┐    │
    │                    │              │    │
    │                    ▼              ▼    │
    │         Distance < 60px?              │
    │         And cooldown = 0?             │
    │              │                        │
    │         ┌────┴────┐                   │
    │         │ YES     │ NO                │
    │         │         │                   │
    │         ▼         ▼                   │
    │       ATTACK    Continue              │
    │       │         Chase                 │
    │       └────┬──────┘                   │
    │            │                          │
    │            ▼                          │
    └────────────┴──────────────────────────┘
                 │
                 ▼
        isAttacking = true
        attackCooldown = 0.8s
        attackHitbox created
                 │
                 ▼
        Apply gravity
        Apply velocity
        Update position
```

### Patrol Boundary Logic

```
Enemy Patrol State
        │
        ├─ patrolLeft = spawnX - 150
        ├─ patrolRight = spawnX + 150
        │
        ▼
    Each Frame:
        │
        └─ While patrolling:
            │
            ├─ Move at 70% speed
            │
            ├─ Check bounds:
            │
            │   If x < patrolLeft
            │   └─ direction *= -1 (flip direction)
            │
            │   If x > patrolRight
            │   └─ direction *= -1 (flip direction)
            │
            └─ Continue moving in current direction

Result: Back-and-forth patrol pattern
Example: Enemy at x=500
├─ patrolLeft = 350
├─ patrolRight = 650
│
├─ Moves right: 500 → 550 → 600 → 650 (flip!)
├─ Moves left: 650 → 600 → 550 → 500 → 450 → 400 → 350 (flip!)
└─ Moves right: 350 → ... (repeat)
```

---

## Memory Layout

### Runtime Object Structure

```
┌─ Game Instance (Single)
│   │
│   ├─ Primitive Fields (40 bytes)
│   │  ├─ state: String (pointer)
│   │  ├─ gravity: 0.6
│   │  ├─ friction: 0.8
│   │  ├─ lastTime: 1699000000000
│   │  └─ ...
│   │
│   ├─ keys Object (Maps ~20 keys)
│   │  └─ { 'a': false, 'd': true, ' ': false, ... }
│   │
│   ├─ Player Instance (1)
│   │  ├─ Position (x, y)
│   │  ├─ Velocity (vx, vy)
│   │  ├─ Dimensions (30×40)
│   │  ├─ Health (100)
│   │  ├─ State flags (4 booleans × 1 byte)
│   │  ├─ Cooldown timers (3 numbers × 8 bytes)
│   │  ├─ Hitbox (x, y, w, h) ← Main body
│   │  ├─ Hitbox (x, y, w, h) ← Attack
│   │  └─ Hitbox (x, y, w, h) ← Parry
│   │
│   │  Total: ~200 bytes
│   │
│   ├─ Enemies Array (6 instances)
│   │  └─ [Enemy, Enemy, Enemy, Enemy, Enemy, Enemy]
│   │     Each Enemy:
│   │     ├─ Position (x, y)
│   │     ├─ Velocity (vx, vy)
│   │     ├─ Dimensions (28×36)
│   │     ├─ Health (30)
│   │     ├─ State flags (2 booleans)
│   │     ├─ AI state (3 numbers: patrol bounds, attack cd)
│   │     ├─ Hitbox (body)
│   │     └─ Hitbox (attack)
│   │
│   │     Total per Enemy: ~180 bytes
│   │     Total for 6: ~1080 bytes
│   │
│   ├─ Platforms Array (8 instances)
│   │  └─ [Platform, Platform, ..., Platform]
│   │     Each Platform:
│   │     ├─ x, y (position)
│   │     ├─ width, height
│   │     ├─ color (String reference)
│   │     └─ Hitbox (body)
│   │
│   │     Total per Platform: ~80 bytes
│   │     Total for 8: ~640 bytes
│   │
│   ├─ Goal Object (1)
│   │  └─ { x: 1140, y: 500, width: 40, height: 40 }
│   │     ~64 bytes
│   │
│   └─ Canvas Reference
│      └─ Points to DOM canvas element
│
│
│
Total Estimated Game Instance Memory: ~2.2 KB

+ Canvas Pixel Buffer: (1200 × 600 × 4 bytes) = 2.88 MB
+ Strings (colors, config): ~2 KB

Total Runtime Memory: ~2.9 MB
```

### Allocation Pattern

```
Initialization (Game loads)
    └─ Create Game instance (fixed allocation)
    └─ Create all entities (Player, Enemies, Platforms)
    └─ Total: ~2.9 MB

Gameplay (Each frame)
    ├─ Create attackHitbox (if attacking)
    │  └─ ~64 bytes (temporary, GC'd next frame)
    │
    ├─ Update all hitbox positions (in-place)
    │  └─ No new allocations
    │
    ├─ Dead enemy removal
    │  └─ Filter array (minimal GC)
    │
    └─ Canvas drawing
       └─ Uses existing canvas buffer

Cleanup (Game Over)
    └─ Game instance can be discarded
    └─ New instance created on page reload
```

### GC Pressure

**Low GC Pressure**:
- Most objects are long-lived (game duration)
- No per-frame object creation (except attack hitboxes)
- Dead enemies filtered out (prevents memory leak)
- Canvas reuses same buffer

**Potential Optimization**:
- Pool attack/parry hitbox objects
- Avoid creating new Array from filter()
- Pre-allocate enemy array at max size

---

## Summary

These diagrams provide comprehensive understanding of:

1. **Class Structure**: How objects are organized
2. **Game Flow**: State transitions and game loop order
3. **Collision System**: Entity relationships and detection
4. **AI Behavior**: Enemy decision-making logic
5. **Combat Resolution**: How attacks and parries work
6. **Memory Usage**: Object layout and allocation patterns

This architecture provides a solid foundation for understanding and extending the game.
