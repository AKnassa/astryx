// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file home-hero-overscroll.test.ts
 * @input globals.css, the home hero sources and core's AppShell/LayoutContent,
 *   read as text
 * @output Invariants that keep native overscroll alive on every docsite route
 * @position Regression guard for #5392 / #5470 (the hero's pin containment)
 *
 * `overscroll-behavior-y: none` on the root element is how you turn off
 * pull-to-refresh (mobile) and the trackpad rubber-band (macOS). The docsite
 * carried it app-wide (#3032), then desktop-only (#5415), to hide the home
 * hero's `position: fixed` layers from the strip an overscroll opens past the
 * end of the page. The layers are bounded now, so the rule is gone (#5470).
 *
 * The docsite suite is node-only with StyleX untransformed, so these are
 * source invariants (the idiom of component-preview-theme.test.ts): read the
 * files as text and assert on the declarations that would let the bleed —
 * and therefore the rule — come back.
 *
 * Run: pnpm -F @astryxdesign/docsite test src/__tests__/home-hero-overscroll.test.ts
 */

import {describe, it, expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, '..', 'app');
const SITE = path.join(APP, '(site)');
const HERO = path.join(SITE, '_landing', 'hero');
const CORE = path.join(HERE, '..', '..', '..', '..', 'packages', 'core', 'src');

function read(file: string): string {
  const source = fs.readFileSync(file, 'utf8');
  // Anti-vacuity: a moved or emptied file must fail loudly, not pass silently.
  expect(source.length, `${file} is empty`).toBeGreaterThan(200);
  return source;
}

/** Drop comments so prose about `fixed` or `none` can't match. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[^]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/([,;{}])\s*\/\/.*$/gm, '$1');
}

/** The brace-balanced `{...}` starting at `open` (which must be a `{`). */
function balanced(source: string, open: number): string {
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') {
      depth++;
    } else if (source[i] === '}' && --depth === 0) {
      return source.slice(open, i + 1);
    }
  }
  throw new Error(`unbalanced braces at ${open}`);
}

/** The `{...}` body of one top-level `stylex.create` entry, e.g. `backdropGlow`. */
function styleBlock(source: string, name: string): string {
  const match = new RegExp(`^  ${name}: \\{`, 'm').exec(source);
  expect(match, `no \`${name}\` style entry in the source`).not.toBeNull();
  return balanced(source, match!.index + match![0].length - 1);
}

/**
 * The raw text of one property's value inside a style block: the scalar up to
 * its trailing comma, or the whole brace-balanced conditional object. Asserting
 * on this text is independent of key syntax (`default`, a quoted media query,
 * or a computed `[BREAKPOINT]` key) and of line layout.
 */
function valueText(block: string, property: string): string {
  const match = new RegExp(`\\n\\s*${property}: `).exec(block);
  expect(match, `no \`${property}\` declaration in the block`).not.toBeNull();
  const start = match!.index + match![0].length;
  if (block[start] === '{') {
    return balanced(block, start);
  }
  const end = block.indexOf('\n', start);
  return block.slice(start, end).replace(/,\s*$/, '').trim();
}

/**
 * Every value a property takes — the scalar, or each arm of its conditional
 * object — unquoted. Parsing is strict: an arm this helper cannot read fails
 * the test rather than vanishing from the result.
 */
