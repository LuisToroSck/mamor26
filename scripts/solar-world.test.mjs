import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { signal, computed, untracked } from '@angular/core';

// Test the actual activity methods with real signals and explicit input/effect scheduling.
// Rendering and Angular template types are validated by the production build.
let scheduled = [];
const mockInput = value => signal(value);
mockInput.required = () => signal([]);
globalThis.__solarTestAngular = {
  signal, computed, untracked, input: mockInput,
  Component: () => target => target,
  effect: callback => { scheduled.push(callback); },
  output: () => ({ values: [], emit(value) { this.values.push(value); } })
};
const source = await readFile(new URL('../src/app/solar-world/solar-world.component.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022, experimentalDecorators: true
} }).outputText.replace(/import \{([^}]+)\} from '@angular\/core';/, 'const {$1} = globalThis.__solarTestAngular;');
const { SolarWorldComponent, SOLAR_GIFTS } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
function world(found = []) {
  scheduled = [];
  const instance = new SolarWorldComponent();
  const effects = [...scheduled];
  instance.found.set(found);
  effects.forEach(fn => fn());
  return { instance, saved: () => effects.forEach(fn => fn()) };
}

test('six activities only advance when the physical gift is confirmed', () => {
  const { instance: w, saved } = world();
  w.openGift(); assert.deepEqual(w.giftOpened.values, []);
  const activities = [
    () => w.wakeMoon(),
    () => { w.meetMoon(); assert.equal(w.revealed(), null); w.chooseSun(); w.meetMoon(); },
    () => { w.connectStar(2); assert.deepEqual(w.path(), []); w.connectStar(0); w.connectStar(0); w.connectStar(1); w.connectStar(2); },
    () => { w.clearCloud(0); w.clearCloud(0); assert.equal(w.clearedClouds().length, 1); w.clearCloud(2); w.clearCloud(1); },
    () => { w.lightWindow(2); w.lightWindow(2); assert.equal(w.litWindows().length, 1); w.lightWindow(0); w.lightWindow(1); },
    () => { w.placeComet(); assert.equal(w.revealed(), null); w.callComet(); w.placeComet(); }
  ];
  activities.forEach((activity, index) => {
    w.review.set(null);
    activity();
    const id = SOLAR_GIFTS[index].id;
    assert.equal(w.revealed(), id);
    assert.equal(w.count(), index);
    assert.equal(w.card().id, id);
    w.openGift();
    assert.equal(w.giftOpened.values.at(-1), id);
    assert.equal(w.count(), index, 'emitting an event does not confirm a cloud write');
    w.found.update(found => [...found, id]); saved();
    assert.equal(w.count(), index + 1);
    assert.equal(w.card().id, id, 'show the saved gift message');
  });
  assert.equal(w.nextGift(), undefined);
  assert.equal(w.giftOpened.values.length, 6);
});

test('preserves non-sequential old progress and clears activity state on reset', () => {
  const { instance: w, saved } = world(['clip', 'earrings', 'bag']);
  assert.equal(w.nextGift().id, 'mirror');
  assert.equal(w.count(), 3);
  w.wakeMoon();
  w.found.update(found => [...found, 'mirror']); saved();
  assert.equal(w.nextGift().id, 'holder');
  w.clearCloud(0);
  w.found.set([]); saved();
  assert.equal(w.nextGift().id, 'mirror');
  assert.deepEqual(w.clearedClouds(), []);
  assert.equal(w.review(), null);
});

test('cannot reveal or confirm while cloud progress is unavailable or saving', () => {
  const { instance: w } = world();
  w.blocked.set(true); w.wakeMoon(); assert.equal(w.revealed(), null);
  w.blocked.set(false); w.wakeMoon(); w.saving.set(true); w.openGift();
  assert.deepEqual(w.giftOpened.values, []);
  w.saving.set(false); w.openGift(); assert.deepEqual(w.giftOpened.values, ['mirror']);
});

test('drag only completes the meeting when released on the moon', () => {
  const { instance: w } = world(['mirror']);
  const event = (x, y) => ({ button: 0, pointerId: 1, clientX: x, clientY: y, currentTarget: { setPointerCapture() {} } });
  const moon = { getBoundingClientRect: () => ({ left: 200, right: 300, top: 50, bottom: 160 }) };
  w.startDrag(event(40, 80)); w.moveDrag(event(80, 80)); w.endDrag(event(80, 80), moon);
  assert.equal(w.revealed(), null);
  assert.equal(w.dragging(), false);
  w.startDrag(event(40, 80)); w.moveDrag(event(250, 100)); w.endDrag(event(250, 100), moon);
  assert.equal(w.revealed(), 'clip');
  assert.deepEqual(w.dragOffset(), { x: 0, y: 0 });
});
