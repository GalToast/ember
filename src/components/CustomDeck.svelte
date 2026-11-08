<script lang="ts">
  import type { Card, CardType } from '../lib/schema';
  import Icon from './Icon.svelte';
  import { loadCustom, saveCustom, validateCustom, newCustomCard, type CustomValidation } from '../lib/game.svelte';

  let {
    names = { a: '', b: '' },
    onClose,
  }: {
    names?: { a: string; b: string };
    onClose?: () => void;
  } = $props();

  let cards = $state<Card[]>(loadCustom());
  let draft = $state<Card | null>(null);
  let author = $state<'a' | 'b'>('a');
  let validation = $state<CustomValidation>({ ok: false, errors: [] });
  let importMsg = $state('');
  let fileInput: HTMLInputElement;

  const TYPES: { id: CardType; label: string }[] = [
    { id: 'truth', label: 'Truth' },
    { id: 'dare', label: 'Dare' },
    { id: 'challenge', label: 'Both' },
    { id: 'topic', label: 'Topic' },
  ];

  function start(type: CardType) {
    author = author === 'a' ? 'a' : 'b'; // keep current selector
    draft = newCustomCard(type, author);
    validation = { ok: false, errors: ['write the card'] };
  }
  function edit(c: Card) { draft = { ...c }; revalidate(); }

  function revalidate() {
    if (!draft) return;
    validation = validateCustom(draft, cards.filter((c) => c.id !== draft!.id));
  }

  function save() {
    if (!draft || !validation.ok) return;
    const i = cards.findIndex((c) => c.id === draft!.id);
    if (i >= 0) cards[i] = { ...draft };
    else cards = [...cards, { ...draft }];
    saveCustom(cards);
    draft = null;
  }
  function remove(id: string) {
    cards = cards.filter((c) => c.id !== id);
    saveCustom(cards);
  }
  function exportDeck() {
    const blob = new Blob([JSON.stringify({ id: 'custom', name: 'Our Deck', adult: true, cards }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'our-deck.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function importDeck(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const incoming: Card[] = Array.isArray(data) ? data : data.cards ?? [];
      const existing = new Set(cards.map((c) => c.text.toLowerCase().replace(/\s+/g, ' ').trim()));
      const fresh = incoming.filter((c) => c.text && !existing.has(c.text.toLowerCase().replace(/\s+/g, ' ').trim()));
      cards = [...cards, ...fresh.map((c) => ({ ...c, id: `custom-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`, deck: 'custom' }))];
      saveCustom(cards);
      importMsg = `imported ${fresh.length} (${incoming.length - fresh.length} skipped as duplicates)`;
    } catch { importMsg = 'that file did not parse'; }
    if (fileInput) fileInput.value = '';
  }

  const authorName = $derived(author === 'a' ? (names.a || 'Player 1') : (names.b || 'Player 2'));
</script>

<div class="wrap enter" data-testid="custom-deck">
  <header class="head">
    <button class="back" onclick={onClose} data-testid="custom-close"><Icon name="skip" /> Back</button>
    <div class="brand"><Icon name="heart" size={18} /> Our deck <span class="dim">({cards.length})</span></div>
    <div class="who">
      <button class="who-btn" class:on={author === 'a'} onclick={() => { author = 'a'; }}>{names.a || 'P1'}</button>
      <button class="who-btn" class:on={author === 'b'} onclick={() => { author = 'b'; }}>{names.b || 'P2'}</button>
    </div>
  </header>
  <p class="dim hint">Cards you write get dealt into nights like any other deck — and each card remembers who wrote it. Write wants you haven't said out loud yet; the draw does the saying for you.</p>

  {#if !draft}
    <nav class="typewrap">
      <span class="dim">{authorName} writes:</span>
      {#each TYPES as t (t.id)}
        <button class="type-btn" onclick={() => start(t.id)} data-testid={`write-${t.id}`}>{t.label}</button>
      {/each}
    </nav>

    {#if cards.length === 0}
      <div class="empty dim">No cards yet. The first one is the hardest — write something you want and haven't said.</div>
    {:else}
      <div class="list" data-testid="custom-list">
        {#each cards as c (c.id)}
          <div class="row">
            <button class="cardlink" onclick={() => edit(c)}>
              <span class="type dim">{c.type}</span>
              <span class="txt">{c.text}</span>
              <span class="by dim">— {c.author === 'a' ? (names.a || 'P1') : (names.b || 'P2')}</span>
            </button>
            <button class="del" onclick={() => remove(c.id)} title="delete"><Icon name="skip" size={13} /></button>
          </div>
        {/each}
      </div>
    {/if}

    <div class="io">
      <button class="mini" onclick={exportDeck} disabled={cards.length === 0}>Export deck</button>
      <button class="mini" onclick={() => fileInput.click()}>Import deck</button>
      <input type="file" accept="application/json" bind:this={fileInput} onchange={importDeck} style="display:none" />
      {#if importMsg}<span class="dim">{importMsg}</span>{/if}
    </div>
  {:else}
    <div class="editor" data-testid="custom-editor">
      <div class="etype">{draft.type.toUpperCase()} — {authorName}'s card</div>
      <textarea
        rows="3"
        maxlength="160"
        placeholder="the card — say the act, direct ('Tell them…', 'Kiss…', 'Ask for…')"
        bind:value={draft.text}
        oninput={revalidate}
        data-testid="custom-text"
      ></textarea>
      {#if draft.type === 'dare' || draft.type === 'challenge'}
        <input
          type="text"
          maxlength="160"
          placeholder="softer variant (required) — same act, gentler"
          bind:value={draft.soften}
          oninput={revalidate}
          data-testid="custom-soften"
        />
      {/if}
      <input
        type="text"
        maxlength="120"
        placeholder="say-while-it-happens line (optional)"
        bind:value={draft.speak}
        oninput={revalidate}
        data-testid="custom-speak"
      />
      {#each validation.errors as e (e)}
        <div class="err">· {e}</div>
      {/each}
      {#if validation.ok}<div class="okline">ready — dealt into every mode from tonight</div>{/if}
      <div class="erow">
        <button class="mini" onclick={() => (draft = null)}>Discard</button>
        <button class="mini save" onclick={save} disabled={!validation.ok} data-testid="custom-save">Add to Our Deck</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .wrap { flex: 1; display: flex; flex-direction: column; gap: clamp(10px, 1.8vmin, 18px); z-index: 1; padding: clamp(12px, 2.4vmin, 28px); min-height: 0; overflow-y: auto; }
  .head { display: flex; align-items: center; gap: 12px; }
  .brand { font-weight: 800; font-size: clamp(14px, 2vmin, 18px); display: inline-flex; align-items: center; gap: 8px; }
  .back { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: var(--r-pill); background: var(--glass); border: 1px solid var(--edge); color: var(--ink-dim); font-size: 13px; font-weight: 700; }
  .who { margin-left: auto; display: inline-flex; gap: 6px; }
  .who-btn { padding: 7px 14px; border-radius: var(--r-pill); background: var(--glass); border: 1px solid var(--edge); color: var(--ink-dim); font-weight: 700; font-size: 13px; }
  .who-btn.on { color: var(--ink); border-color: var(--ember); box-shadow: 0 0 14px rgba(255, 122, 61, 0.2); }
  .hint { font-size: clamp(12px, 1.6vmin, 14px); max-width: 60ch; text-align: center; margin: 0 auto; line-height: 1.45; }
  .typewrap { display: flex; gap: 8px; align-items: center; justify-content: center; flex-wrap: wrap; }
  .type-btn { padding: 12px 22px; min-height: 46px; border-radius: var(--r-pill); background: linear-gradient(135deg, rgba(255,122,61,0.16), rgba(255,82,115,0.16)); border: 1px solid var(--edge-strong); color: var(--ink); font-weight: 700; font-size: clamp(13px, 1.8vmin, 15px); }
  .empty { text-align: center; padding: clamp(20px, 4vmin, 40px); font-size: clamp(13px, 1.8vmin, 16px); }
  .list { display: flex; flex-direction: column; gap: 8px; max-width: 640px; width: 100%; margin: 0 auto; }
  .row { display: flex; align-items: stretch; gap: 8px; }
  .cardlink { flex: 1; text-align: left; padding: 12px 16px; border-radius: var(--r-md); background: var(--glass); border: 1px solid var(--edge); color: var(--ink); display: flex; flex-direction: column; gap: 3px; }
  .cardlink .type { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; }
  .cardlink .txt { font-size: clamp(13px, 1.8vmin, 15px); line-height: 1.35; }
  .cardlink .by { font-size: 12px; font-style: italic; }
  .del { width: 40px; border-radius: var(--r-md); background: var(--glass); border: 1px solid var(--edge); color: var(--ink-dim); display: grid; place-items: center; }
  .editor { display: flex; flex-direction: column; gap: 10px; max-width: 640px; width: 100%; margin: 0 auto; }
  .etype { font-weight: 800; letter-spacing: 0.1em; font-size: 13px; color: var(--ember-soft); text-transform: uppercase; }
  textarea, .editor input[type='text'] {
    width: 100%; padding: 14px 16px; border-radius: var(--r-md);
    background: var(--glass-strong); border: 1px solid var(--edge-strong); color: var(--ink);
    font-size: clamp(14px, 2vmin, 17px); line-height: 1.4; resize: vertical;
    font-family: var(--font-ui);
  }
  .err { color: var(--p2); font-size: 13px; }
  .okline { color: var(--good); font-size: 14px; font-weight: 700; }
  .erow { display: flex; gap: 10px; justify-content: flex-end; }
  .io { display: flex; gap: 10px; align-items: center; justify-content: center; }
  .mini { padding: 10px 18px; border-radius: var(--r-pill); background: var(--glass); border: 1px solid var(--edge); color: var(--ink-dim); font-weight: 700; font-size: 13px; }
  .mini.save { background: linear-gradient(135deg, #ff7a3d, #ff5273); color: #fff; border-color: transparent; }
  .mini:disabled { opacity: 0.4; }
</style>
