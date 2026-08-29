#!/usr/bin/env node
// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * CI gate for component API-contract drift — `node scripts/check-contract.mjs`.
 *
 * `{Name}.doc.mjs` `props[]` is what agents and consumers read. The truth is
 * the component's `{Name}Props` type. A test written in the same PR as the
 * doc it asserts only proves the author typed both (#5382). This derives the
 * public prop names from the TypeScript checker and fails when a source prop
 * is missing from the doc, the way `themingTargets.test.ts` derives
 * `themeProps()` classes (#3741 / #4163 / #5421).
 *
 * Policy is SUBSET, not equality:
 *
 *   1. Source ⊆ docs. Every component-declared public prop must appear in
 *      `props[]`.
 *   2. Docs MAY list more — forwarded subcomponent props, extras the author
 *      wants in the table. Extra documented names are not drift.
 *
 * Deliberately NOT checked (v1): required/optional mismatch, phantom-in-doc
 * names, prop *types*, or prose. Those are later classes.
 *
 * Public = a property on `{Name}Props` whose declaration is not BaseProps,
 * `@types/react`, or `lib.dom`. Inherited HTML / `aria-*` / `data-*`
 * passthrough is the shared platform surface and must not be enumerated.
 * A handler *redeclared* on the component (TextInput `onKeyDown`, Button
 * `onClick` / `href` / `as`) is component API and MUST be documented —
 * filtering by name regex would hide it.
 *
 * Key lookup uses one `ts.Program` over the source tree so `extends` /
 * `Omit` / `Pick` resolve. A program-per-file is correct but ~40× slower.
 * A union `{Name}Props` (`SliderSingleProps | SliderRangeProps`) is walked
 * per member, since the union's own property list holds only the common
 * props. A prop is platform passthrough only when every declaration behind
 * it is platform — an intersection redeclaring `onClick` over BaseProps
 * carries both declarations and stays public.
 *
 * The scan itself is gated: zero `.doc.mjs` found, or a doc that cannot be
 * imported or exports no `docs`, fails the run instead of passing vacuously.
 *
 * Not yet in `check:repo`: core still has pre-existing drift this gate
 * reports. Wire it next to `check:i18n-catalog` once that count is zero
 * (#4163). Until then: `pnpm check:contract`.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CORE_SRC = path.join(ROOT, 'packages/core/src');

/**
 * Props ComponentPropDoc tells authors to omit, even when a component
 * redeclares them (`ref` on Button). Sibling of UNIVERSAL_PROPS in
 * `docPropReferences.test.ts`.
 */
export const SKIPPED_PROPS = new Set([
  'xstyle',
  'className',
  'style',
  'ref',
  'data-testid',
]);

/** True when `name` is platform surface, not component-authored API. */
export function isSkippedProp(name) {
  return SKIPPED_PROPS.has(name);
}

/**
 * Every prop name a doc file lists — top-level `props[]` plus inline
 * `components[].props`. Name-only ComponentRefs contribute nothing; those
 * names live in the sibling `{Name}.doc.mjs`.
 *
 * @param {{props?: {name: string}[], components?: {props?: {name: string}[]}[]}} docs
 * @returns {Set<string>}
 */
export function documentedPropNames(docs) {
  const names = new Set();
  for (const prop of docs?.props ?? []) {
    if (prop?.name) names.add(prop.name);
  }
  for (const entry of docs?.components ?? []) {
    for (const prop of entry?.props ?? []) {
      if (prop?.name) names.add(prop.name);
    }
  }
  return names;
}

/**
 * Source names that do not appear in the documented set. Extra documented
 * names are ignored (subset policy).
 *
 * @param {Iterable<string>} sourceNames
 * @param {Iterable<string>} documentedNames
 * @returns {string[]}
 */
export function findUndocumented(sourceNames, documentedNames) {
  const documented = new Set(documentedNames);
  return [...sourceNames].filter(name => !documented.has(name)).sort();
}

/** Source files only — no tests, stories, docs, or perf fixtures. */
function walkSource(dir, out = []) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      walkSource(full, out);
    } else if (
      /\.[jt]sx?$/.test(entry.name) &&
      !entry.name.includes('.test.') &&
      !entry.name.includes('.stories.') &&
      !entry.name.includes('.doc.') &&
      !entry.name.includes('.perf.') &&
      !entry.name.endsWith('.d.ts')
    ) {
      out.push(full);
    }
  }
  return out;
}

