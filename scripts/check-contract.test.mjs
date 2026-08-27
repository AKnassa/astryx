// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file check-contract.test.mjs
 * Unit tests for the API-contract gate (#5421 / #4163). The behaviour worth
 * pinning is what counts as a public prop: the type checker has to see props
 * a regex would miss (`extends`/`Omit`/`Pick`) and ignore the ones a regex
 * would invent (BaseProps HTML passthrough, raw DOM `on*`), and it has to
 * require a redeclared handler (`onKeyDown` on an input) rather than strip
 * it by name.
 *
 * Policy is SUBSET, not equality: every public source prop must be documented.
 * Docs may list more (forwarded subcomponent props). Required/optional and
 * phantom-doc props are out of scope for v1.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {describe, it, expect, afterEach} from 'vitest';
import {
  isSkippedProp,
  documentedPropNames,
  findUndocumented,
  checkContract,
} from './check-contract.mjs';

const tmpDirs = [];

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, {recursive: true, force: true});
  }
});

function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-contract-'));
  tmpDirs.push(dir);
  for (const [rel, source] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), {recursive: true});
    fs.writeFileSync(full, source);
  }
  return dir;
}

const BASE_PROPS = `export interface BaseProps {
  id?: string;
  className?: string;
  style?: unknown;
  xstyle?: unknown;
  onClick?: () => void;
}
`;

describe('isSkippedProp — platform surface docs must not enumerate', () => {
  it('skips the universal styling / ref props ComponentPropDoc tells authors to omit', () => {
    expect(isSkippedProp('xstyle')).toBe(true);
    expect(isSkippedProp('className')).toBe(true);
    expect(isSkippedProp('style')).toBe(true);
    expect(isSkippedProp('ref')).toBe(true);
    expect(isSkippedProp('data-testid')).toBe(true);
  });

  it('does not skip redeclared HTML-ish props that are part of the component contract', () => {
    expect(isSkippedProp('href')).toBe(false);
    expect(isSkippedProp('as')).toBe(false);
    expect(isSkippedProp('target')).toBe(false);
    expect(isSkippedProp('rel')).toBe(false);
    expect(isSkippedProp('onKeyDown')).toBe(false);
    expect(isSkippedProp('onClick')).toBe(false);
    expect(isSkippedProp('label')).toBe(false);
  });
});

describe('documentedPropNames — every props[] the doc file owns', () => {
  it('reads top-level props on a single-component doc', () => {
    expect(
      documentedPropNames({
        name: 'Button',
        props: [{name: 'label'}, {name: 'href'}],
      }),
    ).toEqual(new Set(['label', 'href']));
  });

  it('reads inline components[].props on a multi-component doc', () => {
    expect(
      documentedPropNames({
        name: 'Layout',
        components: [
          {name: 'Stack', props: [{name: 'gap'}, {name: 'direction'}]},
          {name: 'LayoutPanel'},
        ],
      }),
    ).toEqual(new Set(['gap', 'direction']));
  });

  it('unions top-level props with inline component props', () => {
    expect(
      documentedPropNames({
        name: 'Dialog',
        props: [{name: 'padding'}],
        components: [{name: 'DialogHeader', props: [{name: 'title'}]}],
      }),
    ).toEqual(new Set(['padding', 'title']));
  });
});

describe('findUndocumented — subset, not equality', () => {
  it('lists a source prop the doc omitted', () => {
    expect(findUndocumented(['label', 'href'], ['label'])).toEqual(['href']);
  });

  it('accepts extra documented props (forwarded / subcomponent surface)', () => {
    expect(findUndocumented(['label'], ['label', 'type', 'color'])).toEqual([]);
  });

  it('returns empty when every source prop is documented', () => {
    expect(findUndocumented(['label', 'href'], ['href', 'label'])).toEqual([]);
  });
});

