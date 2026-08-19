// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file RichTextEditorToolbar.test.tsx
 * @input Uses vitest, @testing-library/react, RichTextEditor +
 *   RichTextEditorToolbar
 * @output Edge-case unit tests for the toolbar: single-level headingLevels
 *   filtering, the endContent isRenderable divider guard, link-dialog
 *   whitespace-URL validation and error clearing, and RTL mirroring of
 *   theme-provided history glyphs
 * @position Testing; validates RichTextEditorToolbar.tsx (broader toolbar
 *   coverage lives in RichTextEditor.test.tsx)
 *
 * SYNC: When the toolbar changes, update these tests to match.
 */

import {describe, it, expect, beforeAll, afterAll} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as stylex from '@stylexjs/stylex';
import {defineTheme, Theme} from '@astryxdesign/core/theme';
import {rtlStyles} from '@astryxdesign/core/utils';
import {RichTextEditor} from './RichTextEditor';
import {
  RichTextEditorToolbar,
  type RichTextEditorToolbarProps,
} from './RichTextEditorToolbar';

// Closed popover-backed tooltips are intentionally hidden from the default
// accessibility tree until their trigger opens them.
const h = {hidden: true} as const;

const originalShowModal = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal',
);
const originalDialogClose = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close',
);

beforeAll(() => {
  // JSDOM does not implement the native dialog lifecycle used by Dialog.
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});

afterAll(() => {
  if (originalShowModal) {
    Object.defineProperty(
      HTMLDialogElement.prototype,
      'showModal',
      originalShowModal,
    );
  } else {
    delete (HTMLDialogElement.prototype as {showModal?: unknown}).showModal;
  }
  if (originalDialogClose) {
    Object.defineProperty(
      HTMLDialogElement.prototype,
      'close',
      originalDialogClose,
    );
  } else {
    delete (HTMLDialogElement.prototype as {close?: unknown}).close;
  }
});

/** Mounts the editor with a toolbar configured via `toolbarProps`. */
function renderEditorWithToolbar(
  toolbarProps: RichTextEditorToolbarProps = {},
) {
  return render(
    <RichTextEditor
      label="Notes"
      toolbar={<RichTextEditorToolbar {...toolbarProps} />}
    />,
  );
}

describe('RichTextEditorToolbar — headingLevels edge cases', () => {
  it('offers only the single configured heading level alongside the fixed formats', async () => {
    const user = userEvent.setup();
    renderEditorWithToolbar({headingLevels: ['h2']});
    await user.click(screen.getByRole('combobox', {name: 'Block format'}));

    for (const name of [
      'Paragraph',
      'Heading 2',
      'Bulleted list',
      'Numbered list',
      'Block quote',
    ]) {
      expect(screen.getByRole('option', {name, ...h})).toBeInTheDocument();
    }
    // Both omitted levels disappear — including h1, the first default entry.
    expect(
      screen.queryByRole('option', {name: 'Heading 1', ...h}),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('option', {name: 'Heading 3', ...h}),
    ).not.toBeInTheDocument();
  });
});

describe('RichTextEditorToolbar — endContent divider guard', () => {
  it('renders the end control together with a third group divider', () => {
    renderEditorWithToolbar({
      endContent: <button type="button" aria-label="Custom" />,
    });
    expect(screen.getByRole('button', {name: 'Custom'})).toBeInTheDocument();
    // The two labeled group separators plus the unlabeled endContent divider.
    expect(
      screen.getByRole('separator', {name: 'History and block formats'}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('separator', {name: 'Block and inline formats'}),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('separator')).toHaveLength(3);
  });

  it('renders neither the control nor the divider for endContent={false}', () => {
    // `false` is a valid ReactNode but not renderable content; the
    // isRenderable guard must suppress the divider too, not just the child.
    renderEditorWithToolbar({endContent: false});
    expect(
      screen.queryByRole('button', {name: 'Custom'}),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('separator')).toHaveLength(2);
  });
});

describe('RichTextEditorToolbar — link dialog validation edge cases', () => {
  const INVALID_URL_MESSAGE = 'Enter a valid http, https, mailto, or tel URL.';

  /** Opens the link dialog and returns the (auto-focused) URL input. */
  async function openLinkDialog(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', {name: 'Link'}));
    return screen.findByRole('textbox', {name: 'URL', ...h});
  }

  it('shows the invalid-URL error for a whitespace-only URL', async () => {
    const user = userEvent.setup();
    renderEditorWithToolbar();
    const urlInput = await openLinkDialog(user);

    // Whitespace trims to '' and sanitizeUrl('') yields about:blank — the
    // submit must be rejected with the visible error, not silently accepted.
    await user.clear(urlInput);
    await user.type(urlInput, '   ');
    await user.click(screen.getByRole('button', {name: 'Add link', ...h}));

    expect(await screen.findByText(INVALID_URL_MESSAGE)).toBeInTheDocument();
    // The dialog stays open so the URL can be corrected.
    expect(
      screen.getByRole('dialog', {name: 'Insert link', ...h}),
    ).toBeInTheDocument();
  });

  it('clears the invalid-URL error as soon as the URL is edited', async () => {
    const user = userEvent.setup();
    renderEditorWithToolbar();
    const urlInput = await openLinkDialog(user);

    await user.clear(urlInput);
    await user.type(urlInput, '   ');
    await user.click(screen.getByRole('button', {name: 'Add link', ...h}));
    expect(await screen.findByText(INVALID_URL_MESSAGE)).toBeInTheDocument();

    // Any edit invalidates the stale error immediately (before resubmit).
    await user.type(urlInput, 'x');
    expect(screen.queryByText(INVALID_URL_MESSAGE)).not.toBeInTheDocument();
  });
});

describe('RichTextEditorToolbar — themed history icons stay mirrored', () => {
  it('mirrors a theme-provided undo glyph in RTL', () => {
    const theme = defineTheme({
      name: 'toolbar-mirror-test',
      icons: {'richtext:undo': <span data-testid="themed-undo" />},
    });
    render(
      <Theme theme={theme}>
        <RichTextEditor label="Notes" toolbar={<RichTextEditorToolbar />} />
      </Theme>,
    );

    // The theme's glyph replaces the bundled default…
    const themedGlyph = screen.getByTestId('themed-undo');
    const undoButton = screen.getByRole('button', {name: 'Undo'});
    expect(undoButton).toContainElement(themedGlyph);

    // …and it must still sit inside the RTL mirroring wrapper: the wrapper is
    // the toolbar's responsibility, so swapping the icon cannot lose the flip.
    // rtlStyles.mirror is content-addressed, so carrying all of its atomic
    // classes proves the [dir="rtl"] transform applies.
    const mirrorClasses = (stylex.props(rtlStyles.mirror).className ?? '')
      .split(/\s+/)
      .filter(c => /^x[a-z0-9]+$/.test(c));
    expect(mirrorClasses.length).toBeGreaterThan(0);
    let ancestor = themedGlyph.parentElement;
    let mirrored = false;
    while (ancestor && ancestor !== undoButton.parentElement) {
      if (mirrorClasses.every(c => ancestor!.classList.contains(c))) {
        mirrored = true;
        break;
      }
      ancestor = ancestor.parentElement;
    }
    expect(
      mirrored,
      'themed undo glyph should sit inside an rtlStyles.mirror wrapper',
    ).toBe(true);
  });
});
