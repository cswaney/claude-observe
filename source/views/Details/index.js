import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';
import { useScrollableText } from '../../hooks/useScrollableText.js';

function typeDisplay(log) {
	if (log.type === 'tool_use' || log.type === 'tool_result' && log.toolName) {
		return `Tool (${log.toolName})`;
	} else if (log.type === 'thinking') {
		return 'Thinking';
	} else if (log.type === 'user') {
		return 'User';
	} else if (log.type === 'assistant') {
		return 'Assistant';
	}
}

// Helper: Expand \n and \t within JSON string values
// This prevents extremely long lines that would overflow the viewport
function expandJsonStringEscapes(jsonText) {
	let result = '';
	let inString = false;
	let escaped = false;

	for (let i = 0; i < jsonText.length; i++) {
		const char = jsonText[i];
		const prevChar = i > 0 ? jsonText[i - 1] : '';

		// Track if we're inside a string
		if (char === '"' && !escaped) {
			inString = !inString;
			result += char;
			escaped = false;
			continue;
		}

		// Handle escape sequences
		if (inString && char === '\\' && !escaped) {
			escaped = true;
			continue; // Don't add the backslash yet
		}

		if (escaped) {
			// We're processing an escape sequence
			if (char === 'n') {
				result += '\n'; // Expand \n to actual newline
			} else {
				// Other escapes (e.g., \", \\, \t) - keep as-is
				// Note: literal tabs are already replaced globally before this function
				result += '\\' + char;
			}
			escaped = false;
		} else {
			result += char;
		}
	}

	return result;
}

function timestampDisplay(log) {
	// log.timestamp is now ISO format, format it for display
	return new Date(log.timestamp).toLocaleString();
}

function formatUsage(usage, rawLog) {
	if (!usage) return 'N/A';

	// Extract usage from raw log if available
	const message = rawLog?.message;
	const usageObj = message?.usage;

	if (!usageObj) {
		// Fallback: just show total
		return `${formatTokens(usage)} total`;
	}

	const input = usageObj.input_tokens || 0;
	const output = usageObj.output_tokens || 0;
	const cacheRead = usageObj.cache_read_input_tokens || 0;
	const cacheWrite = usageObj.cache_creation_input_tokens || 0;

	const total = input + output + cacheRead + cacheWrite;

	return `${formatTokens(total)} total (${formatTokens(
		input,
	)} in, ${formatTokens(output)} out, ${formatTokens(
		cacheWrite,
	)} cache write, ${formatTokens(cacheRead)} cache read)`;
}

function formatTokens(count) {
	if (count >= 1000000) {
		return (count / 1000000).toFixed(1) + 'M';
	} else if (count >= 1000) {
		return (count / 1000).toFixed(1) + 'k';
	}
	return count.toString();
}

