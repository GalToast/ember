/**
 * Ember state machine — typed screens, events, and state.
 *
 * Phase 1 of the refactor: extract types and initial state.
 * App.svelte keeps current logic but uses these types.
 */

import type { Card, DeckId } from './schema';
import type { Mode, NightState, Persisted } from './game.svelte';
import { DEFAULT_HEAT_CEILING, load, loadNight } from './game.svelte';

// ---- Screens (discriminated union) ----

export type Screen =
  | { type: 'setup' }
  | { type: 'splash'; firstNight: boolean }
  | { type: 'play'; card: Card; soft: boolean; landing: boolean }
  | { type: 'browse' }
  | { type: 'handoff'; turn: 'a' | 'b'; ptp: boolean }
  | { type: 'private'; card: Card; turn: 'a' | 'b' }
  | { type: 'custom' }
  | { type: 'celebrate'; cards: number; nights: number; tokens: Tokens; release: ReleaseState | null };

// ---- Events (discriminated union) ----

export type Event =
  | { type: 'START' }
  | { type: 'RESUME' }
  | { type: 'RESTART' }
  | { type: 'NEXT' }
  | { type: 'SKIP' }
  | { type: 'SOFTEN' }
  | { type: 'RETIRE' }
  | { type: 'COMMAND' }
  | { type: 'RELEASE_GIFT' }
  | { type: 'RELEASE_SPEND' }
  | { type: 'END' }
  | { type: 'HOME' }
  | { type: 'BROWSE' }
  | { type: 'BROWSE_CLOSE' }
  | { type: 'CUSTOM' }
  | { type: 'CUSTOM_CLOSE' }
  | { type: 'PTP_START' }
  | { type: 'PTP_NEXT' }
  | { type: 'PTP_DONE' }
  | { type: 'PTP_HANDOFF_DONE' }
  | { type: 'PTP_EXIT' }
  | { type: 'PTP_END' }
  | { type: 'SET_STAGE_MODE'; value: boolean };

// ---- Supporting types ----

export type Turn = 'a' | 'b';

export interface Tokens {
  a: number;
  b: number;
}

export type ReleaseState =
  | { holder: Turn; state: 'held' }
  | { holder: Turn; state: 'spent' }
  | { holder: Turn; state: 'gifted' };

// ---- Full application state ----

export interface State {
  screen: Screen;
  night: NightState;
  persisted: Persisted;
  stageMode: boolean;
}

// ---- Initial state factory ----

export function createInitialState(): State {
  const persisted = load();
  const savedNight = loadNight();

  const night: NightState = savedNight ?? {
    mode: 'mixup',
    decks: ['spark', 'closer', 'slowburn', 'afterdark', 'curious'],
    cardId: null,
    count: 0,
    skips: 6,
    seen: [],
    loveCounts: {},
    drawIndex: 0,
    lastBombIndex: -99,
    safeword: '',
    landing: false,
    tokens: { a: 3, b: 3 },
    turn: 'a',
    release: { holder: 'b', state: 'held' },
  };

  return {
    screen: { type: 'setup' },
    night,
    persisted,
    stageMode: false,
  };
}

// ---- Type guards ----

export function isPlayScreen(screen: Screen): screen is Extract<Screen, { type: 'play' }> {
  return screen.type === 'play';
}

export function isSplashScreen(screen: Screen): screen is Extract<Screen, { type: 'splash' }> {
  return screen.type === 'splash';
}

export function isPrivateScreen(screen: Screen): screen is Extract<Screen, { type: 'private' }> {
  return screen.type === 'private';
}

export function isHandoffScreen(screen: Screen): screen is Extract<Screen, { type: 'handoff' }> {
  return screen.type === 'handoff';
}

// ---- Selector helpers (derived state) ----

export function currentCard(state: State): Card | null {
  if (state.screen.type === 'play') return state.screen.card;
  if (state.screen.type === 'private') return state.screen.card;
  return null;
}

export function isLanding(state: State): boolean {
  return state.screen.type === 'play' && state.screen.landing;
}

export function isSoft(state: State): boolean {
  return state.screen.type === 'play' && state.screen.soft;
}

export function canSoften(state: State): boolean {
  const card = currentCard(state);
  return !!(card?.soften);
}

export function canSkip(state: State): boolean {
  return state.night.skips > 0;
}

export function canCommand(state: State): boolean {
  const turn = state.night.turn;
  return (state.night.tokens[turn] ?? 0) > 0;
}

export function canEnd(state: State): boolean {
  // Can always end (warm landing or celebration)
  return state.screen.type === 'play' || state.screen.type === 'private';
}