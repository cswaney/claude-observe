import React, {useState} from 'react';
import {Box, Text, useInput, useStdout} from 'ink';
import {TitledBox} from '@mishieck/ink-titled-box';

// Sample data generator
export const generateSampleLogs = () => [
	{
		id: 1,
		type: 'user',
		timestamp: '00:00:00',
		content: 'Can you help me with this complex task?',
		collapsed: true,
		usage: 150,
	},
	{
		id: 2,
		type: 'assistant',
		timestamp: '00:00:02',
		content: 'I can help with that. Let me start multiple analyses...',
		collapsed: true,
		usage: 320,
	},
	// Three agents start
	{
		id: 3,
		type: 'subagent',
		timestamp: '00:00:05',
		agentId: 'agent-1',
		content: 'Code analysis',
		collapsed: true,
		isLast: false,
		usage: 450,
	},
	{
		id: 4,
		type: 'subagent',
		timestamp: '00:00:06',
		agentId: 'agent-2',
		content: 'Dependency check',
		collapsed: true,
		isLast: false,
		usage: 380,
	},
	{
		id: 5,
		type: 'subagent',
		timestamp: '00:00:07',
		agentId: 'agent-3',
		content: 'Security audit',
		collapsed: true,
		isLast: false,
		usage: 520,
	},
	{
		id: 6,
		type: 'tool',
		timestamp: '00:00:08',
		content: 'Reading multiple files...',
		collapsed: true,
		usage: 200,
	},
	// Agent-2 (middle) ends first
	{
		id: 7,
		type: 'subagent',
		timestamp: '00:00:10',
		agentId: 'agent-2',
		content: 'Dependencies checked',
		collapsed: true,
		isLast: true,
		usage: 290,
	},
	// Agent-4 starts (should reuse agent-2's position)
	{
		id: 8,
		type: 'subagent',
		timestamp: '00:00:11',
		agentId: 'agent-4',
		content: 'Performance analysis',
		collapsed: true,
		isLast: false,
		usage: 410,
	},
	{
		id: 9,
		type: 'tool',
		timestamp: '00:00:12',
		content: 'Running benchmarks...',
		collapsed: true,
		usage: 180,
	},
	// Agent-1 (leftmost) ends
	{
		id: 10,
		type: 'subagent',
		timestamp: '00:00:14',
		agentId: 'agent-1',
		content: 'Code analysis complete',
		collapsed: true,
		isLast: true,
		usage: 350,
	},
	// Agent-5 starts (should reuse agent-1's position)
	{
		id: 11,
		type: 'subagent',
		timestamp: '00:00:15',
		agentId: 'agent-5',
		content: 'Documentation check',
		collapsed: true,
		isLast: false,
		usage: 330,
	},
	{
		id: 12,
		type: 'tool',
		timestamp: '00:00:16',
		content: 'Parsing documentation...',
		collapsed: true,
		usage: 150,
	},
	// Agent-3 ends
	{
		id: 13,
		type: 'subagent',
		timestamp: '00:00:18',
		agentId: 'agent-3',
		content: 'Security audit complete',
		collapsed: true,
		isLast: true,
		usage: 480,
	},
	// Agent-4 ends
	{
		id: 14,
		type: 'subagent',
		timestamp: '00:00:20',
		agentId: 'agent-4',
		content: 'Performance analysis done',
		collapsed: true,
		isLast: true,
		usage: 390,
	},
	// Agent-5 ends (last one)
	{
		id: 15,
		type: 'subagent',
		timestamp: '00:00:22',
		agentId: 'agent-5',
		content: 'Documentation verified',
		collapsed: true,
		isLast: true,
		usage: 270,
	},
	{
		id: 16,
		type: 'assistant',
		timestamp: '00:00:25',
		content: 'All analyses complete!',
		collapsed: true,
		usage: 420,
	},
];

// Color palette for subagents
const AGENT_COLORS = ['#2ecc71', '#3498db', '#9b59b6', '#f1c40f', '#e67e22', '#e74c3c'];