function allValues(block: string, property: string): string[] {
  const text = valueText(block, property);
  const unquote = (v: string) => v.trim().replace(/^(['"])(.*)\1$/, '$2');
  if (!text.startsWith('{')) {
    return [unquote(text)];
  }
  const inner = text.slice(1, -1);
  // One arm per line as prettier writes them, or top-level commas when the
  // whole object fits on one line.
  const arms = (
    inner.includes('\n')
      ? inner.split('\n')
      : inner.split(/,\s*(?=default\b|['"[])/)
  )
    .map(l => l.trim().replace(/,$/, ''))
    .filter(l => l.length > 0);
  expect(arms.length, `no arms in \`${property}\``).toBeGreaterThan(0);
  return arms.map(arm => {
    const parsed = /^(?:default|'[^']*'|"[^"]*"|\[[^\]]+\])\s*:\s*(.+)$/.exec(
      arm,
    );
    expect(parsed, `unreadable arm in \`${property}\`: ${arm}`).not.toBeNull();
    return unquote(parsed![1]);
  });
}

describe('docsite globals.css never suppresses overscroll (#5392, #5470)', () => {
  it('has no overscroll-behavior declaration other than auto, at any width', () => {
    const css = stripComments(read(path.join(APP, 'globals.css')));
    const offenders: string[] = [];
    for (const match of css.matchAll(
      /overscroll-behavior(?:-x|-y|-block|-inline)?\s*:\s*([^;}]+)/gi,
    )) {
      const value = match[1].trim();
      if (value !== 'auto') {
        // Name the enclosing at-rule so a re-scoped rule is still reported.
        const before = css.slice(0, match.index);
        const atRule = /@media[^{]*\{(?:[^{}]|\{[^{}]*\})*$/.exec(before)?.[0];
        offenders.push(
          `${atRule ? atRule.split('{')[0].trim() + ' > ' : ''}overscroll-behavior: ${value}`,
        );
      }
    }
    expect(offenders).toEqual([]);
  });
});

/**
 * A `fixed` layer is glued to the viewport and is not part of the document,
 * so when the document rubber-bands past its own edge the layer sits in the
 * exposed gap. A `sticky` layer lifts with the document and cannot paint past
 * its containing block — that is structural, which is what let the root rule
 * be deleted rather than narrowed. None of the hero's pinned layers may go
 * back to `fixed` in any media arm.
 *
 * `navBackdrop` is deliberately not listed: it is a header-height strip at
 * the very top of the viewport and never reaches the bottom gap.
 */
describe('home hero pinned layers are never position: fixed (#5470)', () => {
  const layers: ReadonlyArray<[string, string, string]> = [
    ['hero text block', path.join(SITE, 'page.tsx'), 'heroContent'],
    ['aurora glow', path.join(HERO, 'HeroThemeReel.tsx'), 'backdropGlow'],
    ['floating cards stage', path.join(HERO, 'HeroFloatingCards.tsx'), 'stage'],
  ];

  for (const [label, file, style] of layers) {
    it(`${label} (${style})`, () => {
      const block = styleBlock(stripComments(read(file)), style);
      // Raw text first: catches `fixed` under any key syntax or line layout.
      expect(valueText(block, 'position')).not.toMatch(/['"]fixed['"]/);
      // Then the parsed arms, which must all be readable.
      const positions = allValues(block, 'position');
      expect(positions.length).toBeGreaterThan(0);
      expect(positions).not.toContain('fixed');
    });
  }
});

/**
 * Sticky is bounded by its containing block, so each pinned layer rides in a
 * full-height rail that spans the hero band AND the showcase (a rail inside
 * the 760px band alone releases the hero after 48px of scroll). The rails are
 * absolute against heroScope, and every hero layer ties at z-index 0/auto, so
 * tree order is paint order: the rails must come before the showcase overlay
 * or the showcase stops covering them.
 */
describe('home hero rails are bounded by heroScope and precede the showcase (#5470)', () => {
  const page = () => stripComments(read(path.join(SITE, 'page.tsx')));
  const reel = () => stripComments(read(path.join(HERO, 'HeroThemeReel.tsx')));

  it('heroScope is the positioned ancestor and the rails fill it', () => {
    expect(allValues(styleBlock(page(), 'heroScope'), 'position')).toEqual([
      'relative',
    ]);
    const rail = styleBlock(reel(), 'rail');
    expect(allValues(rail, 'position')).toEqual(['absolute']);
    expect(allValues(rail, 'inset')).toEqual(['0']);
    const contentRail = styleBlock(page(), 'heroContentRail');
    expect(allValues(contentRail, 'position')).toContain('absolute');
    expect(allValues(contentRail, 'inset')).toContain('0');
  });

  it('sizes the pinned boxes against the rail, never the viewport', () => {
    // 100vw includes a classic scrollbar, so it can exceed the rail's width;
    // an over-wide block zeroes its auto margins and shoves the box left.
    expect(
      valueText(styleBlock(reel(), 'backdropGlow'), 'width'),
    ).not.toContain('100vw');
    const cards = stripComments(read(path.join(HERO, 'HeroFloatingCards.tsx')));
    expect(valueText(styleBlock(cards, 'stage'), 'width')).not.toContain(
      '100vw',
    );
  });

  it('renders the backdrop, cards and hero-text rails inside heroScope, before showcaseOverlay', () => {
    const source = page();
    const jsx = source.slice(
      source.indexOf('export default function HomePage'),
    );
    expect(jsx.length).toBeGreaterThan(200);
    const at = (needle: string) => {
      const index = jsx.indexOf(needle);
      expect(index, `\`${needle}\` not rendered by HomePage`).toBeGreaterThan(
        -1,
      );
      return index;
    };
    const scope = at('styles.heroScope');
    const showcase = at('styles.showcaseOverlay');
    const backdrop = at('<HeroReelBackdrop');
    const cards = at('<HeroReelCards');
    const text = at('<HeroContent');
    // Inside heroScope: after its opening tag, before the showcase it also holds.
    expect(scope).toBeLessThan(backdrop);
    expect(backdrop).toBeLessThan(cards);
    expect(cards).toBeLessThan(text);
    expect(text).toBeLessThan(showcase);
    // The showcase is heroScope's last child: no hero piece may render after it.
    expect(jsx.slice(showcase)).not.toMatch(/<Hero/);
  });
});

/**
 * `sticky` also breaks — silently, with no error — if any ancestor becomes a
 * scroll container. AppShell's main area (`#astryx-app-shell-main`, rendered
 * by LayoutContent) is `overflow: clip` in auto-height layouts: clip creates
 * no scroll container, so the hero keeps pinning. LayoutContent switches to
 * `overflow: auto` only through `isScrollable`, which AppShell wires to fill
 * mode, and the landing layout asks for `height="auto"`. Any of those three
 * links flipping would un-pin the entire landing page.
 */
describe('AppShell content area stays a non-scroll container for sticky', () => {
  it('LayoutContent.styles.content uses overflow: clip and no per-axis longhand', () => {
    const source = stripComments(
      read(path.join(CORE, 'Layout', 'LayoutContent.tsx')),
    );
    const content = styleBlock(source, 'content');
    expect(allValues(content, 'overflow')).toEqual(['clip']);
    expect(content).not.toMatch(/\n\s*overflow(?:X|Y|Block|Inline)\s*:/);
    // The scroll container is opt-in, via a separate style.
    expect(allValues(styleBlock(source, 'scrollable'), 'overflow')).toEqual([
      'auto',
    ]);
  });

  it('AppShell only makes the main area scrollable in fill mode', () => {
    const source = stripComments(
      read(path.join(CORE, 'AppShell', 'AppShell.tsx')),
    );
    expect(source).toMatch(/const isFill = height === 'fill'/);
    const main = source.indexOf('id={MAIN_CONTENT_ID}');
    expect(main, 'main LayoutContent not found').toBeGreaterThan(-1);
    const openingTag = source.slice(source.lastIndexOf('<LayoutContent', main));
    expect(openingTag.slice(0, openingTag.indexOf('>'))).toMatch(
      /isScrollable=\{isFill\}/,
    );
  });

  it('the landing layout renders AppShell in auto height', () => {
    const source = stripComments(read(path.join(SITE, 'layout.tsx')));
    expect(source).toMatch(/<AppShell[^>]*\sheight="auto"/);
  });
});
