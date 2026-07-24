---
'@astryxdesign/core': patch
---

[feat] Tokenizer: `hasCreate` now splits delimited text into multiple tokens (#4175). Typing a comma, or pasting a comma/newline-separated list, commits one token per trimmed, non-empty, non-duplicate value (respecting `maxEntries`) instead of creating a single token from the whole string. Configurable via the new `delimiters` prop (defaults to comma + newline; accepts a string list or a RegExp); pass `delimiters={[]}` to keep Enter as the only way to create when a value may itself contain a comma. Newline-separated pastes (e.g. a spreadsheet column) are read from the clipboard so the single-line input's newline stripping doesn't drop them. PowerSearch's inferred-`hasCreate` string_list editor opts out of splitting so stored filter values keep their commas.
@AKnassa
