const fs = require('fs');
const valid = JSON.parse(fs.readFileSync('c:/Users/criya/SIH26251-SenaAapurti/scripts/valid_cmd_strings.json', 'utf8'));

console.log('--- Sample 201 to 300 ---');
console.log(valid.slice(200, 300).join('\n'));
console.log('--- Sample 301 to 400 ---');
console.log(valid.slice(300, 400).join('\n'));
console.log('--- Sample 401 to 440 ---');
console.log(valid.slice(400, 440).join('\n'));
