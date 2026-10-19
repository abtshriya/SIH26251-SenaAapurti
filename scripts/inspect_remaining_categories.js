const fs = require('fs');

const master = JSON.parse(fs.readFileSync('scripts/master_merged_translations.json', 'utf8'));
const rules = JSON.parse(fs.readFileSync('scripts/rule_translations.json', 'utf8'));
const stillMissing = JSON.parse(fs.readFileSync('scripts/still_missing_user_facing.json', 'utf8'));

const combined = { ...master, ...rules };

const remaining = stillMissing.filter(s => !combined[s]);
console.log('Total remaining:', remaining.length);

// Group by length / type
const sentences = remaining.filter(s => s.split(' ').length > 4);
const phrases = remaining.filter(s => s.split(' ').length <= 4 && s.split(' ').length > 1);
const words = remaining.filter(s => s.split(' ').length === 1);

console.log('Sentences (> 4 words):', sentences.length);
console.log('Phrases (2-4 words):', phrases.length);
console.log('Single words:', words.length);

fs.writeFileSync('scripts/remaining_sentences.json', JSON.stringify(sentences, null, 2), 'utf8');
fs.writeFileSync('scripts/remaining_phrases.json', JSON.stringify(phrases, null, 2), 'utf8');
fs.writeFileSync('scripts/remaining_words.json', JSON.stringify(words, null, 2), 'utf8');
