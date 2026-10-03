import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { signal, computed, untracked } from '@angular/core';
import { parseTemplate } from '@angular/compiler';
import { typeScriptUrl } from './load-typescript.mjs';
const dataUrl = await typeScriptUrl('../src/app/adventure.data.ts');
const { CHAPTERS, SECRET, ALL_GIFTS, GIFT_IDS, TOTAL_GIFTS, canOpenChapter, chapterComplete } = await import(dataUrl);
let scheduled = [];
const input = value => signal(value); input.required = () => signal(undefined);
globalThis.__chapterAngular = { signal, computed, untracked, input, Component: () => target => target,
  ViewChild: () => () => {}, effect: callback => scheduled.push(callback), output: () => ({ values: [], emit(value) { this.values.push(value); } }) };
const source = await readFile(new URL('../src/app/chapter-world/chapter-world.component.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022, experimentalDecorators: true } }).outputText
  .replace(/import \{([^}]+)\} from '@angular\/core';/, 'const {$1} = globalThis.__chapterAngular;');
const { ChapterWorldComponent } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
function world(chapter, found = []) {
  scheduled = []; const instance = new ChapterWorldComponent(); const effects = [...scheduled];
  instance.chapter.set(chapter); instance.found.set(found); effects.forEach(fn => fn());
  return { instance, saved: () => effects.forEach(fn => fn()) };
}
function play(w, kind) {
  if (kind === 'grow') { w.tap(0); assert.deepEqual(w.taps(), []); w.advance(); w.advance(); w.advance(); w.tap(0); w.tap(1); }
  else if (kind === 'spiral') { for (let i = 0; i < 4; i++) w.advance(); }
  else if (kind === 'blend') { w.advance(); assert.equal(w.stage(), 0); [0, 1, 2].forEach(i => w.tap(i)); w.advance(); w.advance(); }
  else if (kind === 'warmth') { w.advance(); assert.equal(w.ready(), null); [0, 1, 2].forEach(i => w.tap(i)); w.advance(); }
  else if (kind === 'paint') { w.paint(0); assert.equal(w.ready(), null); [0, 1, 2].forEach(i => { w.chooseColor(i); w.paint(i); }); }
  else if (kind === 'door') { for (let i = 0; i < 3; i++) w.advance(); }
  else if (kind === 'frog') { [0, 1, 2].forEach(i => w.tap(i)); w.tap(0); w.tap(1); }
  else [0, 1, 2].forEach(i => w.tap(i));
}

test('catalog has nineteen unique openings and exactly two cups plus a thermos', () => {
  assert.equal(TOTAL_GIFTS, 19); assert.equal(new Set(GIFT_IDS).size, 19);
  assert.deepEqual(CHAPTERS[4].gifts.map(g => g.id), ['cup-one', 'cup-two', 'thermos']);
  assert.equal(ALL_GIFTS.at(-1).id, 'frog-incense');
});
test('published-rule file matches every catalog ID and preserves Pokemon permissions', async () => {
  const rules = await readFile(new URL('../docs/firestore.rules', import.meta.url), 'utf8');
  const ids = [...rules.match(/found\.hasOnly\(\[([\s\S]*?)\]\)/)[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
  assert.deepEqual(ids, GIFT_IDS);
  assert.ok(rules.includes('found.size() <= 19'));
  assert.ok(rules.includes('match /collections/{owner}'));
  for (const owner of ['luis', 'martin', 'luis-ash']) assert.ok(rules.includes(`owner == "${owner}"`));
});
test('all chapters unlock in order and the secret does not block the route', () => {
  const found = [];
  CHAPTERS.forEach((chapter, index) => {
    assert.equal(canOpenChapter(index, found), true);
    if (index + 1 < CHAPTERS.length) assert.equal(canOpenChapter(index + 1, found), false);
    chapter.gifts.forEach(gift => found.push(gift.id)); assert.equal(chapterComplete(index, found), true);
  });
  assert.equal(found.length, 18); assert.equal(canOpenChapter(99, found), false);
  assert.equal(canOpenChapter(-1, found), false);
});
for (const chapter of [...CHAPTERS.slice(2), SECRET]) {
  test(`${chapter.title}: every activity needs completion and confirmed cloud progress`, () => {
    const { instance: w, saved } = world(chapter);
    chapter.gifts.forEach((gift, index) => {
      w.openGift(); assert.equal(w.giftOpened.values.length, index);
      w.blocked.set(true); w.tap(0); w.advance(); assert.equal(w.ready(), null);
      w.blocked.set(false); play(w, gift.activity);
      assert.equal(w.ready(), gift.id); assert.equal(w.count(), index);
      w.saving.set(true); w.openGift(); assert.equal(w.giftOpened.values.length, index);
      w.saving.set(false); w.openGift(); assert.equal(w.giftOpened.values.at(-1), gift.id);
      assert.equal(w.count(), index);
      w.found.update(ids => [...ids, gift.id]); saved();
      assert.equal(w.count(), index + 1); assert.equal(w.savedGift().id, gift.id);
      assert.equal(w.card(), undefined);
    });
    assert.equal(w.nextGift(), undefined);
  });
}
test('repeated taps do not count twice and reset preserves no pending activity', () => {
  const { instance: w, saved } = world(CHAPTERS[4]);
  w.tap(2); assert.deepEqual(w.taps(), []);
  w.tap(0); w.tap(0); assert.deepEqual(w.taps(), [0]);
  w.tap(1); w.tap(2); w.found.set(['cup-one']); saved();
  assert.equal(w.stage(), 0); assert.equal(w.nextGift().id, 'cup-two');
  w.found.set([]); saved(); assert.equal(w.nextGift().id, 'cup-one'); assert.equal(w.savedGift(), undefined);
});
function leakedNames(template) {
  const parsed = parseTemplate(template, 'test.html'); assert.equal(parsed.errors, null);
  let leaks = 0, confirmedNames = 0;
  function walk(nodes, confirmed = false) {
    for (const node of nodes ?? []) {
      if (node.constructor.name === 'IfBlock') {
        for (const branch of node.branches) {
          const expression = branch.expression?.source ?? '';
          walk(branch.children, confirmed || expression.includes('found().includes(gift.id)') || expression.includes('savedGift()'));
        }
      } else {
        if (node.value?.source?.includes('gift.name')) { if (confirmed) confirmedNames++; else leaks++; }
        walk(node.children, confirmed);
      }
    }
  }
  walk(parsed.nodes); return { leaks, confirmedNames };
}
test('gift names only render inside confirmed branches in all three world templates', async () => {
  for (const path of ['solar-world/solar-world.component.html', 'ocean-world/ocean-world.component.html', 'chapter-world/chapter-world.component.html']) {
    const template = await readFile(new URL('../src/app/' + path, import.meta.url), 'utf8');
    const result = leakedNames(template); assert.equal(result.leaks, 0, path); assert.ok(result.confirmedNames > 0, path);
    assert.equal(leakedNames(template + '<h2>{{ gift.name }}</h2>').leaks, 1, 'the regression check detects an early reveal');
  }
});
