---
'@astryxdesign/core': patch
---

[feat] InternationalizationProvider gains an optional `translator` prop that formats astryx's strings with an i18n runtime you already ship (react-intl, i18next, LinguiJS) instead of the bundled `intl-messageformat`. The already-exported `Translator` interface (`format(message, values?, locale?)`) is now wired to it. Astryx keeps its own lookup — overrides, then `messages`, then the parent locale (`pt-BR` → `pt`), then the shipped `en` catalog — and hands the translator the resolved ICU message, never an `@astryx.*` key, so consumers do not have to load astryx's catalog into their runtime's store. Messages with no values still short-circuit before the translator. Omitting the prop is a no-op: the bundled runtime and its formatter cache behave exactly as before. (#4029)

@AKnassa
