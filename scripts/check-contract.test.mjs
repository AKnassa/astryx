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
 *
 * Edge classes pinned after the original set: union member-only props,
 * intersection redeclares (either constituent order), `@types/react`
 * inheritance, generic and key-remapped Props, `__tests__/` leakage, docs
 * that cannot be loaded or export no `docs`, report order under any
 * directory read order, and the `run()` exit codes CI sees — including a
 * zero-doc scan failing rather than passing.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {describe, it, expect, afterEach, vi} from 'vitest';
import {
  isSkippedProp,
  documentedPropNames,
  findUndocumented,
  checkContract,
  run,
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
    expect(props).not.toEqual(
      expect.arrayContaining(['isIconOnly', 'children']),
    );
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
    expect(unresolved.some(u => u.component === 'useTableSortable')).toBe(
      false,
    );
  });

  it('records unresolved when a component doc has props[] but no matching {Name}Props', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Widget/Widget.doc.mjs': `
        export const docs = {
          name: 'Widget',
          props: [{name: 'label', type: 'string', description: 'Visible text'}],
        };
      `,
    });
    const {missing, unresolved} = await checkContract(src);
    expect(missing).toEqual([]);
    expect(unresolved).toEqual(
      expect.arrayContaining([expect.objectContaining({component: 'Widget'})]),
    );
  });

  it('reads a stamped default export, not only `export const docs`', async () => {
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
        export default {
          type: 'component',
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

  it('reports a .doc.mjs that cannot be imported instead of swallowing it', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Widget/Widget.tsx': `
        import type {BaseProps} from '../BaseProps';
        export interface WidgetProps extends BaseProps {
          label: string;
        }
      `,
      'Widget/Widget.doc.mjs': `export const docs = {`,
    });
    const result = await checkContract(src);
    expect(result.unreadable).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: expect.stringContaining('Widget.doc.mjs'),
        }),
      ]),
    );
  });

  it('still skips ref and xstyle when the component redeclares them', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Widget/Widget.tsx': `
        import type {BaseProps} from '../BaseProps';
        export interface WidgetProps extends BaseProps {
          label: string;
          ref?: unknown;
          xstyle?: unknown;
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
      expect.arrayContaining(['ref', 'xstyle']),
    );
    expect(missing).toEqual([]);
  });

  it('derives props from a type alias, not only an interface', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Widget/Widget.tsx': `
        export type WidgetProps = {
          label: string;
          width?: string;
        };
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

  it('follows Pick<ParentProps> the same way it follows Omit', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Button/Button.tsx': `
        export interface ButtonProps {
          label: string;
          href?: string;
          size?: string;
        }
      `,
      'LinkButton/LinkButton.tsx': `
        import type {ButtonProps} from '../Button/Button';
        export type LinkButtonProps = Pick<ButtonProps, 'label' | 'href'> & {
          icon: unknown;
        };
      `,
      'LinkButton/LinkButton.doc.mjs': `
        export const docs = {
          name: 'LinkButton',
          props: [{name: 'icon', type: 'unknown', description: 'Glyph'}],
        };
      `,
    });
    const {missing} = await checkContract(src);
    const props = missing
      .filter(m => m.component === 'LinkButton')
      .map(m => m.prop)
      .sort();
    expect(props).toEqual(expect.arrayContaining(['label', 'href']));
    expect(props).not.toContain('size');
  });

  it('does not treat colocated .test / .stories files as the source of truth', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Widget/Widget.tsx': `
        import type {BaseProps} from '../BaseProps';
        export interface WidgetProps extends BaseProps {
          label: string;
        }
      `,
      'Widget/Widget.test.tsx': `
        export interface WidgetProps { leakedFromTest: string }
      `,
      'Widget/Widget.stories.tsx': `
        export interface WidgetProps { leakedFromStory: string }
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
      expect.arrayContaining(['leakedFromTest', 'leakedFromStory']),
    );
    expect(missing).toEqual([]);
  });

  it('checks inline components[].props against that sub-component, not the parent', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Layout/Stack.tsx': `
        import type {BaseProps} from '../BaseProps';
        export interface StackProps extends BaseProps {
          gap?: number;
          direction?: string;
        }
      `,
      'Layout/Layout.doc.mjs': `
        export const docs = {
          name: 'Layout',
          components: [
            {
              name: 'Stack',
              props: [{name: 'gap', type: 'number', description: 'Space between children'}],
            },
          ],
        };
      `,
    });
    const {missing} = await checkContract(src);
    expect(missing).toEqual(
      expect.arrayContaining([
        expect.objectContaining({component: 'Stack', prop: 'direction'}),
      ]),
    );
    expect(missing.map(m => m.component)).not.toContain('Layout');
  });
});

describe('documentedPropNames / findUndocumented — empty and nameless input', () => {
  it('returns an empty set for a missing or empty doc', () => {
    expect(documentedPropNames(undefined)).toEqual(new Set());
    expect(documentedPropNames({name: 'X'})).toEqual(new Set());
  });

  it('skips a props[] entry that has no name', () => {
    expect(
      documentedPropNames({
        name: 'X',
        props: [{type: 'string'}, {name: 'label'}],
      }),
    ).toEqual(new Set(['label']));
  });

  it('returns empty when the source side is empty, even if docs list extras', () => {
    expect(findUndocumented([], ['label'])).toEqual([]);
  });
});

describe('checkContract — union, intersection, and inheritance edges', () => {
  it('requires a prop that only one member of a union {Name}Props declares (Slider range mode)', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Slider/Slider.tsx': `
        import type {BaseProps} from '../BaseProps';
        export interface SliderBaseProps extends BaseProps {
          step?: number;
        }
        export interface SliderSingleProps extends SliderBaseProps {
          value: number;
        }
        export interface SliderRangeProps extends SliderBaseProps {
          value: [number, number];
          minStepsBetweenThumbs?: number;
        }
        export type SliderProps = SliderSingleProps | SliderRangeProps;
      `,
      'Slider/Slider.doc.mjs': `
        export const docs = {
          name: 'Slider',
          props: [
            {name: 'step', type: 'number', description: 'Increment'},
            {name: 'value', type: 'number | [number, number]', description: 'Current value'},
          ],
        };
      `,
    });
    const {missing} = await checkContract(src);
    expect(missing).toEqual([
      expect.objectContaining({
        component: 'Slider',
        prop: 'minStepsBetweenThumbs',
      }),
    ]);
  });

  it('requires a prop redeclared over BaseProps in an intersection, whichever side BaseProps is on', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Widget/Widget.tsx': `
        import type {BaseProps} from '../BaseProps';
        export type WidgetProps = BaseProps & {
          label: string;
          /** Component-owned, not the BaseProps passthrough. */
          onClick?: () => void;
        };
      `,
      'Gadget/Gadget.tsx': `
        import type {BaseProps} from '../BaseProps';
        export type GadgetProps = {
          label: string;
          onClick?: () => void;
        } & BaseProps;
      `,
      'Widget/Widget.doc.mjs': `
        export const docs = {
          name: 'Widget',
          props: [{name: 'label', type: 'string', description: 'Visible text'}],
        };
      `,
      'Gadget/Gadget.doc.mjs': `
        export const docs = {
          name: 'Gadget',
          props: [{name: 'label', type: 'string', description: 'Visible text'}],
        };
      `,
    });
    const {missing} = await checkContract(src);
    expect(missing).toEqual([
      expect.objectContaining({component: 'Gadget', prop: 'onClick'}),
      expect.objectContaining({component: 'Widget', prop: 'onClick'}),
    ]);
  });
});

describe('checkContract — doc loading and report determinism', () => {
  it('reports a .doc.mjs that exports neither `docs` nor a default, instead of silently skipping it', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Widget/Widget.tsx': `
        import type {BaseProps} from '../BaseProps';
        export interface WidgetProps extends BaseProps {
          label: string;
        }
      `,
      'Widget/Widget.doc.mjs': `
        export const doc = {
          name: 'Widget',
          props: [{name: 'label', type: 'string', description: 'Visible text'}],
        };
      `,
    });
    const {unreadable, missing} = await checkContract(src);
    expect(unreadable).toEqual([
      expect.objectContaining({
        file: expect.stringContaining('Widget.doc.mjs'),
        reason: expect.stringMatching(/docs/),
      }),
    ]);
    expect(missing).toEqual([]);
  });

  it('sorts missing and unresolved by name, not by directory read order', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Alpha/Alpha.doc.mjs': `
        export const docs = {name: 'Alpha', props: [{name: 'x', type: 'string', description: 'x'}]};
      `,
      'Beta/Beta.doc.mjs': `
        export const docs = {name: 'Beta', props: [{name: 'x', type: 'string', description: 'x'}]};
      `,
      'Yak/Yak.tsx': `export interface YakProps { b: string; a: string }`,
      'Yak/Yak.doc.mjs': `export const docs = {name: 'Yak', props: []};`,
      'Zed/Zed.tsx': `export interface ZedProps { z: string }`,
      'Zed/Zed.doc.mjs': `export const docs = {name: 'Zed', props: []};`,
    });
    const natural = fs.readdirSync.bind(fs);
    const reversed = (dir, opts) => {
      const entries = natural(dir, opts);
      return String(dir).startsWith(src) ? [...entries].reverse() : entries;
    };
    const spy = vi.spyOn(fs, 'readdirSync');
    try {
      for (const walkOrder of [natural, reversed]) {
        spy.mockImplementation(walkOrder);
        const {missing, unresolved} = await checkContract(src);
        expect(missing.map(m => `${m.component}.${m.prop}`)).toEqual([
          'Yak.a',
          'Yak.b',
          'Zed.z',
        ]);
        expect(unresolved.map(u => u.component)).toEqual(['Alpha', 'Beta']);
      }
    } finally {
      spy.mockRestore();
    }
  });
});

describe('run — the CI-facing report', () => {
  function capture() {
    const out = {log: [], error: []};
    return {
      out,
      io: {
        log: line => out.log.push(line),
        error: line => out.error.push(line),
      },
    };
  }

  it('prints each undocumented prop with its doc path and returns 1', async () => {
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
    const {out, io} = capture();
    await expect(run(src, io)).resolves.toBe(1);
    expect(out.error.join('\n')).toMatch(/1 undocumented public prop/);
    expect(out.error.join('\n')).toMatch(
      /Widget\.width\s+\(.*Widget\.doc\.mjs\)/,
    );
    expect(out.log).toEqual([]);
  });

  it('returns 1 when the scan finds no .doc.mjs at all — an empty scan is a misconfigured gate, not a pass', async () => {
    const src = fixture({'BaseProps.ts': BASE_PROPS});
    const {out, io} = capture();
    await expect(run(src, io)).resolves.toBe(1);
    expect(out.error.join('\n')).toMatch(/no \.doc\.mjs/);
    expect(out.log).toEqual([]);
  });

  it('returns 0 with the checked count and lists unresolved {Name}Props as informational', async () => {
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
      'Ghost/Ghost.doc.mjs': `
        export const docs = {
          name: 'Ghost',
          props: [{name: 'boo', type: 'string', description: 'No GhostProps in source'}],
        };
      `,
    });
    const {out, io} = capture();
    await expect(run(src, io)).resolves.toBe(0);
    expect(out.log).toEqual([
      '✓ check:contract — 2 doc(s) checked, 0 undocumented public props; 1 unresolved {Name}Props (informational)',
      '  · Ghost: no resolvable GhostProps in source',
    ]);
    expect(out.error).toEqual([]);
  });

  it('returns 1 and names the file and reason when a doc cannot be loaded', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Widget/Widget.doc.mjs': `export const docs = {`,
    });
    const {out, io} = capture();
    await expect(run(src, io)).resolves.toBe(1);
    const report = out.error.join('\n');
    expect(report).toMatch(/could not load 1 doc file\(s\)/);
    expect(report).toMatch(/Widget\.doc\.mjs\n\s+\S/);
    expect(report).toMatch(/A broken doc is not skipped/);
    expect(out.log).toEqual([]);
  });
});

describe('checkContract — inheritance and file-walk edges', () => {
  it('requires onClick when the component interface redeclares it over BaseProps', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Widget/Widget.tsx': `
        import type {BaseProps} from '../BaseProps';
        export interface WidgetProps extends BaseProps {
          label: string;
          /** Component-owned: part of the documented contract. */
          onClick?: () => void;
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
    expect(missing).toEqual([
      expect.objectContaining({component: 'Widget', prop: 'onClick'}),
    ]);
  });

  it('does not require BaseProps passthrough that arrives through Omit<ParentProps>', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Button/Button.tsx': `
        import type {BaseProps} from '../BaseProps';
        export interface ButtonProps extends BaseProps {
          label: string;
          href?: string;
          isIconOnly?: boolean;
        }
      `,
      'IconButton/IconButton.tsx': `
        import type {ButtonProps} from '../Button/Button';
        export interface IconButtonProps extends Omit<ButtonProps, 'isIconOnly'> {
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
    expect(missing.map(m => m.prop)).toEqual(['href', 'label']);
  });

  it('does not require attributes inherited from @types/react (HTMLAttributes)', async () => {
    const src = fixture({
      'node_modules/@types/react/index.d.ts': `
        export interface HTMLAttributes<T> {
          id?: string;
          role?: string;
          'aria-label'?: string;
          onKeyDown?: (event: T) => void;
        }
      `,
      'Widget/Widget.tsx': `
        import type {HTMLAttributes} from 'react';
        export interface WidgetProps extends HTMLAttributes<unknown> {
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
    const {missing, unresolved} = await checkContract(src);
    expect(unresolved).toEqual([]);
    expect(missing).toEqual([]);
  });

  it('derives props from a generic {Name}Props, interface or alias', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Widget/Widget.tsx': `
        import type {BaseProps} from '../BaseProps';
        export interface WidgetProps<T> extends BaseProps {
          value: T;
          onChange?: (next: T) => void;
        }
      `,
      'Gadget/Gadget.tsx': `
        export type GadgetProps<T = string> = {
          items: T[];
          label: string;
        };
      `,
      'Widget/Widget.doc.mjs': `
        export const docs = {
          name: 'Widget',
          props: [{name: 'value', type: 'T', description: 'Current value'}],
        };
      `,
      'Gadget/Gadget.doc.mjs': `
        export const docs = {
          name: 'Gadget',
          props: [{name: 'items', type: 'T[]', description: 'Rows'}],
        };
      `,
    });
    const {missing} = await checkContract(src);
    expect(missing.map(m => `${m.component}.${m.prop}`)).toEqual([
      'Gadget.label',
      'Widget.onChange',
    ]);
  });

  it('ignores a {Name}Props declared under __tests__/ (unresolved, not a leaked contract)', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Widget/__tests__/Widget.tsx': `
        export interface WidgetProps { leakedFromTestDir: string }
      `,
      'Widget/Widget.doc.mjs': `
        export const docs = {
          name: 'Widget',
          props: [],
        };
      `,
    });
    const {missing, unresolved} = await checkContract(src);
    expect(missing).toEqual([]);
    expect(unresolved).toEqual([
      expect.objectContaining({component: 'Widget'}),
    ]);
  });

  it('reports a doc whose import fails at runtime and still checks the other docs', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Broken/Broken.tsx': `export interface BrokenProps { a: string }`,
      'Broken/Broken.doc.mjs': `
        import {shared} from './shared-examples.mjs';
        export const docs = {name: 'Broken', props: shared};
      `,
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
    const {unreadable, missing} = await checkContract(src);
    expect(unreadable).toEqual([
      expect.objectContaining({
        file: expect.stringContaining('Broken.doc.mjs'),
        reason: expect.stringContaining('shared-examples'),
      }),
    ]);
    expect(missing).toEqual([
      expect.objectContaining({component: 'Widget', prop: 'width'}),
    ]);
  });

  it('requires declaration-less props from a key-remapped mapped type (they are component API)', async () => {
    const src = fixture({
      'BaseProps.ts': BASE_PROPS,
      'Widget/Widget.tsx': `
        import type {BaseProps} from '../BaseProps';
        type Phase = 'open' | 'close';
        export type WidgetProps = BaseProps & {
          [K in Phase as \`on\${Capitalize<K>}\`]?: () => void;
        } & {label: string};
      `,
      'Widget/Widget.doc.mjs': `
        export const docs = {
          name: 'Widget',
          props: [{name: 'label', type: 'string', description: 'Visible text'}],
        };
      `,
    });
    const {missing} = await checkContract(src);
    expect(missing.map(m => m.prop)).toEqual(['onClose', 'onOpen']);
  });
});
