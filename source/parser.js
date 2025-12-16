import { error } from 'console';
import fs from 'fs';
import path from 'path';
import { cwd } from 'process';


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
		return null
	};


	if (message.role === "user") {
		if (message.toolUseResult) {
			return "tool_result"
		} else {
			return "user"
		}
	}

	if (message.role === "assistant") {
		for (const content of message.content) {
			if (content.type === "thinking") {
				return "thinking"
			}
			if (content.type === "tool_use") {
				return "tool_use"
			}
		}

		return "assistant"
	}

	error(`Encountered an unknown message type while parsing session data (message: {message})`)
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
		return null
	};

	if (type === "user") {
		if (typeof message.content === 'string') {
			return message.content;
		}
		return message.content[0]?.text || '';
	} else if (type === "assistant") {
		return message.content[0]?.text || '';
	} else if (type === "thinking") {
		return message.content[0]?.thinking || '';
	} else if (type === "tool_use") {
		const input = message.content[0]?.input;
		return typeof input === 'object' ? JSON.stringify(input, null, 2) : String(input || '');
	} else if (type === "tool_result") {
		const content = message.content[0]?.content;
		return typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content || '');
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
		return null
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
 * Format ISO timestamp for display
 * @param {string} timestamp - ISO-formatted timestamp
 */
function formatTimestamp(timestamp) {
	return new Date(timestamp).toLocaleTimeString()
}

/**
 * Parse log entries from a single file.
 * 
 * The type of each log is based on the message role and content.
 * @param {string} filePath - Path to session file
 * @returns {array} Array of parsed log entries. 
 */
export function parseLogFile(filePath) {

	const logs = readJsonl(filePath);
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
			timestamp: formatTimestamp(log.timestamp),
			content: getMessageContent(log, type),
			usage: getTotalUsage(log),
			collapsed: true,
			raw: log,
		};

		if (parsed.type === "user") {
			if (parsed.raw.todos) {
				// Handle in log detail view
			}
			if (parsed.raw.thinkingMetadata) {
				// Handle in log detail view
			}
		}

		if (parsed.type === "tool_use") {
			parsed['tool_name'] = parsed.raw.message.content[0].name;
		}

		if (parsed.type === "tool_result") {
			const parentUuid = parsed.raw.message.parentUuid;
			const parentIndex = parsedLogs.findIndex(l => l.uuid === parentUuid);
			const toolName = parsedLogs[parentIndex].tool_name;
			parsed['tool_name'] = toolName;
			parsed['tool_use_result'] = parsed.raw.toolUseResult;
		}

		parsedLogs.push(parsed);
	}

	return parsedLogs;
}

/**
 * Parse an agent log file and create start/end entries
 */
function parseAgentFile(filePath) {
	const entries = readJsonl(filePath);
	const logs = [];

	if (entries.length === 0) return logs;

	// Get agent ID from first entry
	const agentId = entries[0].agentId;
	if (!agentId) return logs;

	// Find first and last timestamps
	const timestamps = entries
		.filter(e => e.timestamp)
		.map(e => e.timestamp);

	if (timestamps.length === 0) return logs;

	const firstTimestamp = timestamps[0];
	const lastTimestamp = timestamps[timestamps.length - 1];

	// Calculate total token usage for this agent
	let totalUsage = 0;
	for (const entry of entries) {
		// Skip summary and other non-message entries
		if (entry.type === 'summary' || entry.type === 'file-history-snapshot' || entry.type === 'queue-operation') {
			continue;
		}

		// Sum up usage from user and assistant messages
		if (entry.type === 'user' || entry.type === 'assistant') {
			const message = entry.message;
			if (message && message.usage) {
				totalUsage += getTotalUsage(message.usage);
			}
		}
	}

	// Create agent start entry
	logs.push({
		uuid: `${agentId}-start`,
		type: 'subagent',
		timestamp: formatTimestamp(firstTimestamp),
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
		timestamp: formatTimestamp(lastTimestamp),
		agentId: agentId,
		content: `Agent ${agentId} completed`,
		collapsed: true,
		usage: 0, // Only count usage once (in start entry)
		isLast: true,
	});

	return logs;
}

