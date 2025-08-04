# Dock Effects System

The WiiDesktop Launcher includes a comprehensive dock effects system that adds magical particle effects to the dock area. This system is designed to be both performant and visually appealing.

## Features

### Particle Effect Types

1. **Normal Particles** ✨ - Simple circular particles with various colors
2. **Stars** ⭐ - Star-shaped particles that twinkle
3. **Paws** 🐾 - Cute paw print particles
4. **Water Drops** 💧 - Droplet-shaped particles
5. **Sparkles** ✨ - Sparkling line-based particles
6. **Magic** 🔮 - Magical swirl effects with rotating arms
7. **Fireflies** 🦟 - Glowing firefly particles with pulsing effects
8. **Dust** 💨 - Floating dust particle clusters

### Direction Options

- **Upward** ⬆️ - Particles emanate upward from the dock (magical effect)
- **All Directions** 🌐 - Particles spread in all directions from the dock center

### Customizable Settings

#### Basic Settings
- **Particle Speed** - Controls how fast particles move
- **Particle Count** - Number of particles spawned per cycle
- **Spawn Rate** - How frequently particles are created (particles per second)
- **Particle Size** - Size of individual particles
- **Gravity** - How much particles are affected by gravity
- **Fade Speed** - How quickly particles fade out
- **Size Decay** - How quickly particles shrink over time

#### Advanced Settings
- **Rotation Speed** - How fast particles rotate
- **Particle Lifetime** - How long particles live before disappearing

#### Color Settings
- **Adaptive Colors** - Use ribbon glow color for particles
- **Color Intensity** - Brightness multiplier for adaptive colors
- **Color Variation** - How much colors vary from the base color
- **Custom Color Palette** - Add your own colors for particles

## Performance Optimizations

The particle system includes several performance optimizations:

1. **Object Pooling** - Reuses particle objects to reduce garbage collection
2. **Particle Limit** - Maximum 200 particles to prevent performance issues
3. **Efficient Rendering** - Uses optimized canvas drawing methods
4. **Memory Management** - Automatically cleans up dead particles

## How to Access

1. Right-click on the dock area
2. Select "Dock Effects Settings" from the context menu
3. Configure your desired effects
4. Click "Save Settings" to apply

## Technical Implementation

### Components

- `DockParticleSystem.jsx` - Core particle rendering engine
- `DockEffectsModal.jsx` - Settings interface
- `ClassicWiiDock.jsx` - Integration with the dock

### Particle Class

Each particle type extends a base `Particle` class with:
- Position and velocity tracking
- Lifecycle management (spawn, update, death)
- Type-specific rendering methods
- Color palette management

### Settings Persistence

Particle settings are automatically saved and restored between sessions using the app's settings system.

## Usage Tips

- Start with low particle counts for better performance
- Use "Upward" direction for the most magical effect
- Fireflies and Magic effects work best with moderate spawn rates
- Dust and Normal particles are the most performant
- Adjust gravity and fade speed to control particle lifespan 