# Ember State Machine Refactor

## Problem

`App.svelte` is a 33KB+ god component with ~20+ `$state` variables and tangled game logic. Screen transitions are implicit string unions with scattered if/else chains. The `night` object is shared mutable state mutated in multiple places.

## Proposed Architecture

### 1. Typed State Machine

```typescript
// src/lib/machine.ts
export type Screen =
  | { type: 'setup' }
  | { type: 'splash'; firstNight: boolean }
  | { type: 'play'; card: Card; soft: boolean; landing: boolean }
  | { type: 'browse' }
  | { type: 'handoff'; turn: 'a' | 'b' }
  | { type: 'private'; card: Card }
  | { type: 'custom' }
  | { type: 'celebrate'; cards: number; tokens: Tokens };

export type Event =
  | { type: 'START' }
  | { type: 'NEXT' }
  | { type: 'SKIP' }
  | { type: 'SOFTEN' }
  | { type: 'RETIRE' }
  | { type: 'COMMAND' }
  | { type: 'END' }
  | { type: 'RESUME' }
  | { type: 'HOME' }
  | { type: 'BROWSE' }
  | { type: 'CUSTOM' }
  | { type: 'PTP_START' }
  | { type: 'PTP_NEXT' }
  | { type: 'PTP_DONE' };

export interface State {
  screen: Screen;
  night: NightState;
  persisted: PersistedState;
  stageMode: boolean;
}
```

### 2. Reducer Pattern

```typescript
// src/lib/reducer.ts
export function reducer(state: State, event: Event): State {
  switch (event.type) {
    case 'START':
      return { ...state, screen: { type: 'splash', firstNight: state.persisted.nights.length === 0 } };
    case 'NEXT':
      if (state.screen.type !== 'play') return state;
      const card = drawCard(state.night, state.persisted);
      return { ...state, screen: { type: 'play', card, soft: false, landing: false } };
    // ... etc
  }
}
```

### 3. Module Structure

```
src/
  lib/
    machine.ts      # State types + initial state
    reducer.ts      # Pure transition function
    selectors.ts    # Derived state (what screen shows)
    game.svelte.ts  # Existing game logic (draw, etc.)
    audio.svelte.ts # Existing audio
    storage.ts      # load/save wrappers
  App.svelte        # Thin view layer — subscribes to state, dispatches events
```

### 4. Migration Path

**Phase 1 (No behavior change):**
1. Extract `NightState` type into `machine.ts`
2. Extract `PersistedState` type
3. Create `initialState()` function
4. App.svelte uses the typed state but keeps current logic

**Phase 2 (Incremental reducer):**
1. Create `reducer.ts` with one event at a time
2. Replace one if/else chain with a dispatch call
3. Run tests after each replacement

**Phase 3 (Full migration):**
1. All screen transitions go through reducer
2. App.svelte becomes a thin view layer
3. Add state transition logging for debugging

## Benefits

- **Type-safe transitions**: Invalid states impossible by construction
- **Testable**: Reducer is pure, unit test each transition
- **Debuggable**: Log every state transition
- **Evolvable**: New screens/modes are additive
- **Serializable**: State can be persisted/restored trivially

## Risks

- Large initial refactor effort
- Need to maintain 225/225 test pass rate
- Svelte 5 runes integration needs care

## Timeline

- Phase 1: 2-3 hours
- Phase 2: 1-2 days (incremental)
- Phase 3: 1 day

Total: ~2-3 days of focused work