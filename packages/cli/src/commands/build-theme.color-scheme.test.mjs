// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file Regression test for the color-scheme output of `astryx theme build`.
 *
 * Themes that use light-dark() need `color-scheme` declared in the built CSS
 * bundle so CSS tooling (e.g. LightningCSS's light-dark() polyfill) can
 * initialize its toggle variables. That declaration lives in
 * `@layer astryx-theme`, which layers ABOVE `reset` — so a bare
 * `:root { color-scheme: light dark; }` silently overrides reset.css's
 * zero-specificity `:where(html[data-theme])` mapping and breaks forced
 * `<Theme mode="light|dark">` at the document root (#3658).
 *
 * Covers:
 *   - the bare :root declaration still ships (tooling compatibility);
 *   - html[data-theme="light"|"dark"] overrides ship alongside it, with real
 *     specificity (NOT :where()-wrapped) so they beat :root in the same layer;
 *   - all three live in @layer astryx-theme;
 *   - themes without light-dark() emit no color-scheme at all.
 *
 * Like build-theme.prose.test.mjs, this suite builds @astryxdesign/core once in
 * beforeAll so it is self-sufficient regardless of CI job ordering.
 */

import {describe, it, expect, beforeAll, beforeEach, afterEach} from 'vitest';
import {execFileSync} from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_BIN = path.resolve(__dirname, '../../bin/astryx.mjs');
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const CORE_THEME_ENTRY = path.join(
  REPO_ROOT,
  'packages/core/dist/theme/index.js',
);

function runCli(args, cwd) {
  try {
    const out = execFileSync('node', [CLI_BIN, ...args], {
      cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {...process.env, FORCE_COLOR: '0'},
    });
    return {code: 0, stdout: out, stderr: ''};
  } catch (e) {
    return {
      code: e.status ?? 1,
      stdout: e.stdout?.toString() ?? '',
      stderr: e.stderr?.toString() ?? '',
    };
  }
}

function writeTheme(dir, name, themeFields) {
  fs.mkdirSync(dir, {recursive: true});
  // The CLI writes <basename>.css next to the source file, so use the
  // theme name as the filename for unambiguous fixtures.
  const file = path.join(dir, `${name}.mjs`);
  fs.writeFileSync(
    file,
    `export default { name: ${JSON.stringify(name)}, ${Object.entries(
      themeFields,
    )
      .map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`)
      .join(', ')} };\n`,
  );
  return file;
}

function buildTheme(tmpDir, name, themeFields) {
  const project = path.join(tmpDir, 'project');
  const themesDir = path.join(project, 'themes');
  const themeFile = writeTheme(themesDir, name, themeFields);

  const result = runCli(
    ['theme', 'build', path.relative(project, themeFile)],
    project,
  );
  expect(result.code).toBe(0);

  const cssPath = path.join(themesDir, `${name}.css`);
  expect(fs.existsSync(cssPath)).toBe(true);
  return fs.readFileSync(cssPath, 'utf-8');
}

// `astryx theme build` imports the compiled @astryxdesign/core/theme entry. Build core
// once if it isn't already present so the suite works in any CI job.
beforeAll(() => {
  if (!fs.existsSync(CORE_THEME_ENTRY)) {
    execFileSync('pnpm', ['-F', '@astryxdesign/core', 'build'], {
      cwd: REPO_ROOT,
      stdio: 'pipe',
      timeout: 180_000,
    });
  }
}, 200_000);

let tmpDir;
beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'astryx-build-theme-cs-'));
});
afterEach(() => {
  fs.rmSync(tmpDir, {recursive: true, force: true});
});

describe('theme build color-scheme output', () => {
  it('emits mode-aware color-scheme rules for light-dark() themes', () => {
    const css = buildTheme(tmpDir, 'with-ld', {
      tokens: {'--color-bg': 'light-dark(#fff, #000)'},
    });

    // Bare :root stays for tooling (LightningCSS light-dark() polyfill).
    expect(css).toMatch(/:root\s*\{\s*color-scheme:\s*light dark;\s*\}/);

    // Forced-mode overrides mirror reset.css's html[data-theme] mapping so
    // <Theme mode="light|dark"> wins at the root despite astryx-theme
    // layering above reset (#3658).
    expect(css).toMatch(
      /html\[data-theme="light"\]\s*\{\s*color-scheme:\s*light;\s*\}/,
    );
    expect(css).toMatch(
      /html\[data-theme="dark"\]\s*\{\s*color-scheme:\s*dark;\s*\}/,
    );

    // They must NOT be :where()-wrapped — zero specificity would lose to
    // :root (0,1,0) within the same layer, reintroducing the bug.
    expect(css).not.toMatch(/:where\(html\[data-theme/);

    // All color-scheme rules live inside @layer astryx-theme (after its
    // opening brace, before any other top-level @layer that follows).
    const layerIndex = css.indexOf('@layer astryx-theme');
    expect(layerIndex).toBeGreaterThanOrEqual(0);
    expect(css.indexOf(':root { color-scheme:')).toBeGreaterThan(layerIndex);
    expect(css.indexOf('html[data-theme="light"]')).toBeGreaterThan(
      layerIndex,
    );
  });

  it('detects light-dark() that only appears in on-media rules', () => {
    // Mirrors what jiti hands the CLI for a defineTheme() file using
    // onDark: a resolved theme carrying __onDark. [light, dark] tuple
    // tokens compile to light-dark() in the on-media block ONLY — the
    // component scope has none, so scanning it alone misses this theme.
    const css = buildTheme(tmpDir, 'onmedia-ld', {
      tokens: {'--color-bg': '#fff'},
      __onDark: {tokens: {'--color-accent': 'light-dark(#036, #9cf)'}},
    });

    expect(css).toMatch(/:root\s*\{\s*color-scheme:\s*light dark;\s*\}/);
    expect(css).toMatch(
      /html\[data-theme="dark"\]\s*\{\s*color-scheme:\s*dark;\s*\}/,
    );
  });

  it('merges component and on-media rules into one @layer astryx-theme block', () => {
    // Runtime parity: generateThemeCSS injects component + on-media rules
    // as a single astryx-theme chunk, so the build must emit one block too.
    const css = buildTheme(tmpDir, 'merged', {
      tokens: {'--color-bg': 'light-dark(#fff, #000)'},
      __onDark: {tokens: {'--color-accent': '#9cf'}},
    });

    const occurrences = css.split('@layer astryx-theme').length - 1;
    expect(occurrences).toBe(1);
    // On-media rules land inside that single block, after the component scope.
    expect(css.indexOf('[data-astryx-media="dark"]')).toBeGreaterThan(
      css.indexOf('@layer astryx-theme'),
    );
  });

  it('emits no root color-scheme rules for themes without light-dark()', () => {
    const css = buildTheme(tmpDir, 'no-ld', {tokens: {'--color-bg': '#fff'}});
    // No forced-mode mapping and no bare :root declaration. (Scoped
    // [data-astryx-media] rules may legitimately set color-scheme for
    // on-media surfaces — that mapping is unrelated to the root one.)
    expect(css).not.toContain(':root { color-scheme:');
    expect(css).not.toContain('html[data-theme');
  });
});
