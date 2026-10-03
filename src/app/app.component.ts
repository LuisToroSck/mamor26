import { Component, inject, signal } from '@angular/core';
import { ProgressService } from './progress.service';
import { SolarWorldComponent } from './solar-world/solar-world.component';
import { OceanWorldComponent } from './ocean-world/ocean-world.component';
import { ChapterWorldComponent } from './chapter-world/chapter-world.component';
import { ALL_GIFTS, canOpenChapter, chapterComplete, CHAPTERS, FINAL_LETTER, SECRET, TOTAL_GIFTS } from './adventure.data';

@Component({ selector: 'app-root', imports: [SolarWorldComponent, OceanWorldComponent, ChapterWorldComponent], templateUrl: './app.component.html', styleUrl: './app.component.css' })
export class AppComponent {
  readonly screen = signal<'welcome' | 'map' | 'world' | 'ocean' | 'chapter' | 'frog' | 'collection' | 'letter'>('welcome');
  readonly chapterIndex = signal(0);
  readonly progress = inject(ProgressService);
  readonly found = this.progress.found;
  readonly confirmingReset = signal(false);
  readonly worlds = CHAPTERS;
  readonly secret = SECRET;
  readonly allGifts = ALL_GIFTS;
  readonly total = TOTAL_GIFTS;
  readonly letter = FINAL_LETTER;
  readonly frogVisits = signal(0);
  discover(id: string) { void this.progress.discover(id); }
  solarComplete(): boolean { return chapterComplete(0, this.found()); }
  worldAvailable(index: number): boolean { return canOpenChapter(index, this.found()); }
  worldStatus(index: number): string {
    if (!this.worldAvailable(index)) return 'Por descubrir';
    return chapterComplete(index, this.found()) ? '✓' : '↗';
  }
  openWorld(index: number): void {
    if (!this.worldAvailable(index)) return;
    this.chapterIndex.set(index);
    this.screen.set(index === 0 ? 'world' : index === 1 ? 'ocean' : 'chapter');
  }
  nextChapter(): void {
    if (this.chapterIndex() < this.worlds.length - 1) this.openWorld(this.chapterIndex() + 1);
    else this.finishAdventure();
  }
  allComplete(): boolean { return this.allGifts.every(gift => this.found().includes(gift.id)); }
  mainComplete(): boolean { return this.worlds.every((_, index) => chapterComplete(index, this.found())); }
  nextLabel(): string { return this.chapterIndex() === this.worlds.length - 1 ? 'Ver el final de mi aventura ♡' : 'Continuar la aventura →'; }
  visitCompanion(): void {
    if (!this.solarComplete() || this.progress.loading()) return;
    this.frogVisits.update(visits => visits + 1);
    if (this.frogVisits() >= 3 || this.mainComplete() || this.found().includes('frog-incense')) this.screen.set('frog');
  }
  finishAdventure(): void {
    this.screen.set(this.allComplete() ? 'letter' : this.mainComplete() ? 'frog' : 'map');
  }
  async resetProgress(): Promise<void> {
    if (await this.progress.reset()) {
      this.screen.set('welcome'); this.chapterIndex.set(0); this.frogVisits.set(0); this.confirmingReset.set(false);
    }
  }
}
