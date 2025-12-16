import { parseSession, parseLogFile, getTotalUsage } from './source/parser.js';

const sessionPath = '/Users/cs7101/.claude/projects/-Users-cs7101-Development-claude-kit/404fc69d-751b-4662-b5c0-5c708a100632.jsonl';

console.log('Loading session...\n');

// const { logs, sessionId, project, startDatetime } = parseSession(null, null, sessionPath);

// console.log('Session loaded successfully!');
// console.log(`Session ID: ${sessionId}`);
// console.log(`Project: ${project}`);
// console.log(`Total logs: ${logs.length}`);
// console.log(`Start: ${startDatetime}\n`);

const logs = parseLogFile(sessionPath);

// Example: Calculate total usage
// const totalUsage = logs.reduce((sum, log) => sum + (log.usage || 0), 0);
// console.log(`Total usage: ${totalUsage.toLocaleString()} tokens\n`);

// Example: Count by type
// const countByType = logs.reduce((acc, log) => {
// 	acc[log.type] = (acc[log.type] || 0) + 1;
// 	return acc;
// }, {});

// console.log('Log count by type:');
// Object.entries(countByType).forEach(([type, count]) => {
// 	console.log(`  ${type}: ${count}`);
// });

// Example: Token distribution by type
// const tokensByType = logs.reduce((acc, log) => {
// 	if (!acc[log.type]) acc[log.type] = 0;
// 	acc[log.type] += (log.usage || 0);
// 	return acc;
// }, {});

// console.log('\nToken usage by type:');
// Object.entries(tokensByType).forEach(([type, usage]) => {
// 	console.log(`  ${type}: ${usage.toLocaleString()} tokens`);
// });

// Export logs for testing
// console.log('\n--- Logs are available in the "logs" variable for testing ---');
// console.log('You can modify this script to test Summary.js calculations\n');

// Example: Access first few logs
console.log('First 10 logs:');
// logs.slice(0, 3).forEach((log, idx) => {
// 	console.log(`  ${idx + 1}. [${log.timestamp}] ${log.type}: ${(log.content || '').substring(0, 50)}...`);
// });

// logs.slice(0, 5).forEach((log, idx) => {
// 	console.log(`[${idx}]`, log)
// })

// logs.slice(0, 20).forEach((log, idx) => {
// 	if (log.raw.message) {
// 		console.log(`[${idx}] type: ${log.type} usage: ${log.usage}`, log.raw.message.usage ? log.raw.message.usage : null)
// 	} else {
// 		console.log("Skipping agent log");
// 	}
// })

logs.slice(0, 20).forEach((log, idx) => {
	console.log(`[${idx}] type: ${log.type} timestamp: ${log.timestamp}, raw.timestamp: ${log.raw.timestamp}`);
})
