// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file translator.ts
 * @input Translator interface for consumer i18n runtime injection
 * @output Type surface for pluggable translators
 * @position Public API for i18n adapter integration
 *
 * Consumers who already run an i18n runtime (react-intl, Lingui, i18next, etc.)
 * can inject their own Translator via `<InternationalizationProvider
 * translator={…}>` instead of using the bundled `intl-messageformat`. The
 * interface is deliberately small so any real i18n library can satisfy it in a
 * few lines.
 *
 * SYNC: When modified, update these files to stay in sync:
 * - /packages/core/src/i18n/index.ts
 * - /packages/core/src/i18n/resolve.ts
 * - /packages/core/src/i18n/InternationalizationContext.ts
 * - /packages/core/src/i18n/InternationalizationProvider.tsx
 * - /packages/cli/docs/internationalization.doc.mjs
 */

/**
 * A Translator formats ICU MessageFormat strings for a given locale.
 * Consumers can supply their own to reuse their existing i18n runtime.
 */
export interface Translator {
  /**
   * Format an ICU MessageFormat message with values in the given locale.
   *
   * `message` is a message astryx has ALREADY resolved through its own chain
   * (overrides → catalog → parent locale → shipped `en`), never an
   * `@astryx.*` key — so the translator does not need astryx's catalog.
   */
  format(
    message: string,
    values?: Record<string, unknown>,
    locale?: string,
  ): string;
}
