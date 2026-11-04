export type Lang = 'ru' | 'en';

export interface Translations {
  score: string;
  best: string;
  combo: string;
  lines: string;
  gameOver: string;
  newRecord: string;
  yourScore: string;
  playAgain: string;
  revive: string;
  adBadge: string;
  reviveDesc: string;
  rateGame: string;
  howToPlay: string;
  rulesTitle: string;
  rulesStep1: string;
  rulesStep2: string;
  rulesStep3: string;
  rulesStep4: string;
  gotIt: string;
  pause: string;
  paused: string;
  resume: string;
  restart: string;
  soundOn: string;
  soundOff: string;
  language: string;
}

export const translations: Record<Lang, Translations> = {
  ru: {
    score: 'СЧЁТ',
    best: 'РЕКОРД',
    combo: 'КОМБО',
    lines: 'ЛИНИИ',
    gameOver: 'ИГРА ОКОНЧЕНА',
    newRecord: 'НОВЫЙ РЕКОРД!',
    yourScore: 'ТВОЙ СЧЁТ',
    playAgain: 'ИГРАТЬ СНОВА',
    revive: 'ВТОРОЙ ШАНС',
    adBadge: 'РЕКЛАМА',
    reviveDesc: 'Расчистить поле и продолжить',
    rateGame: 'ОЦЕНИТЬ ИГРУ',
    howToPlay: 'Как играть',
    rulesTitle: 'ПРАВИЛА ИГРЫ',
    rulesStep1: 'Перетаскивайте блоки на поле 8х8 или нажимайте на них для выбора.',
    rulesStep2: 'Заполняйте горизонтальные и вертикальные ряды, чтобы очищать их и получать очки.',
    rulesStep3: 'Очищайте несколько линий одновременно и делайте серии ходов для мощных комбо!',
    rulesStep4: 'Продумывайте порядок размещения: каждый раунд проходим, если расставлять фигуры с умом.',
    gotIt: 'ПОНЯТНО',
    pause: 'Пауза',
    paused: 'ПАУЗА',
    resume: 'ПРОДОЛЖИТЬ',
    restart: 'ЗАНОВО',
    soundOn: 'Звук включен',
    soundOff: 'Звук выключен',
    language: 'Язык',
  },
  en: {
    score: 'SCORE',
    best: 'BEST',
    combo: 'COMBO',
    lines: 'LINES',
    gameOver: 'GAME OVER',
    newRecord: 'NEW RECORD!',
    yourScore: 'YOUR SCORE',
    playAgain: 'PLAY AGAIN',
    revive: 'SECOND CHANCE',
    adBadge: 'AD',
    reviveDesc: 'Clear board and continue',
    rateGame: 'RATE GAME',
    howToPlay: 'How to Play',
    rulesTitle: 'HOW TO PLAY',
    rulesStep1: 'Drag blocks onto the 8x8 grid or tap to select and place them.',
    rulesStep2: 'Fill complete horizontal or vertical lines to clear them and score points.',
    rulesStep3: 'Clear multiple lines and build consecutive streaks for massive combo bonuses!',
    rulesStep4: 'Plan your move sequence carefully: every trio is solvable with smart strategy.',
    gotIt: 'GOT IT',
    pause: 'Pause',
    paused: 'PAUSED',
    resume: 'RESUME',
    restart: 'RESTART',
    soundOn: 'Sound On',
    soundOff: 'Sound Off',
    language: 'Language',
  },
};

export function normalizeLang(lang: string | null | undefined): Lang {
  if (!lang) return 'ru';
  const prefix = lang.slice(0, 2).toLowerCase();
  if (prefix === 'en') return 'en';
  if (prefix === 'ru' || prefix === 'be' || prefix === 'kk' || prefix === 'uk') {
    return 'ru';
  }
  return 'en';
}

export function getTranslation(lang: string): Translations {
  const norm = normalizeLang(lang);
  return translations[norm];
}

export function getLocalizedCheer(lines: number, combo: number, lang: string): string {
  const isRu = normalizeLang(lang) === 'ru';
  if (lines >= 4 || combo >= 5) return isRu ? 'НЕВЕРОЯТНО!' : 'UNBELIEVABLE!';
  if (lines === 3 || combo >= 4) return isRu ? 'ПОТРЯСАЮЩЕ!' : 'AMAZING!';
  if (lines === 2 || combo >= 3) return isRu ? 'ОТЛИЧНО!' : 'EXCELLENT!';
  if (combo === 2) return isRu ? 'СУПЕР!' : 'GREAT!';
  if (lines === 1) return isRu ? 'КРУТО!' : 'NICE!';
  return isRu ? 'ХОРОШО!' : 'GOOD!';
}
