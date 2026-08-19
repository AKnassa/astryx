---
'@astryxdesign/core': patch
---

[fix] Theme icons: `defineTheme({icons})` now accepts library extension keys (e.g. `'richtext:bold'`) without a cast. The runtime already resolved any string key through `getIcon`/`getExtendedIcon`, but the `icons` field was typed over the built-in `IconName` union only, so themes could not declare overrides for library-contributed icons. Adds the `ExtendedIconRegistry` type and widens `defineTheme`'s input and `DefinedTheme` to it.

@AKnassa
