import React from 'react';
import {Box, Text} from 'ink';

// Color palette for subagents
const AGENT_COLORS = ['#2ecc71', '#3498db', '#9b59b6', '#f1c40f', '#e67e22', '#e74c3c'];

export default function LogsList({
	width = 80,
	logs = [],
	selectedIndex = 0,
	collapsedStates = {}
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
				agentColorMap.set(log.agentId, AGENT_COLORS[colorIndex % AGENT_COLORS.length]);
				colorIndex++;
			}
			// Calculate arrow length: minimum 24 dashes, then +2 for each additional agent
			// Find the lowest available position index by checking which indices are in use
			const usedIndices = new Set(
				Array.from(activeAgents.values()).map(agent => (agent.pos - 24) / 2)
			);
			let agentIndex = 0;
			while (usedIndices.has(agentIndex)) {
				agentIndex++;
			}
			const arrowLength = 24 + (agentIndex * 2);

			activeAgents.set(log.agentId, {
				pos: arrowLength,  // Position where the vertical bar will be (in dashes)
				color: agentColorMap.get(log.agentId),
			});
		}

		// Build vertical bars suffix (comes AFTER the message content)
		// Returns JSX with colored bars positioned at exact arrow endpoint positions
		const renderVerticalBarsSuffix = (prefixLength = 0, keyPrefix = '') => {
			// Get current active agents each time this is called (not cached)
			const currentActiveAgents = Array.from(activeAgents.entries());
			if (currentActiveAgents.length === 0) return null;

			// Sort agents by position
			const sortedAgents = [...currentActiveAgents].sort((a, b) => a[1].pos - b[1].pos);

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
					</Text>
				);
				currentPos = targetIdx + 1;
			});

			return <>{result}</>;
		};

		// Render subagent stop arrow
		const renderSubagentStop = () => {
			const agentData = activeAgents.get(log.agentId);
			if (!agentData) return null;

			const arrowLength = agentData.pos;
			// The corner "╯" needs to be at position (11 + arrowLength) to align with vertical bar
			// "  agentId [timestamp] ◂" - variable length based on agentId
			const prefix = `  ${log.agentId} [${log.timestamp}] ◂`;
			const prefixLength = prefix.length;
			// We need: prefixLength + dashCount = 11 + arrowLength (position of corner)
			const dashCount = (11 + arrowLength) - prefixLength;

			// Build the stop arrow with spacing for alignment
			const textBeforeArrow = `  ${log.agentId} `;
			const timestamp = `[${log.timestamp}]`;
			const arrow = ' ◂' + '─'.repeat(dashCount);
			const totalPrefixLen = textBeforeArrow.length + timestamp.length + arrow.length;

			// Remove this agent before rendering suffix bars so it doesn't show its own bar
			activeAgents.delete(log.agentId);

			return (
				<Box>
					<Text color={agentData.color}>
						{textBeforeArrow}
						<Text dimColor>{timestamp}</Text>
						{arrow}{'╯'}
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
			// "> agentId [timestamp] " - variable length based on agentId
			const prefix = `> ${log.agentId} [${log.timestamp}] `;
			const prefixLength = prefix.length;
			// Corner "╮" should be at position (11 + agent.pos)
			const dashCount = (11 + agent.pos) - prefixLength;
			// Corner "╮" is at position (11 + agent.pos), so after it we're at (12 + agent.pos)
			const arrowEndPos = 12 + agent.pos;

			return (
				<Box key={log.id} flexDirection="column">
					{/* Subagent start arrow row */}
					<Box>
						<Text inverse={isSelected} color={agent?.color}>
							{'> '}{log.agentId} <Text dimColor>[{log.timestamp}]</Text> {'─'.repeat(dashCount)}{'╮'}
						</Text>
						{renderVerticalBarsSuffix(arrowEndPos, `${log.id}-start-title`)}
					</Box>

					{/* Content Row (if expanded) */}
					{!isCollapsed && log.content && (
						<Box>
							<Text dimColor>    "{log.content}"</Text>
							{renderVerticalBarsSuffix(4 + 1 + log.content.length + 1, `${log.id}-start-content`)}
						</Box>
					)}
				</Box>
			);
		}

		// Regular log entries (user, assistant, tool, thinking)
		// Add emojis for special types
		let displayTitle = log.type;
		if (log.type === 'tool') {
			displayTitle = '🔧 tool';
		} else if (log.type === 'thinking') {
			displayTitle = '💭 thinking';
		}

		// Generate preview for title line (only when collapsed)
		const firstLine = log.content?.split('\n')[0] || '';
		// Calculate available width for preview
		// Format: "[HH:MM:SS] > displayTitle preview"
		const prefixLength = 1 + log.timestamp.length + 2 + 2 + displayTitle.length + 1; // brackets, spaces, arrow
		const availableWidth = Math.max(0, width - prefixLength - 7); // -7 buffer for borders/padding
		const preview = firstLine.length > availableWidth ? firstLine.substring(0, availableWidth) + '...' : firstLine;
		const previewText = (isCollapsed && preview) ? ` ${preview}` : '';

		// Calculate indentation for expanded content to align with title
		// Format: "[HH:MM:SS] > title"
		const contentIndent = ' '.repeat(1 + log.timestamp.length + 2 + 2); // align with title

		const hasExpandableContent = Boolean(log.content);

		return (
			<Box key={log.id} flexDirection="column">
				{/* Title Row */}
				<Box>
					<Text inverse={isSelected}>
						<Text dimColor>[{log.timestamp}] </Text>
						<Text>{isCollapsed ? '> ' : '⌄ '}</Text>
						<Text>
							{displayTitle}
						</Text>
						<Text dimColor>{previewText}</Text>
					</Text>
					{renderVerticalBarsSuffix(1 + log.timestamp.length + 2 + 2 + displayTitle.length + previewText.length, `${log.id}-title`)}
				</Box>

				{/* Content Row (if expanded) - show up to 5 lines */}
				{!isCollapsed && hasExpandableContent && (
					<Box flexDirection="column">
						{(() => {
							const lines = (log.content || '').split('\n').slice(0, 5);
							const hasMore = (log.content || '').split('\n').length > 5;
							const maxLineLength = Math.max(0, width - contentIndent.length - 7); // -7 buffer for borders/padding
							return lines.map((line, idx) => {
								const displayLine = line.length > maxLineLength ? line.substring(0, maxLineLength) + '...' : line;
								return (
									<Box key={`${log.id}-line-${idx}`}>
										<Text dimColor>{contentIndent}{displayLine}</Text>
										{renderVerticalBarsSuffix(contentIndent.length + displayLine.length, `${log.id}-content-${idx}`)}
									</Box>
								);
							}).concat(
								hasMore ? (
									<Box key={`${log.id}-more`}>
										<Text dimColor>{contentIndent}...</Text>
										{renderVerticalBarsSuffix(contentIndent.length + 3, `${log.id}-more`)}
									</Box>
								) : []
							);
						})()}
					</Box>
				)}
			</Box>
		);
	};

	return (
		<>
			{logs.map((log, index) => renderLog(log, index))}
		</>
	);
}
