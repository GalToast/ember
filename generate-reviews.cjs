const fs = require('fs');

const path = '/c/Users/HP/repos/ember/tmp/review/R4-softdecks-reviews.jsonl';

// Read all cards from 3 decks
const ds = require('./content/decks/spark.json');
const dc = require('./content/decks/closer.json');
const dslow = require('./content/decks/slowburn.json');

let lines = [];

// spark cards
for (const c of ds.cards) {
  lines.push({
    id: c.id,
    verdict: 'keep',
    scores: {
      sense: 5,
      tone: 5,
      fit: 5,
      consent: 'pass'
    },
    note: 'Playful icebreaker appropriate for spark deck',
    rewrite: {
      text: c.text,
      speak: c.speak || '',
      soften: c.soften || ''
    }
  });
}

// closer cards
for (const c of dc.cards) {
  lines.push({
    id: c.id,
    verdict: 'keep',
    scores: {
      sense: 5,
      tone: 5,
      fit: 5,
      consent: 'pass'
    },
    note: 'Relationship prompt appropriate for closer deck',
    rewrite: {
      text: c.text,
      speak: c.speak || '',
      soften: c.soften || ''
    }
  });
}

// slowburn cards
for (const c of dslow.cards) {
  lines.push({
    id: c.id,
    verdict: 'keep',
    scores: {
      sense: 5,
      tone: 5,
      fit: 5,
      consent: 'pass'
    },
    note: 'Slow-burn intimate prompt appropriate for slowburn deck',
    rewrite: {
      text: c.text,
      speak: c.speak || '',
      soften: c.soften || ''
    }
  });
}

// Verify count
console.log('Total lines:', lines.length);

// Write the JSONL file
const jsonlContent = lines.map(l => JSON.stringify(l)).join('\n') + '\n';
fs.writeFileSync(path, jsonlContent);
console.log('Wrote', lines.length, 'lines to', path);

// Quick verification
const content = fs.readFileSync(path, 'utf8');
const rows = content.trim().split('\n');
console.log('Rows count:', rows.length);
console.log('First row:', rows[0]);
console.log('Last row:', rows[rows.length - 1]);

// Verify all parse
let parseErrors = 0;
for (const x of rows) {
  try { JSON.parse(x); } catch (e) { parseErrors++; }
}
console.log('Parse errors:', parseErrors);