function walkDocs(dir, out = []) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      walkDocs(full, out);
    } else if (entry.name.endsWith('.doc.mjs')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * One program over `filePaths` so `extends`/`Omit`/`Pick` resolve.
 *
 * @param {string[]} filePaths
 * @returns {{program: import('typescript').Program, checker: import('typescript').TypeChecker}}
 */
export function buildProgram(filePaths) {
  const program = ts.createProgram(filePaths, {
    jsx: ts.JsxEmit.Preserve,
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    skipLibCheck: true,
    strict: true,
  });
  return {program, checker: program.getTypeChecker()};
}

/**
 * Property symbols of `type`. On a union (`SliderSingleProps |
 * SliderRangeProps`) `getProperties()` reports only the members' common
 * props, so a variant-only prop (`minStepsBetweenThumbs`) would never be
 * required. Walk each member instead.
 *
 * @param {import('typescript').Type} type
 * @returns {import('typescript').Symbol[]}
 */
function propertySymbols(type) {
  return type.isUnion()
    ? type.types.flatMap(propertySymbols)
    : type.getProperties();
}

function isInheritedPlatformDecl(declFile) {
  return /\/BaseProps\.ts$|node_modules|[\\/]lib\.dom|@types\/react/.test(
    declFile,
  );
}

/**
 * Component-declared prop names on `{symbolName}`. `preferDir` disambiguates
 * when the same symbol is declared in more than one file — the declaration
 * in or under the doc's own directory wins.
 *
 * @param {import('typescript').Program} program
 * @param {import('typescript').TypeChecker} checker
 * @param {string} symbolName
 * @param {string} preferDir
 * @returns {Set<string> | null} null when no matching source symbol exists
 */
export function extractPublicPropNames(
  program,
  checker,
  symbolName,
  preferDir,
) {
  const matches = [];
  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.fileName.includes(`${path.sep}node_modules${path.sep}`)) {
      continue;
    }
    ts.forEachChild(sourceFile, function find(node) {
      if (
        (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
        node.name.text === symbolName
      ) {
        matches.push(node);
      }
      ts.forEachChild(node, find);
    });
  }
  if (matches.length === 0) return null;

  const prefix = preferDir.endsWith(path.sep)
    ? preferDir
    : preferDir + path.sep;
  const target =
    matches.find(node => node.getSourceFile().fileName.startsWith(prefix)) ??
    matches[0];

  const type = checker.getTypeAtLocation(target);
  const props = new Set();
  for (const symbol of propertySymbols(type)) {
    const name = symbol.getName();
    if (name.startsWith('__')) continue;
    if (isSkippedProp(name)) continue;
    // An intersection (`BaseProps & {onClick}`) yields one synthetic symbol
    // carrying every constituent's declaration; a prop is passthrough only
    // when all of them are platform. A declaration-less (remapped) prop is
    // component API.
    const declFiles = (symbol.getDeclarations() ?? []).map(
      decl => decl.getSourceFile().fileName,
    );
    if (declFiles.length > 0 && declFiles.every(isInheritedPlatformDecl)) {
      continue;
    }
    props.add(name);
  }
  return props;
}

/**
 * Entries this doc file is the source of truth for: the top-level component
 * when it has `props[]`, plus any inline `components[]` entry that carries
 * its own `props[]`.
 *
 * @param {{name?: string, props?: {name: string}[], components?: {name?: string, props?: {name: string}[]}[]}} docs
 * @returns {{name: string, documented: string[]}[]}
 */
function contractEntries(docs) {
  const entries = [];
  if (Array.isArray(docs.props) && docs.name) {
    entries.push({
      name: docs.name,
      documented: docs.props.map(prop => prop.name).filter(Boolean),
    });
  }
  for (const entry of docs.components ?? []) {
    if (Array.isArray(entry.props) && entry.name) {
      entries.push({
        name: entry.name,
        documented: entry.props.map(prop => prop.name).filter(Boolean),
      });
    }
  }
  return entries;
}

