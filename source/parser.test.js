import {parseSession} from './parser.js';

const sessionDir = './data';
const sessionId = '404fc69d-751b-4662-b5c0-5c708a100632';
const result = parseSession(sessionDir, sessionId);

console.log('Project:', result.project);
console.log('Session ID:', result.sessionId);
console.log('Total logs:', result.logs.length);

// Count log types
const logTypes = {};
result.logs.forEach(log => {
	logTypes[log.type] = (logTypes[log.type] || 0) + 1;
});
console.log('\nLog type counts:', logTypes);

console.log('\nFirst 20 logs:');
result.logs.slice(0, 20).forEach((log) => {
	console.log(`${log.id}. [${log.timestamp}] ${log.type}: ${log.content?.substring(0, 60)}...`);
	if (log.agentId) {
		console.log(`   Agent ID: ${log.agentId}, isLast: ${log.isLast}`);
	}
	console.log(`   Usage: ${log.usage} tokens`);
});
