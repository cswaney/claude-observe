import fs from 'fs';
import path from 'path';

/**
 * Read logs from JSONL file
 * @param {string} filePath - Path to session file
 * @return {array} Array of raw log entries
 */
function readJsonl(filePath) {
	const content = fs.readFileSync(filePath, 'utf-8');
	const lines = content.split('\n').filter(line => line.trim());
	return lines.map(line => JSON.parse(line));
}

/**
 * Extract message type based on role and content type
 * @param {object} log - Raw log object
 * @return {string} Message type
 */
function getMessageType(log) {
	const message = log.message;

	if (!message || !message.content) {
		return null;
	}

	if (message.role === 'user') {
		if (log.toolUseResult) {
			return 'tool_result';
		} else {
			return 'user';
		}
	}

	if (message.role === 'assistant') {
		for (const content of message.content) {
			if (content.type === 'thinking') {
				return 'thinking';
			}
			if (content.type === 'tool_use') {
				return 'tool_use';
			}
		}

		return 'assistant';
	}

	console.error(
		`Encountered an unknown message type while parsing session data (message: ${JSON.stringify(
			message,
		)})`,
	);
}

/**
 * Extract message content based on type
 * @param {object} log - Raw log object
 * @param {string} type - Parsed log type
 * @returns {string} Message content
 */
function getMessageContent(log, type) {
	const message = log.message;

	if (!message || !message.content) {
		return null;
	}

	if (type === 'user') {
		if (typeof message.content === 'string') {
			return message.content;
		}
		return message.content[0]?.text || '';
	} else if (type === 'assistant') {
		return message.content[0]?.text || '';
	} else if (type === 'thinking') {
		return message.content[0]?.thinking || '';
	} else if (type === 'tool_use') {
		const input = message.content[0]?.input;
		return typeof input === 'object'
			? JSON.stringify(input, null, 2)
			: String(input || '');
	} else if (type === 'tool_result') {
		const content = message.content[0]?.content;
		return typeof content === 'object'
			? JSON.stringify(content, null, 2)
			: String(content || '');
	}
}

/**
 * Calculate total token usage
 * @param {object} log - Raw log object
 * @returns {number} Total token usage
 */
export function getTotalUsage(log) {
	const message = log.message;

	if (!message || !message.content) {
		return null;
	}

	const usage = message.usage;

	if (!usage) return 0;

	const input = usage.input_tokens || 0;
	const output = usage.output_tokens || 0;
	const cacheRead = usage.cache_read_input_tokens || 0;
	const cacheCreation = usage.cache_creation_input_tokens || 0;

	return input + output + cacheRead + cacheCreation;
}

/**
 * Parse log entries from a single file.
 *
 * The type of each log is based on the message role and content.
 * @param {string} sessionPath - Path to session file
 * @returns {Log[]} Array of parsed log entries.
 *
 * type LogType = 'assistant' | 'thinking' | 'took_use' | 'took_result' | 'agent';
 *
 * type Log {
 *     uuid: string;
 *     type: LogType;
 *     timestamp: string;
 *     content: string | Object;
 *     usage: Number;
 *     collapsed: Boolean,
 *     toolName: string,
 *     toolUseResult: string | Object,
 *     raw: Object,
 * }
 *
 */
export function loadSessionLogs(sessionPath) {
	const logs = readJsonl(sessionPath);
	const parsedLogs = [];

	for (const log of logs) {
		// Not processing summaries
		if (log.type === 'summary') {
			continue;
		}

		// Not processing file history snapshots
		if (log.type === 'file-history-snapshot') {
			continue;
		}

		// Not processing queue opertaions
		if (log.type === 'queue-operation') {
			continue;
		}

		if (!log.message) continue;

		let type = getMessageType(log);
		let parsed = {
			uuid: log.uuid,
			type: type,
			timestamp: log.timestamp, // Store ISO timestamp
			content: getMessageContent(log, type),
			usage: getTotalUsage(log),
			collapsed: true,
			raw: log,
		};

		if (parsed.type === 'user') {
			if (parsed.raw.todos) {
				// Handle in log detail view
			}
			if (parsed.raw.thinkingMetadata) {
				// Handle in log detail view
			}
		}

		if (parsed.type === 'tool_use') {
			parsed['toolName'] = parsed.raw.message.content[0].name;
		}

		if (parsed.type === 'tool_result') {
			const toolUseId = parsed.raw.message.content[0].tool_use_id;
			const parentIndex = parsedLogs.findIndex(l => {
				if (l.type === "tool_use") {
					return l.raw.message.content[0].id === toolUseId;
				}
			});
			if (parentIndex >= 0) {
				const toolName = parsedLogs[parentIndex].toolName;
				parsed['toolName'] = toolName;
			} else {
				// Parent tool_use not found, use a placeholder
				parsed['toolName'] = 'unknown';
			}
			parsed['toolUseResult'] = parsed.raw.toolUseResult;
		}

		parsedLogs.push(parsed);
	}

	return parsedLogs;
}

/**
 * Parse an agent log file and create start/end entries
 */