export default function Logs({width = 80, logs = []}) {
	const {stdout} = useStdout();
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [collapsedStates, setCollapsedStates] = useState(() => {
		const initial = {};
		logs.forEach(log => {
			initial[log.id] = log.collapsed;
		});
		return initial;
	});

	// Calculate viewport: how many logs to show at once
	// Reserve space for Summary (8 lines), box borders (4 lines), help text (2 lines)
	const terminalHeight = stdout?.rows || 40;
	const availableHeight = terminalHeight - 14;
	// Limit viewport to reduce re-render flashing (each log takes 1-2 lines when collapsed)
	// Show enough to fill screen but not so many that scrolling causes excessive re-renders
	const viewportSize = Math.min(25, Math.max(15, availableHeight));

	// Helper to check if a log is selectable (has content or can be expanded)
	const isSelectable = (log) => {
		// Skip subagent end rows (isLast = true)
		if (log.type === 'subagent' && log.isLast) {
			return false;
		}
		return true;
	};

	// Find next selectable index
	const findNextSelectable = (currentIndex, direction) => {
		let nextIndex = currentIndex + direction;
		while (nextIndex >= 0 && nextIndex < logs.length) {
			if (isSelectable(logs[nextIndex])) {
				return nextIndex;
			}
			nextIndex += direction;
		}
		return currentIndex; // Stay at current if no selectable found
	};

	// Find Nth selectable index in a direction
	const findNthSelectable = (currentIndex, direction, n) => {
		let nextIndex = currentIndex;
		let count = 0;
		while (count < n && nextIndex >= 0 && nextIndex < logs.length) {
			nextIndex = findNextSelectable(nextIndex, direction);
			if (nextIndex === currentIndex || (direction > 0 && nextIndex >= logs.length - 1) || (direction < 0 && nextIndex <= 0)) {
				break; // Reached end of list
			}
			count++;
		}
		return nextIndex;
	};

	// Handle keyboard input
	useInput((input, key) => {
		if (key.upArrow) {
			setSelectedIndex(prev => findNextSelectable(prev, -1));
		} else if (key.downArrow) {
			setSelectedIndex(prev => findNextSelectable(prev, 1));
		} else if (input === 'd' || input === ' ') {
			// d or Space: jump down 10 messages
			setSelectedIndex(prev => findNthSelectable(prev, 1, 10));
		} else if (input === 'u') {
			// u: jump up 10 messages
			setSelectedIndex(prev => findNthSelectable(prev, -1, 10));
		} else if (input === 't') {
			// t: jump to top
			const firstSelectable = logs.findIndex(log => isSelectable(log));
			if (firstSelectable !== -1) setSelectedIndex(firstSelectable);
		} else if (input === 'b') {
			// b: jump to bottom
			for (let i = logs.length - 1; i >= 0; i--) {
				if (isSelectable(logs[i])) {
					setSelectedIndex(i);
					break;
				}
			}
		} else if (key.return) {
			const selectedLog = logs[selectedIndex];
			if (selectedLog.content) {
				setCollapsedStates(prev => ({
					...prev,
					[selectedLog.id]: !prev[selectedLog.id],
				}));
			}
		} else if (input === 'a') {
			// Expand all
			const newStates = {};
			logs.forEach(log => {
				newStates[log.id] = false;
			});
			setCollapsedStates(newStates);
		} else if (input === 'c') {
			// Collapse all
			const newStates = {};
			logs.forEach(log => {
				newStates[log.id] = true;
			});
			setCollapsedStates(newStates);
		}
	});

	// Track active agents and assign colors
	const activeAgents = new Map(); // agentId -> { pos, color }
	const agentColorMap = new Map();
	let colorIndex = 0;

	// Render the logs
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
			displayTitle = `🔧 ${log.content}`;
		} else if (log.type === 'thinking') {
			displayTitle = '💭 thinking';
		}

		const hasExpandableContent = (log.type === 'thinking' || (log.type !== 'tool' && log.content));

		return (
			<Box key={log.id} flexDirection="column">
				{/* Title Row */}
				<Box>
					<Text inverse={isSelected}>
						<Text>{isCollapsed ? '> ' : '⌄ '}</Text>
						<Text>
							{displayTitle}
						</Text>
						<Text dimColor> [{log.timestamp}]</Text>
					</Text>
					{renderVerticalBarsSuffix(2 + displayTitle.length + 2 + log.timestamp.length + 1, `${log.id}-title`)}
				</Box>

				{/* Content Row (if expanded) - show first line only */}
				{!isCollapsed && hasExpandableContent && (
					<Box>
						{(() => {
							const firstLine = log.content?.split('\n')[0] || '';
							const preview = firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
							return (
								<>
									<Text dimColor>    "{preview}"</Text>
									{renderVerticalBarsSuffix(4 + 1 + preview.length + 1, `${log.id}-content`)}
								</>
							);
						})()}
					</Box>
				)}
			</Box>
		);
	};

	// Calculate visible window of logs to render
	const startIndex = Math.max(0, selectedIndex - Math.floor(viewportSize / 2));
	const endIndex = Math.min(logs.length, startIndex + viewportSize);
	const visibleLogs = logs.slice(startIndex, endIndex);

	// Show indicators when there are more logs above/below
	const hasLogsAbove = startIndex > 0;
	const hasLogsBelow = endIndex < logs.length;

	return (
		<Box flexDirection="column" width={width}>
			<TitledBox
				borderStyle="single"
				borderColor="gray"
				padding={1}
				titles={['Logs']}
			>
				<Box flexDirection="column">
					{hasLogsAbove && (
						<Text dimColor>
							... {startIndex} more above ...
						</Text>
					)}
					{visibleLogs.map((log, visibleIndex) => {
						const actualIndex = startIndex + visibleIndex;
						return renderLog(log, actualIndex);
					})}
					{hasLogsBelow && (
						<Text dimColor>
							... {logs.length - endIndex} more below ...
						</Text>
					)}
				</Box>
			</TitledBox>
			<Box>
				<Text dimColor>
					↑/↓: Navigate | d/Space: Down 10 | u: Up 10 | t: Top | b: Bottom | Enter: Expand/Collapse | a/c: All | {selectedIndex + 1}/{logs.length}
				</Text>
			</Box>
		</Box>
	);
}
