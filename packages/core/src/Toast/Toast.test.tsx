// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file Toast.test.tsx
 * @input Uses vitest, @testing-library/react, Toast, ToastViewport, useToast,
 *   Theme, defineTheme
 * @output Unit tests for the Toast card itself. Today: the `themeMode`
 *   theming state it reflects (#5503) — what it reflects, that it is
 *   independent of the card's media surface, that `defineTheme` can target
 *   it, and that the card reflects nothing but closed-vocabulary values
 * @position Testing; the component's own suite. ToastViewport.test.tsx holds
 *   layout, timers, focus and announcements; useToast.test.tsx holds the
 *   fallback viewport.
 *
 * SYNC: When Toast.tsx's `themeProps('toast', …)` reflection changes, update
 *   these tests and Toast.doc.mjs `theming.targets`.
 */

import {describe, it, expect, vi, afterEach} from 'vitest';
import {
  cleanup,
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import {Toast} from './Toast';
import {ToastViewport} from './ToastViewport';
import {useToast} from './useToast';
import {Theme} from '../theme/Theme';
import {defineTheme, generateThemeCSS} from '../theme/defineTheme';
import {Button} from '../Button';

const testTheme = defineTheme({name: 'toast-theme-mode', tokens: {}});

/**
 * jsdom has no `matchMedia`; `useTheme` resolves `mode="system"` through it.
 * Same shape as useToast.test.tsx so the two Toast suites agree on how the OS
 * preference is faked.
 */
function mockMatchMedia(prefersDark: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('dark') ? prefersDark : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function InlineToast({
  type = 'info',
  body = 'Saved',
  endContent,
}: {
  type?: 'info' | 'error';
  body?: string;
  endContent?: React.ReactNode;
}) {
  return (
    <Toast
      type={type}
      body={body}
      endContent={endContent}
      isAutoHide={false}
      autoHideDuration={5000}
      onDismiss={() => {}}
    />
  );
}

/** The card — the element carrying `astryx-toast`, found the way the other Toast suites find it. */
function card(body = 'Saved'): HTMLElement {
  const el = screen.getByText(body).closest('[data-type]');
  if (!(el instanceof HTMLElement)) {
    throw new Error(`no toast card around "${body}"`);
  }
  return el;
}

afterEach(() => {
  cleanup();
  mockMatchMedia(false);
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-astryx-theme');
});

describe('Toast reflects the Theme mode as a theming state (#5503)', () => {
  it.each(['light', 'dark'] as const)(
    'reflects mode="%s" as data-theme-mode and a state class on the card',
    mode => {
      render(
        <Theme theme={testTheme} mode={mode}>
          <InlineToast />
        </Theme>,
      );

      const el = card();
      expect(el).toHaveClass('astryx-toast');
      expect(el).toHaveAttribute('data-theme-mode', mode);
      expect(el).toHaveClass(mode);
      expect(el).not.toHaveClass(mode === 'light' ? 'dark' : 'light');
    },
  );

  it('resolves mode="system" to the OS preference — never "system"', () => {
    mockMatchMedia(true);
    render(
      <Theme theme={testTheme} mode="system">
        <InlineToast />
      </Theme>,
    );
    expect(card()).toHaveAttribute('data-theme-mode', 'dark');
  });

  it('reflects the nearest Theme, which is the one whose scoped CSS reaches the card', () => {
    const inner = defineTheme({name: 'toast-theme-mode-inner', tokens: {}});
    render(
      <Theme theme={testTheme} mode="light">
        <Theme theme={inner} mode="dark">
          <InlineToast />
        </Theme>
      </Theme>,
    );
    expect(card()).toHaveAttribute('data-theme-mode', 'dark');
  });

  it('follows the Theme mode live when it changes', () => {
    const {rerender} = render(
      <Theme theme={testTheme} mode="light">
        <InlineToast />
      </Theme>,
    );
    expect(card()).toHaveAttribute('data-theme-mode', 'light');

    rerender(
      <Theme theme={testTheme} mode="dark">
        <InlineToast />
      </Theme>,
    );
    expect(card()).toHaveAttribute('data-theme-mode', 'dark');
    expect(card()).toHaveClass('dark');
    expect(card()).not.toHaveClass('light');
  });

  it('keeps the theme mode separate from the media fallback the card renders before measurement', () => {
    // The issue's scenario: an error toast paints an inverted error surface
    // that is dark in BOTH app modes, so nothing inside the card said which
    // app mode it was in. jsdom cannot measure a painted surface, so
    // `mode="auto"` renders its pre-measurement fallback — dark for an error
    // toast in every mode. In a browser the dark-app card measures to `off`
    // (no media attribute at all), which carries no app-mode information
    // either; the reflection is the one thing that differs between the two.
    for (const mode of ['light', 'dark'] as const) {
      const {unmount} = render(
        <Theme theme={testTheme} mode={mode}>
          <InlineToast type="error" body={`Failed in ${mode}`} />
        </Theme>,
      );
      const el = card(`Failed in ${mode}`);
      const media = el.querySelector('[data-astryx-media]');
      expect(media).toHaveAttribute('data-astryx-media', 'dark');
      expect(el).toHaveAttribute('data-theme-mode', mode);
      unmount();
    }
  });

  it('without a Theme ancestor, reads the mode the root Theme synced to <html data-theme>', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    render(<InlineToast />);
    expect(card()).toHaveAttribute('data-theme-mode', 'dark');
  });

  it('without a Theme ancestor or <html data-theme>, falls back to the OS preference', () => {
    mockMatchMedia(true);
    render(<InlineToast />);
    expect(card()).toHaveAttribute('data-theme-mode', 'dark');
  });

  it('reflects the Theme a viewport-rendered toast is nested under, not only an inline one', async () => {
    function Trigger() {
      const toast = useToast();
      return (
        <button
          type="button"
          onClick={() => toast({body: 'From viewport', isAutoHide: false})}>
          Fire
        </button>
      );
    }
    // Dark only under the inner Theme: a card reading the root Theme, or
    // <html data-theme>, would say light.
    const inner = defineTheme({name: 'toast-theme-mode-viewport', tokens: {}});
    render(
      <Theme theme={testTheme} mode="light">
        <Theme theme={inner} mode="dark">
          <ToastViewport>
            <Trigger />
          </ToastViewport>
        </Theme>
      </Theme>,
    );
    act(() => {
      fireEvent.click(screen.getByText('Fire'));
    });
    await waitFor(() => {
      expect(card('From viewport')).toHaveAttribute('data-theme-mode', 'dark');
    });
  });
});

describe('the reflected state is a defineTheme target (#5503)', () => {
  it('compiles toast["themeMode:*"] — alone and compounded with type — to the classes the card renders', () => {
    const theme = defineTheme({
      name: 'toast-theme-mode-target',
      tokens: {},
      components: {
        toast: {
          'themeMode:dark': {backgroundColor: '#111'},
          'type:error+themeMode:light': {borderColor: 'red'},
        },
      },
    });

    const {component} = generateThemeCSS(theme);
    expect(component).toContain('.astryx-toast.dark {');
    expect(component).toContain('.astryx-toast.error.light {');

    render(
      <Theme theme={theme} mode="light">
        <InlineToast type="error" body="Failed" />
      </Theme>,
    );
    expect(card('Failed')).toHaveClass('astryx-toast', 'error', 'light');
  });

  it('carries a theme-owned custom property through the mode rule for a Button rule to read', () => {
    // The documented way to reach an action in endContent: the toast rule
    // sets a property the theme owns, and the theme's Button rule reads it
    // behind the variant's own background. Both halves must survive the
    // generator unchanged.
    const theme = defineTheme({
      name: 'toast-theme-mode-recipe',
      tokens: {},
      components: {
        toast: {
          'themeMode:light': {
            '--demo-toast-action-bg': 'rgb(255 255 255 / 0.16)',
          },
          'themeMode:dark': {'--demo-toast-action-bg': 'transparent'},
        },
        button: {
          'variant:secondary': {
            backgroundColor:
              'var(--demo-toast-action-bg, var(--color-neutral))',
          },
        },
      },
    });

    const {component} = generateThemeCSS(theme);
    expect(component).toContain(
      '.astryx-toast.light {\n    --demo-toast-action-bg: rgb(255 255 255 / 0.16);',
    );
    expect(component).toContain(
      '.astryx-toast.dark {\n    --demo-toast-action-bg: transparent;',
    );
    expect(component).toContain(
      '.astryx-button.secondary {\n    background-color: var(--demo-toast-action-bg, var(--color-neutral));',
    );
  });
});

describe('data minimization: the card reflects closed vocabularies only (#5503)', () => {
  const body = 'SECRET-BODY-4f8a';
  const label = 'Undo LABEL-9c1';
  const href = 'https://example.com/private?token=abc123';

  it.each(['light', 'dark'] as const)(
    'in mode="%s": only data-type and data-theme-mode, with bounded values, and no content, labels, hrefs or children',
    mode => {
      render(
        <Theme theme={testTheme} mode={mode}>
          <InlineToast
            body={body}
            endContent={
              <>
                <Button label={label} variant="secondary" size="sm" />
                <a href={href} data-user-id="u-42">
                  Details
                </a>
              </>
            }
          />
        </Theme>,
      );

      const el = card(body);
      const dataAttrs = Array.from(el.attributes)
        .filter(a => a.name.startsWith('data-'))
        .map(a => [a.name, a.value] as const)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

      expect(dataAttrs).toEqual([
        ['data-theme-mode', mode],
        ['data-type', 'info'],
      ]);

      // Nothing the toast holds may surface on the card: not the body, not an
      // action's label, and — should a future reflection ever hoist child
      // attributes — not a child's href or identifiers either.
      const serialized = Array.from(el.attributes)
        .map(a => `${a.name}="${a.value}"`)
        .join(' ');
      expect(serialized).not.toContain(body);
      expect(serialized).not.toContain('LABEL-9c1');
      expect(serialized).not.toContain('token=abc123');
      expect(serialized).not.toContain('u-42');
    },
  );
});