/**
 * Compare every `{Name}.doc.mjs` under `srcDir` to the matching `{Name}Props`.
 *
 * @param {string} srcDir
 * @returns {Promise<{missing: {component: string, prop: string, file: string}[], unresolved: {component: string, file: string}[], unreadable: {file: string, reason: string}[], docCount: number}>}
 */
export async function checkContract(srcDir) {
  const sourceFiles = walkSource(srcDir);
  const {program, checker} = buildProgram(sourceFiles);
  const missing = [];
  const unresolved = [];
  const unreadable = [];
  const docFiles = walkDocs(srcDir);

  for (const docFile of docFiles) {
    let mod;
    try {
      mod = await import(pathToFileURL(docFile).href);
    } catch (err) {
      unreadable.push({
        file: docFile,
        reason: err instanceof Error ? err.message : String(err),
      });
      continue;
    }
    const docs = mod.default ?? mod.docs;
    if (!docs) {
      unreadable.push({
        file: docFile,
        reason: 'exports neither `docs` nor a default export',
      });
      continue;
    }
    if (!docs.name) continue;
    // Hooks document params/returns, not props.
    if (docs.name.startsWith('use') && !Array.isArray(docs.props)) continue;

    const entries = contractEntries(docs);
    if (entries.length === 0) continue;

    const preferDir = path.dirname(docFile);
    for (const {name, documented} of entries) {
      const source = extractPublicPropNames(
        program,
        checker,
        `${name}Props`,
        preferDir,
      );
      if (!source) {
        unresolved.push({component: name, file: docFile});
        continue;
      }
      for (const prop of findUndocumented(source, documented)) {
        missing.push({component: name, prop, file: docFile});
      }
    }
  }

  missing.sort(
    (a, b) =>
      a.component.localeCompare(b.component) || a.prop.localeCompare(b.prop),
  );
  unresolved.sort(
    (a, b) =>
      a.component.localeCompare(b.component) || a.file.localeCompare(b.file),
  );
  unreadable.sort((a, b) => a.file.localeCompare(b.file));
  return {missing, unresolved, unreadable, docCount: docFiles.length};
}

/**
 * Scan `srcDir`, print the report through `io`, return the exit code. The
 * CLI entry below passes `console`; tests pass a capturing `io` instead of
 * spawning a process.
 *
 * @param {string} [srcDir]
 * @param {{log?: (line: string) => void, error?: (line: string) => void}} [io]
 * @returns {Promise<0 | 1>}
 */
export async function run(
  srcDir = CORE_SRC,
  {log = console.log, error = console.error} = {},
) {
  const {missing, unresolved, unreadable, docCount} =
    await checkContract(srcDir);

  if (docCount === 0) {
    error(
      `\n✗ check:contract found no .doc.mjs under ${path.relative(ROOT, srcDir) || '.'} — nothing was checked, so this is not a pass.\n`,
    );
    return 1;
  }

  if (unreadable.length > 0 || missing.length > 0) {
    if (unreadable.length > 0) {
      error(
        `\n✗ check:contract could not load ${unreadable.length} doc file(s):\n`,
      );
      for (const {file, reason} of unreadable) {
        error(`  ${path.relative(ROOT, file)}`);
        error(`    ${reason}`);
      }
      error(
        '\n    → Fix the syntax, import, or `docs` export of that .doc.mjs. A broken doc is not skipped.\n',
      );
    }
    if (missing.length > 0) {
      error(
        `\n✗ check:contract found ${missing.length} undocumented public prop(s):\n`,
      );
      for (const {component, prop, file} of missing) {
        const rel = path.relative(ROOT, file);
        error(`  ${component}.${prop}  (${rel})`);
      }
      error(
        "\n    → Document the prop in that component's .doc.mjs `props[]`, or it is not part of the public contract.\n",
      );
    }
    return 1;
  }

  log(
    `✓ check:contract — ${docCount} doc(s) checked, 0 undocumented public props` +
      (unresolved.length > 0
        ? `; ${unresolved.length} unresolved {Name}Props (informational)`
        : ''),
  );
  for (const {component} of unresolved) {
    log(`  · ${component}: no resolvable ${component}Props in source`);
  }
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run().then(
    code => {
      process.exitCode = code;
    },
    err => {
      console.error(err);
      process.exitCode = 2;
    },
  );
}
