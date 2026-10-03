import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import '@angular/compiler';
import { typeScriptUrl } from './load-typescript.mjs';
const catalogUrl = await typeScriptUrl('../src/app/adventure.data.ts');
const { GIFT_IDS } = await import(catalogUrl);

// Run the actual service with Angular signals and an in-memory Firestore transport.
const source = await readFile(new URL('../src/app/progress.service.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022, experimentalDecorators: true
} }).outputText.replace("from '@angular/core'", `from '${import.meta.resolve('@angular/core')}'`)
  .replaceAll("import('firebase/firestore')", 'Promise.resolve(globalThis.__testFirestore)').replace("from './adventure.data'", "from '" + catalogUrl + "'" );
const { ProgressService, normalizeProgress, progressErrorMessage } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const flush = () => new Promise(resolve => setImmediate(resolve));

test('normalizes corrupt and duplicate progress', () => {
  assert.deepEqual(normalizeProgress(null), []);
  assert.deepEqual(normalizeProgress(['mirror', 'mirror', 42, 'unknown', 'clip']), ['mirror', 'clip']);
  assert.deepEqual(normalizeProgress(['fish-clip', 'fish-rings', 'mirror', 'fish-rings']), ['fish-clip', 'fish-rings', 'mirror']);
  assert.deepEqual(normalizeProgress(GIFT_IDS), GIFT_IDS);
});

test('distinguishes permission errors from connection failures', () => {
  assert.match(progressErrorMessage({ code: 'permission-denied' }, 'fallback'), /permisos/);
  assert.match(progressErrorMessage({ code: 'unavailable' }, 'fallback'), /conexión/);
  assert.equal(progressErrorMessage(null, 'fallback'), 'fallback');
});

test('confirmed persistence, live sync, failed writes, retry, reset and cleanup', async () => {
  let next, onError, fail = false, writes = 0, stopped = 0;
  let data = { found: [] };
  const snapshot = (pending = false, cached = false) => ({
    data: () => data, metadata: { hasPendingWrites: pending, fromCache: cached }
  });
  globalThis.__testFirestore = {
    doc: (_db, ...path) => { assert.deepEqual(path, ['mamor26Progress', 'birthday']); return {}; },
    onSnapshot: (_ref, _options, callback, error) => {
      next = callback; onError = error; callback(snapshot()); return () => stopped++;
    },
    arrayUnion: id => ({ union: id }), serverTimestamp: () => 'timestamp',
    setDoc: async (_ref, value, options) => {
      writes++;
      assert.deepEqual(options, { merge: true });
      if (fail) throw new Error('permission-denied');
      data = { found: Array.isArray(value.found) ? [] : [...new Set([...data.found, value.found.union])] };
    },
    getDocFromServer: async () => snapshot()
  };
  const service = new ProgressService({ firestore: Promise.resolve({}) });
  await flush();
  assert.equal(service.loading(), false);
  await service.discover('mirror');
  assert.deepEqual(service.found(), ['mirror']);
  await service.discover('mirror');
  await service.discover('unknown');
  assert.equal(writes, 1);
  data = { found: ['mirror', 'clip'] }; next(snapshot());
  assert.deepEqual(service.found(), ['mirror', 'clip']);
  data = { found: ['mirror', 'clip', 'bag'] }; next(snapshot(true));
  assert.deepEqual(service.found(), ['mirror', 'clip']);
  next(snapshot(false, true));
  assert.deepEqual(service.found(), ['mirror', 'clip']);
  data = { found: ['mirror', 'clip'] }; fail = true;
  await service.discover('earrings');
  assert.deepEqual(service.found(), ['mirror', 'clip']);
  assert.ok(service.error()); assert.equal(service.saving(), false);
  fail = false; await service.connect();
  assert.equal(service.error(), '');
  await service.discover('fish-clip');
  await service.discover('fish-rings');
  assert.deepEqual(service.found(), ['mirror', 'clip', 'fish-clip', 'fish-rings']);
  for (const id of GIFT_IDS) await service.discover(id);
  assert.equal(service.found().length, 19);
  assert.deepEqual([...service.found()].sort(), [...GIFT_IDS].sort());
  assert.equal(await service.reset(), true);
  assert.deepEqual(service.found(), []);
  onError({ code: 'permission-denied' });
  assert.match(service.error(), /permisos/);
  assert.equal(service.loading(), false);
  service.ngOnDestroy();
  assert.equal(stopped, 2);
  delete globalThis.__testFirestore;
});
