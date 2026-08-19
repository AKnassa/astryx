// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file RichTextView.test.tsx
 * @input Uses vitest, @testing-library/react, RichTextView
 * @output Unit tests for the read-only view's accessible name (including
 *   label changes after mount), keyboard reachability, className/xstyle
 *   merging on the root element, and the root ref in both render branches
 * @position Testing; validates RichTextView.tsx
 *
 * SYNC: When the view component changes, update these tests to match.
 */

import {describe, it, expect} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {createRef} from 'react';
import * as stylex from '@stylexjs/stylex';
import {RichTextView} from './RichTextView';

// A minimal valid serialized Lexical editor state containing a single
// paragraph with the given text.
function makeParagraphState(text: string): string {
  return JSON.stringify({
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text,
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  });
}

const HELLO_STATE = makeParagraphState('Hello world');

describe('RichTextView accessibility', () => {
  it('names the textbox via the label prop', async () => {
    render(<RichTextView value={HELLO_STATE} label="Meeting notes" />);
    await waitFor(() =>
      expect(screen.getByText('Hello world')).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('textbox', {name: 'Meeting notes'}),
    ).toBeInTheDocument();
  });

  it('announces the surface as read-only, never disabled', async () => {
    render(<RichTextView value={HELLO_STATE} label="Meeting notes" />);
    await waitFor(() =>
      expect(screen.getByText('Hello world')).toBeInTheDocument(),
    );
    const textbox = screen.getByRole('textbox');
    expect(textbox).toHaveAttribute('aria-readonly', 'true');
    expect(textbox).not.toHaveAttribute('aria-disabled');
    // Same content model as the editor surface: a multiline textbox.
    expect(textbox).toHaveAttribute('aria-multiline', 'true');
  });

  it('keeps the read-only surface keyboard reachable', async () => {
    render(<RichTextView value={HELLO_STATE} label="Meeting notes" />);
    await waitFor(() =>
      expect(screen.getByText('Hello world')).toBeInTheDocument(),
    );
    // A read-only textbox must stay in the tab order so keyboard and
    // screen-reader users can reach, read, and copy its content.
    expect(screen.getByRole('textbox')).toHaveAttribute('tabindex', '0');
  });
});

describe('RichTextView root element merging', () => {
  it('merges a consumer className with the view styling instead of clobbering it', async () => {
    const {container} = render(
      <RichTextView value={HELLO_STATE} className="consumer-class" />,
    );
    await waitFor(() =>
      expect(screen.getByText('Hello world')).toBeInTheDocument(),
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains('consumer-class')).toBe(true);
    // The view's own StyleX atomic classes must survive alongside the
    // consumer's class.
    expect([...root.classList].some(c => c.startsWith('x'))).toBe(true);
  });

  it('merges a consumer className in the error-fallback branch too', () => {
    render(
      <RichTextView
        value={'{ not valid json'}
        className="consumer-class"
        errorFallback={<div data-testid="view-fallback" />}
      />,
    );
    const root = screen.getByTestId('view-fallback')
      .parentElement as HTMLElement;
    expect(root.classList.contains('consumer-class')).toBe(true);
    expect([...root.classList].some(c => c.startsWith('x'))).toBe(true);
  });

  it('merges a consumer className, the view styling, and xstyle together', async () => {
    // StyleX class names are content-addressed: identical declarations compile
    // to identical atomic classes. Compiling a local declaration here and
    // asserting the root carries its exact classes proves the consumer's
    // xstyle survives alongside both the consumer className and the view's
    // own StyleX styling.
    const localStyles = stylex.create({
      custom: {
        minBlockSize: '3rem',
      },
    });
    // Only atomic classes are content-addressed across files; drop the
    // human-readable debug name.
    const customClasses = (stylex.props(localStyles.custom).className ?? '')
      .split(/\s+/)
      .filter(c => /^x[a-z0-9]+$/.test(c));
    expect(customClasses.length).toBeGreaterThan(0);

    const {container} = render(
      <RichTextView
        value={HELLO_STATE}
        className="consumer-class"
        xstyle={localStyles.custom}
      />,
    );
    await waitFor(() =>
      expect(screen.getByText('Hello world')).toBeInTheDocument(),
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains('consumer-class')).toBe(true);
    for (const cls of customClasses) {
      expect([...root.classList]).toContain(cls);
    }
    // The view's own StyleX classes must survive too — xstyle extends the
    // root styling, it does not replace it.
    expect(
      [...root.classList].some(
        c => c.startsWith('x') && !customClasses.includes(c),
      ),
    ).toBe(true);
  });
});

describe('RichTextView label reactivity', () => {
  it('updates the accessible name when the label changes after mount', async () => {
    const {rerender} = render(<RichTextView value={HELLO_STATE} label="A" />);
    await waitFor(() =>
      expect(screen.getByText('Hello world')).toBeInTheDocument(),
    );
    expect(screen.getByRole('textbox', {name: 'A'})).toBeInTheDocument();

    rerender(<RichTextView value={HELLO_STATE} label="B" />);
    expect(screen.getByRole('textbox', {name: 'B'})).toBeInTheDocument();
    expect(screen.queryByRole('textbox', {name: 'A'})).not.toBeInTheDocument();
  });
});

describe('RichTextView root ref', () => {
  it('attaches the ref to the root element in the normal branch', async () => {
    const ref = createRef<HTMLDivElement>();
    const {container} = render(
      <RichTextView ref={ref} value={HELLO_STATE} label="Notes" />,
    );
    await waitFor(() =>
      expect(screen.getByText('Hello world')).toBeInTheDocument(),
    );
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBe(container.firstElementChild);
    // The ref points at the wrapper around the read-only surface.
    expect(ref.current).toContainElement(screen.getByRole('textbox'));
  });

  it('keeps the ref on the root when a bad value switches to the fallback branch', async () => {
    const ref = createRef<HTMLDivElement>();
    const fallback = <div data-testid="view-fallback">Unavailable</div>;
    const {container, rerender} = render(
      <RichTextView
        ref={ref}
        value={HELLO_STATE}
        label="Notes"
        errorFallback={fallback}
      />,
    );
    await waitFor(() =>
      expect(screen.getByText('Hello world')).toBeInTheDocument(),
    );

    rerender(
      <RichTextView
        ref={ref}
        value={'{ not valid json'}
        label="Notes"
        errorFallback={fallback}
      />,
    );
    expect(screen.getByTestId('view-fallback')).toBeInTheDocument();
    // The error-fallback branch renders its own root div; the ref must follow
    // it rather than dangling on the unmounted composer wrapper.
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current).toContainElement(screen.getByTestId('view-fallback'));
  });
});
