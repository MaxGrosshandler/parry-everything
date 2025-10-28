# Parry Everything - Game Architecture & Design Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Design](#architecture-design)
3. [Class Structure](#class-structure)
4. [Game Loop](#game-loop)
5. [Physics System](#physics-system)
6. [Collision Detection](#collision-detection)
7. [Game Mechanics](#game-mechanics)
8. [Design Decisions](#design-decisions)
9. [Performance Considerations](#performance-considerations)

---

## System Overview

**Parry Everything** is a 2D platformer combat game built with vanilla JavaScript and HTML5 Canvas. The game features real-time physics, collision detection, AI enemies, and a parry-based combat system.

### Key Characteristics
- **Technology**: Pure JavaScript (ES6 Classes), HTML5 Canvas
- **Architecture**: Object-oriented with clear separation of concerns
- **Rendering**: 60 FPS game loop using `requestAnimationFrame`
- **Physics**: Gravity-based movement with friction and velocity
- **Gameplay**: Platforming + combat with strategic parrying mechanics
- **Scope**: Self-contained, no external dependencies

### Target Platform
- Modern web browsers supporting HTML5 Canvas and ES6 JavaScript
- Desktop-optimized (keyboard + mouse controls)

---

## Architecture Design

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      HTML Document                      │
│  (index.html - Canvas, UI, Game Over Screen, Styles)   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Game Engine (game.js)                │
├─────────────────────────────────────────────────────────┤
│  Game Class (Main Loop, State Management)              │
├─────────────────────────────────────────────────────────┤
│    │                                                     │
│    ├─► Player            │ Enemies (Array)              │
│    ├─► Platforms (Array) │ Goal Marker                  │
│    └─► Game State        │ UI Manager                   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│         Core Systems (Collision, Physics, Rendering)   │
├─────────────────────────────────────────────────────────┤
│  • Hitbox (AABB Collision)                             │
│  • Platform Physics                                     │
│  • Player/Enemy Movement & Attacks                      │
│  • Canvas 2D Rendering                                  │
└─────────────────────────────────────────────────────────┘
```

### Module Dependencies

```
game.js (Single File - All Classes)
├── Game Class
│   ├── Creates: Player, Enemies[], Platforms[]
│   ├── Manages: Game Loop, Input Handling, Collision Detection
│   ├── Updates: All entities each frame
│   └── Renders: All game elements
│
├── Player Class
│   ├── Properties: Position, Velocity, Health, State
│   ├── Methods: Update, Collision, Attack, Parry, Draw
│   └── Dependencies: Hitbox, Game
│
├── Enemy Class
│   ├── Properties: Position, Velocity, Health, AI State
│   ├── Methods: Update, Collision, Attack, AI Logic, Draw
│   └── Dependencies: Hitbox, Game
│
├── Platform Class
│   ├── Properties: Position, Dimensions, Collision Box
│   ├── Methods: Draw
│   └── Dependencies: Hitbox
│
└── Hitbox Class
    ├── Properties: Position, Dimensions
    └── Methods: Intersection Testing, Debug Draw
```

---

## Class Structure

### 1. Game Class (Lines 56-263)

**Responsibility**: Central game controller and main loop orchestrator

#### Properties
```javascript
this.state           // Current game state (PLAYING, GAME_OVER, WIN)
this.gravity         // Global gravity value (0.6)
this.friction        // Global friction coefficient (0.8)
this.keys            // Keyboard state object
this.mouseButtons    // Mouse button state object
this.player          // Player instance
this.platforms       // Array of Platform instances
this.enemies         // Array of Enemy instances
this.goal            // Goal marker position and dimensions
this.lastTime        // Timestamp for delta-time calculation
```

#### Key Methods

**Constructor ()`**
- Initializes game systems
- Sets up input handlers
- Creates player instance
- Builds level (platforms, enemies, goal)
- Starts the game loop

**setupInputHandlers()** (Lines 78-99)
- Registers keyboard event listeners for movement (A/D) and jumping (Space)
- Maps mouse buttons to attack (Left Click) and parry (Right Click)
- Prevents browser context menu on right-click

**createLevel()** (Lines 101-135)
- Defines 8 platforms at strategic positions
- Places 6 enemies across the level
- Sets goal position (1140, 500)
- Creates a progression from left (starting area) to right (castle/goal)

**update(deltaTime)** (Lines 137-198)
- **Player Update**: Applies input and physics
- **Enemy Updates**: Updates all enemy AI and movement
- **Collision Detection**:
  - Platform collisions for player and enemies
  - Player attack vs. enemies
  - Enemy attacks vs. player (with parry check)
  - Goal collision (win condition)
  - Death boundary (lose condition)
- **Cleanup**: Removes dead enemies from array
- **UI Update**: Updates health bar display

**draw()** (Lines 224-251)
- Clears canvas with sky-blue background
- Renders platforms, goal marker, enemies, player
- Optional hitbox debug visualization

**gameLoop()** (Lines 253-262)
- Calculates delta-time between frames
- Calls update and draw
- Schedules next frame with `requestAnimationFrame`
- Achieves ~60 FPS

---

### 2. Player Class (Lines 308-493)

**Responsibility**: Player character logic, input handling, and combat

#### Properties
```javascript
// Position & Physics
this.x, this.y              // Position
this.velocityX, velocityY   // Current velocity
this.width, height          // Dimensions (30x40)
this.speed                  // Movement speed (250)
this.jumpPower              // Jump velocity (400)

// State
this.health                 // Current HP (0-100)
this.maxHealth              // Maximum HP (100)
this.isGrounded             // True when standing on platform
this.direction              // Current facing direction (1 = right, -1 = left)

// Combat
this.isAttacking            // Currently attacking
this.isParrying             // Currently parrying
this.attackCooldown         // Time until next attack allowed (0.3s)
this.parryCooldown          // Time until next parry allowed (0.4s)
this.attackDuration         // How long attack hitbox is active (0.15s)
this.attackHitbox           // Rectangular area of attack
this.parryHitbox            // Circular parry area (radius 35)

// Visual
this.damageFlashTimer       // Duration of red damage flash (0.15s)
this.hitbox                 // Main collision box
```

#### Key Methods

**update(keys, deltaTime)** (Lines 341-414)
- **Input Processing**: Reads A/D for movement, Space for jump
- **Attack System**:
  - Left-click to attack (creates attackHitbox extending 40px from player)
  - 0.3s cooldown between attacks
  - Attack lasts 0.15s for damage window
- **Parry System**:
  - Right-click to activate parry
  - 0.4s cooldown between parries
  - Converts incoming damage to damage against attacker
- **Physics**:
  - Applies gravity (0.6)
  - Updates position with velocity
  - Maintains horizontal canvas boundaries
- **Death Check**: Sets health to 0 if falling below y=700

**collideWithPlatform(platform)** (Lines 416-439)
- **AABB Intersection Testing**: Checks if hitbox overlaps platform
- **Overlap Calculation**: Determines smallest overlap on each side
- **Response Logic**:
  - Top: Landing on platform (set grounded, zero vertical velocity)
  - Bottom: Hitting head (zero vertical velocity)
  - Left: Moving right into wall (stop horizontal movement)
  - Right: Moving left into wall (stop horizontal movement)
- **Epsilon Buffer** (0.5px): Prevents player from sticking to platforms

**takeDamage(amount)** (Lines 441-444)
- Reduces health by damage amount
- Triggers visual flash effect for 0.15s

**draw(ctx)** (Lines 446-492)
- Renders green rectangular body (30x40)
- Draws head with tan color and black eyes
- **Attack Animation**: Red rectangle extending in facing direction
- **Parry Animation**: Green circle (radius 35) around center
- **Damage Flash**: Red overlay that fades out
- **Direction Indicator**: Small black square showing facing direction

---

### 3. Enemy Class (Lines 495-661)

**Responsibility**: AI-controlled opponent with patrol and chase behaviors

#### Properties
```javascript
// Position & Physics
this.x, this.y              // Position
this.velocityX, velocityY   // Current velocity
this.width, height          // Dimensions (28x36)
this.speed                  // Movement speed (100)
this.jumpPower              // Jump velocity (300)

// State
this.health                 // Current HP (0-30)
this.maxHealth              // Maximum HP (30)
this.isGrounded             // True when standing on platform
this.direction              // Facing direction (1 or -1)
this.isAttacking            // Currently attacking

// AI Behavior
this.patrolRange            // Patrol zone width (300px)
this.patrolLeft             // Leftmost patrol position
this.patrolRight            // Rightmost patrol position
this.chaseDistance          // Distance to start chasing (400px)
this.attackCooldown         // Time until next attack allowed (0.8s)

// Combat
this.attackHitbox           // Rectangular area of attack
this.hitbox                 // Main collision box
```

#### Key Methods

**update(player, deltaTime)** (Lines 530-596)
- **Distance Calculation**: Measures distance to player
- **AI Behavior**:
  - **Chase** (if distance < 400px):
    - Move toward player at full speed
    - Face player
    - Jump when player is higher
    - Attack when within 60px (0.8s cooldown)
  - **Patrol** (if distance >= 400px):
    - Move back and forth within patrol zone
    - Move at 70% speed
    - Reverse direction at patrol boundaries
- **Physics**: Applies gravity, velocity, boundary checks
- **Death Boundary**: Removes enemy if falls below y=700

**collideWithPlatform(platform)** (Lines 598-621)
- Identical to Player collision logic
- AABB intersection with overlap-based response
- Epsilon buffer prevents sticking

**takeDamage(amount)** (Lines 623-625)
- Reduces health by damage amount

**draw(ctx)** (Lines 627-660)
- Renders red rectangular body (28x36)
- Dark red head with white eyes
- **Attack Animation**: Orange rectangle extending in facing direction
- **Health Bar**: 25px wide bar above enemy showing current HP

---

### 4. Platform Class (Lines 289-306)

**Responsibility**: Static level geometry

#### Properties
```javascript
this.x, this.y              // Position (top-left corner)
this.width, height          // Dimensions
this.color                  // Fill color (hex string)
this.hitbox                 // Collision box (Hitbox instance)
```

#### Key Methods

**constructor(x, y, width, height, color)**
- Creates hitbox matching platform dimensions
- Stores color for rendering

**draw(ctx)** (Lines 299-305)
- Fills rectangle with color
- Draws dark border (2px, #333)

---

### 5. Hitbox Class (Lines 265-286)

**Responsibility**: AABB collision detection

#### Properties
```javascript
this.x, this.y              // Top-left corner
this.width, height          // Box dimensions
```

#### Key Methods

**intersects(other)** (Lines 274-279)
- AABB intersection test
- Returns `true` if boxes overlap
- Formula: Checks all four edges for overlap

**draw(ctx)** (Lines 281-285)
- Debug visualization (red outline)
- Useful for collision debugging

---

## Game Loop

### Frame Execution Order

```
Frame Start
    │
    ├─► RequestAnimationFrame Callback
    │   └─► Calculate deltaTime (seconds since last frame)
    │
    ├─► Game.update(deltaTime)
    │   ├─► Player.update(keys, deltaTime)
    │   │   ├─► Process input (movement, attack, parry)
    │   │   ├─► Apply physics (gravity, velocity)
    │   │   └─► Update position and state
    │   │
    │   ├─► for each Enemy
    │   │   ├─► Enemy.update(player, deltaTime)
    │   │   ├─► Run AI behavior (patrol/chase)
    │   │   ├─► Apply physics (gravity, velocity)
    │   │   └─► Update position and state
    │   │
    │   ├─► for each Platform
    │   │   ├─► Player.collideWithPlatform(platform)
    │   │   └─► for each Enemy, enemy.collideWithPlatform(platform)
    │   │
    │   ├─► Check Player Attack vs Enemies
    │   │   └─► If attacking and hit: Deal damage, end attack
    │   │
    │   ├─► Check Enemy Attacks vs Player
    │   │   └─► If hit: Check if parrying
    │   │       ├─► If parrying: Deal damage back to enemy
    │   │       └─► If not parrying: Take damage
    │   │
    │   ├─► Check Win Condition (player touches goal)
    │   ├─► Check Lose Condition (player health <= 0)
    │   ├─► Remove dead enemies
    │   └─► Update UI (health bar, HP display)
    │
    ├─► Game.draw()
    │   ├─► Clear canvas (sky blue)
    │   ├─► Draw all platforms
    │   ├─► Draw goal marker
    │   ├─► Draw all enemies
    │   └─► Draw player
    │
    └─► Schedule next frame with requestAnimationFrame
```

### Delta-Time System

The game uses delta-time (elapsed time since last frame) to ensure frame-rate independent physics:

```javascript
const now = Date.now();
const deltaTime = (now - this.lastTime) / 1000;  // Convert to seconds
this.lastTime = now;

// Physics update uses delta-time for consistent speed
this.x += this.velocityX * deltaTime;
this.y += this.velocityY * deltaTime;
```

**Benefit**: Movement is consistent whether game runs at 30 FPS, 60 FPS, or 120 FPS.

---

## Physics System

### Gravity & Velocity

```javascript
// Every frame:
this.velocityY += gravity;  // Gravity pulls downward (0.6 units/frame²)
this.y += this.velocityY * deltaTime;

// Example: Character falls 1 second
// velocityY accumulates: 0.6, 1.2, 1.8, 2.4... (each frame)
// Actual pixel distance = sum of: velocityY * deltaTime
```

### Collision Response

When a character collides with a platform from above:

```
BEFORE:
  velocityY = 100 (falling)

AFTER:
  y = platform.y - height - epsilon
  velocityY = 0 (stop falling)
  isGrounded = true
```

### Movement

**Player Movement Speed**: 250 pixels/second
- `velocityX = ±250` when moving left/right
- Applied each frame: `x += velocityX * deltaTime`

**Enemy Movement Speed**: 100 pixels/second
- Patrol: 70 pixels/second (reduced by 30%)
- Chase: 100 pixels/second (full speed)

### Jump Mechanics

When player presses Space while grounded:
```javascript
this.velocityY = -jumpPower;  // -400 (negative = upward)
this.isGrounded = false;

// Character rises until gravity overcomes velocity
// Then falls back down due to gravity
```

---

## Collision Detection

### AABB (Axis-Aligned Bounding Box) System

The game uses simple rectangular collision boxes:

```javascript
intersects(other) {
    return this.x < other.x + other.width &&
           this.x + this.width > other.x &&
           this.y < other.y + other.height &&
           this.y + this.height > other.y;
}
```

**Diagram**:
```
Box A intersects Box B if:
- A's left < B's right    AND
- A's right > B's left    AND
- A's top < B's bottom    AND
- A's bottom > B's top
```

### Collision Types

#### 1. Platform Collisions
- **Hitboxes**: Player/Enemy body vs Platform
- **Response**: Directional - top (land), bottom (hit head), left/right (wall)
- **Epsilon Buffer**: 0.5px prevents sticking

#### 2. Attack Collisions
- **Hitboxes**: Attack hitbox (40px extending from character) vs. target hitbox
- **Detection**: Checked every frame while attacking
- **Response**: Damage dealt, attack ends (prevents multiple hits per swing)

#### 3. Goal Collision
- **Hitboxes**: Player vs goal marker
- **Response**: Game state changes to WIN

#### 4. Boundary Collisions
- **Horizontal**: Player/Enemy constrained to canvas width (0 to 1200)
- **Vertical (Death)**: If y > 700, entity dies

---

## Game Mechanics

### Combat System

#### Player Attack
- **Input**: Left-click
- **Cooldown**: 0.3 seconds between attacks
- **Duration**: 0.15 seconds (active hitbox duration)
- **Range**: 40 pixels extending in facing direction
- **Damage**: 15 HP to enemies
- **Animation**: Red rectangle extending from character

#### Enemy Attack
- **Trigger**: Activated when within 60px of player
- **Cooldown**: 0.8 seconds between attacks
- **Duration**: 0.48 seconds (60% of cooldown)
- **Range**: 40 pixels extending in facing direction
- **Damage**: 10 HP to player
- **Animation**: Orange rectangle extending from enemy
- **Frequency**: Less frequent than player attacks

#### Parry Mechanic
- **Input**: Right-click (hold to maintain)
- **Cooldown**: 0.4 seconds per parry activation
- **Radius**: 35 pixels circular coverage
- **Effect**: Converts incoming enemy attack to 20 damage back to attacker
- **Animation**: Green circle around player
- **Strategic Value**: Only converts damage if held at moment of impact

### AI Behavior

#### Patrol Mode (Distance > 400px)
```
Loop:
  Move at 70% speed back and forth
  Turn around at patrol zone boundaries (±150px from start)
  Wait for player to enter chase range
```

#### Chase Mode (Distance < 400px)
```
Loop:
  Move at 100% speed toward player
  Face player direction
  Jump if player is higher
  IF distance < 60px AND cooldown ready:
    Attack
```

#### Decision Making
- Single condition check: `distToPlayer < chaseDistance`
- Efficient: O(1) per enemy per frame
- Predictable: Players can learn enemy patterns

### Win/Lose Conditions

**Win**: Player touches goal platform at (1140, 500)
- Displays "VICTORY!" screen
- Shows message: "You defeated all enemies and reached the castle!"

**Lose**: Two ways to fail
1. Player health drops to 0 (defeated in combat)
2. Player falls below y=700 (death boundary)
- Displays "GAME OVER" screen
- Shows message: "You were defeated. Try again!"

---

## Design Decisions

### 1. Vanilla JavaScript (No Framework)

**Decision**: Use pure JavaScript with HTML5 Canvas instead of game engine

**Rationale**:
- Simple game doesn't require heavy framework overhead
- Direct control over rendering and physics
- Minimal file size (1 HTML file + 1 JS file)
- No build process needed
- Easier to understand architecture

**Trade-offs**:
- No built-in physics engine (implemented manually)
- No asset pipeline (all graphics drawn procedurally)
- More boilerplate for common game tasks

### 2. Single-File Architecture

**Decision**: All classes in one `game.js` file

**Rationale**:
- Small codebase (667 lines)
- No module bundling required
- Simpler deployment
- Classes logically grouped and closely related

**Scalability**: For larger projects, would split into:
- `game.js` - Game controller
- `entities/player.js` - Player logic
- `entities/enemy.js` - Enemy logic
- `physics/hitbox.js` - Collision system

### 3. Configuration Object

**Decision**: Store all game constants in CONFIG object (lines 13-53)

**Rationale**:
- Easy tuning of game feel (speed, damage, cooldowns)
- Centralized balance parameters
- No magic numbers scattered through code
- Enables rapid iteration

**Example**:
```javascript
const CONFIG = {
    PLAYER: {
        SPEED: 250,        // Easy to increase for faster gameplay
        JUMP_POWER: 400,
        ATTACK_COOLDOWN: 0.3,
        PARRY_COOLDOWN: 0.4,
        // ...
    }
};
```

### 4. AABB Collision System

**Decision**: Simple rectangular collision boxes instead of pixel-perfect

**Rationale**:
- Performance: O(1) per collision check
- Simplicity: Easy to understand and debug
- Sufficient for rectangular characters/platforms
- Predictable: No surprises for players

**Trade-offs**:
- Less precise than pixel-perfect collision
- Circular parry area uses approximation

### 5. Delta-Time Physics

**Decision**: Use elapsed time between frames for movement calculation

**Rationale**:
- Frame-rate independent gameplay
- Works consistently on 30 FPS, 60 FPS, 120 FPS monitors
- Standard practice in game development
- Smooth movement even with frame rate variations

### 6. Array-Based Entity Management

**Decision**: Store platforms, enemies in arrays; update/remove as needed

**Rationale**:
- Simple iteration each frame
- Easy to add/remove entities
- Minimal memory overhead
- Clear ownership (Game class owns all entities)

**Current Optimization**:
```javascript
// Remove dead enemies efficiently
this.enemies = this.enemies.filter(enemy => enemy.health > 0);
```

### 7. Input Handling

**Decision**: Keyboard event listeners + mouse button tracking

**Rationale**:
- Keyboard responsiveness for movement
- Mouse for combat (intuitive left/right clicks)
- Prevents browser context menu on right-click
- Handles simultaneous key presses

**Flexibility**: Could easily extend to gamepad input via GamepadAPI

### 8. Procedural Graphics

**Decision**: Draw all graphics with Canvas 2D API instead of sprites

**Rationale**:
- No asset files needed
- Minimal bandwidth
- Simple animation (e.g., attack flash)
- Easy color variations

**Limitation**: Less visually polished than sprite-based approach

---

## Performance Considerations

### Current Performance Profile

**Target**: 60 FPS on modern hardware

**Per-Frame Operations** (approximate):
- Input processing: O(1)
- Player update: O(1)
- Enemy updates: O(n) where n = enemy count (6)
- Collision detection: O(n × m) where m = platform count (8)
- Rendering: O(1) + O(n) for enemies

**Total**: ~O(n) with n ≈ 14 entities

### Optimizations Already Implemented

1. **Dead Entity Cleanup**
   ```javascript
   this.enemies = this.enemies.filter(enemy => enemy.health > 0);
   ```
   Prevents accumulation of corpses

2. **Delta-Time Checks**
   ```javascript
   if (distToPlayer < this.chaseDistance)  // Single distance check
   ```
   Minimal distance calculations

3. **Early Collision Exits**
   ```javascript
   if (!this.hitbox.intersects(platform.hitbox)) return;
   ```
   Skip expensive collision response if no overlap

4. **State-Based Rendering**
   - Only draws attack/parry circles when active
   - Conditional damage flash based on timer

### Potential Future Optimizations

**If performance becomes an issue**:

1. **Spatial Partitioning**: Divide canvas into grid cells
   - Reduce collision checks from O(n×m) to O(n)
   - Useful for 50+ entities

2. **Object Pooling**: Pre-allocate Hitbox objects
   - Avoid garbage collection during gameplay
   - Reuse hitbox objects

3. **Render Batching**: Group similar draw calls
   - Minor improvement for current scale

4. **WebGL Rendering**: Switch to WebGL for 2D
   - Unnecessary for current game size
   - Adds complexity

### Memory Usage

**Fixed Memory** (per game instance):
- 1 Player object
- 6 Enemy objects
- 8 Platform objects
- ~1KB game state

**Garbage Collection**: Minimal allocation after startup
- Dead enemies filtered out but not re-created
- Attack/parry hitboxes allocated fresh each frame (minor)

---

## Extension Points

### Adding New Features

#### New Enemy Type
1. Create `EnemyVariant` class extending or mimicking `Enemy`
2. Override `update()` for different AI behavior
3. Add to `createLevel()` enemy array

#### Power-Ups
1. Create `PowerUp` class with position, effect
2. Add collision check in `Game.update()`
3. Apply effect to player (health, speed boost, etc.)

#### New Combat Moves
1. Add new input key mapping in `setupInputHandlers()`
2. Create move logic in `Player.update()`
3. Define hitbox and damage in `CONFIG`

#### Level Editor
1. Define levels as array of object literals
2. Load level data in `createLevel()`
3. Add level selection screen

---

## File Structure

```
ParryEverything/
├── index.html          (168 lines)
│   ├── Canvas element (1200x600)
│   ├── Game UI markup
│   ├── Game Over screen
│   └── Embedded CSS styles
│
└── game.js             (667 lines)
    ├── CONFIG object (constants)
    ├── Game class (main loop)
    ├── Player class (character)
    ├── Enemy class (AI opponent)
    ├── Platform class (level geometry)
    ├── Hitbox class (collision)
    └── Window load event handler
```

---

## Summary

**Parry Everything** demonstrates clean game architecture in vanilla JavaScript:

- **Clear Separation**: Each class has single responsibility
- **Efficient Physics**: Simple gravity-based movement
- **Effective Collision**: AABB system sufficient for gameplay
- **Engaging Mechanics**: Attack/Parry system creates strategic decisions
- **Scalable Design**: Easy to extend with new features
- **Minimal Overhead**: No dependencies, single HTML file deployment

The codebase prioritizes **clarity and simplicity** over feature richness, making it an excellent reference for 2D game architecture fundamentals.
