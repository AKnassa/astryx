---
'@astryxdesign/core': patch
---

[fix] `SideNavItem`: an icon-only item in a nav that mounts collapsed, such as one restored from saved state, now shows its rail tooltip on hover, the same as an item whose nav collapsed after mounting (#7435, #7692). The rail tooltip renders inside the row it anchors to, and `Tooltip`'s `anchorRef` mode read that anchor once, before React had attached its ref, so the row never got hover listeners or `aria-describedby`. `Tooltip` now binds an `anchorRef` whose element React attaches later in the same commit, such as one rendered around or after the tooltip, and a tooltip open on mount is anchored from its first frame. A tooltip whose anchor was already attached is unchanged.

@AKnassa
