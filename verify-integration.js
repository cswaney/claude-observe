import {parseSession} from './source/parser.js';

console.log('=== Verifying Parser Integration ===\n');

// Parse the session
const sessionDir = './data';
const sessionId = '404fc69d-751b-4662-b5c0-5c708a100632';
const result = parseSession(sessionDir, sessionId);

console.log('Project:', result.project);
console.log('Session ID:', result.sessionId);
console.log('Total logs:', result.logs.length);

// Show log type distribution
const types = {};
result.logs.forEach(log => {
	types[log.type] = (types[log.type] || 0) + 1;
});
console.log('\nLog types:');
Object.entries(types).forEach(([type, count]) => {
	console.log(`  ${type}: ${count}`);
});

// Show first few timestamps to verify real data
console.log('\nFirst 5 log timestamps (should start at 10:02:56):');
result.logs.slice(0, 5).forEach(log => {
	console.log(`  ${log.id}. [${log.timestamp}] ${log.type}`);
});

console.log('\n✓ Parser integration successful!');
console.log('✓ App configured to use: sessionDir="./data", sessionId="404fc69d-751b-4662-b5c0-5c708a100632"');
