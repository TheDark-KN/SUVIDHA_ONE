# SUVIDHA ONE - Interface & Typography Specification

## 1. Font Family System

### Primary Font
- **Noto Sans** - Main font for all UI elements
- **Noto Sans Devanagari** - For Hindi and Devanagari script
- **Noto Sans [Script]** - For regional languages (Tamil, Bengali, Telugu, Kannada, etc.)

### Fallback Fonts
| Primary | Fallback | Use Case |
|---------|----------|----------|
| Noto Sans | Roboto / Arial | Latin text |
| Noto Sans | Hind Bold | Hindi headings |
| Noto Sans Devanagari | Gargi / Shruti | Hindi/Devanagari |
| Noto Sans [Script] | System fallback | Regional scripts |
| Noto Sans | Inter / Poppins | English-heavy screens |

---

## 2. Typography Scale

### Screen Title / Hero
| Property | Value |
|----------|-------|
| Font | Noto Sans |
| Weight | 700 Bold |
| Size | **72-96 px** |
| Line Height | 1.2 |
| Usage | Main welcome screen titles, service hero banners |
| Notes | Visible from 2m distance on 32-55" kiosk |

### Page Headings
| Property | Value |
|----------|-------|
| Font | Noto Sans |
| Weight | 700 Bold |
| Size | **60-72 px** |
| Line Height | 1.3 |
| Usage | Section headers, page titles, category headings |
| Alignment | Left-aligned |
| Color | Saffron (#FF6600) or Blue (#1A3C8F) |

### Sub-Headings
| Property | Value |
|----------|-------|
| Font | Noto Sans |
| Weight | 600 SemiBold |
| Size | **48-56 px** |
| Line Height | 1.4 |
| Usage | Card titles, category labels, section sub-headers |

### Body Text
| Property | Value |
|----------|-------|
| Font | Noto Sans |
| Weight | 400 Regular |
| Size | **48-56 px** |
| Line Height | 1.5 |
| Usage | Descriptions, instructions, informational text |
| Notes | Minimum 48px enforced for kiosk readability |

### Button Labels
| Property | Value |
|----------|-------|
| Font | Noto Sans |
| Weight | 500 Medium |
| Size | **56-72 px** |
| Line Height | 1.2 |
| Usage | All CTA buttons, action buttons |
| Style | Centered, uppercase or title case |
| Touch Target | Minimum 60x60mm |

### Form Input Text
| Property | Value |
|----------|-------|
| Font | Noto Sans |
| Weight | 400 Regular |
| Size | **48-56 px** |
| Line Height | 1.4 |
| Usage | Input fields, numeric keypad, form data entry |
| Notes | High contrast, clear placeholder text |

### Voice Prompt Text (TTS Display)
| Property | Value |
|----------|-------|
| Font | Noto Sans Italic |
| Weight | 400 Regular |
| Size | **40-48 px** |
| Line Height | 1.4 |
| Usage | Subtitle display synced with Text-to-Speech |

### Hindi / Devanagari Text
| Property | Value |
|----------|-------|
| Font | Noto Sans Devanagari |
| Weight | 400 Regular / 700 Bold |
| Size | Same scale as English |
| Line Height | 1.6 |
| Usage | All Hindi text, Devanagari script |
| Notes | Unicode compliant, CDAC approved, extra line height |

### Regional Scripts
| Property | Value |
|----------|-------|
| Font | Noto Sans [Script] |
| Weight | 400 Regular / 700 Bold |
| Size | Same scale |
| Line Height | 1.6 |
| Usage | Tamil, Bengali, Telugu, Kannada, Malayalam, Gujarati, Marathi, Punjabi |
| Notes | Unicode compliant, script-specific Noto font |

### Accessibility Large Mode
| Property | Value |
|----------|-------|
| Font | All fonts scale +50% |
| Weight | Same weights |
| Size | **72-144 px** |
| Line Height | 1.6 |
| Usage | Activated via accessibility toggle |
| Trigger | Large text mode / High contrast mode |

### Error / Warning Messages
| Property | Value |
|----------|-------|
| Font | Noto Sans |
| Weight | 600 SemiBold |
| Size | **48 px** |
| Line Height | 1.4 |
| Color | Red #C0392B |
| Usage | Error states, validation messages, warnings |
| Prefix | Exclamation icon (!) |

### Success Messages
| Property | Value |
|----------|-------|
| Font | Noto Sans |
| Weight | 600 SemiBold |
| Size | **48 px** |
| Line Height | 1.4 |
| Color | Green #217346 |
| Usage | Payment success, transaction confirmed, completion |
| Prefix | Checkmark icon (✓) |

---

## 3. Touch Target Specifications

| Element | Minimum Size | Recommended Size |
|---------|--------------|------------------|
| Button | 60x60mm | 80x80mm |
| Service Icons (Main Grid) | 120x120px | 150-180px |
| Navigation Icons | 64x64px | 80-100px |
| Action Icons | 48x48px | 60-80px |
| Status Icons | 64x64px | 80-120px |
| Spacing between targets | 10-15mm | 16px |

---

## 4. Color Palette

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Primary Blue | #1A3C8F | Headers, primary actions, trust |
| Accent Saffron | #FF6600 | Highlights, CTAs, energy |
| Success Green | #217346 | Success states, positive actions |
| Error Red | #C0392B | Errors, warnings, urgent |
| Background White | #FFFFFF | Main background |
| Background Light | #F5F5F5 | Card backgrounds |
| Text Primary | #333333 | Main text |
| Text Secondary | #666666 | Subtle text |
| High Contrast BG | #000000 | Dark mode background |
| High Contrast Text | #FFFFFF | Dark mode text |

---

## 5. Screen Layout Specifications

### Home Screen Grid
- **32" Screens**: 3x2 grid (6 services visible)
- **55" Screens**: 4x2 grid (8 services visible)
- Scrollable for additional services

### Service Tile Design
- Icon: 120-180px above text
- Label: Max 2 lines, ellipsis overflow
- Spacing: 16px gap between icon and label
- Border-radius: 8px soft corners
- Background circle: 160px container, 90px icon

### Navigation
- Bottom persistent nav bar
- Home icon: 80px
- Back navigation: 80px
- Help/Accessibility: 80px each

---

## 6. Font Implementation

### CSS Import
```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;700&display=swap');
```

### CSS Variables
```css
:root {
  --font-scale: 1;           /* Default */
  --font-scale-large: 1.3;   /* Large mode */
  --font-scale-xl: 1.5;      /* Extra-large mode */
  
  --font-size-hero: calc(72px * var(--font-scale));
  --font-size-h1: calc(60px * var(--font-scale));
  --font-size-h2: calc(48px * var(--font-scale));
  --font-size-body: calc(48px * var(--font-scale));
  --font-size-button: calc(56px * var(--font-scale));
  --font-size-input: calc(48px * var(--font-scale));
}
```

### Font Subsetting
- Subset to Latin + Devanagari only
- Reduced file size: ~80KB vs full 2MB

---

## 7. Accessibility Requirements

| Feature | Implementation |
|---------|----------------|
| Voice Guidance | Auto-play on all screens, TTS in selected language |
| Font Scaling | 100% (default) / 130% (large) / 150% (extra-large) |
| High Contrast Mode | Black background, white text, yellow icons |
| Screen Reader | ARIA labels on all interactive elements |
| Touch Targets | Minimum 60x60mm, 10-15mm spacing |
| Color Contrast | WCAG AA ≥ 4.5:1 ratio |

---

## 8. Icon Specifications

### Icon Sizes by Context
| Context | Size |
|---------|------|
| Main Service Grid | 150px |
| Navigation Bar | 80px |
| Button Icons | 60px |
| Status Indicators | 80-120px |
| Informational | 60px |

### Icon Library
- Material Symbols (Variable font icons)
- Format: SVG for crisp rendering at any scale
- All icons must have aria-label for screen reader support
