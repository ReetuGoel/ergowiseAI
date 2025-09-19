# Accessibility & Inclusive Design Guidelines

This document summarizes th## 11. Tooling Suggestions
Consider integrating automated checks:
- jest-axe (installed - version ~10.x) or jest-axe for component accessibility tests.
- Lighthouse CI for regression monitoring.cessibility considerations implemented in the ErgoWise UI and how to extend them safely.

## 1. Color System Overview
We use a Fluent-inspired token design system defined in `src/index.css`:

- Brand Tokens: `--brand-primary`, `--brand-accent`, `--brand-accent-soft` (core interactive & chart hues)
- Neutral Tokens: Background & text layers such as `--neutral-bg`, `--neutral-bg-alt`, `--neutral-border`, `--neutral-text`, `--neutral-text-soft`
- Semantic Tokens: Status feedback like `--semantic-success`, `--semantic-warning`, `--semantic-error`, with matching `*-bg` & `*-fg` variants for readable surfaces.
- Chart Tokens: `--chart-1` … `--chart-6` map to brand + accent derivatives for categorical data.
- Alias Tokens (Legacy Compatibility): `--color-primary`, `--color-secondary`, `--color-accent`, etc. map down to brand/neutral tokens so older inline styles keep working.

All components should favor brand / neutral / semantic tokens over raw hex values. Avoid introducing new literal colors unless prototyping.

## 2. Light, Dark & High Contrast Support
- Themes are switched via `data-theme="dark"` on `<html>` from the ThemeContext.
- High contrast adjustments follow `@media (prefers-contrast: more)` using stronger borders, elevated backgrounds, and higher opacity focus rings.
- Never hard-code theme-specific colors in components; instead rely on tokens which provide both light & dark variants automatically.

## 3. Contrast Ratios (Targets)
We target WCAG 2.1 AA:
- Body & standard text: ≥ 4.5:1 against its background.
- Large text (≥ 18px regular or 14px bold): ≥ 3:1.
- Interactive components (buttons, links, inputs): visible focus indicator and ≥ 3:1 for glyph/text vs background.

Spot Checks (Representative Pairs – Light Theme):
| Element | Foreground Token | Background Token | Ratio (approx) |
|---------|------------------|------------------|----------------|
| Primary Button Text | `--neutral-text-on-accent` (#ffffff) | `--brand-primary` (#115ea3) | > 7:1 |
| Surface Text | `--neutral-text` (#201f1e) | `--neutral-bg` (#ffffff) | > 12:1 |
| Muted Text | `--neutral-text-soft` (#5a5a5a) | `--neutral-bg` (#ffffff) | ~ 5.3:1 |
| Warning Badge | `--semantic-warning-fg` (#3d2e00) | `--semantic-warning-bg` (#fef4d2) | > 7:1 |

Dark mode tokens were chosen to maintain similar or better ratios; verify new elements with a contrast checker.

## 4. Focus & Keyboard Navigation
- We use a consistent focus ring: `outline: 2px solid var(--focus-ring)` with an offset for clarity.
- Only display focus outlines during keyboard navigation (`:focus-visible`). Do not remove outlines globally.
- When designing custom interactive controls (e.g., cards acting as buttons) ensure they are reachable via keyboard (tabindex=0 + role + key handlers) and show the focus ring.

## 5. Motion & Animation
- Keep motion subtle; prefer transforms & opacity transitions ≤ 250ms.
- Respect `prefers-reduced-motion` if adding future complex animations (not yet implemented—add conditional wrappers and immediate state changes if user opts out).

## 6. Icon & SVG Usage
- Provide `role="img"` + `<title>` for meaningful SVGs (see `logo.tsx`).
- Decorative SVGs should have `aria-hidden="true"` or be background images.
- Ensure sufficient contrast for stroked icons in both themes (inherit `currentColor` where possible so tokens propagate).

## 7. Forms & Inputs
- Radio / checkbox groups use visible labels and accessible name from the label text.
- Future enhancement: introduce ARIA live regions for timed events (break timer completion) and error messaging.

## 8. Avoiding Color-Only Communication
- Do not rely solely on color to convey status (add icons, text labels, or shape cues). For example, instead of highlighting an invalid field only with a red border, also include helper text and/or an error icon.

## 9. Testing Checklist
When adding or modifying UI components:
- [ ] Keyboard: Can every interactive element be tabbed to & activated with Enter/Space?
- [ ] Focus: Is a clear outline visible (no clipping / overflow hidden)?
- [ ] Contrast: Foreground/background pairs meet AA ratios.
- [ ] Scaling: Zoom the page to 200%—layout still usable without horizontal scroll (where practical).
- [ ] Screen Reader: Landmarks & roles are logical (add `role="region" aria-label="..."` for complex clusters if needed).

## 10. Adding New Tokens
If you need an additional role (e.g., `--semantic-info`):
1. Define it in both light & dark theme blocks near existing semantic tokens.
2. Provide background (`*-bg`), foreground (`*-fg`), and emphasis (`*-emphasis`) variants if the status includes surfaces.
3. Use the new token in components; avoid directly referencing brand hues for semantic meanings.

## 11. Known Follow-Ups
- Potential: Provide reduced-motion handling.
- Potential: Add aria-live polite announcement for break timer completion.
- Potential: Add unit tests for theme switching / token presence.

## 12. Tooling Suggestions
Consider integrating automated checks:
- axe-core or jest-axe for component accessibility tests.
- Lighthouse CI for regression monitoring.

---
Questions or improvements? Extend this doc and keep design tokens the single source of truth for color.