function parseAgentLogs(sessionPath) {
	const entries = readJsonl(sessionPath);
	const logs = [];

	if (entries.length === 0) return logs;

	// Get agent ID from first entry
	const agentId = entries[0].agentId;
	if (!agentId) return logs;

	// Find first and last timestamps
	const timestamps = entries.filter(e => e.timestamp).map(e => e.timestamp);

	if (timestamps.length === 0) return logs;

	const firstTimestamp = timestamps[0];
	const lastTimestamp = timestamps[timestamps.length - 1];

	// Calculate total token usage for this agent
	let totalUsage = 0;
	for (const entry of entries) {
		// Skip summary and other non-message entries
		if (
			entry.type === 'summary' ||
			entry.type === 'file-history-snapshot' ||
			entry.type === 'queue-operation'
		) {
			continue;
		}

		// Sum up usage from user and assistant messages
		if (entry.type === 'user' || entry.type === 'assistant') {
			totalUsage += getTotalUsage(entry);
		}
	}

	// Create agent start entry
	logs.push({
		uuid: `${agentId}-start`,
		type: 'subagent',
		timestamp: firstTimestamp, // Store ISO timestamp
		agentId: agentId,
		content: `Agent ${agentId} started`,
		collapsed: true,
		usage: totalUsage,
		isLast: false,
	});

	// Create agent end entry
	logs.push({
		uuid: `${agentId}-end`,
		type: 'subagent',
		timestamp: lastTimestamp, // Store ISO timestamp
		agentId: agentId,
		content: `Agent ${agentId} completed`,
		collapsed: true,
		usage: 0, // Only count usage once (in start entry)
		isLast: true,
	});

	return logs;
}

function loadAgentLogs(sessionDir, sessionId) {
	const files = fs.readdirSync(sessionDir);
	const agentFiles = files.filter(
		f => f.startsWith('agent-') && f.endsWith('.jsonl'),
	);
	const logs = [];
	for (const file of agentFiles) {
		const agentPath = path.join(sessionDir, file);

		// Read first line to check if this agent belongs to this session
		const line = fs.readFileSync(agentPath, 'utf-8').split('\n')[0];
		if (!line.trim()) continue;

		try {
			const log = JSON.parse(line);
			if (log.sessionId === sessionId) {
				const agentLogs = parseAgentLogs(agentPath);
				logs.push(...agentLogs);
			}
		} catch (e) {
			// Skip invalid JSON
			continue;
		}
	}

	return logs;
}

/**
 * Extract metadata from a session file without parsing all logs
 * @param {string} sessionPath - Path to session file
 * @returns {SessionMetadata} Session metadata (cwd, usage, logCount, created, modified)
 *
 * type SessionMetadata = {
 *   project: string | null;
 *   created: Date;
 *   modified: Date;
 *   log_count: Number;
 *   token_usage: Number;
 * };
 *
 */
export function loadSessionMetadata(sessionPath) {
	const sessionStats = fs.statSync(sessionPath);
	const created = sessionStats.birthtime;
	const modified = sessionStats.mtime;

	try {
		const logs = readJsonl(sessionPath);

		let project = null;
		let logCount = 0;
		let tokenUsage = 0;

		for (const log of logs) {
			if (!project && log.cwd) {
				project = log.cwd;
			}
			if (log.type === 'user' || log.type === 'assistant') {
				logCount += 1;
				tokenUsage += getTotalUsage(log);
			}
		}

		return {
			project,
			created,
			modified,
			logCount,
			tokenUsage,
		};
	} catch (e) {
		return {
			project: null,
			created: null,
			modified: null,
			usage: 0,
			logCount: 0,
			duration: null,
		};
	}
}

/**
 * Parse logs from a session directory or file path
 * @param {string} sessionDir - Directory containing session files
 * @param {string} sessionId - Optional session ID to parse (without .jsonl extension)
 * @param {string} sessionPath - Optional direct path to session file (takes precedence)
 * @returns Session data object {logs, sessionId, project: projectName, startDatetime}
 * 
 * type Session = {
	 uuid: uuid;
	 path: string;
	 project: string;
	 created: Date;
	 modified: Date;
	 logCount: Number;
	 tokenUsage: Number;
	 logs: Log[];
}
 * 
 */
export function loadSession(sessionPath) {
	const sessionDir = path.dirname(sessionPath);
	const sessionId = path.parse(sessionPath).name;
	const metadata = loadSessionMetadata(sessionPath);
	const logs = loadSessionLogs(sessionPath);

	// Check if this is an agent session (starts with 'agent-')
	let parentSessionId = null;
	if (sessionId.startsWith('agent-') && logs.length > 0) {
		// Agent logs contain sessionId field pointing to parent
		const firstLog = logs.find(log => log.raw?.sessionId);
		if (firstLog?.raw?.sessionId) {
			parentSessionId = firstLog.raw.sessionId;
		}
	}

	// Merge agent logs (only for non-agent sessions)
	if (!sessionId.startsWith('agent-')) {
		const agentLogs = loadAgentLogs(sessionDir, sessionId);
		logs.push(...agentLogs);
	}

	// Sort chronologically
	logs.sort((a, b) => {
		if (a.timestamp < b.timestamp) return -1;
		if (a.timestamp > b.timestamp) return 1;
		return 0;
	});

	// Assign sequential IDs
	logs.forEach((log, index) => {
		log.id = index + 1;
	});

	return {
		uuid: sessionId,
		path: sessionPath,
		parentSessionId,
		...metadata,
		logs,
	};
}
