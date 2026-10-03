import { Component, computed, effect, input, output, signal, untracked } from '@angular/core';

export const SOLAR_GIFTS = [
  { id: 'mirror', symbol: '☾', label: 'Luna', name: 'Espejo de mano Whimsi', message: 'Para que el día y la noche te acompañen donde vayas.' },
  { id: 'clip', symbol: '☀', label: 'Sol', name: 'Pinche dorado sol y luna', message: 'Un pedacito de cielo para llevar contigo.' },
  { id: 'earrings', symbol: '✦', label: 'Estrella', name: 'Aros Whimsi sol y luna', message: 'Porque hasta el cielo tiene su pareja favorita.' },
  { id: 'holder', symbol: '☯', label: 'Eclipse', name: 'Porta cenicero sol y luna', message: 'Una pequeña constelación para tu espacio.' },
  { id: 'bag', symbol: '✿', label: 'Flor', name: 'Cosmetiquero Whimsi', message: 'Para todas esas cositas que te hacen brillar.' },
  { id: 'scrunchie', symbol: '❋', label: 'Destello', name: 'Scrunchie Whimsi', message: 'Otro detalle mágico para tus días.' }
] as const;

@Component({
  selector: 'app-solar-world',
  templateUrl: './solar-world.component.html',
  styleUrls: ['./solar-world.component.css', './solar-sky.css']
})
export class SolarWorldComponent {
  readonly found = input.required<readonly string[]>();
  readonly blocked = input(false);
  readonly saving = input(false);
  readonly saveError = input('');
  readonly retry = output<void>();
  readonly giftOpened = output<string>();
  readonly back = output<void>();
  readonly nextWorld = output<void>();
  readonly gifts = SOLAR_GIFTS;
  readonly nextGift = computed(() => this.gifts.find(gift => !this.found().includes(gift.id)));
  readonly count = computed(() => this.gifts.filter(gift => this.found().includes(gift.id)).length);
  readonly revealed = signal<string | null>(null);
  readonly review = signal<string | null>(null);
  readonly card = computed(() => this.gifts.find(gift => gift.id === this.review() || gift.id === this.revealed()));
  readonly sunChosen = signal(false);
  readonly path = signal<number[]>([]);
  readonly clearedClouds = signal<number[]>([]);
  readonly litWindows = signal<number[]>([]);
  readonly cometCalled = signal(false);
  readonly help = signal(false);
  readonly dragging = signal(false);
  readonly dragOffset = signal({ x: 0, y: 0 });
  private pointerStart?: { x: number; y: number; id: number };

  readonly narration = computed(() => {
    if (!this.nextGift()) return 'Mira todo lo que despertaste. Este pequeño cielo ya tiene algo de ti.';
    if (this.revealed() === this.nextGift()?.id) return 'El cielo te dejó una sorpresa. Hay un paquete esperando por ti.';
    switch (this.nextGift()?.id) {
      case 'mirror': return 'La luna lleva un ratito dormida. ¿La despertamos?';
      case 'clip': return '«Me falta alguien con quien compartir el cielo», dice la luna.';
      case 'earrings': return 'El sol y la luna dejaron tres lucecitas. Juntas pueden dibujar algo bonito.';
      case 'holder': return 'Unas nubes se quedaron mirando las estrellas. Dales un empujoncito para que sigan su viaje.';
      case 'bag': return 'Debajo del cielo hay una casita. Todavía le falta un poquito de calor.';
      default: return 'Solo falta un deseo. Hay una estrella viajera que quiere escucharte.';
    }
  });
  readonly instruction = computed(() => {
    switch (this.nextGift()?.id) {
      case 'mirror': return 'Toca la luna para despertarla.';
      case 'clip': return 'Acerca el sol a la luna. También puedes tocar primero el sol y después la luna.';
      case 'earrings': return 'Une las estrellas tocando 1 → 2 → 3.';
      case 'holder': return 'Toca las tres nubes para despejar el cielo.';
      case 'bag': return 'Enciende las tres ventanas de la casita.';
      default: return 'Llama a la estrella, piensa en un deseo y ponla en tu cielo.';
    }
  });

  constructor() {
    // Derive the next activity from saved gifts, including progress from the old version.
    effect(() => {
      this.nextGift();
      const opened = untracked(() => this.revealed());
      const justSaved = opened && untracked(() => this.found().includes(opened));
      this.revealed.set(null);
      this.review.set(justSaved ? opened : null);
      this.sunChosen.set(false);
      this.path.set([]);
      this.clearedClouds.set([]);
      this.litWindows.set([]);
      this.cometCalled.set(false);
      this.help.set(false);
      this.dragging.set(false);
      this.dragOffset.set({ x: 0, y: 0 });
    });
  }

  reveal(): void {
    const gift = this.nextGift();
    if (gift && !this.blocked() && !this.saving()) {
      this.review.set(null);
      this.revealed.set(gift.id);
    }
  }
  wakeMoon(): void { if (this.nextGift()?.id === 'mirror') this.reveal(); }
  chooseSun(): void { if (!this.blocked()) this.sunChosen.set(true); }
  meetMoon(): void { if (this.sunChosen() && this.nextGift()?.id === 'clip') this.reveal(); }
  connectStar(index: number): void {
    if (this.blocked() || this.nextGift()?.id !== 'earrings' || index !== this.path().length) return;
    this.path.update(path => [...path, index]);
    if (this.path().length === 3) this.reveal();
  }
  clearCloud(index: number): void {
    if (this.blocked() || this.nextGift()?.id !== 'holder' || this.clearedClouds().includes(index)) return;
    this.clearedClouds.update(clouds => [...clouds, index]);
    if (this.clearedClouds().length === 3) this.reveal();
  }
  lightWindow(index: number): void {
    if (this.blocked() || this.nextGift()?.id !== 'bag' || this.litWindows().includes(index)) return;
    this.litWindows.update(windows => [...windows, index]);
    if (this.litWindows().length === 3) this.reveal();
  }
  callComet(): void { if (!this.blocked()) this.cometCalled.set(true); }
  placeComet(): void { if (this.cometCalled() && this.nextGift()?.id === 'scrunchie') this.reveal(); }
  openGift(): void {
    const gift = this.nextGift();
    if (gift && this.revealed() === gift.id && !this.blocked() && !this.saving()) this.giftOpened.emit(gift.id);
  }
  reviewGift(id: string): void {
    if (this.found().includes(id)) this.review.set(id);
  }
  startDrag(event: PointerEvent): void {
    if (this.blocked() || event.button !== 0) return;
    this.pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.dragging.set(true);
  }
  moveDrag(event: PointerEvent): void {
    if (!this.pointerStart || event.pointerId !== this.pointerStart.id) return;
    this.dragOffset.set({ x: event.clientX - this.pointerStart.x, y: event.clientY - this.pointerStart.y });
  }
  endDrag(event: PointerEvent, target: HTMLElement): void {
    if (!this.pointerStart || event.pointerId !== this.pointerStart.id) return;
    const bounds = target.getBoundingClientRect();
    if (event.clientX >= bounds.left - 16 && event.clientX <= bounds.right + 16 &&
        event.clientY >= bounds.top - 16 && event.clientY <= bounds.bottom + 16) {
      this.chooseSun();
      this.meetMoon();
    }
    this.cancelDrag();
  }
  cancelDrag(): void {
    this.pointerStart = undefined;
    this.dragging.set(false);
    this.dragOffset.set({ x: 0, y: 0 });
  }
}
