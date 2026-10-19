const fs = require('fs');
const valid = JSON.parse(fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/scripts/valid_cmd_strings.json', 'utf8'));

console.log('--- Sample 1 to 50 ---');
console.log(valid.slice(0, 50).join('\n'));
console.log('--- Sample 51 to 100 ---');
console.log(valid.slice(50, 100).join('\n'));
console.log('--- Sample 101 to 150 ---');
console.log(valid.slice(100, 150).join('\n'));
console.log('--- Sample 151 to 200 ---');
console.log(valid.slice(150, 200).join('\n'));
