---
'@astryxdesign/cli': patch
---

[fix] theme build: built theme.css no longer pins `color-scheme` to `light dark` at the root. The generated `@layer astryx-theme` block now mirrors reset.css's `html[data-theme]` mapping (`html[data-theme="light"] { color-scheme: light }` / `html[data-theme="dark"] { color-scheme: dark }`) alongside the bare `:root` declaration, so a forced `<Theme mode="light|dark">` correctly flips the document's computed `color-scheme` — and with it `light-dark()` tokens and browser UI — instead of silently following the OS preference. Component and on-media rules now share a single `@layer astryx-theme` block (matching the runtime's `generateThemeCSS`), so `light-dark()` used only in `onDark`/`onLight` tokens is detected too, and the legacy theme-extraction fallback no longer drops `onDark`/`onLight`/`syntax` when re-resolving a raw theme definition (#3658)
@let-sunny
