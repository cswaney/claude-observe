import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {Box, Text, useInput} from 'ink';
import {TitledBox} from '@mishieck/ink-titled-box';
import {useScrollableText} from '../../hooks/useScrollableText.js';

function typeDisplay(log) {
	if (log.type === 'tool_use' || (log.type === 'tool_result' && log.toolName)) {
		return `Tool (${log.toolName})`;
	}

	if (log.type === 'thinking') {
		return 'Thinking';
	}

	if (log.type === 'user') {
		return 'User';
	}

	if (log.type === 'assistant') {
		return 'Assistant';
	}
}

// Helper: Expand \n and \t within JSON string values
// This prevents extremely long lines that would overflow the viewport
function expandJsonStringEscapes(jsonText) {
	let result = '';
	let inString = false;
	let escaped = false;

	for (const char of jsonText) {
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
			result +=
				char === 'n'
					? '\n' // Expand \n to actual newline
					: '\\' + char; // Other escapes (e.g., \", \\, \t) - keep as-is

			escaped = false;
		} else {
			result += char;
		}
	}

	return result;
}

function timestampDisplay(log) {
	// Log.timestamp is now ISO format, format it for display
	return new Date(log.timestamp).toLocaleString();
}

function formatUsage(usage, rawLog) {
	if (!usage) return 'N/A';

	// Extract usage from raw log if available
	const message = rawLog?.message;
	const usageObject = message?.usage;

	if (!usageObject) {
		// Fallback: just show total
		return `${formatTokens(usage)} total`;
	}

	const input = usageObject.input_tokens || 0;
	const output = usageObject.output_tokens || 0;
	const cacheRead = usageObject.cache_read_input_tokens || 0;
	const cacheWrite = usageObject.cache_creation_input_tokens || 0;

	const total = input + output + cacheRead + cacheWrite;

	return `${formatTokens(total)} total (${formatTokens(
		input,
	)} in, ${formatTokens(output)} out, ${formatTokens(
		cacheWrite,
	)} cache write, ${formatTokens(cacheRead)} cache read)`;
}

function formatTokens(count) {
	if (count >= 1_000_000) {
		return (count / 1_000_000).toFixed(1) + 'M';
	}

	if (count >= 1000) {
		return (count / 1000).toFixed(1) + 'k';
	}

	return count.toString();
}

function HighlightedJSON({line, inString}) {
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
						currentIndex =
							stringEnd + 1 + (afterQuote ? afterQuote[0].length : 0);
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
					{regex: /\b(true|false|null)\b/, type: 'keyword'},
					{regex: /-?\d+\.?\d*/, type: 'number'},
					{regex: /[{}[\],:]/, type: 'punctuation'},
					{regex: /\s+/, type: 'whitespace'},
				];

				for (const pattern of patterns) {
					const regex = new RegExp(`^${pattern.regex.source}`);
					const match = line.slice(currentIndex).match(regex);

					if (match) {
						tokens.push({text: match[0], type: pattern.type});
						currentIndex += match[0].length;
						matched = true;
						break;
					}
				}

				if (!matched) {
					tokens.push({text: char, type: 'plain'});
					currentIndex++;
				}
			}
		}
	}

	return (
		<Text wrap="truncate-end">
			{tokens.map((token, idx) => {
				const key = `${token.type}-${idx}`;
				switch (token.type) {
					case 'key': {
						return (
							<Text key={key} color="cyan">
								{token.text}
							</Text>
						);
					}

					case 'string': {
						return (
							<Text key={key} color="green">
								{token.text}
							</Text>
						);
					}

					case 'keyword': {
						return (
							<Text key={key} color="magenta">
								{token.text}
							</Text>
						);
					}

					case 'number': {
						return (
							<Text key={key} color="yellow">
								{token.text}
							</Text>
						);
					}

					case 'punctuation': {
						return (
							<Text key={key} dimColor>
								{token.text}
							</Text>
						);
					}

					case 'whitespace': {
						return <Text key={key}>{token.text}</Text>;
					}

					default: {
						return <Text key={key}>{token.text}</Text>;
					}
				}
			})}
		</Text>
	);
}

export default function Details({log, width, contentHeight = 30}) {
	const [scrollOffset, setScrollOffset] = useState(0);

	// Extract content as text string (not lines array)
	// Memoize to avoid recalculating on every render
	const {contentText, isJSON} = useMemo(() => {
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
		text = json ? expandJsonStringEscapes(text) : text.replace(/\\n/g, '\n'); // Escaped newlines → actual newlines

		return {contentText: text, isJSON: json};
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
			for (const char of line) {
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
			setScrollOffset(previous => Math.max(0, previous - 1));
		} else if (key.downArrow) {
			setScrollOffset(previous =>
				Math.min(viewport.maxScrollOffset, previous + 1),
			);
		} else
			switch (input) {
				case 'u': {
					setScrollOffset(previous => Math.max(0, previous - 10));

					break;
				}

				case 'd': {
					setScrollOffset(previous =>
						Math.min(viewport.maxScrollOffset, previous + 10),
					);

					break;
				}

				case 't': {
					setScrollOffset(0);

					break;
				}

				case 'b': {
					setScrollOffset(viewport.maxScrollOffset);

					break;
				}
				// No default
			}
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
					{viewport.visibleLines.map((line, idx) => {
						const lineNumber = viewport.startLineIndex + idx;
						return isJSON ? (
							<Box key={lineNumber}>
								<Box width={6}>
									<Text dimColor>[{lineNumber}]</Text>
								</Box>
								<HighlightedJSON
									line={line}
									inString={lineStringStates[lineNumber] || false}
								/>
							</Box>
						) : (
							<Box key={lineNumber}>
								<Box width={6}>
									<Text dimColor>[{lineNumber}]</Text>
								</Box>
								<Text wrap="truncate-end"> {line}</Text>
							</Box>
						);
					})}
					{viewport.hasLinesBelow && (
						<Box width={width - 8} height={2}>
							<Text dimColor>... {viewport.rowsBelow} rows below ...</Text>
						</Box>
					)}
				</TitledBox>
			</TitledBox>

			{/* Navigation */}
			<Box justifyContent="center" marginTop={1}>
				<Text dimColor>
					↑/↓: Scroll | ←: Session | Esc: Browser | Shift+←/→: Prev/Next log |
					u/d/t/b: Jump | Line {viewport.startLineIndex}-{viewport.endLineIndex}
					/{viewport.totalLines - 1}
				</Text>
			</Box>
		</Box>
	);
}
