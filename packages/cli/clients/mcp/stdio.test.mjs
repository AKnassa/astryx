// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file Tests for the stdio pump.
 *
 * stdout is the protocol channel: one JSON-RPC message per line and nothing
 * else. Anything that prints to stdout corrupts the session, so these tests pin
 * that notifications stay silent, that a message split across chunk boundaries
 * still parses, and that a malformed line answers with a parse error instead of
 * killing the process.
 */

import {describe, it, expect} from 'vitest';
import {PassThrough} from 'node:stream';
import {pump} from './stdio.mjs';

/**
 * Feed lines through the pump and collect everything written to stdout.
 * @param {string[]} chunks raw stdin chunks (not necessarily whole lines)
 * @param {(message: Record<string, unknown>) => Promise<object|null>} handle
 * @returns {Promise<object[]>}
 */
async function run(chunks, handle) {
  const input = new PassThrough();
  const output = new PassThrough();
  /** @type {string} */
  let written = '';
  output.on('data', d => {
    written += d.toString();
  });

  const done = pump({input, output, handle});
  for (const chunk of chunks) input.write(chunk);
  input.end();
  await done;

  return written
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => JSON.parse(line));
}

const echo = async (/** @type {Record<string, unknown>} */ message) =>
  message.id === undefined
    ? null
    : {jsonrpc: '2.0', id: message.id, result: {}};

describe('pump', () => {
  it('answers one request with one line', async () => {
    const out = await run(['{"jsonrpc":"2.0","id":1,"method":"ping"}\n'], echo);
    expect(out).toEqual([{jsonrpc: '2.0', id: 1, result: {}}]);
  });

  it('stays silent for a notification', async () => {
    const out = await run(
      ['{"jsonrpc":"2.0","method":"notifications/initialized"}\n'],
      echo,
    );
    expect(out).toEqual([]);
  });

  it('reassembles a message split across chunks', async () => {
    const out = await run(
      ['{"jsonrpc":"2.0","id', '":2,"method":"ping"}\n'],
      echo,
    );
    expect(out).toEqual([{jsonrpc: '2.0', id: 2, result: {}}]);
  });

  it('handles several messages arriving in one chunk', async () => {
    const out = await run(
      [
        '{"jsonrpc":"2.0","id":1,"method":"ping"}\n{"jsonrpc":"2.0","id":2,"method":"ping"}\n',
      ],
      echo,
    );
    expect(out.map(m => m.id)).toEqual([1, 2]);
  });

  it('answers a malformed line with a parse error and keeps serving', async () => {
    const out = await run(
      ['{not json\n', '{"jsonrpc":"2.0","id":3,"method":"ping"}\n'],
      echo,
    );
    expect(out[0].error.code).toBe(-32700);
    expect(out[1].id).toBe(3);
  });

  it('turns a handler crash into an internal error instead of dying', async () => {
    const out = await run(
      ['{"jsonrpc":"2.0","id":4,"method":"ping"}\n'],
      async () => {
        throw new Error('handler exploded');
      },
    );
    expect(out[0].error.code).toBe(-32603);
    expect(out[0].id).toBe(4);
  });

  it('answers a batch with one array carrying every answerable response', async () => {
    const out = await run(
      [
        '[{"jsonrpc":"2.0","id":1,"method":"ping"},' +
          '{"jsonrpc":"2.0","method":"notifications/initialized"},' +
          '{"jsonrpc":"2.0","id":2,"method":"ping"}]\n',
      ],
      echo,
    );
    // One wire message, which is itself the array of the two answerable ids.
    expect(out).toHaveLength(1);
    expect(out[0].map((/** @type {{id: number}} */ m) => m.id)).toEqual([1, 2]);
  });

  it('stays silent for a batch made only of notifications', async () => {
    const out = await run(
      ['[{"jsonrpc":"2.0","method":"a"},{"jsonrpc":"2.0","method":"b"}]\n'],
      echo,
    );
    expect(out).toEqual([]);
  });

  // Responses must leave in request order. Without awaiting each handler the
  // pump would interleave, so a slow first request would answer after a fast
  // second one and a client pairing by arrival would mismatch them.
  it('keeps responses in request order even when the first is slower', async () => {
    /** @param {Record<string, unknown>} message */
    const slowFirst = async message => {
      if (message.id === 1) await new Promise(r => setTimeout(r, 25));
      return {jsonrpc: '2.0', id: message.id, result: {}};
    };
    const out = await run(
      [
        '{"jsonrpc":"2.0","id":1,"method":"ping"}\n' +
          '{"jsonrpc":"2.0","id":2,"method":"ping"}\n',
      ],
      slowFirst,
    );
    expect(out.map(m => m.id)).toEqual([1, 2]);
  });
});
