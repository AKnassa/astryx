// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file Spacing token usage derivation tests for the Theme Editor.
 *
 * Covers the pipeline that answers "if I change --spacing-N, what moves?"
 * (issue #808). The map is derived from packages/core source rather than
 * hand-curated, because a hand-authored component→token map in this repo has
 * already drifted twice (see packages/core/src/theme/themingTargets.test.ts).
 *
 * The logic lives in src/lib/spacingUsage.mjs (shared with
 * scripts/generate-spacing-usage.mjs), so these tests exercise the same code
 * path the build-time generator uses.
 *
 * Run: pnpm -F @astryxdesign/docsite test
 */

import * as path from 'node:path';
import {describe, it, expect} from 'vitest';
import {analyzeSource, deriveSpacingUsage} from '../lib/spacingUsage.mjs';
import {summarizeSpacingUsage} from '../app/playground/themeEditor/helpers';

const CORE_SRC_DIR = path.resolve(__dirname, '../../../../packages/core/src');

describe('analyzeSource', () => {
  it('records a spacing token used in a named style entry', () => {
    const source = [
      "import * as stylex from '@stylexjs/stylex';",
      "import {spacingVars} from '../theme/tokens.stylex';",
      'const styles = stylex.create({',
      '  base: {',
      "    gap: spacingVars['--spacing-2'],",
      '  },',
      '});',
    ].join('\n');

    const result = analyzeSource(source, 'Button/Button.tsx');

    expect(result.local).toEqual([
      {token: '--spacing-2', property: 'gap', scale: false},
    ]);
  });

  it('marks numerically keyed style entries as prop-driven scale rungs', () => {
    const source = [
      "import * as stylex from '@stylexjs/stylex';",
      "import {spacingVars} from '../theme/tokens.stylex';",
      'const gapStyles = stylex.create({',
      '  2: {',
      "    columnGap: spacingVars['--spacing-2'],",
      '  },',
      '  0.5: {',
      "    columnGap: spacingVars['--spacing-0-5'],",
      '  },',
      '});',
    ].join('\n');

    const result = analyzeSource(source, 'Stack/stack.stylex.ts');

    expect(result.local).toEqual([
      {token: '--spacing-2', property: 'columnGap', scale: true},
      {token: '--spacing-0-5', property: 'columnGap', scale: true},
    ]);
  });

  it('treats SpacingToken-keyed entries as scale rungs too', () => {
    // container.stylex.ts spells the same prop-keyed scale with the
    // SpacingToken union ('spacing4') rather than a numeric literal (4).
    const source = [
      "import * as stylex from '@stylexjs/stylex';",
      "import {spacingVars} from '../theme/tokens.stylex';",
      'const styles = stylex.create({',
      "  spacing4: {'--container-padding': spacingVars['--spacing-4']},",
      "  spacing0_5: {'--container-padding': spacingVars['--spacing-0-5']},",
      '});',
    ].join('\n');

    const result = analyzeSource(source, 'Layout/container.stylex.ts');

    expect(result.local.every(ref => ref.scale)).toBe(true);
  });

  it('resolves a token named as a string and indexed indirectly', () => {
    // Toolbar and Grid map a SpacingStep prop to a token name, then index
    // spacingVars with it. The numeric keys still mark it as a scale.
    const source = [
      "import {spacingVars} from '../theme/tokens.stylex';",
      'const spacingStepToVar = {',
      "  2: '--spacing-2',",
      "  0.5: '--spacing-0-5',",
      '};',
    ].join('\n');

    const result = analyzeSource(source, 'Toolbar/Toolbar.tsx');

    expect(result.local).toEqual([
      {token: '--spacing-2', property: '2', scale: true},
      {token: '--spacing-0-5', property: '0.5', scale: true},
    ]);
  });

  it('does not mistake a token default table for token usage', () => {
    // theme/tokens.stylex.ts declares the scale itself: token names are keys
    // and the values are lengths, so nothing here is a usage site.
    const source = [
      'export const spacingDefaults = {',
      "  '--spacing-4': '16px',",
      "  '--spacing-6': '24px',",
      '} as const;',
    ].join('\n');

    const result = analyzeSource(source, 'theme/tokens.stylex.ts');

    expect(result.local).toEqual([]);
    expect(result.exports.get('spacingDefaults')).toBeUndefined();
  });

  it('resolves a spacing token reached through a const alias', () => {
    const source = [
      "import * as stylex from '@stylexjs/stylex';",
      "import {spacingVars} from '../theme/tokens.stylex';",
      "const SP4 = spacingVars['--spacing-4'];",
      'const styles = stylex.create({',
      '  base: {',
      '    padding: SP4,',
      '  },',
      '});',
    ].join('\n');

    const result = analyzeSource(source, 'Layout/container.stylex.ts');

    expect(result.local).toEqual([
      {token: '--spacing-4', property: 'padding', scale: false},
    ]);
  });

  it('follows a chained var() fallback built from template literals', () => {
    // The shape Card/Section/Dialog default padding actually uses.
    const source = [
      "import * as stylex from '@stylexjs/stylex';",
      "import {spacingVars} from '../theme/tokens.stylex';",
      "const SP4 = spacingVars['--spacing-4'];",
      'const cardShorthand = `var(--astryx-card-padding, ${SP4})`;',
      'const cardInline = `var(--astryx-card-padding-inline, ${cardShorthand})`;',
      'const styles = stylex.create({',
      '  base: {',
      '    paddingInline: cardInline,',
      '  },',
      '});',
    ].join('\n');

    const result = analyzeSource(source, 'Layout/container.stylex.ts');

    // ownerVar carries the public custom property the value flows through, so
    // the declaration can be credited to Card rather than to the Layout
    // directory that happens to host the chain.
    expect(result.local).toEqual([
      {
        token: '--spacing-4',
        property: 'paddingInline',
        scale: false,
        ownerVar: 'card-padding-inline',
      },
    ]);
  });

  it('separates exported style objects from module-local ones', () => {
    const source = [
      "import * as stylex from '@stylexjs/stylex';",
      "import {spacingVars} from '../theme/tokens.stylex';",
      'export const inputWrapperStyles = stylex.create({',
      "  base: {paddingBlock: spacingVars['--spacing-1']},",
      '});',
      'const privateStyles = stylex.create({',
      "  base: {gap: spacingVars['--spacing-6']},",
      '});',
    ].join('\n');

    const result = analyzeSource(source, 'Field/inputStyles.stylex.ts');

    expect(result.exports.get('inputWrapperStyles')).toEqual([
      {token: '--spacing-1', property: 'paddingBlock', scale: false},
    ]);
    expect(result.local).toEqual([
      {token: '--spacing-6', property: 'gap', scale: false},
    ]);
  });

  it('collects named imports and barrel re-exports by source module', () => {
    const source = [
      "import {inputWrapperStyles} from '../Field';",
      "import {container} from '../Layout/container.stylex';",
      "export {inputWrapperStyles} from './inputStyles.stylex';",
    ].join('\n');

    const result = analyzeSource(source, 'TextInput/TextInput.tsx');

    expect(result.imports).toEqual([
      {from: '../Field', names: ['inputWrapperStyles']},
      {from: '../Layout/container.stylex', names: ['container']},
    ]);
    expect(result.reexports).toEqual([
      {from: './inputStyles.stylex', names: ['inputWrapperStyles']},
    ]);
  });

  it('ignores type-only imports', () => {
    const source = [
      "import type {SpacingToken} from '../Layout/container.stylex';",
      "import {type SpacingStep, container} from '../Layout/container.stylex';",
    ].join('\n');

    const result = analyzeSource(source, 'Card/Card.tsx');

    expect(result.imports).toEqual([
      {from: '../Layout/container.stylex', names: ['container']},
    ]);
  });
});

describe('summarizeSpacingUsage', () => {
  it('lists the first few components and counts the rest', () => {
    const result = summarizeSpacingUsage({
      components: ['Badge', 'Banner', 'Button', 'Chat', 'Item'],
      viaProps: [],
    });

    expect(result?.summary).toBe('Badge, Banner, Button +2 more');
    expect(result?.detail).toBe(
      'Moves 5 components by default: Badge, Banner, Button, Chat, Item.',
    );
  });

  it('omits the counter when everything fits', () => {
    const result = summarizeSpacingUsage({
      components: ['Badge', 'Button'],
      viaProps: [],
    });

    expect(result?.summary).toBe('Badge, Button');
  });

  it('says so when a token has no default usage at all', () => {
    // --spacing-9 and --spacing-10 are reachable only through a numeric
    // spacing prop. Reporting "no components" would be wrong; merging them
    // into one count would be misleading.
    const result = summarizeSpacingUsage({
      components: [],
      viaProps: ['Grid', 'Stack'],
    });

    expect(result?.summary).toBe('Only via spacing props');
    expect(result?.detail).toContain('No component uses this step by default');
    expect(result?.detail).toContain('Grid, Stack');
  });

  it('keeps prop-driven components out of the default count', () => {
    const result = summarizeSpacingUsage({
      components: ['Button'],
      viaProps: ['Grid', 'Stack'],
    });

    expect(result?.detail).toContain('Moves 1 component by default: Button.');
    expect(result?.detail).toContain(
      'Reachable on 2 more components when a spacing prop selects it: Grid, Stack.',
    );
  });

  it('renders nothing for a token with no mapping', () => {
    // SpacingEditor also serves the size group, whose tokens are unmapped.
    expect(summarizeSpacingUsage(undefined)).toBeNull();
    expect(summarizeSpacingUsage({components: [], viaProps: []})).toBeNull();
  });
});

describe('deriveSpacingUsage (against packages/core source)', () => {
  const usage = deriveSpacingUsage(CORE_SRC_DIR);

  it('covers every spacing rung defined in the theme', () => {
    expect(Object.keys(usage)).toContain('--spacing-0');
    expect(Object.keys(usage)).toContain('--spacing-4');
    expect(Object.keys(usage)).toContain('--spacing-12');
  });

  it('lists Button as a default consumer of its own padding tokens', () => {
    expect(usage['--spacing-2'].components).toContain('Button');
    expect(usage['--spacing-3'].components).toContain('Button');
  });

  it('classifies Stack gap as prop-driven, not a default consumer', () => {
    expect(usage['--spacing-2'].viaProps).toContain('Stack');
    expect(usage['--spacing-2'].components).not.toContain('Stack');
  });

  it('attributes Card default padding to --spacing-4 through the var() chain', () => {
    expect(usage['--spacing-4'].components).toContain('Card');
  });

  it('attributes shared input styles to the components that apply them', () => {
    // inputWrapperStyles is declared in Field/ but re-exported through the
    // Field barrel and applied by five separate input components.
    expect(usage['--spacing-1'].components).toContain('TextInput');
    expect(usage['--spacing-2'].components).toContain('TextInput');
    expect(usage['--spacing-1'].components).toContain('Tokenizer');
  });

  it('does not report Layout as a default consumer of every rung', () => {
    // Layout enumerates the whole scale for its numeric padding prop; that is
    // reach, not default usage. Without the scale filter it would appear under
    // all 15 rungs and the annotation would be noise.
    const defaultRungs = Object.keys(usage).filter(token =>
      usage[token].components.includes('Layout'),
    );
    expect(defaultRungs.length).toBeLessThan(15);
    expect(usage['--spacing-9'].components).not.toContain('Layout');
  });

  it('never reports a component that does not exist', () => {
    // The issue's proposed table credits a "Container" component for spacing-3
    // and spacing-4 padding. No such component exists — Container is an
    // internal StyleX util plus an anatomy label in Card.doc.mjs.
    const named = new Set(
      Object.values(usage).flatMap(entry => [
        ...entry.components,
        ...entry.viaProps,
      ]),
    );
    expect(named.has('Container')).toBe(false);
  });

  it("pins Field's own gap to --spacing-1, not --spacing-2", () => {
    // The issue's table lists "Field gap" under both --spacing-1 and
    // --spacing-2. Field.tsx uses --spacing-1; the --spacing-2 gap belongs to
    // the input wrapper, a different element.
    expect(usage['--spacing-1'].components).toContain('Field');

    // And credit follows what a component *applies*, not what its directory
    // happens to contain: inputWrapperStyles is declared in Field/ but applied
    // by the five input components, so they carry its --spacing-2 and Field
    // does not.
    for (const name of [
      'TextInput',
      'Selector',
      'Tokenizer',
      'Typeahead',
      'TimeInput',
    ]) {
      expect(usage['--spacing-2'].components, name).toContain(name);
    }
    expect(usage['--spacing-2'].components).not.toContain('Field');
  });

  it('pins Section default padding to --spacing-4, not --spacing-6', () => {
    // The issue's table claims --spacing-6 drives "Section spacing". Section's
    // padding chain terminates at --spacing-4.
    expect(usage['--spacing-4'].components).toContain('Section');
    expect(usage['--spacing-6'].components).not.toContain('Section');
  });

  it('returns component lists that are sorted and free of duplicates', () => {
    for (const [token, entry] of Object.entries(usage)) {
      expect(entry.components, token).toEqual([...new Set(entry.components)]);
      expect(entry.components, token).toEqual([...entry.components].sort());
      expect(entry.viaProps, token).toEqual([...entry.viaProps].sort());
    }
  });

  it('never lists a component as both a default and a prop-driven consumer', () => {
    // A component whose fixed styles already use the token is moved by any
    // change to it; reporting it a second time as conditional is misleading.
    for (const [token, entry] of Object.entries(usage)) {
      const overlap = entry.viaProps.filter(name =>
        entry.components.includes(name),
      );
      expect(overlap, token).toEqual([]);
    }
  });
});
