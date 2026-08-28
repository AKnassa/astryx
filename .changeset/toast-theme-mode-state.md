---
'@astryxdesign/core': patch
---

[feat] `Toast` reflects the resolved colour mode of the Theme it renders under as a theming state, `themeMode` (`data-theme-mode="light|dark"`, never `system`), on the card beside `type`. Inside the card, `MediaTheme` flips every `light-dark()` token to the side that reads on the painted surface, so when that surface is dark in both app modes — the error toast is, and a brand that keeps its toasts dark is too — no theme rule could tell a dark app from a light one, and the only way to treat a toast action differently per app mode was to pick its `variant` from `useTheme()` in product code. A theme keys on the state instead: `toast: {'themeMode:dark': {...}}`, alone or compounded with the type (`'type:error+themeMode:dark'`), and a theme-owned custom property set there inherits into `endContent`, where the theme's Button rule can read it (the `ThemedToastAction` story shows the shape). The state is a closed vocabulary derived from context, so nothing can set it untruthfully and nothing about the toast's content reaches the DOM through it. `astryx theme targets Toast` and `theme build` validation pick the state up from the doc. (#5503)

@AKnassa
