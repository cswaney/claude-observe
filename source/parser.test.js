import { loadSession, getTotalUsage } from './parser.js';

const log = {
	parentUuid: '19ebe628-fac2-4548-84be-836912b91b5c',
	isSidechain: false,
	userType: 'external',
	cwd: '/Users/cs7101/Development/claude-kit',
	sessionId: '404fc69d-751b-4662-b5c0-5c708a100632',
	version: '2.0.46',
	gitBranch: '',
	message: {
		model: 'claude-sonnet-4-5-20250929',
		id: 'msg_01SwNJgxsPD8pWiNMKJegehm',
		type: 'message',
		role: 'assistant',
		content: [[Object]],
		stop_reason: 'tool_use',
		stop_sequence: null,
		usage: {
			input_tokens: 7,
			cache_creation_input_tokens: 162,
			cache_read_input_tokens: 17545,
			cache_creation: [Object],
			output_tokens: 230,
			service_tier: 'standard'
		}
	},
	requestId: 'req_011CVHrBHJzWiApqC7ynF3Dz',
	type: 'assistant',
	uuid: '9331acb3-179f-45bb-9aa0-7c880aa99a7f',
	timestamp: '2025-11-19T20:05:16.363Z'
}

console.log("Total usage:", getTotalUsage(log));

// const sessionPath = '/Users/cs7101/.claude/projects/-Users-cs7101-Development-claude-kit/404fc69d-751b-4662-b5c0-5c708a100632.jsonl';
const sessionPath = '/Users/cs7101/.claude/projects/-Users-cs7101-Development-aoc/09b8f9ab-0278-4b66-8e83-261f298ede7a.jsonl';
const session = loadSession(sessionPath);

// console.log("Session:", {...session, logs: session.logs.slice(0, 20).map((log) => log.raw?.message?.content)});
console.log("Logs: ", session.logs.slice(0, 20).map((log) => {
	// return {type: log.type, content: log.raw?.message?.content}
	return log.raw
}));
// console.log("Session:", session);
// console.log(session.logs[0]);
// for (const log of session.logs) {
// 	if (!log.raw?.timestamp) {
// 		console.log(log);
// 	}
// }