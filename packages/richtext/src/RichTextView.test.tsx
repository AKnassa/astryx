// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file RichTextView.test.tsx
 * @input Uses vitest, @testing-library/react, RichTextView
 * @output Unit tests for the read-only view's accessible name, keyboard
 *   reachability, and className/style merging on the root element
 * @position Testing; validates RichTextView.tsx
 *
 * SYNC: When the view component changes, update these tests to match.
 */

import {describe, it, expect} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
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
});
