
# Game Image Assets

This directory contains visual assets used in therapeutic games.

## Directory Structure

```
games/
├── icons/            # Game icons and UI elements
├── characters/       # Character images and avatars
├── objects/          # Object images for word practice
├── backgrounds/      # Background images
├── animations/       # Sprite sheets and animations
└── achievements/     # Achievement badges and rewards
```

## Image Format Guidelines

- **Format**: PNG (with transparency), JPG (photos), SVG (icons)
- **Size**: Optimize for web (under 200KB per image)
- **Resolution**: 2x for retina displays
- **Naming**: Use lowercase with hyphens (e.g., `game-icon-speech.png`)

## Recommended Sizes

### Icons
- Small: 24x24px, 48x48px (@2x)
- Medium: 64x64px, 128x128px (@2x)
- Large: 128x128px, 256x256px (@2x)

### Characters
- Avatar: 200x200px, 400x400px (@2x)
- Full Character: 400x600px, 800x1200px (@2x)

### Objects
- Small Objects: 100x100px, 200x200px (@2x)
- Medium Objects: 200x200px, 400x400px (@2x)
- Large Objects: 400x400px, 800x800px (@2x)

### Backgrounds
- Mobile: 750x1334px (iPhone)
- Tablet: 1536x2048px (iPad)
- Desktop: 1920x1080px (HD)

## Usage

```typescript
import gameIcon from '@/public/images/games/icons/speech-game.png';

<img src={gameIcon} alt="Speech Game" width={64} height={64} />
```

## Design Guidelines

### Autism-Friendly Design
- High contrast colors
- Simple, clear shapes
- Minimal visual clutter
- Consistent styling
- Avoid flashing or rapid animations

### Child-Friendly Design
- Bright, cheerful colors
- Large, clear imagery
- Friendly characters
- Encouraging visual feedback
- Age-appropriate content

## Color Palette

### Primary Colors
- Orange: #FF6B1D (brand color)
- Blue: #4A90E2
- Green: #7ED321
- Yellow: #F5B82E

### Secondary Colors
- Purple: #9B51E0
- Pink: #FF6B9D
- Teal: #50E3C2
- Red: #E74C3C

## Accessibility

- Ensure sufficient color contrast (WCAG AA minimum)
- Provide alt text for all images
- Use descriptive file names
- Include text labels where helpful

## File Organization

### Icons (`icons/`)
- `game-icon-pronunciation.png`
- `game-icon-fluency.png`
- `ui-button-play.png`
- `ui-button-pause.png`

### Characters (`characters/`)
- `avatar-therapist-1.png`
- `avatar-child-happy.png`
- `character-robot-helper.png`

### Objects (`objects/`)
- `object-cat.png`
- `object-dog.png`
- `object-house.png`

### Achievements (`achievements/`)
- `badge-first-session.png`
- `badge-10-stars.png`
- `trophy-gold.png`

## Image Optimization

Tools to optimize images:
- **TinyPNG**: https://tinypng.com/ (PNG/JPG compression)
- **SVGOMG**: https://jakearchibald.github.io/svgomg/ (SVG optimization)
- **Squoosh**: https://squoosh.app/ (Advanced compression)

## Copyright and Licensing

Ensure all images are either:
- Original artwork
- Royalty-free from licensed sources (e.g., Unsplash, Pexels)
- Properly attributed if required
- Licensed for commercial use

## Sources for Free Images

- **Icons**: Lucide Icons (already installed)
- **Illustrations**: unDraw, Humaaans
- **Photos**: Unsplash, Pexels
- **Emoji**: Native emoji or Twemoji
