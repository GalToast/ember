// Ember haptics — thin guard around navigator.vibrate.
// No-op when the Vibration API is missing (desktop, restricted WebViews).
function vibrate(ms: number) {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try { navigator.vibrate(ms); } catch { /* best effort — haptics are never critical */ }
}

export const haptics = {
  /** fired when a card flies out toward "next" */
  next: () => vibrate(12),
  /** fired when a card flies out toward "skip" */
  skip: () => vibrate(8),
  /** double 10ms pulse when a fresh spice bomb is dealt */
  bomb: () => {
    vibrate(10);
    setTimeout(() => vibrate(10), 18);
  },
};
