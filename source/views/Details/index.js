import React, {useMemo} from 'react';
import {Box, Text} from 'ink';
import {TitledBox} from '@mishieck/ink-titled-box';

export default function Details({
	width = 80,
	log = null,
	sessionId = null,
	agentViewData = null,
	detailScrollOffset = 0,
	availableHeight = 30
}) {
	if (!log) return null;

	// Memoize content lines
	const contentLines = useMemo(
		() => (log.content || '').split('\n'),
		[log.id, log.content]
	);

	let displayTitle = log.type;
	if (log.type === 'tool') {
		displayTitle = '🔧 tool';
	} else if (log.type === 'thinking') {
		displayTitle = '💭 thinking';
	}

	const totalLines = contentLines.length;

	// Adjust scroll offset if it's too far down
	const maxOffset = Math.max(0, totalLines - availableHeight);
	const actualOffset = Math.min(detailScrollOffset, maxOffset);

	const visibleLines = contentLines.slice(actualOffset, actualOffset + availableHeight);
	// Pad with empty lines to keep constant height
	while (visibleLines.length < availableHeight) {
		visibleLines.push('');
	}
	const hasLinesAbove = actualOffset > 0;
	const hasLinesBelow = actualOffset + availableHeight < totalLines;

	const detailTitle = agentViewData
		? `Log: ${sessionId}/agent-${agentViewData.agentId}/${log.uuid || log.id}`
		: `Log: ${sessionId}/${log.uuid || log.id}`;

	return (
		<Box flexDirection="column" width={width}>
			<TitledBox
				borderStyle="single"
				borderColor="gray"
				padding={1}
				key="detail-view"
				titles={[detailTitle]}
			>
				<Box flexDirection="column">
					<Text>
						<Text dimColor>[{log.timestamp}] </Text>
						<Text>{displayTitle}</Text>
					</Text>
					<Box flexDirection="column" marginTop={1}>
						{log.uuid && (
							<Text dimColor>UUID: {log.uuid}</Text>
						)}
						{log.isoTimestamp && (
							<Text dimColor>Timestamp: {log.isoTimestamp}</Text>
						)}
						{log.usage !== undefined && (
							<Text dimColor>Token Usage: {log.usage.toLocaleString()}</Text>
						)}
						{log.type === 'subagent' && log.agentId && (
							<Text dimColor>Agent ID: {log.agentId}</Text>
						)}
						{log.type === 'tool' && log.toolInput && (
							<Box flexDirection="column" marginTop={1}>
								<Text dimColor>Tool Parameters:</Text>
								<Text dimColor>{JSON.stringify(log.toolInput, null, 2)}</Text>
							</Box>
						)}
					</Box>
					<Text dimColor>─────────────────────</Text>
					<Box flexDirection="column" marginTop={1}>
						{hasLinesAbove && (
							<Text dimColor>... {actualOffset} more above ...</Text>
						)}
						{visibleLines.map((line, idx) => (
							<Text key={idx}>{line}</Text>
						))}
						{hasLinesBelow && (
							<Text dimColor>... {totalLines - (actualOffset + availableHeight)} more below ...</Text>
						)}
					</Box>
				</Box>
			</TitledBox>
			<Box>
				<Text dimColor>
					←: Back to list | ↑/↓: Scroll | u: Up 10 | d: Down 10 | t: Top | b: Bottom | Line {actualOffset + 1}-{Math.min(actualOffset + availableHeight, totalLines)}/{totalLines}
				</Text>
			</Box>
		</Box>
	);
}
