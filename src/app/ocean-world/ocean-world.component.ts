import { AfterViewChecked, Component, computed, effect, ElementRef, input, output, signal, untracked, ViewChild } from '@angular/core';

export const OCEAN_GIFTS = [
  { id: 'fish-clip', name: 'Pinche de pelo con forma de pez', message: 'Este pececito quería encontrar un lugar cerca de ti.' },
  { id: 'fish-rings', name: 'Los dos anillos con forma de pez', message: 'Estos dos no querían separarse. Ahora te acompañan juntos.' }
] as const;

@Component({ selector: 'app-ocean-world', templateUrl: './ocean-world.component.html', styleUrl: './ocean-world.component.css' })
export class OceanWorldComponent implements AfterViewChecked {
  readonly found = input.required<readonly string[]>();
  readonly blocked = input(false);
  readonly saving = input(false);
  readonly saveError = input('');
  readonly retry = output<void>();
  readonly giftOpened = output<string>();
  readonly back = output<void>();
  readonly nextWorld = output<void>();
  readonly gifts = OCEAN_GIFTS;
  readonly nextGift = computed(() => this.gifts.find(gift => !this.found().includes(gift.id)));
  readonly count = computed(() => this.gifts.filter(gift => this.found().includes(gift.id)).length);
  readonly revealed = signal<string | null>(null);
  readonly review = signal<string | null>(null);
  readonly savedNotice = signal<string | null>(null);
  readonly savedGift = computed(() => this.gifts.find(gift => gift.id === this.savedNotice()));
  @ViewChild('activity') private activity?: ElementRef<HTMLElement>;
  private focusNextActivity = false;
  readonly card = computed(() => this.gifts.find(gift => gift.id === (this.review() ?? this.revealed())));
  readonly visits = signal(0);
  readonly friends = signal<number[]>([]);
  readonly feedback = signal('');
  readonly help = signal(false);
  readonly fishPositions = [{ x: 22, y: 30 }, { x: 68, y: 48 }, { x: 38, y: 65 }];
  readonly hidingPlaces = ['concha', 'alga', 'coral', 'roca', 'caracola'];

  constructor() {
    effect(() => {
      this.nextGift();
      const opened = untracked(() => this.revealed());
      const saved = opened && untracked(() => this.found().includes(opened));
      this.revealed.set(null);
      this.review.set(null);
      this.savedNotice.set(saved ? opened : null);
      this.focusNextActivity = !!saved;
      this.visits.set(0);
      this.friends.set([]);
      this.feedback.set('');
      this.help.set(false);
    });
  }

  ngAfterViewChecked(): void {
    if (!this.focusNextActivity || !this.activity) return;
    this.focusNextActivity = false;
    const element = this.activity.nativeElement;
    element.focus({ preventScroll: true });
    element.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  followFish(): void {
    if (this.blocked() || this.saving() || this.nextGift()?.id !== 'fish-clip' || this.revealed()) return;
    this.visits.update(value => value + 1);
    if (this.visits() === 3) this.reveal();
  }
  search(index: number): void {
    if (this.blocked() || this.saving() || this.nextGift()?.id !== 'fish-rings' || this.revealed() || index < 0 || index >= 5) return;
    if (index === 1 || index === 4) {
      if (this.friends().includes(index)) return;
      this.friends.update(friends => [...friends, index]);
      this.feedback.set('¡Aquí estaba uno! Su amigo debe estar cerquita.');
      if (this.friends().length === 2) this.reveal();
    } else {
      this.feedback.set('Aquí solo hay burbujitas. Mira en otro rincón, sin apuro.');
    }
  }
  private reveal(): void {
    this.review.set(null);
    this.revealed.set(this.nextGift()?.id ?? null);
  }
  openGift(): void {
    const gift = this.nextGift();
    if (gift && this.revealed() === gift.id && !this.blocked() && !this.saving()) this.giftOpened.emit(gift.id);
  }
  reviewGift(id: string): void { if (this.found().includes(id)) this.review.set(id); }
}
