/**
 * Ember state-machine reducer — Phase 2 of the refactor.
 *
 * Pure transition function: (State, Event) -> State.
 * Every screen transition flows through here so invalid states are
 * impossible by construction and every transition is testable.
 *
 * Phase 2 scope: the play-screen transitions (START, NEXT, SKIP, SOFTEN,
 * RETIRE, END). The remaining screens (browse, custom, handoff, private)
 * stay in App.svelte until Phase 3.
 */

import type { Card } from './schema';
import type { NightState } from './game.svelte';
import { draw, drawWarmLanding, save, saveNight, clearNight, trackLove, seedSeen, load } from './game.svelte';
import type { State, Screen, Event, Turn, Tokens, ReleaseState } from './machine';

// ---- Transition helpers ----

function playScreen(card: Card, soft: boolean, landing: boolean): Screen {
  return { type: 'play', card, soft, landing };
}

function advanceNight(state: State, except?: Card): State {
  const c = draw(
    state.night.mode,
    state.night.decks,
    state.persisted.retired,
    state.night,
    except,
    state.persisted.custom ?? [],
  );
  if (!c) return endNight(state);

  const night: NightState = {
    ...state.night,
    drawIndex: state.night.drawIndex + 1,
    seen: [...state.night.seen, c.id],
    cardId: c.id,
    turn: state.night.turn === 'a' ? 'b' : 'a',
    lastType: c.type,
    typeRun: state.night.lastType === c.type ? (state.night.typeRun ?? 0) + 1 : 1,
  };
  trackLove(night, c);

  return {
    ...state,
    screen: playScreen(c, false, false),
    night,
  };
}

function endNight(state: State): State {
  // Warm landing: one final gentle card before the celebration (peak-end rule)
  if (!state.night.landing) {
    const w = drawWarmLanding(state.night.decks, state.persisted.retired);
    if (w) {
      return { ...state, screen: playScreen(w, false, true), night: { ...state.night, landing: true } };
    }
  }

  // Capture final state before clearing
  const finalTokens: Tokens = { ...(state.night.tokens ?? { a: 0, b: 0 }) };
  const finalLoves = { ...(state.night.loveCounts ?? {}) };

  // Persist the night log
  const nights = [...state.persisted.nights, {
    date: new Date().toISOString().slice(0, 10),
    cards: state.night.count,
    mode: state.night.mode,
    loves: finalLoves,
    tokensSpent: {
      a: 3 - (finalTokens.a ?? 0),
      b: 3 - (finalTokens.b ?? 0),
    },
  }];
  save({ ...state.persisted, nights });
  clearNight();

  return {
    ...state,
    screen: {
      type: 'celebrate',
      cards: state.night.count,
      nights: nights.length,
      tokens: finalTokens,
      release: (state.night.release as ReleaseState) ?? null,
    },
    night: { ...state.night, landing: false },
    persisted: { ...state.persisted, nights },
  };
}

// ---- The reducer ----

export function reducer(state: State, event: Event): State {
  switch (event.type) {
    case 'START':
      return {
        ...state,
        screen: { type: 'splash', firstNight: state.persisted.nights.length === 0 },
      };

    case 'START_NIGHT':
      // begin() dispatches this after resetting night state. It draws the first
      // card and transitions to play. Unlike NEXT, it works from ANY screen
      // (splash, setup) because it's the entry point, not a mid-play advance.
      return advanceNight(state);

    case 'NEXT':
    case 'SKIP': {
      if (state.screen.type !== 'play') return state;
      const except = state.screen.card;
      return advanceNight({ ...state, night: { ...state.night, count: state.night.count + 1, skips: event.type === 'SKIP' ? state.night.skips - 1 : state.night.skips } }, except);
    }

    case 'SOFTEN': {
      if (state.screen.type !== 'play') return state;
      return { ...state, screen: { ...state.screen, soft: !state.screen.soft } };
    }

    case 'RETIRE': {
      if (state.screen.type !== 'play') return state;
      const id = state.screen.card.id;
      const persisted = { ...state.persisted, retired: [...state.persisted.retired, id] };
      save(persisted);
      return advanceNight({ ...state, persisted, night: { ...state.night, count: state.night.count + 1 } }, state.screen.card);
    }

    case 'END':
      if (state.screen.type === 'play') return endNight(state);
      return state;

    case 'HOME':
      return { ...state, screen: { type: 'setup' } };

    case 'SET_STAGE_MODE':
      return { ...state, stageMode: event.value };

    default:
      return state;
  }
}