function HighlightedJSON({ line, inString }) {
	// Parse the line to identify JSON syntax elements
	// inString indicates if we're continuing a string from a previous line
	const tokens = [];
	let currentIndex = 0;
	let insideString = inString;

	while (currentIndex < line.length) {
		const char = line[currentIndex];

		if (insideString) {
			// We're inside a multi-line string value
			// Look for the closing quote (not escaped)
			let stringEnd = currentIndex;
			let escaped = false;

			while (stringEnd < line.length) {
				if (line[stringEnd] === '\\' && !escaped) {
					escaped = true;
					stringEnd++;
					continue;
				}
				if (line[stringEnd] === '"' && !escaped) {
					// Found closing quote
					tokens.push({
						text: line.slice(currentIndex, stringEnd + 1),
						type: 'string',
					});
					currentIndex = stringEnd + 1;
					insideString = false;
					break;
				}
				escaped = false;
				stringEnd++;
			}

			if (insideString) {
				// No closing quote found, entire rest of line is string
				tokens.push({
					text: line.slice(currentIndex),
					type: 'string',
				});
				break;
			}
		} else {
			// Normal JSON parsing
			let matched = false;

			// Check for opening quote (start of string/key)
			if (char === '"') {
				let stringEnd = currentIndex + 1;
				let escaped = false;

				while (stringEnd < line.length) {
					if (line[stringEnd] === '\\' && !escaped) {
						escaped = true;
						stringEnd++;
						continue;
					}
					if (line[stringEnd] === '"' && !escaped) {
						// Found closing quote
						const fullString = line.slice(currentIndex, stringEnd + 1);
						// Check if it's a key (followed by :)
						const afterQuote = line.slice(stringEnd + 1).match(/^\s*:/);
						tokens.push({
							text: afterQuote ? fullString + afterQuote[0] : fullString,
							type: afterQuote ? 'key' : 'string',
						});
						currentIndex = stringEnd + 1 + (afterQuote ? afterQuote[0].length : 0);
						matched = true;
						break;
					}
					escaped = false;
					stringEnd++;
				}

				if (!matched) {
					// No closing quote - multi-line string starts here
					tokens.push({
						text: line.slice(currentIndex),
						type: 'string',
					});
					insideString = true;
					break;
				}
			}

			if (!matched) {
				// Try other patterns
				const patterns = [
					{ regex: /\b(true|false|null)\b/, type: 'keyword' },
					{ regex: /-?\d+\.?\d*/, type: 'number' },
					{ regex: /[{}\[\],:]/, type: 'punctuation' },
					{ regex: /\s+/, type: 'whitespace' },
				];

				for (const pattern of patterns) {
					const regex = new RegExp(`^${pattern.regex.source}`);
					const match = line.slice(currentIndex).match(regex);

					if (match) {
						tokens.push({ text: match[0], type: pattern.type });
						currentIndex += match[0].length;
						matched = true;
						break;
					}
				}

				if (!matched) {
					tokens.push({ text: char, type: 'plain' });
					currentIndex++;
				}
			}
		}
	}

	return (
		<Text wrap="truncate-end">
			{tokens.map((token, idx) => {
				switch (token.type) {
					case 'key':
						return (
							<Text key={idx} color="cyan">
								{token.text}
							</Text>
						);
					case 'string':
						return (
							<Text key={idx} color="green">
								{token.text}
							</Text>
						);
					case 'keyword':
						return (
							<Text key={idx} color="magenta">
								{token.text}
							</Text>
						);
					case 'number':
						return (
							<Text key={idx} color="yellow">
								{token.text}
							</Text>
						);
					case 'punctuation':
						return (
							<Text key={idx} dimColor>
								{token.text}
							</Text>
						);
					case 'whitespace':
						return <Text key={idx}>{token.text}</Text>;
					default:
						return <Text key={idx}>{token.text}</Text>;
				}
			})}
		</Text>
	);
}

