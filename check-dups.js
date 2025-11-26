import {parseSession} from './source/parser.js';

const result = parseSession('./data', '404fc69d-751b-4662-b5c0-5c708a100632');
const ids = result.logs.map(l => l.id);
const uniqueIds = new Set(ids);

console.log('Total logs:', result.logs.length);
console.log('Unique IDs:', uniqueIds.size);
console.log('Has duplicates:', ids.length !== uniqueIds.size);

// Find duplicates
const seen = new Set();
const duplicates = [];
ids.forEach(id => {
	if (seen.has(id)) {
		duplicates.push(id);
	}
	seen.add(id);
});

if (duplicates.length > 0) {
	console.log('Duplicate IDs found:', duplicates);
}
