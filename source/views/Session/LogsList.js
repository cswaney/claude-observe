import React from 'react';
import {Box, Text} from 'ink';
import {TitledBox} from '@mishieck/ink-titled-box';

// Color palette for subagents
const AGENT_COLORS = ['#f1c40f', '#e67e22', '#e74c3c', '#2ecc71'];
const TOOL_COLOR = '#3498db';
const THINKING_COLOR = '#9b59b6';

// Helper to format ISO timestamp for display
const formatTimestamp = isoTimestamp => {
	return new Date(isoTimestamp).toLocaleTimeString();
};

export default function LogsList({
	width = 80,
	logs = [],
	selectedIndex = 0,
	collapsedStates = {},
	listViewKey = null,
	hasLogsAbove = false,
	hasLogsBelow = false,
	filteredLogs = [],
	startIndex = null,
	endIndex = null,
	height = null,
}) {
	// Track active agents and assign colors
	const activeAgents = new Map(); // agentId -> { pos, color }
	const agentColorMap = new Map();
	let colorIndex = 0;

	// Render a single log entry
	const renderLog = (log, index) => {
		const isSelected = index === selectedIndex;
		const isCollapsed = collapsedStates[log.id];

		// Update active agents tracking
		if (log.type === 'subagent' && !log.isLast) {
			if (!agentColorMap.has(log.agentId)) {
				agentColorMap.set(
					log.agentId,
					AGENT_COLORS[colorIndex % AGENT_COLORS.length],
				);
				colorIndex++;
			}
			// Calculate arrow length: minimum 24 dashes, then +2 for each additional agent
			// Find the lowest available position index by checking which indices are in use
			const usedIndices = new Set(
				Array.from(activeAgents.values()).map(agent => (agent.pos - 24) / 2),
			);
			let agentIndex = 0;
			while (usedIndices.has(agentIndex)) {
				agentIndex++;
			}
			const arrowLength = 24 + agentIndex * 2;

			activeAgents.set(log.agentId, {
				pos: arrowLength, // Position where the vertical bar will be (in dashes)
				color: agentColorMap.get(log.agentId),
				index: index,
			});
		}

		// Build vertical bars suffix (comes AFTER the message content)
		// Returns JSX with colored bars positioned at exact arrow endpoint positions
		const renderVerticalBarsSuffix = (prefixLength = 0, keyPrefix = '') => {
			const currentActiveAgents = Array.from(activeAgents.entries());
			if (currentActiveAgents.length === 0) return null;

			// Sort agents by position
			const sortedAgents = [...currentActiveAgents].sort(
				(a, b) => a[1].pos - b[1].pos,
			);

			// Filter out agents whose bars would be covered by the prefix (to the left)
			const visibleAgents = sortedAgents.filter(([agentId, agent]) => {
				const targetIdx = 11 + agent.pos;
				return targetIdx >= prefixLength; // Only show bars at or after the prefix
			});

			if (visibleAgents.length === 0) return null;

			// Calculate spacing: "* subagent " is 11 chars (indices 0-10), then dashes, then "│"
			// The bar "│" itself is at index (11 + agent.pos) in 0-indexed
			let result = [];
			let currentPos = prefixLength;

			visibleAgents.forEach(([agentId, agent]) => {
				const targetIdx = 11 + agent.pos; // 0-indexed position where "│" should be
				const spacing = targetIdx - currentPos;
				result.push(
					<Text key={`${keyPrefix}-bar-${agentId}`} color={agent.color}>
						{' '.repeat(spacing)}│
					</Text>,
				);
				currentPos = targetIdx + 1;
			});

			return <>{result}</>;
		};

		// Render subagent stop arrow
		const renderSubagentStop = () => {
			const agentData = activeAgents.get(log.agentId);
			if (!agentData) return null;

			const formattedTime = formatTimestamp(log.timestamp);
			const arrowLength = agentData.pos;
			// The corner "╯" needs to be at position (11 + arrowLength) to align with vertical bar
			// "  agentId [timestamp] ◂" - variable length based on agentId
			const prefix = `[${formattedTime}] • agent: ${log.agentId} ◂`;
			const prefixLength = prefix.length;
			// We need: prefixLength + dashCount = 11 + arrowLength (position of corner)
			const dashCount = 11 + 12 + arrowLength - prefixLength;

			// Build the stop arrow with spacing for alignment
			const textBeforeArrow = `   end`;
			const timestamp = `[${formattedTime}]`;
			const arrow = ' ◂' + '─'.repeat(dashCount);
			const totalPrefixLen =
				textBeforeArrow.length + timestamp.length + arrow.length;

			// Remove this agent before rendering suffix bars so it doesn't show its own bar
			const isSelected = agentData.index === selectedIndex;
			activeAgents.delete(log.agentId);

			return (
				<Box>
					<Text bold={isSelected} color={agentData.color}>
						<Text bold={isSelected} dimColor={!isSelected}>
							{timestamp}
						</Text>
						{textBeforeArrow}
						{arrow}
						{'╯'}
					</Text>
					{renderVerticalBarsSuffix(totalPrefixLen + 1, `${log.id}-stop`)}
				</Box>
			);
		};

		// Clean up agent after rendering stop
		if (log.type === 'subagent' && log.isLast) {
			const stopElement = renderSubagentStop();
			return <Box key={log.id}>{stopElement}</Box>;
		}

		// For subagent start, show the arrow instead of regular title
		if (log.type === 'subagent' && !log.isLast) {
			const agent = activeAgents.get(log.agentId);
			const formattedTime = formatTimestamp(log.timestamp);
			// "> agentId [timestamp] " - variable length based on agentId
			const prefix = `[${formattedTime}] • agent; ${log.agentId} `;
			const prefixLength = prefix.length;
			// Corner "╮" should be at position (11 + agent.pos)
			const dashCount = 11 + agent.pos - prefixLength;
			// Corner "╮" is at position (11 + agent.pos), so after it we're at (12 + agent.pos)
			const arrowEndPos = 12 + agent.pos;

			return (
				<Box key={log.id} flexDirection="column">
					{/* Subagent start arrow row */}
					<Box>
						<Text bold={isSelected} color={agent?.color}>
							<Text bold={isSelected} dimColor={!isSelected}>
								[{formattedTime}]
							</Text>{' '}
							• agent: {log.agentId} {'─'.repeat(dashCount)}
							{'╮'}
						</Text>
						{renderVerticalBarsSuffix(arrowEndPos, `${log.id}-start-title`)}
					</Box>

					{/* Content Row (if expanded) */}
					{!isCollapsed && log.content && (
						<Box>
							<Text dimColor> "{log.content}"</Text>
							{renderVerticalBarsSuffix(
								4 + 1 + log.content.length + 1,
								`${log.id}-start-content`,
							)}
						</Box>
					)}
				</Box>
			);
		}

		// Regular log entries (user, assistant, tool, thinking)
		// Add emojis for special types
		let displayTitle = log.type;
		let displayColor = 'white';
		if (log.type === 'tool') {
			displayTitle = 'tool';
			displayColor = TOOL_COLOR;
		} else if (log.type === 'thinking') {
			displayTitle = 'thinking';
			displayColor = THINKING_COLOR;
		}

		let selectIconBefore = '> ';
		let selectIconAfter = '⌄ ';

		// Generate preview for title line (only when collapsed)
		const formattedTime = formatTimestamp(log.timestamp);
		const firstLine = log.content?.split('\n')[0] || '';
		// Calculate available width for preview
		// Format: "[HH:MM:SS] > displayTitle preview"
		const prefixLength =
			1 + formattedTime.length + 2 + 2 + displayTitle.length + 1; // brackets, spaces, arrow
		const availableWidth = Math.max(0, width - prefixLength - 12); // -7 buffer for borders/padding
		const preview =
			firstLine.length > availableWidth
				? firstLine.substring(0, availableWidth) + '...'
				: firstLine;
		const previewText = isCollapsed && preview ? ` ${preview}` : '';

		// Calculate indentation for expanded content to align with title
		// Format: "[HH:MM:SS] > title"
		const contentIndent = ' '.repeat(1 + formattedTime.length + 2 + 2); // align with title

		const hasExpandableContent = Boolean(log.content);

		return (
			<Box key={log.id} flexDirection="column">
				{/* Title Row */}
				<Box>
					<Text bold={isSelected}>
						<Text dimColor={!isSelected}>[{formattedTime}] </Text>
						<Text dimColor={!isSelected}>
							{isCollapsed ? selectIconBefore : selectIconAfter}
						</Text>
						<Text color={displayColor}>{displayTitle}:</Text>
						<Text dimColor={!isSelected}>{previewText}</Text>
					</Text>
					{renderVerticalBarsSuffix(
						2 +
							formattedTime.length +
							2 +
							2 +
							displayTitle.length +
							previewText.length,
						`${log.id}-title`,
					)}
				</Box>

				{/* Content Row (if expanded) - show up to 5 lines */}
				{!isCollapsed && hasExpandableContent && (
					<Box flexDirection="column">
						{(() => {
							const lines = (log.content || '').split('\n').slice(0, 5);
							const hasMore = (log.content || '').split('\n').length > 5;
							const maxLineLength = Math.max(
								0,
								width - contentIndent.length - 7,
							); // -7 buffer for borders/padding
							return lines
								.map((line, idx) => {
									const displayLine =
										line.length > maxLineLength
											? line.substring(0, maxLineLength) + '...'
											: line;
									return (
										<Box key={`${log.id}`}>
											<Text dimColor>
												{contentIndent}
												{displayLine}
											</Text>
											{renderVerticalBarsSuffix(
												contentIndent.length + displayLine.length,
												`${log.id}-content-${idx}`,
											)}
										</Box>
									);
								})
								.concat(
									hasMore ? (
										<Box key={`${log.id}-more`}>
											<Text dimColor>{contentIndent}...</Text>
											{renderVerticalBarsSuffix(
												contentIndent.length + 3,
												`${log.id}-more`,
											)}
										</Box>
									) : (
										[]
									),
								);
						})()}
					</Box>
				)}
			</Box>
		);
	};

	return (
		<TitledBox
			borderStyle="single"
			borderColor="gray"
			padding={1}
			// marginTop={1}
			key={listViewKey}
			titles={['Logs']}
			height={height}
		>
			<Box flexDirection="column">
				{hasLogsAbove && (
					<Box>
						<Text dimColor>
							{'           '}  ... {startIndex} more above ...
						</Text>
					</Box>
				)}
				{logs.map((log, index) => renderLog(log, index))}
				{hasLogsBelow && (
					<Box>
						<Text dimColor>
							{'           '}  ... {filteredLogs.length - endIndex} more below ...
						</Text>
					</Box>
				)}
			</Box>
		</TitledBox>
	);
}