export default function Details({ log, width, contentHeight = 30 }) {
	const [scrollOffset, setScrollOffset] = useState(0);

	// Extract content as text string (not lines array)
	// Memoize to avoid recalculating on every render
	const { contentText, isJSON } = useMemo(() => {
		let text = '';
		let json = false;

		if (log.type === 'tool_use') {
			const content = log.raw.message?.content?.[0].input;
			if (typeof content === 'string') {
				text = content;
			} else {
				text = JSON.stringify(content, null, 2);
				json = true;
			}
		} else if (log.type === 'tool_result') {
			if (log.toolUseResult) {
				if (typeof log.toolUseResult === 'string') {
					text = log.toolUseResult;
				} else {
					text = JSON.stringify(log.toolUseResult, null, 2);
					json = true;
				}
			}
		} else {
			text = log.content || '';
		}

		// FIRST: Replace literal tab characters with spaces
		// Tab characters expand unpredictably in terminals and break width calculations
		text = text.replace(/\t/g, '  ');

		// THEN: Preprocess text: expand escaped newlines
		// For JSON: Only expand escapes within string values to prevent breaking syntax highlighting
		// For plain text: Expand all escapes globally
		if (json) {
			text = expandJsonStringEscapes(text);
		} else {
			text = text.replace(/\\n/g, '\n');  // Escaped newlines → actual newlines
		}

		return { contentText: text, isJSON: json };
	}, [log]);

	// Calculate string state for each line (for multi-line JSON strings)
	const lineStringStates = useMemo(() => {
		if (!isJSON) return [];

		const lines = contentText.split('\n');
		const states = [];
		let inString = false;

		for (const line of lines) {
			states.push(inString);

			// Update state for next line
			let escaped = false;
			for (let i = 0; i < line.length; i++) {
				const char = line[i];
				if (char === '\\' && !escaped) {
					escaped = true;
				} else if (char === '"' && !escaped) {
					inString = !inString;
					escaped = false;
				} else {
					escaped = false;
				}
			}
		}

		return states;
	}, [contentText, isJSON]);

	// Simple approach: assume each line = 1 row, let Ink truncate overflow
	const getLineHeight = useCallback(() => 1, []);

	// Use the scrollable text hook
	const viewport = useScrollableText({
		text: contentText,
		scrollOffset,
		height: contentHeight,
		width,
		getLineHeight,
	});

	useEffect(() => {
		setScrollOffset(0);
	}, [log]);

	useInput((input, key) => {
		if (key.upArrow) {
			setScrollOffset(prev => Math.max(0, prev - 1));
		} else if (key.downArrow) {
			setScrollOffset(prev => Math.min(viewport.maxScrollOffset, prev + 1));
		} else if (input === 'u') {
			setScrollOffset(prev => Math.max(0, prev - 10));
		} else if (input === 'd') {
			setScrollOffset(prev => Math.min(viewport.maxScrollOffset, prev + 10));
		} else if (input === 't') {
			setScrollOffset(0);
		} else if (input === 'b') {
			setScrollOffset(viewport.maxScrollOffset);
		}

		return;
	});

	return (
		<Box flexDirection="column">
			<TitledBox
				flexDirection="column"
				width={width}
				borderStyle="single"
				borderColor="gray"
				padding={1}
				titles={[`Log: ${log.uuid}`]}
			>
				{/* Metadata */}
				<TitledBox
					flexDirection="column"
					titles={['Info']}
					borderColor="gray"
					borderStyle="single"
					padding={1}
				>
					<Box>
						<Text dimColor>Project: </Text>
						<Text>{log.raw.cwd || 'N/A'}</Text>
					</Box>
					<Box>
						<Text dimColor>Session: </Text>
						<Text>{log.raw.sessionId || 'N/A'}</Text>
					</Box>
					<Box>
						<Text dimColor>Type: </Text>
						<Text>{typeDisplay(log)}</Text>
					</Box>
					<Box>
						<Text dimColor>Timestamp: </Text>
						<Text>{timestampDisplay(log)}</Text>
					</Box>
					<Box>
						<Text dimColor>Version: </Text>
						<Text>{log.raw?.version || 'N/A'}</Text>
					</Box>
					{(log.type === 'assistant' ||
						log.type === 'tool_use' ||
						log.type === 'thinking') && (
							<Box>
								<Text dimColor>Model: </Text>
								<Text>{log.raw?.message?.model || 'N/A'}</Text>
							</Box>
						)}
					{(log.type === 'assistant' ||
						log.type === 'tool_use' ||
						log.type === 'thinking') &&
						log.usage !== undefined && (
							<Box>
								<Text dimColor>Usage: </Text>
								<Text>{formatUsage(log.usage, log.raw)}</Text>
							</Box>
						)}
					{(log.type === 'assistant' ||
						log.type === 'tool_use' ||
						log.type === 'thinking') && (
							<Box>
								<Text dimColor>Stop Reason: </Text>
								<Text>{log.raw?.message?.stop_reason || 'None'}</Text>
							</Box>
						)}
				</TitledBox>

				{/* Content */}
				<TitledBox
					flexDirection="column"
					titles={['Content']}
					borderColor="gray"
					borderStyle="single"
					padding={1}
					marginTop={1}
					height={contentHeight}
				>
					{viewport.hasLinesAbove && (
						<Box width={width - 8} height={1}>
							<Text dimColor>... {viewport.rowsAbove} rows above ...</Text>
						</Box>
					)}
					{viewport.visibleLines.map((line, idx) =>
						isJSON ? (
							<Box key={idx}>
								<Box width={6}>
									<Text dimColor>[{viewport.startLineIndex + idx}]</Text>
								</Box>
								<HighlightedJSON
									line={line}
									inString={lineStringStates[viewport.startLineIndex + idx] || false}
								/>
							</Box>
						) : (
							<Box key={idx}>
								<Box width={6}>
									<Text dimColor>[{viewport.startLineIndex + idx}]</Text>
								</Box>
								<Text wrap="truncate-end"> {line}</Text>
							</Box>
						),
					)}
					{viewport.hasLinesBelow && (
						<Box width={width - 8} height={2}>
							<Text dimColor>
								... {viewport.rowsBelow} rows below ...
							</Text>
						</Box>
					)}
				</TitledBox>
			</TitledBox>

			{/* Navigation */}
			<Box justifyContent="center" marginTop={1}>
				<Text dimColor>
					Esc: Back | ←/→: Prev/Next Log (offset: {scrollOffset}/{viewport.maxScrollOffset}, lines:{' '}
					{viewport.startLineIndex}-{viewport.endLineIndex}/{viewport.totalLines - 1})
				</Text>
			</Box>

			{/* Debug */}
			<Box justifyContent="center" marginTop={1}>
				<Text dimColor>
					[DEBUG] offset: {scrollOffset}, visible: {viewport.visibleLines.length},
					rowsAbove: {viewport.rowsAbove}, rowsBelow: {viewport.rowsBelow},
					hasAbove: {String(viewport.hasLinesAbove)}, hasBelow: {String(viewport.hasLinesBelow)}
				</Text>
			</Box>
		</Box>
	);
}
