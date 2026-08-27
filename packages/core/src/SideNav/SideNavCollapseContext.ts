// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

/**
 * @file SideNavCollapseContext.ts
 * @input React createContext, use
 * @output Exports SideNavCollapseContext, useSideNavCollapse and the registry
 *   of collapse toggles rendered outside a SideNav
 * @position Internal context for sidenav collapse state
 *
 * Provides collapse state to SideNavCollapseButton and other
 * sidenav children. Set by SideNav when isCollapsible is true.
 * A button rendered outside the SideNav tree is out of context's reach and
 * takes the controlled `collapsible` config as a prop instead.
 */

import {createContext, use} from 'react';

export interface SideNavCollapseState {
  /**
   * Whether the sidenav is currently collapsed. Inside a nav that hides
   * entirely (`collapsedWidth: 0`) this stays `false` while collapsed: there
   * is no visible collapsed form to morph into, and the content has to keep
   * its expanded layout while it slides out of view.
   */
  isCollapsed: boolean;
  /** Toggle collapse state */
  toggle: () => void;
  /** Whether collapse is enabled */
  isCollapsible: boolean;
}

/** Object form of SideNav's `collapsible` prop. */
export interface SideNavCollapsibleConfig {
  defaultIsCollapsed?: boolean;
  isCollapsed?: boolean;
  onCollapsedChange?: (isCollapsed: boolean) => void;
  hasButton?: boolean;
  buttonLabel?: string;
  /**
   * Width (px) of the collapsed nav. Defaults to the icon rail. `0` hides the
   * nav entirely, for focused single-pane UIs (e.g. chat) where the rail is
   * not wanted; pair it with a `SideNavCollapseButton` rendered outside the
   * nav, since the built-in one hides with it. A fully hidden nav is `inert`,
   * so its links can't take keyboard focus while invisible, and its content
   * keeps the expanded layout (see `SideNavCollapseState.isCollapsed`). If
   * focus is inside the nav when the collapse starts, it is parked on that
   * outside toggle (or blurred) before `inert` lands, so it is never yanked
   * to `<body>` mid-slide.
   */
  collapsedWidth?: number;
  /**
   * Slide the content out and back in when collapsing to `collapsedWidth: 0`.
   * Only `transform` animates; the box itself snaps in one reflow (after the
   * slide on collapse, before it on expand). The icon rail always snaps:
   * animating it would mean animating `width`. Honours
   * `prefers-reduced-motion`.
   */
  isAnimated?: boolean;
}

/**
 * The controlled form: the consumer holds the state, so it can be handed to
 * both SideNav and a SideNavCollapseButton rendered outside it.
 */
export interface SideNavControlledCollapsible extends SideNavCollapsibleConfig {
  isCollapsed: boolean;
  onCollapsedChange: (isCollapsed: boolean) => void;
}

/**
 * @deprecated Pass the same controlled `collapsible` config to SideNav and to
 * the out-of-tree SideNavCollapseButton instead. The state then reaches the
 * button through props rather than through a ref.
 */
export interface SideNavImperativeCollapseHandle {
  getCollapseState: () => SideNavCollapseState | null;
}

export const SideNavCollapseContext = createContext<SideNavCollapseState>({
  isCollapsed: false,
  toggle: () => {},
  isCollapsible: false,
});
SideNavCollapseContext.displayName = 'SideNavCollapseContext';

/**
 * Read the sidenav collapse state from context.
 * Returns { isCollapsed, toggle, isCollapsible }.
 * When used outside a sidenav with isCollapsible, isCollapsible is false.
 */
export function useSideNavCollapse(): SideNavCollapseState {
  return use(SideNavCollapseContext);
}

// Collapse toggles rendered outside a SideNav, registered by
// SideNavCollapseButton. When a fully-hidden collapse (`collapsedWidth: 0`)
// starts while focus is inside the nav, the nav parks focus on one of these
// before it goes `inert`. Module scope rather than context: the outside
// button and the nav share no ancestor of their own, only the consumer's
// layout.
const externalCollapseToggles = new Set<HTMLElement>();

/** Registers a collapse toggle rendered outside a SideNav; returns the matching unregister. */
export function registerExternalCollapseToggle(
  element: HTMLElement,
): () => void {
  externalCollapseToggles.add(element);
  return () => {
    externalCollapseToggles.delete(element);
  };
}

/** The first registered toggle that is in the document and not inside `nav`. */
export function findExternalCollapseToggle(
  nav: HTMLElement,
): HTMLElement | null {
  for (const element of externalCollapseToggles) {
    if (element.isConnected && !nav.contains(element)) {
      return element;
    }
  }
  return null;
}
