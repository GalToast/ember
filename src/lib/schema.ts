// Ember deck schema — content-as-code. Every card is one of five types at one heat level.
export type CardType = 'truth' | 'dare' | 'challenge' | 'ice' | 'topic';
export type DeckId = 'spark' | 'closer' | 'slowburn' | 'afterdark' | 'curious' | 'inferno';

export interface Card {
  id: string;
  deck: DeckId;
  type: CardType;
  /** heat level 1-4; a "spice bomb" is a card hotter than its deck's baseline */
  level: 1 | 2 | 3 | 4;
  text: string;
  /** optional second line the player delivers WHILE the dare happens */
  speak?: string;
  /** timebox in seconds (dares/challenges) */
  timebox?: number;
  /** auto-generated lower-heat variant */
  soften?: string;
  /** both partners play simultaneously */
  together?: boolean;
  /** spice bomb: surprising heat for its deck; draw engine occasionally favors these */
  bomb?: boolean;
  /** love language this card primarily hits: words of affirmation | quality time | physical touch | acts of service | receiving gifts */
  love?: 'words' | 'time' | 'touch' | 'service' | 'gifts';
}
