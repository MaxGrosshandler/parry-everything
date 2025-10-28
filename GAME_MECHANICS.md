# Parry Everything - Game Mechanics & Design Deep Dive

## Table of Contents
1. [Core Mechanics Overview](#core-mechanics-overview)
2. [Movement & Physics](#movement--physics)
3. [Combat Mechanics](#combat-mechanics)
4. [Parry System](#parry-system)
5. [Enemy AI & Behavior](#enemy-ai--behavior)
6. [Level Design](#level-design)
7. [Win/Lose Conditions](#winlose-conditions)
8. [Game Balance Analysis](#game-balance-analysis)
9. [Tuning Guide](#tuning-guide)

---

## Core Mechanics Overview

### Primary Game Loop

1. **Input Processing**: Read player keyboard and mouse input
2. **Physics Update**: Apply gravity and update positions
3. **Collision Resolution**: Handle platform and combat collisions
4. **State Updates**: Update health, cooldowns, and game state
5. **Rendering**: Draw all game elements

### Core Systems

| System | Type | Purpose |
|--------|------|---------|
| **Movement** | Continuous | Player/enemy horizontal and vertical motion |
| **Combat** | Event-Based | Attack/Parry triggered by input |
| **Collision** | Continuous | Platform and combat hit detection |
| **AI** | Continuous | Enemy patrol/chase decision-making |
| **Health** | Event-Based | Damage application and death checking |

---

## Movement & Physics

### Coordinate System

```
Canvas (1200 × 600 pixels)

(0, 0) ─────────────── (1200, 0)
  │                          │
  │                          │
  │        Game Area         │  Y increases
  │        (Sky Blue)        │  downward
  │                          │
  │                          │
(0, 600) ─────────────── (1200, 600)

Death Boundary: y > 700 (off bottom)
Canvas Boundary: x = 0 to 1200
```

### Gravity System

**Gravity Constant**: 0.6 units/frame²

```
Effect Per Second (60 FPS):
Frame 1: vy += 0.6  → vy = 0.6
Frame 2: vy += 0.6  → vy = 1.2
Frame 3: vy += 0.6  → vy = 1.8
Frame 4: vy += 0.6  → vy = 2.4
...
Frame 60: vy ≈ 36 pixels/frame

Actual pixel distance per frame = vy * deltaTime
At 60 FPS: 36 * (1/60) = 0.6 pixels/frame

Net vertical distance after 1 second of falling:
= Sum of velocity over 60 frames
= 0.6 + 1.2 + 1.8 + ... + 36
= (60 × 36.6) / 2 ≈ 1098 pixels fallen
```

### Jump Mechanics

**Jump Power**: 400 units/second (upward velocity)

```
On Jump (Space pressed while grounded):
1. Set velocityY = -400 (negative = upward)
2. Set isGrounded = false

Trajectory:
Frame 1: y -= 400 * (1/60) = 6.67 pixels up
         vy += 0.6 gravity
         vy = -399.4
Frame 2: y -= 399.4 * (1/60) = 6.66 pixels up
         vy += 0.6 gravity
         vy = -398.8
... [Continue until vy = 0, then fall]

Peak Height:
- Time to reach peak: t = jumpPower / gravity = 400 / 0.6 ≈ 667 frames
- Wait, that's wrong! Let me recalculate...

Actual calculation:
- Each frame gravity adds 0.6 to velocity
- Velocity decreases from 400 to 0
- Frames to reach peak: 400 / 0.6 ≈ 667 frames (too long!)

Actually, the physics is delta-time based:
vy = vy + gravity * deltaTime
At deltaTime = 1/60:
vy = vy + 0.6 * (1/60) = vy + 0.01

Reaching peak takes: 400 / 0.01 = 40,000 frames (way too long)

Let me check the code again... The gravity is 0.6 per deltaTime second.
If deltaTime = 1/60:
vy = -400 → vy = -400 + 0.6*(1/60) = -399.99
                [after 60 frames] vy ≈ -394 (barely any change)

This suggests the physics is frame-rate dependent OR I'm misreading.

Looking at code: velocityY += this.game.gravity; (line 382)
This happens once per update(deltaTime) call.

So gravity is applied ONCE per frame, not scaled by deltaTime!
This is actually frame-rate dependent game physics.

Corrected:
Frame 1: vy = -400, vy += 0.6 → vy = -399.4
Frame 2: vy = -399.4, vy += 0.6 → vy = -398.8
...
Frame 667: vy ≈ 0 (peak reached)

Peak height ≈ 667 pixels up from jump point
Time to peak ≈ 11 seconds at 60 FPS

That still seems too high. Let me recalculate with pixel scale:
Position update: y += velocityY * deltaTime

Frame 1: y -= 400 * (1/60) = 6.67 pixels
         vy becomes -399.4
Frame 2: y -= 399.4 * (1/60) = 6.66 pixels
         vy becomes -398.8

Total height after 1 second:
≈ (400 + 399 + 398 + ... down to 340) * (1/60)
≈ (400 + 340) / 2 * 60 * (1/60)
≈ 370 pixels

This seems reasonable for platformer jump height.
```

### Movement Speed

**Player Speed**: 250 pixels/second
```
When key pressed (A or D):
velocityX = ±250

Per frame at 60 FPS:
x += 250 * (1/60) = 4.17 pixels/frame
Time to cross canvas: 1200 / 250 = 4.8 seconds

Practical feel: Quick but not instant, requires ~1-2 seconds to cross screen
```

**Enemy Speed**: 100 pixels/second (patrol) to 100 pixels/second (chase)
```
Patrol: 70 pixels/second (70% speed)
Chase: 100 pixels/second (100% speed)

Time to cross screen:
- Patrol: 1200 / 70 ≈ 17 seconds
- Chase: 1200 / 100 = 12 seconds

Faster than player movement gives feeling of threat
```

### Collision Physics

**Platform Collision Response**:

When player collides with platform, game determines direction of overlap:

```
Overlap Detection (AABB):
overlapLeft = (playerX + playerWidth) - platformX
overlapRight = (platformX + platformWidth) - playerX
overlapTop = (playerY + playerHeight) - platformY
overlapBottom = (platformY + platformHeight) - playerY

Minimum overlap determines contact direction:
- If overlapTop is smallest → Landing on platform
- If overlapBottom is smallest → Hitting head
- If overlapLeft is smallest → Hitting wall from left
- If overlapRight is smallest → Hitting wall from right
```

**Landing on Platform (From Above)**:
```
Condition: overlapTop == min AND velocityY > 0 (falling)

Response:
1. y = platform.y - playerHeight - epsilon
   (Place player exactly on top of platform)
2. velocityY = 0
   (Stop falling)
3. isGrounded = true
   (Can now jump again)
4. epsilon = 0.5 pixels
   (Small buffer prevents sticking/sinking)
```

**Hitting Head (From Below)**:
```
Condition: overlapBottom == min AND velocityY < 0 (ascending)

Response:
1. y = platform.y + platformHeight + epsilon
   (Place player below platform)
2. velocityY = 0
   (Stop upward movement)
3. isGrounded remains false
   (Player continues to fall)
```

**Wall Collision (Horizontal)**:
```
Condition: overlapLeft or overlapRight == min

Response:
- Set x to position player beside platform
- Keep velocityY unchanged
- Player can still be affected by gravity while against wall
```

---

## Combat Mechanics

### Attack System

**Player Attack**

```
Input: Left Mouse Click
Cooldown: 0.3 seconds (300 milliseconds)
Duration: 0.15 seconds (150 milliseconds active)
Range: 40 pixels extending from player
Damage: 15 HP per hit
```

**Attack Activation**:
```javascript
if (keys['attack'] && this.attackCooldown <= 0) {
    this.isAttacking = true;
    this.attackDuration = 0.15;
    this.attackCooldown = 0.3;

    // Create attack hitbox extending 40px from player
    const attackRange = 40;
    this.attackHitbox = new Hitbox(
        this.x + (this.direction > 0 ? this.width : -attackRange),
        this.y,
        attackRange,
        this.height  // Matches player height
    );
}
```

**Attack Hitbox Positioning**:
```
Right-facing Attack:
┌─ Player (30×40)
│     ├─ Attack Hitbox (40×40)
└─────────────────────────────
   x       x+30      x+70

Left-facing Attack:
Attack Hitbox (40×40) ─┬─ Player (30×40)
─────────────────────── ┴
   x-40        x-10       x
```

**Attack Duration**:
```
While isAttacking && attackDuration > 0:
  └─ Attack hitbox exists and can hit enemies

When attackDuration <= 0:
  └─ Attack ends, hitbox destroyed

Benefit of duration limit:
- Player can't hold attack forever
- Each attack has fixed window
- Prevents keeping hitbox active between clicks
```

**Hit Detection**:
```
If isAttacking:
  For each enemy:
    If attackHitbox.intersects(enemy.hitbox):
      ├─ enemy.takeDamage(15)
      ├─ isAttacking = false
      └─ Attack ends immediately

Can only hit each enemy once per attack sequence
```

### Enemy Attack

**Trigger Conditions**:
```
If in Chase Mode AND:
├─ distance < 60 pixels AND
└─ attackCooldown <= 0
    └─ Initiate attack
```

**Enemy Attack Properties**:
```
Range: 40 pixels
Damage: 10 HP
Cooldown: 0.8 seconds (800 milliseconds)
Duration: 48% of cooldown (0.48 seconds)
Attack window: First 40-50% of cooldown (0.32-0.40 seconds)
```

**Attack Timing**:
```
Cooldown at 0.8s: Enemy can attack again
Attack triggered, attack starts
└─ isAttacking = true
└─ attackCooldown = 0.8s

Over next 0.8 seconds:
├─ 0.8s → 0.4s: isAttacking = true (active hitbox)
├─ 0.4s → 0.0s: isAttacking = false (cooldown only)

Result: 50% of cooldown is actual attack, 50% is pure cooldown
```

**Hit Detection**:
```
If enemy.isAttacking:
  If enemyAttackHitbox.intersects(player.hitbox):
    If player.isParrying:
      └─ enemy.takeDamage(20)
    Else:
      └─ player.takeDamage(10)
```

### Damage System

**Health Values**:
```
Player:  100 HP (survives 10 normal hits)
Enemy:   30 HP (dies in 2 player attacks)
```

**Damage Per Action**:
```
┌─ Normal Attack
│  ├─ Player → Enemy: 15 HP
│  └─ Enemy → Player: 10 HP
│
└─ Parried Attack
   ├─ Enemy takes: 20 HP
   └─ Player takes: 0 HP (avoids damage)
```

**Damage Application Flow**:
```
takeDamage(amount) {
    this.health -= amount;
    if (this is Player):
        this.damageFlashTimer = 0.15;  // Visual feedback
}

Game loop checks:
If player.health <= 0:
    └─ State = GAME_OVER (Loss)

If enemy.health <= 0:
    └─ Remove from enemies array (cleanup)
```

---

## Parry System

### Parry Mechanics

**Input**: Right Mouse Click (hold to maintain)

**Activation Requirements**:
```
If parryCooldown <= 0:
    ├─ Right click pressed
    ├─ parryCooldown = 0.4 seconds
    └─ isParrying = true
```

**Duration**:
```
While Right Click held:
    └─ isParrying = true

When Right Click released:
    └─ isParrying = false

Can't attack or parry simultaneously:
If isAttacking:
    └─ Can't parry (must wait for attack to end)
If isParrying:
    └─ Can't attack (must release parry first)
```

**Parry Coverage**:
```
Visual: Green circle (radius 35 pixels) around player

Actual Hitbox: Still uses rectangular hitbox for collision detection
Problem: Circular visual doesn't match rectangular collision
Solution: Players learn the actual collision area through gameplay

Radius 35 pixels covers:
- Most of player's front
- Slightly covers sides
- Does NOT cover back or feet
```

**Parry Effect**:
```
When enemy attack hits during parry:
├─ Enemy takes 20 damage (double normal)
├─ Enemy attack ends
├─ Player takes 0 damage
└─ Visual feedback: Green circle remains visible

Strategic Value:
- Requires timing/prediction
- Doubles damage output if successful
- Leaves player vulnerable if mistimed (attack then gets hurt)
- More risky than dodging (which isn't possible)
```

### Parry Window

**Critical Timing**:
```
Parry Success Requires:
1. Player must press Right Click BEFORE enemy hits
2. Player must HOLD Right Click during collision
3. Collision must occur while isParrying = true

Parry Failure Scenarios:
├─ Parry not yet active (cooldown not ready)
├─ Parry released before collision
├─ Player is attacking (can't parry + attack)
└─ Enemy attacks outside parry radius

Recovery:
├─ On success: parryCooldown = 0.4s, then can parry again
└─ On failure: Take 10 damage, parryCooldown may still be active
```

### Parry Strategy

**When to Parry**:
```
✓ Good times:
  - Enemy is close and attacking (60px range)
  - Player is low on health
  - Want to damage enemy twice as much
  - Enemy just started chasing (predictable)

✗ Bad times:
  - When you could dodge instead
  - Multiple enemies attacking (can't parry all)
  - When it's safer to just move away
  - During your own attack (can't parry)
```

**Risk/Reward**:
```
Success:
- Avoid 10 damage
- Deal 20 damage
- Net swing: 30 damage advantage
- Cooldown: 0.4s

Failure:
- Take 10 damage
- Enemy continues
- Lost attack opportunity
- Cooldown: 0.4s

Expected value (assuming 50% success rate):
- Damage dealt: 10
- Damage taken: -5
- Net: +5 advantage per parry

Direct attack:
- Damage dealt: 15
- Damage taken: -10 (not attacking, so defense-focused)
- Net: +5 advantage

Both are equally valuable, but parry feels more skill-based
```

---

## Enemy AI & Behavior

### Patrol Behavior

**Initialization**:
```javascript
this.patrolRange = 300;  // Zone width
this.patrolLeft = x - 150;
this.patrolRight = x + 150;
```

**Patrol Loop**:
```
┌─ Move at 70% speed
├─ Check position
│  ├─ If x < patrolLeft → turn around (direction *= -1)
│  └─ If x > patrolRight → turn around (direction *= -1)
└─ Continue next frame

Visual Pattern:
x = 400 (spawn point)
├─ 400 → 550 (moving right 70 px/s)
├─ 550 → 650 (moving right, reaching boundary)
├─ 650 → 550 (turn around, moving left)
├─ 550 → 400 (moving left)
├─ 400 → 250 (moving left, reaching boundary)
├─ 250 → 400 (turn around, moving right)
└─ [Repeat indefinitely]

This creates back-and-forth guard pattern
```

**Perception Radius**: 400 pixels (half canvas width)
```
Enemy can "see" player if:
distance < 400 pixels

Example at position 500:
└─ Can see targets in range [100, 900]
```

### Chase Behavior

**Activation**:
```
distance < 400 pixels
└─ Switch to CHASE state
```

**Chase Movement**:
```
Direction decision:
direction = sign(player.x - this.x)
├─ If player.x > enemy.x → direction = 1 (right)
└─ If player.x < enemy.x → direction = -1 (left)

Movement:
velocityX = direction * 100  (full speed)

Jump Logic:
If player.y < this.y - 50 AND isGrounded:
  └─ velocityY = -300 (jump toward player)
```

**Chase Characteristics**:
```
- Moves at 100 pixels/second (faster than patrol)
- Face player (direction follows player position)
- Attempt to jump over obstacles
- Relentless until player is > 400px away
- Attack when within 60px
```

**Attack Trigger During Chase**:
```
If distance < 60 pixels AND attackCooldown <= 0:
  ├─ Create attack hitbox
  ├─ Set isAttacking = true
  ├─ Start 0.8s cooldown
  └─ Continue chasing while attacking
```

### Decision Making

**Distance Calculation** (Per Frame):
```javascript
const distToPlayer = Math.abs(player.x - this.x);

if (distToPlayer < 400) {
    // CHASE
} else {
    // PATROL
}
```

**Complexity Analysis**:
```
Time Complexity: O(1)
- Single distance calculation
- Single if statement
- No pathfinding or complex logic

Space Complexity: O(1)
- No dynamic state allocation
- Fixed patrol range boundaries
```

**Efficiency**:
```
6 enemies × O(1) per frame = negligible overhead

Even with 100 enemies, would only add 100 distance calculations
Still frame-rate independent
```

---

## Level Design

### Level Layout

```
Starting Area              Mid-Game               End-Game
     │                        │                      │
     │  Platform pattern      │  Platform pattern    │  Goal
     │                        │                      │
     └────────────────────────┴──────────────────────┘

     0                    600                    1200

Platforms (from game.js):
1. Ground:        (0, 550, 1200, 50)
2. Left-mid:      (300, 450, 200, 20)
3. Center-left:   (600, 400, 200, 20)
4. Center-right:  (900, 350, 200, 20)
5. Mid-height:    (150, 300, 150, 20)
6. Center:        (500, 250, 200, 20)
7. Upper-right:   (850, 200, 150, 20)
8. Final:         (1100, 150, 200, 20)
9. Goal:          (1100, 550, 100, 50) [Special]

Design principle: Generally ascending left to right
```

### Platform Progression

**Early Game** (x: 0-400):
```
Ground floor safety
Platforms at y: 550, 450, 400
Enemies at low positions (420, 370, 320)
Easy to learn mechanics with ground access
```

**Mid Game** (x: 400-800):
```
Rising difficulty
Platforms require jumping
More altitude variation (400 to 250 pixels)
Enemies spread across level (300-600 range)
Still some ground access
```

**Late Game** (x: 800-1200):
```
Highest challenge
Platforms highest (y: 150)
Long jump requirements
Enemies in final defensive positions (170-320)
Goal platform at ground level on far right
```

### Enemy Placement

```
Enemy locations chosen to:
1. Guard progress path
2. Cover platform landing zones
3. Stagger so not all visible at once
4. Create natural patrol patterns
5. Force player to engage in combat or dodge

Enemies as obstacles:
└─ Player must either defeat them or navigate around
└─ Adds strategic layer beyond platforming
```

### Difficulty Curve

```
Time (Seconds) →

Difficulty
    │
  100├──────────────────────────
    │                          ╱│
   75├──────╱│         ╱││     ╱ │
    │      ╱ │────────╱ ││    ╱  │
   50├────╱  │       ╱  ││   ╱   │
    │   ╱    │      ╱   ││  ╱    │
   25├──╱────╱─────╱────││─╱─────┤
    │╱       │    ╱     ││╱      │
    0└───────┴───┴──────┴┴──────┘
      Start   Walk   Combat   Goal

- Initial: Learning controls (easy platforms, single enemy visible)
- Mid: Platforming + avoidance (multiple enemies, varied terrain)
- Late: Full engagement (high platforms, multiple enemies nearby)
- Goal: Challenging final stretch (high altitude, concentrated enemies)
```

---

## Win/Lose Conditions

### Win Condition

**Trigger**:
```javascript
if (this.player.hitbox.intersects(this.goal)) {
    this.state = GAME_STATE.WIN;
    this.showGameOver(true);
}
```

**Victory Screen**:
```
Title: "VICTORY!"
Message: "You defeated all enemies and reached the castle!"
Color: Green (#4CAF50 or similar)
```

**Requirements**:
```
✓ Player must survive the journey (health > 0)
✓ Player must reach goal platform at (1140, 500)
✓ Goal platform is at ground level (easy to reach)
✓ No enemies to defeat to win (can be avoided)
```

**Gameplay Implication**:
```
Players have multiple strategies:
1. Combat strategy: Fight all enemies, then walk to goal
2. Evasion strategy: Parkour past enemies to goal
3. Hybrid: Fight some, avoid others

This flexibility makes the game less frustrating
```

### Lose Conditions

**Condition 1: Health Depletion**
```javascript
if (this.player.health <= 0) {
    this.state = GAME_STATE.GAME_OVER;
    this.showGameOver(false);
}
```

**Condition 2: Falling**
```javascript
if (this.player.y > CONFIG.BOUNDARIES.DEATH_Y) {  // y > 700
    this.health = 0;
    // Health check triggers loss condition above
}
```

**Defeat Screen**:
```
Title: "GAME OVER"
Message: "You were defeated. Try again!"
Color: Red
```

**Recovery**:
```
Player must reload page to restart
└─ Creates new Game instance
└─ All state reset
└─ Start from beginning
```

### Health Management

**Player Health**:
```
Max: 100 HP
Damage per hit: 10 HP (normal enemy attack)
Survivable hits: 10 hits without healing
Parried attacks: 0 damage taken

Example scenarios:
├─ 1v1 vs enemy: Each side deals 15 and 10 respectively
│  └─ Enemy dies first (30 HP vs 100 HP)
│
├─ 6 enemies attacking: 60 HP per second (1000 ms cooldowns)
│  └─ Player dies in ~10 seconds if just taking damage
│
└─ With parrying: Can double damage output
   └─ Win fights faster, take less cumulative damage
```

**Enemy Health**:
```
Max: 30 HP
Player attack: 15 HP
Parried attack: 20 HP (overkill)
Dies in: 2 player attacks
         1.5 parried attacks (killed on first parry)
```

---

## Game Balance Analysis

### Offensive Balance

**Player DPS** (Damage Per Second):
```
With attack cooldown 0.3s:
└─ 15 damage per 0.3s = 50 DPS

Enemy can survive:
└─ 30 HP ÷ 50 DPS = 0.6 seconds
└─ But cooldown is 0.3s, so 2 hits to kill
```

**Enemy DPS** (If player doesn't parry):
```
With attack cooldown 0.8s:
└─ 10 damage per 0.8s = 12.5 DPS

Player can survive:
└─ 100 HP ÷ 12.5 DPS = 8 seconds
└─ That's about 10 enemy hits total

Encounter length: ~0.6 seconds (enemy dies) vs 8 seconds (player dies)
Player has advantage even in direct 1v1
```

**With Parrying**:
```
Player mirrors 20 damage instead of taking 10

Effective enemy DPS vs parrying player:
└─ If 50% parry rate: -5 DPS (healing effect!)
└─ If 75% parry rate: -17.5 DPS (huge advantage)

High skill ceiling: Timing parries is key to dominance
```

### Defensive Balance

**Player Defense Options**:
```
1. Dodge: Not available! Must fight or parry
   └─ Punishes defensive play style

2. Parry: Active defense, 0.4s cooldown
   └─ Skilled defense mechanic
   └─ Requires prediction and timing

3. Movement: Jump and move to avoid attacks
   └─ Can strafe around enemies
   └─ Not guaranteed safety
```

**Enemy Threat Assessment**:
```
┌─ Single Enemy
│  └─ Manageable (2 attacks, 15 dmg each, cooldowns)
│
├─ Two Enemies
│  └─ Challenging (staggered attacks, coordination)
│
├─ Three+ Enemies
│  └─ Very difficult (overwhelming simultaneous attacks)
│
└─ Strategy: Avoid 3+ enemies, deal with single/pairs
```

### Movement Balance

**Speed Comparison**:
```
Player movement:  250 px/s
Enemy movement:   100 px/s (patrol) / 100 px/s (chase)
Speed advantage:  2.5x faster

Player can outrun enemies easily
Useful for:
├─ Escaping from bad situations
├─ Kiting (running while attacking)
└─ Positioning for attacks
```

**Jump Advantage**:
```
Player jump: -400 velocity (high)
Enemy jump: -300 velocity (lower)

Player can reach higher platforms
Useful for:
├─ Accessing platforms enemies can't reach
├─ Escaping to high ground
└─ Height advantage for attacks
```

### Overall Meta

**Dominant Strategies**:
```
1. Speed Running
   └─ Avoid most enemies, rush to goal
   └─ Requires platforming skill, minimal combat

2. Combat Mastery
   └─ Fight enemies, use parrying effectively
   └─ Requires reaction time and pattern recognition

3. Hybrid
   └─ Fight selectively, avoid when disadvantaged
   └─ Most balanced approach
```

**Hard Counter Situations**:
```
├─ 3+ enemies converging
│  └─ Player has no perfect counter
│  └─ Must retreat or die
│
├─ Enemy in a corner
│  └─ No escape routes
│  └─ Must fight or accept damage
│
└─ Multiple enemies on jump path
   └─ Can't reach next platform safely
   └─ Must fight or detour
```

---

## Tuning Guide

### Adjustable Parameters (in CONFIG)

All game constants are in one location for easy tuning:

```javascript
const CONFIG = {
    GRAVITY: 0.6,           // Affects jump arc, fall speed
    FRICTION: 0.8,          // Currently unused (set to 1.0)

    PLAYER: {
        SPEED: 250,         // Movement speed
        JUMP_POWER: 400,    // Initial jump velocity
        MAX_HEALTH: 100,
        ATTACK_COOLDOWN: 0.3,
        ATTACK_DURATION: 0.15,
        ATTACK_RANGE: 40,
        PARRY_COOLDOWN: 0.4,
        PARRY_RADIUS: 35
    },

    ENEMY: {
        SPEED: 100,         // Chase speed
        JUMP_POWER: 300,
        MAX_HEALTH: 30,
        ATTACK_DAMAGE: 10,
        ATTACK_COOLDOWN: 0.8,
        PATROL_RANGE: 300,
        CHASE_DISTANCE: 400
    },

    DAMAGE: {
        ENEMY_TO_PLAYER: 10,
        PLAYER_TO_ENEMY: 15,
        PARRIED_TO_ENEMY: 20
    }
};
```

### Difficulty Adjustments

**Make Game Easier**:
```javascript
// Faster player
PLAYER.SPEED = 300  // Was 250

// Powerful player
PLAYER.ATTACK_COOLDOWN = 0.2  // Was 0.3
DAMAGE.PLAYER_TO_ENEMY = 20     // Was 15

// Weak enemies
ENEMY.ATTACK_DAMAGE = 5         // Was 10
ENEMY.SPEED = 75                // Was 100

// Slower parry cooldown
PLAYER.PARRY_COOLDOWN = 0.2     // Was 0.4
```

**Make Game Harder**:
```javascript
// Slower player
PLAYER.SPEED = 200  // Was 250

// Weaker player
PLAYER.ATTACK_COOLDOWN = 0.4  // Was 0.3
DAMAGE.PLAYER_TO_ENEMY = 12     // Was 15
PLAYER.MAX_HEALTH = 75          // Was 100

// Stronger enemies
ENEMY.ATTACK_DAMAGE = 15        // Was 10
ENEMY.SPEED = 125               // Was 100
ENEMY.MAX_HEALTH = 40           // Was 30

// Faster parry cooldown
PLAYER.PARRY_COOLDOWN = 0.5     // Was 0.4
```

### Playstyle Rebalancing

**Favor Combat**:
```
Reduce enemy cooldowns → Force more fights
Increase attack damage → Reward combat
Reduce parry cooldown → Reward skilled players
```

**Favor Evasion**:
```
Reduce enemy perception → Players can sneak past
Increase player speed → Easier to escape
Reduce enemy speed → Harder to catch
```

**Favor Platforming**:
```
Reduce gravity → Higher, longer jumps
Increase jump power → More forgiving platforming
Reduce enemy vision range → Less mandatory combat
```

---

## Summary

### Key Design Principles

1. **Simplicity**: Three mechanics (move, attack, parry)
2. **Fairness**: Player advantages match difficulty
3. **Flexibility**: Multiple valid strategies
4. **Feedback**: Visual effects for all actions
5. **Progression**: Difficulty naturally increases

### Core Loop

```
1. Move/Platform → 2. Engage Enemy → 3. Attack/Parry → 4. Progress → Repeat
```

### Unique Mechanic

**The Parry System** is the core differentiator:
- Active defense (not passive dodging)
- Double damage reward (20 vs 10)
- Timing-based skill ceiling
- Strategic depth in 1v1 engagements

This creates satisfying moments when parries succeed and teaches players to time their defense.

### Balance Philosophy

The game is **player-favored** by design:
- Player is faster (2.5x)
- Player attacks deal more damage (15 vs 10)
- Parrying is optional but rewarding
- Multiple paths to victory (combat, evasion, hybrid)

This makes the game accessible to diverse skill levels while still challenging skilled players.
