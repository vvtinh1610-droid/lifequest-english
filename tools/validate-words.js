#!/usr/bin/env node
// Validate LifeQuest English vocabulary JSON files.
// Usage: node tools/validate-words.js data/words/*.json
// Prints errors (must fix) and warnings (please review), plus level/type mix per file.

const fs = require('fs');
const path = require('path');

const FIELDS = ['id', 'word', 'type', 'pos', 'ipa', 'vi', 'level', 'region', 'register',
  'topic', 'job', 'example', 'exampleVi', 'blankExample', 'blankAnswer', 'emoji'];
const TYPES = ['word', 'collocation', 'phrase', 'idiom', 'slang'];
const POS = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'pronoun', 'number', 'interjection', 'phrase'];
const REGIONS = ['common', 'US', 'UK', 'AU', 'SG', 'IN'];
const REGISTERS = ['formal', 'neutral', 'informal', 'slang'];
const JOBS = ['none', 'restaurant', 'delivery'];

const norm = s => String(s).trim().replace(/\s+/g, ' ').replace(/[.?!]+$/, '').toLowerCase();

const files = process.argv.slice(2);
if (!files.length) {
  console.log('Usage: node tools/validate-words.js <file.json> [...]');
  process.exit(1);
}

const seenIds = new Map();
const seenWords = new Map();
let totalErrors = 0, totalWarnings = 0, totalEntries = 0;

for (const file of files) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.log(`\n✖ ${file}: invalid JSON — ${e.message}`);
    totalErrors++;
    continue;
  }
  if (!Array.isArray(data)) {
    console.log(`\n✖ ${file}: top level must be an array`);
    totalErrors++;
    continue;
  }
  const errors = [], warnings = [];
  const levels = [0, 0, 0, 0, 0];
  const types = {};
  data.forEach((e, i) => {
    const tag = e && e.id ? e.id : `#${i}`;
    for (const f of FIELDS) {
      if (!(f in e)) errors.push(`${tag}: missing field "${f}"`);
      else if (f !== 'emoji' && f !== 'level' && String(e[f]).trim() === '') errors.push(`${tag}: empty field "${f}"`);
    }
    for (const k of Object.keys(e)) if (!FIELDS.includes(k)) warnings.push(`${tag}: extra field "${k}"`);
    if (!TYPES.includes(e.type)) errors.push(`${tag}: bad type "${e.type}"`);
    if (!POS.includes(e.pos)) errors.push(`${tag}: bad pos "${e.pos}"`);
    if (!REGIONS.includes(e.region)) errors.push(`${tag}: bad region "${e.region}"`);
    if (!REGISTERS.includes(e.register)) errors.push(`${tag}: bad register "${e.register}"`);
    if (!JOBS.includes(e.job)) errors.push(`${tag}: bad job "${e.job}"`);
    if (![0, 1, 2, 3, 4].includes(e.level)) errors.push(`${tag}: bad level "${e.level}"`);
    else levels[e.level]++;
    types[e.type] = (types[e.type] || 0) + 1;
    if (e.ipa && !/^\/.+\/$/.test(e.ipa)) warnings.push(`${tag}: ipa should be between slashes`);
    if (e.blankExample) {
      const blanks = (e.blankExample.match(/___/g) || []).length;
      if (blanks !== 1) errors.push(`${tag}: blankExample must contain exactly one ___`);
      else if (e.blankAnswer && e.example) {
        const filled = e.blankExample.replace('___', e.blankAnswer);
        if (norm(filled) !== norm(e.example)) {
          errors.push(`${tag}: blankExample + blankAnswer ≠ example\n      got:      "${filled}"\n      expected: "${e.example}"`);
        }
      }
    }
    if (e.example && e.example.split(/\s+/).length > 12) warnings.push(`${tag}: example longer than 12 words`);
    if (e.id) {
      if (seenIds.has(e.id)) errors.push(`${tag}: duplicate id (also in ${seenIds.get(e.id)})`);
      else seenIds.set(e.id, path.basename(file));
    }
    if (e.word) {
      const w = norm(e.word);
      if (seenWords.has(w)) warnings.push(`${tag}: duplicate word "${e.word}" (also ${seenWords.get(w)})`);
      else seenWords.set(w, tag);
    }
    if ((e.type === 'slang' || e.type === 'idiom')) warnings.push(`${tag}: ${e.type} "${e.word}" — human check`);
  });
  totalEntries += data.length;
  totalErrors += errors.length;
  totalWarnings += warnings.length;
  console.log(`\n${errors.length ? '✖' : '✔'} ${file}: ${data.length} entries`);
  console.log(`   levels 0–4: ${levels.join(' / ')}`);
  console.log(`   types: ${Object.entries(types).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  errors.forEach(m => console.log(`   ERROR   ${m}`));
  warnings.forEach(m => console.log(`   warn    ${m}`));
}

console.log(`\nTotal: ${totalEntries} entries, ${totalErrors} errors, ${totalWarnings} warnings`);
process.exit(totalErrors ? 1 : 0);
