#!/usr/bin/env node
/**
 * board-roster-truth.mjs — print the REAL switchboard roster, not the stored status.
 *
 * WHY THIS EXISTS (measured 2026-11-10):
 *   war_room_agents.json persists `status: "online"` at registration. Nothing
 *   rewrites it when a process dies. Result: `list_agents` reported 15 online
 *   while `who_is_working` reported 2, and 13 of the 15 had `last_seen` between
 *   34 h and 148 h old. Every lane was coordinating against a false roster.
 *
 *   Truth = last_seen freshness. `status` is only a hint.
 *
 * Usage:
 *   node scripts/board-roster-truth.mjs                 # full table
 *   node scripts/board-roster-truth.mjs --stale 60      # agents silent > 60 min
 *   node scripts/board-roster-truth.mjs --tasks        # + ownerless in_progress
 *   node scripts/board-roster-truth.mjs --json          # machine-readable
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SB = process.env.PI_SWITCHBOARD_DIR || join(process.env.HOME || 'C:\\Users\\HP', '.pi', 'agent', 'switchboard');
const AGENTS = join(SB, 'war_room_agents.json');
const TASKS = join(SB, 'war_room_tasks.json');

const argv = process.argv.slice(2);
const STALE_MIN = (() => {
  const i = argv.indexOf('--stale');
  return i >= 0 ? Number(argv[i + 1]) || 60 : 60;
})();
const AS_JSON = argv.includes('--json');
const WITH_TASKS = argv.includes('--tasks');

function load(p) {
  try {
    if (!existsSync(p)) return null;
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

const agentsDoc = load(AGENTS);
const tasksDoc = load(TASKS);

if (!agentsDoc) {
  console.error(`board-roster-truth: no roster at ${AGENTS}`);
  process.exit(1);
}

// The roster is an OBJECT keyed by agent_id (not an array).
const agents = Object.entries(agentsDoc)
  .filter(([id, a]) => a && typeof a === 'object' && (a.agent_id || id))
  .map(([id, a]) => ({
    id: a.agent_id || id,
    tag: a.tag || '',
    storedStatus: a.status || 'unknown',
    lastSeen: a.last_seen ? new Date(a.last_seen) : null,
    ageMinutes: a.last_seen ? Math.max(0, (Date.now() - new Date(a.last_seen).getTime()) / 60000) : null,
  }));

const now = Date.now();
const TRUTH = (a) => {
  if (!a.lastSeen) return 'never-seen';
  if (now - a.lastSeen.getTime() > 2 * 3600e3) return 'dead';
  if (now - a.lastSeen.getTime() > STALE_MIN * 60e3) return 'stale';
  return 'live';
};

agents.sort((x, y) => (x.ageMinutes ?? 1e9) - (y.ageMinutes ?? 1e9));
const tally = { live: 0, stale: 0, dead: 0, 'never-seen': 0 };
for (const a of agents) tally[TRUTH(a)]++;

// Attribution of every open task to a truth state, so ownership is not trusted blindly.
let tasks = [];
if (tasksDoc) {
  const arr = Array.isArray(tasksDoc) ? tasksDoc :tasksDoc.tasks || [];
  const byId = new Map(agents.map((a) => [a.id, TRUTH(a)]));
  tasks = arr
    .filter((t) => t && (t.status === 'in_progress' || t.status === 'todo' || t.status === 'open'))
    .map((t) => ({
      id: t.id,
      status: t.status,
      owner: t.owner || '',
      ownerTruth: t.owner ? (byId.get(t.owner) || 'unregistered') : 'unowned',
      priority: t.priority || '',
      title: String(t.title || '').slice(0, 90),
    }));
}

if (AS_JSON) {
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), source: AGENTS, tally, agents, tasks }, null, 2));
  process.exit(0);
}

console.log(`roster truth @ ${new Date().toISOString()}  (catalog ${AGENTS})`);
console.log(`stored status says online: ${agents.filter((a) => a.storedStatus === 'online').length}`);
console.log(`actual truth: live=${tally.live} stale=${tally.stale} dead=${tally.dead} never=${tally['never-seen']}  (threshold ${STALE_MIN} min)`);
console.log('');
console.log('  id                          stored   truth      silent    last_seen');
for (const a of agents) {
  const age = a.ageMinutes == null ? '—' : a.ageMinutes < 1 ? '<1m' : a.ageMinutes < 60 ? `${Math.round(a.ageMinutes)}m` : `${(a.ageMinutes / 60).toFixed(1)}h`;
  console.log(`  ${a.id.padEnd(26)} ${a.storedStatus.padEnd(7)} ${TRUTH(a).padEnd(9)} ${String(age).padStart(7)}   ${a.lastSeen ? a.lastSeen.toISOString().slice(0, 19) : 'never'}`);
}

if (WITH_TASKS) {
  console.log('');
  console.log('  open/in_progress task attribution:');
  const problematic = tasks.filter((t) => t.ownerTruth !== 'live');
  for (const t of tasks) {
    const flag = t.ownerTruth === 'live' ? ' ' : '!';
    console.log(`${flag} #${String(t.id).padEnd(4)} ${t.status.padEnd(11)} owner=${(t.owner || '(none)').padEnd(34)} truth=${t.ownerTruth.padEnd(12)} ${t.title}`);
  }
  console.log('');
  console.log(`  ${problematic.length} of ${tasks.length} open tasks are held by dead/stale/unowned agents.`);
  const unowned = tasks.filter((t) => !t.owner);
  if (unowned.length) {
    console.log(`  ownerless (needs a decision, not capacity): ${unowned.map((t) => '#' + t.id).join(', ')}`);
  }
}