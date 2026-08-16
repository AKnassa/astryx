// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file Menu.test.tsx
 * @input vitest, Testing Library, Menu, DropdownMenuItem, DropdownMenuSubMenu
 * @output Unit tests for the standalone menu body (#4985)
 * @position Tests; the menu container with no trigger and no layer of its own
 *
 * SYNC: When Menu.tsx changes, update these tests.
 */

import {describe, it, expect, vi, beforeEach} from 'vitest';
import {useState} from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Menu} from './Menu';
import {DropdownMenuItem} from './DropdownMenuItem';
import {DropdownMenuSubMenu} from './DropdownMenuSubMenu';

beforeEach(() => {
  HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
    this.setAttribute('popover-open', '');
    const event = new Event('toggle', {bubbles: false});
    Object.defineProperty(event, 'newState', {value: 'open'});
    this.dispatchEvent(event);
  });
  HTMLElement.prototype.hidePopover = vi.fn(function (this: HTMLElement) {
    this.removeAttribute('popover-open');
    const event = new Event('toggle', {bubbles: false});
    Object.defineProperty(event, 'newState', {value: 'closed'});
    this.dispatchEvent(event);
  });
  const originalMatches = HTMLElement.prototype.matches;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (HTMLElement.prototype as any).matches = function (
    selector: string,
  ): boolean {
    if (selector === ':popover-open') {
      return this.hasAttribute('popover-open');
    }
    return originalMatches.call(this, selector);
  };
});

describe('Menu', () => {
  it('renders a named role=menu with no trigger and no dialog wrapper', () => {
    render(
      <Menu label="Models" onClose={() => {}}>
        <DropdownMenuItem label="GPT-4" />
      </Menu>,
    );

    expect(screen.getByRole('menu', {name: 'Models'})).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('closes when Tab is pressed inside it (APG menu-button)', () => {
    const onClose = vi.fn();
    render(
      <Menu label="Models" onClose={onClose}>
        <DropdownMenuItem label="GPT-4" />
      </Menu>,
    );

    fireEvent.keyDown(screen.getByRole('menu', {name: 'Models'}), {
      key: 'Tab',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('typeahead focuses the item matching the typed character', () => {
    render(
      <Menu label="Models" onClose={() => {}}>
        <DropdownMenuItem label="Claude" />
        <DropdownMenuItem label="GPT-4" />
        <DropdownMenuItem label="Llama" />
      </Menu>,
    );

    fireEvent.keyDown(screen.getByRole('menu', {name: 'Models'}), {key: 'g'});
    expect(screen.getByRole('menuitem', {name: 'GPT-4'})).toHaveFocus();
  });

  it('Enter activates the focused item', () => {
    const onClick = vi.fn();
    render(
      <Menu label="Models" onClose={() => {}}>
        <DropdownMenuItem label="GPT-4" onClick={onClick} />
      </Menu>,
    );

    const item = screen.getByRole('menuitem', {name: 'GPT-4'});
    item.focus();
    fireEvent.keyDown(screen.getByRole('menu', {name: 'Models'}), {
      key: 'Enter',
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('closes the stack when a leaf item is selected', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Menu label="Models" onClose={onClose}>
        <DropdownMenuItem label="GPT-4" />
      </Menu>,
    );

    await user.click(screen.getByRole('menuitem', {name: 'GPT-4'}));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not steal focus on mount when isOpen is false', () => {
    render(
      <Menu label="Models" onClose={() => {}} isOpen={false}>
        <DropdownMenuItem label="GPT-4" />
      </Menu>,
    );

    expect(screen.getByRole('menuitem', {name: 'GPT-4'})).not.toHaveFocus();
    expect(screen.getByRole('menu', {name: 'Models'})).not.toHaveFocus();
  });

  it('focuses the first item when isOpen becomes true', async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <Menu label="Models" onClose={() => {}} isOpen={open}>
            <DropdownMenuItem label="GPT-4" />
            <DropdownMenuItem label="Claude" />
          </Menu>
        </>
      );
    }

    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', {name: 'Open'}));
    await waitFor(() =>
      expect(screen.getByRole('menuitem', {name: 'GPT-4'})).toHaveFocus(),
    );
  });

  it('focuses the container when focusOnOpen is container', async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <Menu
            label="Models"
            onClose={() => {}}
            isOpen={open}
            focusOnOpen="container">
            <DropdownMenuItem label="GPT-4" />
          </Menu>
        </>
      );
    }

    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', {name: 'Open'}));
    await waitFor(() =>
      expect(screen.getByRole('menu', {name: 'Models'})).toHaveFocus(),
    );
  });

  it('opens a DropdownMenuSubMenu flyout as its own top-layer element', async () => {
    const user = userEvent.setup();
    render(
      <Menu label="Models" onClose={() => {}}>
        <DropdownMenuItem label="GPT-4" />
        <DropdownMenuSubMenu label="More models">
          <DropdownMenuItem label="Fable 5" />
        </DropdownMenuSubMenu>
      </Menu>,
    );

    await user.click(screen.getByRole('menuitem', {name: /More models/}));
    await waitFor(() => {
      expect(
        screen.getByRole('menuitem', {name: /More models/}),
      ).toHaveAttribute('aria-expanded', 'true');
    });

    const flyoutItem = screen.getByRole('menuitem', {
      name: 'Fable 5',
      hidden: true,
    });
    const flyout = flyoutItem.closest('[role="menu"]');
    expect(flyout?.closest('[popover]')).not.toBeNull();
    expect(flyout?.closest('[popover]')).toHaveAttribute('popover', 'manual');
  });
});
