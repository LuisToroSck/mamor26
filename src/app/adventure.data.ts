export interface GiftDefinition { id: string; name: string; message: string; activity: string; }
export interface ChapterDefinition { id: string; icon: string; title: string; description: string; gifts: GiftDefinition[]; }
const gift = (id: string, name: string, activity: string, message: string): GiftDefinition => ({ id, name, activity, message });

export const CHAPTERS: ChapterDefinition[] = [
  { id: 'solar', icon: '☀', title: 'El Sol y la Luna', description: 'Seis tesoros entre el día y la noche.', gifts: [
    gift('mirror', 'Espejo de mano Whimsi', 'moon', 'Una pequeña luna para acompañarte.'),
    gift('clip', 'Pinche dorado sol y luna', 'sun', 'Un pedacito de cielo para ti.'),
    gift('earrings', 'Aros Whimsi sol y luna', 'stars', 'Dos astros que se encontraron.'),
    gift('holder', 'Porta cenicero sol y luna', 'clouds', 'Una constelación para tu espacio.'),
    gift('bag', 'Cosmetiquero Whimsi', 'windows', 'Un refugio para tus pequeñas magias.'),
    gift('scrunchie', 'Scrunchie Whimsi', 'wish', 'Un detalle mágico para tus días.')
  ] },
  { id: 'ocean', icon: '🐟', title: 'Bajo el agua', description: 'Un pez y sus dos amigos te esperan.', gifts: [
    gift('fish-clip', 'Pinche de pelo con forma de pez', 'fish', 'Este pececito quería quedarse cerquita de ti.'),
    gift('fish-rings', 'Los dos anillos con forma de pez', 'friends', 'Estos dos no querían separarse.')
  ] },
  { id: 'garden', icon: '🪲', title: 'El jardín de los bichitos', description: 'Pequeñas vidas, grandes sorpresas.', gifts: [
    gift('bug-scrunchies', 'Los dos scrunchies de bichos', 'grow', 'Dos pequeños habitantes para acompañar tus días.'),
    gift('moon-hanger', 'Colgante de luna para aros y collares', 'fireflies', 'Esta luna quería cuidar tus tesoros.'),
    gift('spiral-ring', 'Anillo de espiral', 'spiral', 'Las cosas bonitas a veces dan muchas vueltas antes de encontrarse.')
  ] },
  { id: 'spooky', icon: '🎃', title: 'La noche spooky', description: 'Un sustito que termina en cariño.', gifts: [
    gift('pumpkin-earrings', 'Aros de calabaza', 'pumpkins', 'Un poquito de Halloween para cualquier día del año.')
  ] },
  { id: 'tea', icon: '☕', title: 'Un descanso', description: 'Tres momentos para entrar en calor.', gifts: [
    gift('cup-one', 'La primera taza', 'steam', 'Para tus primeros sorbitos y nuestras pausas favoritas.'),
    gift('cup-two', 'La segunda taza', 'blend', 'Porque siempre puede haber otra excusa para compartir algo rico.'),
    gift('thermos', 'Termo con diseño de teteras antiguas', 'warmth', 'Para llevarte un poquito de calor cuando salgas.')
  ] },
  { id: 'beauty', icon: '✧', title: 'El camerino mágico', description: 'Pinta un cielo a tu manera.', gifts: [
    gift('nyx-palette', 'Paleta de sombras NYX', 'paint', 'Esta era una de esas sorpresas que estabas esperando. Ahora, a crear cosas bonitas.')
  ] },
  { id: 'home', icon: '♡', title: 'La casita de Chiikawa', description: 'Un hogar para dos visitantes.', gifts: [
    gift('chiikawa', 'Peluche de Chiikawa', 'prepare', 'Alguien muy pequeñito quería darte un abrazo enorme.'),
    gift('hachiware', 'Peluche de Hachiware', 'door', 'Su amigo también quería quedarse contigo. Ahora están los dos.')
  ] }
];
export const SECRET: ChapterDefinition = { id: 'secret', icon: '🐸', title: 'Una pequeña compañera', description: 'Alguien te acompañó durante toda la aventura.', gifts: [
  gift('frog-incense', 'Rana porta incienso de cerámica', 'frog', 'Parece que nuestra pequeña compañera también quería quedarse en tu mundo.')
] };
export const ALL_GIFTS = [...CHAPTERS.flatMap(chapter => chapter.gifts), ...SECRET.gifts];
export const GIFT_IDS = ALL_GIFTS.map(item => item.id);
export const TOTAL_GIFTS = ALL_GIFTS.length;
export function chapterComplete(index: number, found: readonly string[]): boolean {
  const chapter = CHAPTERS[index];
  return !!chapter && chapter.gifts.every(item => found.includes(item.id));
}
export function canOpenChapter(index: number, found: readonly string[]): boolean {
  return Number.isInteger(index) && index >= 0 && index < CHAPTERS.length &&
    CHAPTERS.slice(0, index).every(chapter => chapter.gifts.every(item => found.includes(item.id)));
}
export const FINAL_LETTER = `Hasta aquí llega nuestra aventura de descubrir rekalos mamor.

También fue parte de los regalos que quería hacerte, espero que le haya kustado.

Gracias por dejarme acompañarte en este día tan importante que es para ti y que hace un par de años ya lo es también para mí jjj.

Feliz cumpleaños, mi mamor. Te amo mucho. ♡ `
;
