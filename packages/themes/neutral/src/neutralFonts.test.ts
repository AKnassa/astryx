// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file Guards the README against drifting from the fonts the theme declares (#5991).
 * @input README.md plus the resolved --font-family-* tokens of neutralTheme.
 * @output Fails when the README omits, misdescribes, or gives no loading
 *   recipe for a webfont the theme resolves.
 * @position Package-local docs guard, sibling of neutralTheme.test.ts.
 *
 * Neutral shipped describing itself as "system fonts" while declaring Figtree
 * for body and heading. Astryx never loads font files, so an undocumented
 * webfont silently falls back and a missing font looks like a consumer
 * integration failure. The README must name every webfont the theme resolves
 * and show how to load it — a recipe, not just a warning — so if the theme's
 * typography ever changes, the README has to follow.
 */

import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {neutralTheme} from './neutralTheme';

const readme = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'README.md'),
  'utf8',
);

/**
 * Families every browser resolves without loading anything: CSS generics and
 * platform system-UI names. Same spirit as the CLI theme-build font warning
 * (packages/cli/api/theme/build/font-warning.mjs) — anything else is a
 * webfont the app must load itself.
 */
const PREINSTALLED = new Set([
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
]);

function firstFamily(stack: string): string {
  return stack
    .split(',')[0]
    .trim()
    .replace(/^["']|["']$/g, '');
}

function isPreinstalled(family: string): boolean {
  return (
    PREINSTALLED.has(family) ||
    family.startsWith('ui-') ||
    family.startsWith('-')
  );
}

const declaredWebfonts = [
  ...new Set(
    (
      [
        '--font-family-body',
        '--font-family-heading',
        '--font-family-code',
      ] as const
    )
      .map(key => neutralTheme.tokens[key])
      .filter((stack): stack is string => typeof stack === 'string')
      .map(firstFamily)
      .filter(family => !isPreinstalled(family)),
  ),
];

describe('neutral README documents the declared fonts (#5991)', () => {
  it('resolves Figtree as a webfont the app must load', () => {
    expect(declaredWebfonts).toContain('Figtree');
  });

  it('names every declared webfont in the README', () => {
    for (const family of declaredWebfonts) {
      expect(readme).toContain(family);
    }
  });

  it('shows a loading recipe for the declared webfonts', () => {
    expect(readme).toMatch(/fonts\.googleapis\.com|@font-face/);
  });

  it('does not claim the theme runs on system fonts alone', () => {
    expect(readme).not.toMatch(/uses system fonts|with system fonts/i);
    expect(readme).not.toMatch(/no external font loading is required/i);
  });
});
