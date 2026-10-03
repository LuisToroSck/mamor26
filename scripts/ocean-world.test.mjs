import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { signal, computed, untracked } from '@angular/core';
import { typeScriptUrl } from './load-typescript.mjs';
const catalogUrl = await typeScriptUrl('../src/app/adventure.data.ts');

// Test the actual activity methods with real signals and explicit input/effect scheduling.
// Rendering and Angular template types are validated by the production build.
let scheduled = [];
const mockInput = value => signal(value);
mockInput.required = () => signal([]);
globalThis.__oceanTestAngular = {
  signal, computed, untracked, input: mockInput,
  Component: () => target => target,
  ViewChild: () => () => {},
  effect: callback => { scheduled.push(callback); },
  output: () => ({ values: [], emit(value) { this.values.push(value); } })
};
const source = await readFile(new URL('../src/app/ocean-world/ocean-world.component.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022, experimentalDecorators: true
} }).outputText.replace(/import \{([^}]+)\} from '@angular\/core';/, 'const {$1} = globalThis.__oceanTestAngular;');
const { OceanWorldComponent, OCEAN_GIFTS } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
function world(found = []) {
  scheduled = [];
  const instance = new OceanWorldComponent();
  const effects = [...scheduled];
  instance.found.set(found);
  effects.forEach(fn => fn());
  return { instance, saved: () => effects.forEach(fn => fn()) };
}

test('two activities reveal gifts without package markings and require confirmation', () => {
  const { instance: w, saved } = world();
  w.openGift(); assert.deepEqual(w.giftOpened.values, []);
  w.followFish(); w.followFish(); assert.equal(w.revealed(), null);
  w.followFish(); assert.equal(w.revealed(), 'fish-clip');
  w.followFish(); assert.equal(w.visits(), 3);
  assert.equal(w.card().name, 'Pinche de pelo con forma de pez');
  w.openGift(); assert.deepEqual(w.giftOpened.values, ['fish-clip']);
  assert.equal(w.count(), 0);
  w.found.set(['fish-clip']); saved();
  assert.equal(w.nextGift().id, 'fish-rings');
  assert.equal(w.review(), null);
  assert.equal(w.card(), undefined, 'the old gift card must not obscure progression');
  assert.equal(w.savedGift().id, 'fish-clip');
  let focused = false, scrolled = false;
  w.activity = { nativeElement: { focus() { focused = true; }, scrollIntoView() { scrolled = true; } } };
  w.ngAfterViewChecked();
  assert.equal(focused, true); assert.equal(scrolled, true);
  w.search(0); assert.deepEqual(w.friends(), []); assert.ok(w.feedback());
  w.search(1); w.search(1); assert.deepEqual(w.friends(), [1]);
  w.search(4); assert.equal(w.revealed(), 'fish-rings');
  assert.equal(w.card().name, 'Los dos anillos con forma de pez');
  w.openGift(); assert.equal(w.count(), 1);
  w.found.set(['fish-clip', 'fish-rings']); saved();
  assert.equal(w.count(), 2); assert.equal(w.nextGift(), undefined);
});

test('saved progress survives reload and resets cleanly across both chapters', () => {
  const { instance: w, saved } = world(['mirror', 'clip', 'earrings', 'holder', 'bag', 'scrunchie', 'fish-rings']);
  assert.equal(w.count(), 1); assert.equal(w.nextGift().id, 'fish-clip');
  w.followFish(); assert.equal(w.visits(), 1);
  w.found.set([]); saved();
  // Same nextGift identity: a shared reset must clear unfinished activity too.
  // Activities are transient; the parent remounts this world when chapter I becomes incomplete.
  const fresh = world().instance;
  assert.equal(fresh.visits(), 0); assert.equal(fresh.count(), 0);
});

test('unavailable cloud or pending save cannot reveal or confirm a gift', () => {
  const { instance: w } = world();
  w.blocked.set(true); w.followFish(); assert.equal(w.visits(), 0);
  w.blocked.set(false); w.followFish(); w.followFish(); w.followFish();
  w.saving.set(true); w.openGift(); assert.deepEqual(w.giftOpened.values, []);
  w.saving.set(false); w.openGift(); assert.deepEqual(w.giftOpened.values, ['fish-clip']);
  const second = world(['fish-clip']).instance;
  second.blocked.set(true); second.search(1); assert.deepEqual(second.friends(), []);
});

test('map locks the ocean until all six solar gifts exist, independently of total count', async () => {
  const rootSource = await readFile(new URL('../src/app/app.component.ts', import.meta.url), 'utf8');
  const found = signal(['mirror', 'clip', 'earrings', 'holder', 'bag', 'fish-clip']);
  globalThis.__chapterProgress = { found, loading: () => false, reset: async () => { found.set([]); return true; } };
  globalThis.__chapterComponents = {
    SolarWorldComponent: {}, OceanWorldComponent: {}, OCEAN_GIFTS,
    SOLAR_GIFTS: ['mirror', 'clip', 'earrings', 'holder', 'bag', 'scrunchie'].map(id => ({ id }))
  };
  const rootJs = ts.transpileModule(rootSource, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022, experimentalDecorators: true
  } }).outputText
    .replace(/import \{([^}]+)\} from '@angular\/core';/, 'const {$1} = {...globalThis.__oceanTestAngular, inject: () => globalThis.__chapterProgress};')
    .replace(/import \{ ProgressService \} from '.\/progress.service';/, 'const ProgressService = {};')
    .replace(/import \{[^}]+\} from '.\/solar-world\/solar-world.component';/, 'const {SolarWorldComponent, SOLAR_GIFTS} = globalThis.__chapterComponents;')
    .replace(/import \{[^}]+\} from '.\/ocean-world\/ocean-world.component';/, 'const {OceanWorldComponent, OCEAN_GIFTS} = globalThis.__chapterComponents;')
    .replace(/import \{[^}]+\} from '.\/chapter-world\/chapter-world.component';/, 'const ChapterWorldComponent = {};')
    .replace("from './adventure.data'", "from '" + catalogUrl + "'" );
  const { AppComponent } = await import('data:text/javascript;base64,' + Buffer.from(rootJs).toString('base64'));
  const app = new AppComponent();
  app.openWorld(1); assert.equal(app.screen(), 'welcome');
  assert.equal(app.worldAvailable(1), false);
  found.update(ids => [...ids, 'scrunchie']);
  app.openWorld(1); assert.equal(app.screen(), 'ocean');
  assert.equal(app.worldStatus(0), '✓'); assert.equal(app.worldStatus(1), '↗');
  found.update(ids => [...ids, 'fish-rings']); assert.equal(app.worldStatus(1), '✓');
  assert.equal(app.worldAvailable(2), true);
  app.worlds.slice(2).forEach((chapter, offset) => {
    const index = offset + 2;
    app.openWorld(index); assert.equal(app.screen(), 'chapter');
    assert.equal(app.chapterIndex(), index);
    if (index < 6) assert.equal(app.worldAvailable(index + 1), false);
    found.update(ids => [...ids, ...chapter.gifts.map(gift => gift.id)]);
  });
  assert.equal(app.mainComplete(), true);
  assert.equal(app.allComplete(), false);
  app.finishAdventure(); assert.equal(app.screen(), 'frog');
  found.update(ids => [...ids, 'frog-incense']);
  app.finishAdventure(); assert.equal(app.screen(), 'letter');
  await app.resetProgress();
  assert.equal(app.screen(), 'welcome'); assert.equal(app.chapterIndex(), 0);
  assert.deepEqual(found(), []); assert.equal(app.worldAvailable(1), false);
});
