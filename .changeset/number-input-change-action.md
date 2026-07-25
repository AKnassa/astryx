---
'@astryxdesign/core': patch
---

[feat] NumberInput: add `changeAction`, the async-action convention its sibling inputs (TextInput, TimeInput, CheckboxInput, Selector, Pagination) already have. It fires after `onChange`, wrapped in a React transition, and the field now shows the committed number optimistically so a controlled parent that applies the value asynchronously no longer makes the input snap back mid-flight. Typed off the same `hasClear` discrimination as `onChange`, so it only receives `null` when clearing is enabled.

@AKnassa
