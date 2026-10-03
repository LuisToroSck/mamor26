import { AfterViewChecked, Component, computed, effect, ElementRef, input, output, signal, untracked, ViewChild } from '@angular/core';
import { ChapterDefinition } from '../adventure.data';

@Component({ selector: 'app-chapter-world', templateUrl: './chapter-world.component.html', styleUrls: ['./chapter-world.component.css', './chapter-scenes.css'] })
export class ChapterWorldComponent implements AfterViewChecked {
  readonly chapter = input.required<ChapterDefinition>();
  readonly found = input.required<readonly string[]>();
  readonly blocked = input(false);
  readonly saving = input(false);
  readonly saveError = input('');
  readonly nextLabel = input('Continuar la aventura →');
  readonly giftOpened = output<string>();
  readonly back = output<void>();
  readonly nextWorld = output<void>();
  readonly retry = output<void>();
  readonly nextGift = computed(() => this.chapter().gifts.find(gift => !this.found().includes(gift.id)));
  readonly count = computed(() => this.chapter().gifts.filter(gift => this.found().includes(gift.id)).length);
  readonly ready = signal<string | null>(null);
  readonly review = signal<string | null>(null);
  readonly savedNotice = signal<string | null>(null);
  readonly savedGift = computed(() => this.chapter().gifts.find(gift => gift.id === this.savedNotice()));
  readonly card = computed(() => this.chapter().gifts.find(gift => gift.id === (this.review() ?? this.ready())));
  readonly taps = signal<number[]>([]);
  readonly stage = signal(0);
  readonly selectedColor = signal('');
  readonly painting = signal<string[]>(['', '', '']);
  readonly colors = ['#dab2d5', '#e6c58c', '#94c5cf'];
  readonly colorNames = ['Lavanda', 'Dorado', 'Azul agua'];
  readonly help = signal(false);
  @ViewChild('activity') private activity?: ElementRef<HTMLElement>;
  private focusNext = false;

  readonly narration = computed(() => {
    if (!this.nextGift()) return 'Mira lo que construiste. Este rincón del universo ya tiene algo de ti.';
    if (this.ready()) return 'Terminaste la pequeña magia. Alguien tiene una sorpresa para entregarte.';
    switch (this.nextGift()?.activity) {
      case 'grow': return this.stage() === 0 ? 'El jardín empieza con algo muy pequeño. Planta una semilla.' : this.stage() < 3 ? 'Nuestra plantita tiene sed. Dale un poquito de agua.' : '¡Creció! Dos habitantes se esconden entre sus hojas.';
      case 'fireflies': return 'Tres luciérnagas quieren mostrarle el camino a la luna. Enciéndelas en orden.';
      case 'spiral': return 'Una pequeña espiral guarda el ritmo del jardín. Hazla girar y mira cómo florece.';
      case 'pumpkins': return 'Alguien se esconde detrás de estas calabazas. ¿Le hacemos una visita?';
      case 'steam': return 'Después de tanto explorar, el vapor quiere dibujar un corazón. Une sus tres nubecitas.';
      case 'blend': return this.stage() < 3 ? 'Preparemos algo rico: agrega tres aromas a la tetera.' : 'Ahora remueve suavemente dos veces. El aroma ya llega hasta aquí.';
      case 'warmth': return this.stage() < 3 ? 'Guardemos un poquito de esta pausa. Reúne tres chispitas de calor.' : 'Ya está calentito. Cierra la tapa para que el calor nos acompañe.';
      case 'paint': return 'Elige colores y pinta las tres partes de este cielo. Que cada una tenga su propia luz.';
      case 'prepare': return 'Hay alguien en camino. Preparemos un rincón suave, una luz y un poquito de cariño.';
      case 'door': return 'Se escucha algo al otro lado de la puerta. Llama tres veces, sin apuro.';
      default: return this.stage() < 3 ? 'Nuestra compañera quiere cruzar el estanque. Ayúdala a saltar por los tres nenúfares.' : 'Llegó a su rincón. Enciende sus dos lucecitas para darle la bienvenida.';
    }
  });

  constructor() {
    effect(() => {
      this.nextGift();
      const opened = untracked(() => this.ready());
      const saved = opened && untracked(() => this.found().includes(opened));
      this.ready.set(null); this.review.set(null); this.savedNotice.set(saved ? opened : null);
      this.stage.set(0); this.taps.set([]); this.painting.set(['', '', '']); this.selectedColor.set(''); this.help.set(false);
      this.focusNext = !!saved;
    });
  }
  ngAfterViewChecked(): void {
    if (!this.focusNext || !this.activity) return;
    this.focusNext = false;
    this.activity.nativeElement.focus({ preventScroll: true });
    this.activity.nativeElement.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  private active(): boolean { return !!this.nextGift() && !this.blocked() && !this.saving() && !this.ready(); }
  private reveal(): void { this.review.set(null); this.ready.set(this.nextGift()?.id ?? null); }
  tap(index: number): void {
    if (!this.active() || !Number.isInteger(index) || index < 0 || index > 2) return;
    const kind = this.nextGift()?.activity;
    if (kind === 'grow' && this.stage() < 3) return;
    if (this.taps().includes(index)) return;
    if ((kind === 'fireflies' || kind === 'steam') && index !== this.taps().length) return;
    if (kind === 'frog' && this.stage() < 3) {
      if (index !== this.stage()) return;
      this.stage.update(stage => stage + 1); return;
    }
    this.taps.update(taps => [...taps, index]);
    const target = kind === 'grow' || kind === 'frog' ? 2 : 3;
    if (kind === 'blend' || kind === 'warmth') {
      this.stage.set(this.taps().length); return;
    }
    if (this.taps().length === target) this.reveal();
  }
  advance(): void {
    if (!this.active()) return;
    const kind = this.nextGift()?.activity;
    if (kind === 'grow') { if (this.stage() < 3) this.stage.update(stage => stage + 1); }
    else if (kind === 'blend') { if (this.stage() >= 3) { this.stage.update(stage => stage + 1); if (this.stage() === 5) this.reveal(); } }
    else if (kind === 'warmth') { if (this.stage() === 3) this.reveal(); }
    else if (kind === 'spiral' || kind === 'door') {
      this.stage.update(stage => stage + 1);
      if (this.stage() === (kind === 'spiral' ? 4 : 3)) this.reveal();
    }
  }
  chooseColor(index: number): void { if (this.active() && this.nextGift()?.activity === 'paint' && this.colors[index]) this.selectedColor.set(this.colors[index]); }
  paint(index: number): void {
    if (!this.active() || this.nextGift()?.activity !== 'paint' || !this.selectedColor() || index < 0 || index > 2) return;
    this.painting.update(parts => parts.map((color, i) => i === index ? this.selectedColor() : color));
    if (this.painting().every(Boolean) && new Set(this.painting()).size === 3) this.reveal();
  }
  openGift(): void {
    const gift = this.nextGift();
    if (gift && this.ready() === gift.id && !this.blocked() && !this.saving()) this.giftOpened.emit(gift.id);
  }
  reviewGift(id: string): void { if (this.found().includes(id)) this.review.set(id); }
}
