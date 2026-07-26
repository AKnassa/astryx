// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

/**
 * @file InternationalizationProvider.tsx
 * @input React, InternationalizationContext, i18n types, Translator
 * @output Exports InternationalizationProvider component and props type
 * @position Provider component for astryx i18n locale + messages + translator
 *
 * Wraps a subtree with a locale and (optional) additional message catalogs +
 * overrides. Astryx components inside the subtree resolve their strings via
 * this context. If a consumer never renders a provider, astryx components
 * still work — they use the shipped en catalog directly.
 *
 * SYNC: When modified, update these files to stay in sync:
 * - /packages/core/src/i18n/InternationalizationContext.ts
 * - /packages/core/src/i18n/translator.ts
 * - /packages/core/src/i18n/index.ts
 * - /packages/core/src/i18n/InternationalizationProvider.doc.mjs
 * - /packages/cli/docs/internationalization.doc.mjs
 */

import {useMemo, type ReactNode} from 'react';
import {InternationalizationContext} from './InternationalizationContext';
import type {Translator} from './translator';
import type {Locale, MessagesByLocale, Overrides} from './types';

export interface InternationalizationProviderProps {
  /**
   * BCP 47 language tag. Examples: `'en'`, `'pt'`, `'pt-BR'`, `'zh-Hans'`.
   *
   * Regional tags are respected — resolving a message walks the tag from
   * most-specific to least-specific (`pt-BR` → `pt`), then falls back to
   * the shipped `en` catalog.
   */
  locale: Locale;
  /**
   * Additional shipped catalogs to make available for the selected locale.
   * `en` is bundled with astryx and never needs to be listed here.
   *
   * @example
   * ```
   * import {fr} from '@astryxdesign/core/locales/fr.json';
   * <InternationalizationProvider locale="fr" messages={{fr}}>
   * ```
   */
  messages?: MessagesByLocale;
  /**
   * Sparse per-locale overrides applied on top of shipped defaults.
   * Only the keys you want to override need to be listed.
   *
   * @example
   * ```
   * <InternationalizationProvider
   *   locale="fr"
   *   overrides={{fr: {'@astryx.pagination.next': 'Suivant'}}}>
   * ```
   */
  overrides?: Overrides;
  /**
   * Reuse an existing i18n runtime (react-intl, i18next, LinguiJS, …) to
   * format astryx's strings instead of the bundled `intl-messageformat`.
   *
   * Astryx keeps its own lookup: overrides, then `messages`, then the parent
   * locale, then the shipped `en` catalog. The translator is handed the
   * already-resolved ICU message — never an `@astryx.*` key — so you do not
   * need to load astryx's catalog into your runtime's store.
   *
   * Messages with no values skip the translator; there is nothing to
   * interpolate.
   *
   * @example
   * ```
   * const intl = useIntl();
   * const translator = useMemo(
   *   () => ({
   *     format: (message, values) =>
   *       intl.formatMessage({id: message, defaultMessage: message}, values),
   *   }),
   *   [intl],
   * );
   * <InternationalizationProvider locale={intl.locale} translator={translator}>
   * ```
   */
  translator?: Translator;
  children: ReactNode;
}

/**
 * Provides locale + additional messages + overrides + an optional translator
 * to all astryx components in the subtree.
 */
export function InternationalizationProvider({
  locale,
  messages,
  overrides,
  translator,
  children,
}: InternationalizationProviderProps) {
  const value = useMemo(
    () => ({locale, messages: messages ?? {}, overrides, translator}),
    [locale, messages, overrides, translator],
  );
  return (
    <InternationalizationContext value={value}>
      {children}
    </InternationalizationContext>
  );
}

InternationalizationProvider.displayName = 'InternationalizationProvider';
