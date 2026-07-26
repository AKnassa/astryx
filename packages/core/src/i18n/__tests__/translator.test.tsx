// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file translator.test.tsx
 * @input packages/core/src/i18n/resolve.ts,
 *   packages/core/src/i18n/InternationalizationProvider.tsx
 * @output Tests for the optional consumer-supplied `Translator` adapter
 * @position Unit + integration tests for the adapter seam (#4029). resolve.ts
 *   keeps astryx's own lookup chain (overrides → catalog → parent locale →
 *   shipped en) and delegates ONLY the final ICU format step, so these tests
 *   assert what the translator RECEIVES as much as what it returns.
 */

import {describe, test, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {__resetForTests, resolve} from '../resolve';
import {InternationalizationProvider} from '../InternationalizationProvider';
import {Pagination} from '../../Pagination';
import type {Translator} from '../translator';
import type {MessagesByLocale, Overrides} from '../types';

beforeEach(() => {
  __resetForTests();
});

/**
 * A stub standing in for react-intl / i18next / Lingui. It records every call
 * so tests can assert astryx handed over an already-RESOLVED ICU message
 * rather than a raw `@astryx.*` key.
 */
function makeTranslator(
  impl: (
    message: string,
    values?: Record<string, unknown>,
    locale?: string,
  ) => string = message => `[${message}]`,
) {
  const format = vi.fn(impl);
  const translator: Translator = {format};
  return {translator, format};
}

describe('resolve — translator receives a resolved message, not a key', () => {
  test('hands the shipped en message to the translator when the locale has no catalog', () => {
    // fr has no catalog and no override, so astryx's own chain falls back to
    // the shipped en entry. The translator must see THAT string — if it saw
    // '@astryx.pagination.goToPage' the lookup would have leaked out of
    // astryx and every consumer would have to re-implement the fallback.
    const {translator, format} = makeTranslator();

    resolve(
      '@astryx.pagination.goToPage',
      {page: 5},
      'fr',
      {},
      undefined,
      translator,
    );

    expect(format).toHaveBeenCalledTimes(1);
    expect(format).toHaveBeenCalledWith(
      'Go to page {page, number}',
      {page: 5},
      'fr',
    );
  });

  test('hands the provider catalog message to the translator when one exists', () => {
    const {translator, format} = makeTranslator();
    const messages: MessagesByLocale = {
      fr: {
        '@astryx.pagination.goToPage': {
          defaultMessage: 'Aller à la page {page, number}',
        },
      },
    };

    resolve(
      '@astryx.pagination.goToPage',
      {page: 5},
      'fr',
      messages,
      undefined,
      translator,
    );

    expect(format).toHaveBeenCalledWith(
      'Aller à la page {page, number}',
      {page: 5},
      'fr',
    );
  });

  test('overrides still win before the translator is reached', () => {
    const {translator, format} = makeTranslator();
    const messages: MessagesByLocale = {
      fr: {
        '@astryx.pagination.goToPage': {
          defaultMessage: 'Aller à la page {page, number}',
        },
      },
    };
    const overrides: Overrides = {
      fr: {'@astryx.pagination.goToPage': 'Page {page, number}'},
    };

    resolve(
      '@astryx.pagination.goToPage',
      {page: 5},
      'fr',
      messages,
      overrides,
      translator,
    );

    expect(format).toHaveBeenCalledWith('Page {page, number}', {page: 5}, 'fr');
  });

  test('regional locale walks pt-BR → pt inside astryx before delegating', () => {
    const {translator, format} = makeTranslator();
    const messages: MessagesByLocale = {
      pt: {
        '@astryx.pagination.goToPage': {
          defaultMessage: 'Ir para a página {page, number}',
        },
      },
    };

    resolve(
      '@astryx.pagination.goToPage',
      {page: 2},
      'pt-BR',
      messages,
      undefined,
      translator,
    );

    expect(format).toHaveBeenCalledWith(
      'Ir para a página {page, number}',
      {page: 2},
      'pt-BR',
    );
  });
});

describe('resolve — the translator formats messages that have values', () => {
  test('returns the translator output instead of the built-in ICU result', () => {
    const {translator} = makeTranslator(
      (message, values) => `translated:${message}:${JSON.stringify(values)}`,
    );

    const out = resolve(
      '@astryx.pagination.goToPage',
      {page: 7},
      'en',
      {},
      undefined,
      translator,
    );

    expect(out).toBe('translated:Go to page {page, number}:{"page":7}');
  });

  test('the built-in intl-messageformat runtime is bypassed entirely', () => {
    // A translator that ignores ICU syntax proves the built-in formatter never
    // ran — the raw braces would otherwise have been interpolated away.
    const {translator} = makeTranslator(message => message);

    const out = resolve(
      '@astryx.pagination.count',
      {from: 1, to: 10, total: 1000},
      'en-US',
      {},
      undefined,
      translator,
    );

    expect(out).toBe('{from, number}–{to, number} of {total, number}');
    expect(out).not.toContain('1,000');
  });
});

describe('resolve — the values===undefined short-circuit still short-circuits', () => {
  test('a value-less message never reaches the translator', () => {
    const {translator, format} = makeTranslator();

    const out = resolve(
      '@astryx.pagination.next',
      undefined,
      'en',
      {},
      undefined,
      translator,
    );

    expect(format).not.toHaveBeenCalled();
    expect(out).toBe('Go to next page');
  });

  test('a missing key returns the key and never reaches the translator', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const {translator, format} = makeTranslator();

    const out = resolve(
      '@astryx.does.not.exist',
      {a: 1},
      'en',
      {},
      undefined,
      translator,
    );

    expect(out).toBe('@astryx.does.not.exist');
    expect(format).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('resolve — no translator means byte-identical behavior', () => {
  const cases: {
    name: string;
    key: string;
    values: Record<string, unknown> | undefined;
    locale: string;
    messages: MessagesByLocale;
    overrides: Overrides | undefined;
  }[] = [
    {
      name: 'shipped en, no values',
      key: '@astryx.pagination.next',
      values: undefined,
      locale: 'en',
      messages: {},
      overrides: undefined,
    },
    {
      name: 'ICU number formatting under en-US',
      key: '@astryx.pagination.count',
      values: {from: 1, to: 10, total: 1000},
      locale: 'en-US',
      messages: {},
      overrides: undefined,
    },
    {
      name: 'ICU number formatting under de-DE',
      key: '@astryx.pagination.count',
      values: {from: 1, to: 10, total: 1000},
      locale: 'de-DE',
      messages: {},
      overrides: undefined,
    },
    {
      name: 'provider catalog + locale chain',
      key: '@astryx.pagination.goToPage',
      values: {page: 3},
      locale: 'pt-BR',
      messages: {
        pt: {
          '@astryx.pagination.goToPage': {
            defaultMessage: 'Página {page, number}',
          },
        },
      },
      overrides: undefined,
    },
    {
      name: 'override wins',
      key: '@astryx.pagination.next',
      values: undefined,
      locale: 'fr',
      messages: {},
      overrides: {fr: {'@astryx.pagination.next': 'Suivant'}},
    },
  ];

  const expected: Record<string, string> = {
    'shipped en, no values': 'Go to next page',
    'ICU number formatting under en-US': '1–10 of 1,000',
    'ICU number formatting under de-DE': '1–10 of 1.000',
    'provider catalog + locale chain': 'Página 3',
    'override wins': 'Suivant',
  };

  for (const c of cases) {
    test(`omitting translator keeps today's output — ${c.name}`, () => {
      const withoutArg = resolve(
        c.key,
        c.values,
        c.locale,
        c.messages,
        c.overrides,
      );
      __resetForTests();
      const withUndefined = resolve(
        c.key,
        c.values,
        c.locale,
        c.messages,
        c.overrides,
        undefined,
      );

      expect(withoutArg).toBe(expected[c.name]);
      expect(withUndefined).toBe(expected[c.name]);
    });
  }

  test('the formatter cache is still used when no translator is supplied', () => {
    // Two identical calls must produce identical output; the second is served
    // from formatterCache. A regression here would show up as a throw or a
    // changed string, not a silent slowdown.
    const first = resolve(
      '@astryx.pagination.goToPage',
      {page: 1},
      'en',
      {},
      undefined,
    );
    const second = resolve(
      '@astryx.pagination.goToPage',
      {page: 2},
      'en',
      {},
      undefined,
    );
    expect(first).toBe('Go to page 1');
    expect(second).toBe('Go to page 2');
  });
});

describe('InternationalizationProvider — translator prop', () => {
  test('threads the translator down to astryx components', () => {
    const {translator, format} = makeTranslator(message => `«${message}»`);

    render(
      <InternationalizationProvider locale="en" translator={translator}>
        <Pagination
          page={2}
          totalItems={100}
          pageSize={10}
          onChange={() => {}}
          variant="count"
        />
      </InternationalizationProvider>,
    );

    // `count` carries values, so it goes through the translator verbatim.
    expect(
      screen.getByText('«{from, number}–{to, number} of {total, number}»'),
    ).toBeInTheDocument();

    // Every message handed over is a resolved ICU string, never a key.
    for (const call of format.mock.calls) {
      expect(call[0]).not.toMatch(/^@astryx\./);
    }
  });

  test('value-less strings still resolve through astryx when a translator is set', () => {
    const {translator} = makeTranslator(message => `«${message}»`);

    render(
      <InternationalizationProvider locale="en" translator={translator}>
        <Pagination
          page={2}
          totalItems={100}
          pageSize={10}
          onChange={() => {}}
        />
      </InternationalizationProvider>,
    );

    // No values → short-circuit → untouched English, no guillemets.
    expect(
      screen.getByRole('button', {name: 'Go to next page'}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', {name: 'Pagination'}),
    ).toBeInTheDocument();
  });

  test('no translator prop leaves rendered output unchanged', () => {
    render(
      <InternationalizationProvider locale="en-US">
        <Pagination
          page={2}
          totalItems={10000}
          pageSize={10}
          onChange={() => {}}
          variant="count"
        />
      </InternationalizationProvider>,
    );

    expect(screen.getByText(/10,000/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: 'Go to next page'}),
    ).toBeInTheDocument();
  });
});
