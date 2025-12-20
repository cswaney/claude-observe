import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';

function typeDisplay(log) {
	if (log.type === 'tool_use' && log.toolName) {
		return `Tool (${log.toolName})`;
	} else if (log.type === 'thinking') {
		return 'Thinking';
	} else if (log.type === 'user') {
		return 'User';
	} else if (log.type === 'assistant') {
		return 'Assistant';
	}
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

function HighlightedJSON({ line }) {
	// Parse the line to identify JSON syntax elements
	const tokens = [];
	let currentIndex = 0;

	// Regex patterns for different JSON elements
	const patterns = [
		{ regex: /"([^"\\]|\\.)*"\s*:/, type: 'key' }, // JSON keys
		{ regex: /"([^"\\]|\\.)*"/, type: 'string' }, // String values
		{ regex: /\b(true|false|null)\b/, type: 'keyword' }, // Keywords
		{ regex: /-?\d+\.?\d*/, type: 'number' }, // Numbers
		{ regex: /[{}\[\],:]/, type: 'punctuation' }, // Punctuation
	];

	while (currentIndex < line.length) {
		let matched = false;

		for (const pattern of patterns) {
			const regex = new RegExp(`^${pattern.regex.source}`);
			const match = line.slice(currentIndex).match(regex);

			if (match) {
				const text = match[0];
				tokens.push({ text, type: pattern.type });
				currentIndex += text.length;
				matched = true;
				break;
			}
		}

		if (!matched) {
			// No pattern matched, add as plain text
			tokens.push({ text: line[currentIndex], type: 'plain' });
			currentIndex++;
		}
	}

	return (
		<Text>
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
					default:
						return <Text key={idx}>{token.text}</Text>;
				}
			})}
		</Text>
	);
}

export default function Details({ log, width, contentHeight = 30 }) {
	const [scrollOffset, setScrollOffset] = useState(0);

	let contentLines = [];
	let isJSON = false;

	if (log.type === 'tool_use') {
		if (log.toolInput) {
			contentLines = JSON.stringify(log.toolInput, null, 2).split('\n');
			isJSON = true;
		}
	} else if (log.type === "tool_result") {
		if (log.toolUseResult) {
			if (typeof log.toolUseResult === 'string') {
				contentLines = log.toolUseResult.split('\n');
			} else {
				contentLines = JSON.stringify(log.toolUseResult, null, 2).split('\n');
				isJSON = true;
			}
		}
	} else {
		contentLines = (log.content || '').split('\n');
	}

	const totalLines = contentLines.length;
	const maxOffset = Math.max(0, totalLines - contentHeight);
	const visibleLines = contentLines.slice(
		scrollOffset,
		scrollOffset + contentHeight,
	);
	const hasLinesAbove = scrollOffset > 0;
	const hasLinesBelow = scrollOffset + contentHeight < totalLines;

	useEffect(() => {
		setScrollOffset(0);
	}, [log]);

	useInput((input, key) => {
		if (key.upArrow) {
			setScrollOffset(prev => Math.max(0, prev - 1));
		} else if (key.downArrow) {
			setScrollOffset(prev => Math.min(maxOffset, prev + 1));
		} else if (input === 'u') {
			setScrollOffset(prev => Math.max(0, prev - 10));
		} else if (input === 'd') {
			setScrollOffset(prev => Math.min(maxOffset, prev + 10));
		} else if (input === 't') {
			setScrollOffset(0);
		} else if (input === 'b') {
			setScrollOffset(maxOffset);
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
					{hasLinesAbove && (
						<Box width={width - 8} height={1}>
							<Text dimColor>... {scrollOffset} more above ...</Text>
						</Box>
					)}
					{visibleLines.map((line, idx) =>
						isJSON ? (
							<HighlightedJSON key={idx} line={line} />
						) : (
							<Box key={idx}>
								<Box width={6}>
									<Text dimColor>[{scrollOffset + idx}]</Text>
								</Box>
								<Text> {line}</Text>
							</Box>
						),
					)}
					{hasLinesBelow && (
						<Box width={width - 8} height={2}>
							<Text dimColor>
								... {totalLines - (scrollOffset + contentHeight)} more below ...
							</Text>
						</Box>
					)}
				</TitledBox>
			</TitledBox>

			{/* Navigation */}
			<Box justifyContent="center" marginTop={1}>
				<Text dimColor>
					Esc: Back | ←/→: Prev/Next Log (offset: {scrollOffset}, lines:{' '}
					{visibleLines.length}, hasLinesAbove: {String(hasLinesAbove)},
					hasLinesBelow: {String(hasLinesBelow)})
				</Text>
			</Box>

			{/* Debug */}
			<Box justifyContent="center" marginTop={1}>
				<Text dimColor>
					[DEBUG] offset: {scrollOffset}, lines: {visibleLines.length},
					hasLinesAbove: {String(hasLinesAbove)}, hasLinesBelow:{' '}
					{String(hasLinesBelow)})
				</Text>
			</Box>
		</Box>
	);
}