/**
 * Extract metadata from a session file without parsing all logs
 * @param {string} filePath - Path to session file
 * @returns {object} Session metadata (cwd, usage, logCount, created, modified)
 */
export function getSessionMetadata(filePath) {

	const sessionStats = fs.statSync(filePath);
	const created = sessionStats.birthtime;
	const modified = sessionStats.mtime;

	try {
		const logs = readJsonl(filePath);

		let cwd = null;
		let created = null;
		let totalUsage = 0;
		let logCount = 0;
		let lastTimestamp = null;

		for (const log of logs) {

			if (!cwd && log.cwd) {
				cwd = log.cwd;
			}

			if (log.type === 'user' || log.type === 'assistant') {
				logCount += 1;
				totalUsage += getTotalUsage(log);
				const message = log.message;
			}
		}

		return {
			cwd,
			usage: totalUsage,
			logCount,
			created,
			modified,
		};
	} catch (e) {
		return { cwd: null, usage: 0, logCount: 0, created: null, modified: null };
	}
}

/**
 * Parse logs from a session directory or file path
 * @param {string} sessionDir - Directory containing session files
 * @param {string} sessionId - Optional session ID to parse (without .jsonl extension)
 * @param {string} sessionPath - Optional direct path to session file (takes precedence)
 */
export function parseSession(sessionDir, sessionId = null, sessionPath = null) {
	let mainFilePath;
	let currentSessionDir;

	if (sessionPath) {
		// Load from direct file path
		mainFilePath = sessionPath;
		currentSessionDir = path.dirname(sessionPath);
	} else {
		// Load from sessionDir/sessionId
		const files = fs.readdirSync(sessionDir);

		// Find main session file
		let mainFile;
		if (sessionId) {
			mainFile = `${sessionId}.jsonl`;
			if (!files.includes(mainFile)) {
				throw new Error(`Session file ${mainFile} not found`);
			}
		} else {
			// Find first non-agent file
			mainFile = files.find(f => f.endsWith('.jsonl') && !f.startsWith('agent-'));
			if (!mainFile) {
				throw new Error('No main session file found');
			}
		}

		mainFilePath = path.join(sessionDir, mainFile);
		currentSessionDir = sessionDir;
	}

	// Parse main logs
	const logs = parseLogFile(mainFilePath);

	// Get session ID from the main file name (without .jsonl extension)
	const currentSessionId = path.basename(mainFilePath, '.jsonl');

	// Parse agent files that belong to this session
	const allFiles = fs.readdirSync(currentSessionDir);
	const agentFiles = allFiles.filter(f => f.startsWith('agent-') && f.endsWith('.jsonl'));
	for (const agentFile of agentFiles) {
		const agentPath = path.join(currentSessionDir, agentFile);

		// Read first line to check if this agent belongs to this session
		const firstLine = fs.readFileSync(agentPath, 'utf-8').split('\n')[0];
		if (!firstLine.trim()) continue;

		try {
			const firstEntry = JSON.parse(firstLine);
			// Only parse if this agent belongs to the current session
			if (firstEntry.sessionId === currentSessionId) {
				const agentLogs = parseAgentFile(agentPath);
				logs.push(...agentLogs);
			}
		} catch (e) {
			// Skip invalid JSON
			continue;
		}
	}

	// Sort by timestamp
	logs.sort((a, b) => {
		if (a.timestamp < b.timestamp) return -1;
		if (a.timestamp > b.timestamp) return 1;
		return 0;
	});

	// Assign sequential IDs
	logs.forEach((log, index) => {
		log.id = index + 1;
	});

	// Extract project name from directory path
	// Format: ~/.claude/projects/something-with-project-name
	const dirName = path.basename(currentSessionDir);
	const projectName = dirName.replace(/-/g, ' ').replace(/^\./, '');

	// Get start datetime from first log
	const startDatetime = logs.length > 0 && logs[0].isoTimestamp ? new Date(logs[0].isoTimestamp).toLocaleString() : null;

	return {
		logs,
		sessionId: currentSessionId,
		project: projectName,
		startDatetime,
	};
}
