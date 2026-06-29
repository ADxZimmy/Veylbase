# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Veylbase
**Generated:** 2026-06-23 17:17:02
**Category:** Fintech/Crypto

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#FFD208` | `--color-primary` |
| On Primary | `#000000` | `--color-on-primary` |
| Secondary | `#2D2D2D` | `--color-secondary` |
| Accent/CTA | `#FFD208` | `--color-accent` |
| Accent Hover | `#FFD400` | `--color-accent-hover` |
| Accent Pressed | `#FFC700` | `--color-accent-pressed` |
| Background | `#000000` | `--color-background` |
| Foreground | `#FFFFFF` | `--color-foreground` |
| Muted | `#2D2D2D` | `--color-muted` |
| Light Surface | `#F4F4F4` | `--color-light-surface` |
| Border | `rgba(255,255,255,0.12)` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| Ring | `#FFD208` | `--color-ring` |

**Color Notes:** Zama yellow anchor + black/graphite neutrals. Use yellow sparingly for primary CTAs, active states, verified-registry badges, decryption affordances, and focus rings.

### Typography

- **Heading Font:** Space Grotesk
- **Body Font:** Inter
- **Mood:** web3, bitcoin, defi, digital gold, fintech, crypto, trustless, luminescent, precision, dark
- **Google Fonts:** [Space Grotesk + Inter](https://fonts.google.com/share?selection.family=Inter:wght@400;500;600;700|JetBrains+Mono:wght@400;500|Space+Grotesk:wght@500;600;700)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #FFD208;
  color: #000000;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  background: #FFD400;
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #FFFFFF;
  border: 1px solid rgba(255,255,255,0.16);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #111111;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  border-color: rgba(255,210,8,0.45);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #FFD208;
  outline: none;
  box-shadow: 0 0 0 3px rgba(255,210,8,0.20);
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: #111111;
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 8px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Institutional DeFi Console

**Keywords:** Confidential assets, searchable registry, high contrast, precise data surfaces, selective reveal, verified pairs, production-ready crypto

**Best For:** DeFi protocols, registries, wallet-connected utilities, developer-program submissions, confidential finance products

**Key Effects:** clear focus rings, compact data tables, sticky action panels, selective reveal states, restrained yellow highlights, responsive dense layouts

### Page Pattern

**Pattern Name:** Search-first Registry App

- **CTA Placement:** Wallet/connect and selected-pair action panel
- **Section Order:** App nav > source/coverage summary > registry search/table > selected-pair actions > activity/decrypt states

---

## Anti-Patterns (Do NOT Use)

- ❌ Playful design
- ❌ Unclear fees
- ❌ AI purple/pink gradients

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
