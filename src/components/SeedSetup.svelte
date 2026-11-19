<script lang="ts">
  /**
   * Seed entry — the private half of two-sided authorship.
   *
   * One holder at a time. Neither partner ever sees the other's words on this
   * screen, and the handoff is explicit so there is no half-second where the
   * phone shows the wrong person's secret.
   *
   * The BOUNDARY is not a card and is never dealt. It is stored so the night can
   * honour it (and so the finale can say "one line stayed off the table").
   */
  import Icon from './Icon.svelte';
  import type { Seed } from '../lib/seeds';

  let {
    names = { a: '', b: '' },
    existing = [] as Seed[],
    onDone,
    onClose,
  }: {
    names?: { a: string; b: string };
    existing?: Seed[];
    onDone: (seeds: Seed[]) => void;
    onClose: () => void;
  } = $props();

  type Step = 'a' | 'handoff' | 'b';
  let step = $state<Step>(existing.length ? 'a' : 'a');
  let wish = $state('');
  let boundary = $state('');
  /** who just sealed — `holder` flips to 'b' on the handoff screen, so the copy
   *  must remember the author or it credits the wrong partner. */
  let sealedBy = $state<'a' | 'b'>('a');
  const seeds = $state<Seed[]>([...existing]);

  const holder = $derived(step === 'a' ? 'a' : 'b');
  const holderName = $derived(holder === 'a' ? (names.a || 'you') : (names.b || 'you'));
  const otherName = $derived(holder === 'a' ? (names.b || 'them') : (names.a || 'them'));
  const canSeal = $derived(wish.trim().length >= 4);

  function seal() {
    if (!canSeal) return;
    sealedBy = holder;
    seeds.push({ who: holder, wish: wish.trim(), boundary: boundary.trim() });
    wish = '';
    boundary = '';
    if (holder === 'a') step = 'handoff';
    else onDone([...seeds]);
  }

  function skipRest() {
    // one seed is still a night-maker; never block a couple on the second phone pass
    onDone([...seeds]);
  }
</script>

<div class="wrap enter">
  <div class="glass panel" data-testid="seed-setup">
    {#if step === 'handoff'}
      <div class="crown"><Icon name="pass" size={26} /></div>
      <h2 class="display">Pass the phone.</h2>
      <p class="dim">
        {sealedBy === 'a' ? (names.a || 'They') : (names.b || 'They')} sealed one thing.
        {(sealedBy === 'a' ? names.b : names.a) || 'They'} get the phone next — whatever was just
        written is nobody's business but theirs.
      </p>
      <button class="btn btn-primary" onclick={() => (step = 'b')} data-testid="seed-handoff">I'm {names.b || 'next'} — my turn</button>
      <button class="btn btn-ghost" onclick={skipRest} data-testid="seed-handoff-skip">Just one tonight</button>
    {:else}
      <div class="crown"><Icon name="heart" size={26} /></div>
      <p class="who dim">{holderName}'s turn — {otherName} can't see this screen.</p>
      <h2 class="display">Plant one thing.</h2>
      <p class="dim small">
        One thing you want more of. It arrives tonight as a card {otherName} reads out loud —
        without your name on it. They find out it was you at the end.
      </p>

      <label class="field">
        <span>What you want more of</span>
        <textarea
          bind:value={wish}
          maxlength="180"
          rows="3"
          placeholder="Slow mornings. Your hand on my back in the kitchen. Twenty minutes where nobody's phone exists."
          data-testid="seed-wish"
        ></textarea>
      </label>

      <label class="field">
        <span>Off the table tonight <em class="dim">(optional — never dealt)</em></span>
        <input
          bind:value={boundary}
          maxlength="180"
          placeholder="Not tonight: anything about work."
          data-testid="seed-boundary"
        />
      </label>

      <button class="btn btn-primary" onclick={seal} disabled={!canSeal} data-testid="seed-seal">
        Seal it <Icon name="pass" size={15} />
      </button>
      <button class="btn btn-ghost back" onclick={onClose} data-testid="seed-back">Not tonight</button>
    {/if}
  </div>
</div>

<style>
  .wrap { flex: 1; display: grid; place-items: center; padding: clamp(20px, 4vmin, 48px); z-index: 1; overflow-y: auto; }
  .panel {
    width: min(92vw, 620px);
    padding: clamp(24px, 4.4vmin, 48px);
    display: flex; flex-direction: column; align-items: center;
    gap: clamp(12px, 2.2vmin, 20px); text-align: center;
    box-shadow: var(--shadow-card), 0 0 40px rgba(255, 122, 61, 0.1);
  }
  .crown { color: var(--ember); filter: drop-shadow(0 0 18px rgba(255, 122, 61, 0.5)); }
  h2 { font-size: clamp(26px, 5vmin, 46px); }
  .who { font-size: clamp(12px, 1.6vmin, 14px); letter-spacing: 0.1em; text-transform: uppercase; }
  .small { font-size: clamp(14px, 1.9vmin, 17px); line-height: 1.5; max-width: 46ch; }
  .field { width: 100%; display: flex; flex-direction: column; gap: 6px; text-align: left; }
  .field span { font-size: clamp(12px, 1.6vmin, 14px); color: var(--ink-dim); letter-spacing: 0.04em; }
  .field em { font-style: normal; opacity: 0.75; }
  textarea, input {
    width: 100%; padding: 12px 14px; border-radius: var(--r-sm);
    background: rgba(255, 255, 255, 0.04); border: 1px solid var(--edge);
    color: var(--ink); font: inherit; font-size: clamp(15px, 2vmin, 17px); line-height: 1.45;
    resize: vertical;
  }
  textarea:focus-visible, input:focus-visible { outline: 2px solid var(--ember-soft); outline-offset: 2px; }
  .btn { min-height: 48px; padding: 12px 28px; }
  .back { opacity: 0.7; }
</style>