describe('checkContract — public props derived from the type checker', () => {
  it('flags an own prop that the doc omitted', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Widget/Widget.tsx': `
        import type {BaseProps} from '../BaseProps';
        export interface WidgetProps extends BaseProps {
          label: string;
          width?: string;
        }
      `,
      'Widget/Widget.doc.mjs': `
        export const docs = {
          name: 'Widget',
          props: [{name: 'label', type: 'string', description: 'Visible text'}],
        };
      `,
    });
    const {missing} = await checkContract(src);
    expect(missing).toEqual(
      expect.arrayContaining([
        expect.objectContaining({component: 'Widget', prop: 'width'}),
      ]),
    );
  });

  it('does not require BaseProps passthrough (id, onClick)', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Widget/Widget.tsx': `
        import type {BaseProps} from '../BaseProps';
        export interface WidgetProps extends BaseProps {
          label: string;
        }
      `,
      'Widget/Widget.doc.mjs': `
        export const docs = {
          name: 'Widget',
          props: [{name: 'label', type: 'string', description: 'Visible text'}],
        };
      `,
    });
    const {missing} = await checkContract(src);
    expect(missing.map(m => m.prop)).not.toEqual(
      expect.arrayContaining(['id', 'onClick', 'className', 'style', 'xstyle']),
    );
    expect(missing).toEqual([]);
  });

  it('requires a redeclared onKeyDown (component-owned, not raw DOM passthrough)', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Widget/Widget.tsx': `
        import type {BaseProps} from '../BaseProps';
        export interface WidgetProps extends BaseProps {
          label: string;
          onKeyDown?: (e: unknown) => void;
        }
      `,
      'Widget/Widget.doc.mjs': `
        export const docs = {
          name: 'Widget',
          props: [{name: 'label', type: 'string', description: 'Visible text'}],
        };
      `,
    });
    const {missing} = await checkContract(src);
    expect(missing).toEqual(
      expect.arrayContaining([
        expect.objectContaining({component: 'Widget', prop: 'onKeyDown'}),
      ]),
    );
  });

  it('follows Omit<ParentProps> so IconButton still requires label and href', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Button/Button.tsx': `
        import type {BaseProps} from '../BaseProps';
        export interface ButtonProps extends BaseProps {
          label: string;
          href?: string;
          isIconOnly?: boolean;
          children?: unknown;
        }
      `,
      'IconButton/IconButton.tsx': `
        import type {ButtonProps} from '../Button/Button';
        export interface IconButtonProps extends Omit<ButtonProps, 'isIconOnly' | 'children'> {
          icon: unknown;
        }
      `,
      'IconButton/IconButton.doc.mjs': `
        export const docs = {
          name: 'IconButton',
          props: [{name: 'icon', type: 'unknown', description: 'Glyph'}],
        };
      `,
    });
    const {missing} = await checkContract(src);
    const props = missing
      .filter(m => m.component === 'IconButton')
      .map(m => m.prop)
      .sort();
    expect(props).toEqual(expect.arrayContaining(['label', 'href']));
    expect(props).not.toEqual(expect.arrayContaining(['isIconOnly', 'children']));
  });

  it('accepts extra documented props (subset policy)', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Widget/Widget.tsx': `
        import type {BaseProps} from '../BaseProps';
        export interface WidgetProps extends BaseProps {
          format?: string;
        }
      `,
      'Widget/Widget.doc.mjs': `
        export const docs = {
          name: 'Widget',
          props: [
            {name: 'format', type: 'string', description: 'Format string'},
            {name: 'type', type: 'string', description: 'Forwarded from a child'},
            {name: 'color', type: 'string', description: 'Forwarded from a child'},
          ],
        };
      `,
    });
    const {missing} = await checkContract(src);
    expect(missing).toEqual([]);
  });

  it('prefers the {Name}Props declared in the doc directory when the name collides', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Other/Other.tsx': `
        export interface WidgetProps {
          alien: string;
        }
      `,
      'Widget/Widget.tsx': `
        import type {BaseProps} from '../BaseProps';
        export interface WidgetProps extends BaseProps {
          label: string;
        }
      `,
      'Widget/Widget.doc.mjs': `
        export const docs = {
          name: 'Widget',
          props: [{name: 'label', type: 'string', description: 'Visible text'}],
        };
      `,
    });
    const {missing} = await checkContract(src);
    expect(missing.map(m => m.prop)).not.toContain('alien');
    expect(missing).toEqual([]);
  });

  it('scans a sibling sub-component doc (subComponentOf) as its own contract', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Dialog/Dialog.tsx': `
        import type {BaseProps} from '../BaseProps';
        export interface DialogProps extends BaseProps {
          padding?: number;
        }
      `,
      'Dialog/DialogHeader.tsx': `
        import type {BaseProps} from '../BaseProps';
        export interface DialogHeaderProps extends BaseProps {
          title: string;
        }
      `,
      'Dialog/Dialog.doc.mjs': `
        export const docs = {
          name: 'Dialog',
          props: [{name: 'padding', type: 'number', description: 'Inset'}],
          components: [{name: 'DialogHeader'}],
        };
      `,
      'Dialog/DialogHeader.doc.mjs': `
        export const docs = {
          name: 'DialogHeader',
          subComponentOf: 'Dialog',
          description: 'Title row',
          props: [],
        };
      `,
    });
    const {missing} = await checkContract(src);
    expect(missing).toEqual(
      expect.arrayContaining([
        expect.objectContaining({component: 'DialogHeader', prop: 'title'}),
      ]),
    );
  });

  it('does not fail a hook doc that has no {Name}Props (unresolved, not drift)', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Table/useTableSortable.ts': `
        export interface UseTableSortableConfig {
          column: string;
        }
      `,
      'Table/useTableSortable.doc.mjs': `
        export const docs = {
          name: 'useTableSortable',
          params: [{name: 'column', type: 'string', description: 'Sort key'}],
        };
      `,
    });
    const {missing, unresolved} = await checkContract(src);
    expect(missing).toEqual([]);
    expect(unresolved.some(u => u.component === 'useTableSortable')).toBe(false);
  });
});
