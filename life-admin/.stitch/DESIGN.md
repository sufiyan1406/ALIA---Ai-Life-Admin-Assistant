# Design System: Smart Life Inbox — Neo-Brutalism

## 1. Visual Theme & Atmosphere
"The Architectural Disruptor" — treats the digital interface as a physical construction of solid blocks, vibrant inks, and raw structural integrity. Intentional asymmetry breaks predictable SaaS layouts. Elements feel "stacked" rather than nested, using heavy borders and hard shadows to create a tactile, comic-book-inspired depth. High-contrast, editorial experience for an AI assistant that feels authoritative yet irreverently playful.

- **Density:** 6/10 — Daily App Balanced leaning Cockpit
- **Variance:** 8/10 — Offset Asymmetric
- **Motion:** 5/10 — Mechanical, spring-stiff transitions

## 2. Color Palette & Roles
- **Sunny Yellow** (#FFD60A) — Primary background, hero sections, energy base
- **Coral Pink** (#FF6B6B) — Urgent actions, notifications, primary accent blocks
- **Electric Purple** (#7B61FF) — AI-driven features, insight panels, "Smart" features
- **Accent Lime** (#BFFF00) — CTA buttons, success states, active navigation
- **Accent Lavender** (#C4B5FD) — Secondary info, calming context, "later" states
- **Off-White** (#FFFDF7) — Clean areas, card backgrounds
- **Ink Black** (#1A1A1A) — All borders, shadows, primary text, structural glue

### Solid-Block Rule
1. Structural Borders: Every container has `2px` or `3px` solid `#1A1A1A` border
2. Surface Nesting: Cards pop, never blend. Use Hard Offset Shadow
3. No Gradients: Colors remain flat and unapologetic

## 3. Typography
- **Display/Headlines:** Space Grotesk — Bold, uppercase, `-2%` letter-spacing, oversized (3.5rem hero)
- **Body/Titles:** Manrope — Clean geometric sans-serif, 1rem body, relaxed leading
- **Monospace:** JetBrains Mono — Metadata, timestamps, data points
- **BANNED:** Inter, rounded/soft typefaces, generic serifs

## 4. Elevation & Depth: Hard-Shadow Principle
- **Shadow Token:** `box-shadow: 4px 4px 0px 0px #1A1A1A`
- **Active States:** Shadow disappears, element translates `2px` down-right (button press)
- **Priority Elevation:** Important cards use `8px` offset; standard cards use `4px`
- **Zero Radius:** All containers `0px` corners. Max `2px` for tiny UI (checkboxes)

## 5. Component Stylings
- **Buttons:** Primary = Coral fill, 3px black border, 4px hard shadow. Secondary = Lime fill. Uppercase Space Grotesk Bold. Push-down on active.
- **Cards:** Own bordered box with hard shadow. Masonry/asymmetric layout. Never use divider lines.
- **Inputs:** White bg, 2px black border. Focus state: yellow bg, 6px shadow offset.
- **Badges/Labels:** Sticker-style — solid color fill, thick border, placed like physical stickers.
- **Smart Pulse (AI):** Purple border oscillating 2px–6px thickness for processing states.

## 6. Layout Principles
- Grid-first, asymmetric responsive architecture
- Sidebar: 280px fixed, ink black background
- Main content: CSS Grid with variable column spans
- Mobile: single-column collapse below 768px
- No flexbox percentage hacks — use named grid areas

## 7. Motion & Interaction
- Mechanical, spring-stiff transitions (`transition: all 0.15s ease`)
- Hover: translate -2px up, shadow increases to 6px
- Active: translate +2px down, shadow collapses to 0px
- No blur transitions, no opacity fades, no soft easing

## 8. Anti-Patterns (BANNED)
- No blurs, no `backdrop-filter`, no `box-shadow` with blur radius
- No rounded corners (max 2px on tiny elements)
- No gradients, no glassmorphism, no soft shadows
- No low-contrast text pairings
- No generic 3-column equal card grids
- No emojis in UI
- No opacity/transparency effects
