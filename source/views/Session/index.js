import React from 'react';
import {Box, Text} from 'ink';
import {TitledBox} from '@mishieck/ink-titled-box';
import {useScrollableList} from '../../hooks/useScrollableList.js';
import Summary from './Summary.js';
import LogsList from './LogsList.js';

export default function Session({
	session = null,
	filteredLogs = [],
	selectedIndex = 0,
	activeFilters = {},
	searchMode = false,
	searchQuery = '',
	activeSearch = '',
	collapsedStates = {},
	width = 80,
	logsListHeight = 15,
}) {
	const sessionId = session.uuid;

	// Calculate how many lines a log takes
	const getLogHeight = log => {
		// Safety check for undefined logs
		if (!log) return 1;

		if (log.type === 'tool_result') {
			return 1; // tool result not displaying preview for now
		}

		if (log.type === 'subagent' && log.isLast) {
			// Agent end: 1 line
			return 1;
		}
		if (log.type === 'subagent' && !log.isLast) {
			// Agent start: 1 line for title + content lines if expanded
			const isCollapsed = collapsedStates[log.id];
			if (isCollapsed || !log.content) return 1;
			return 2; // Title + content line
		}
		// Regular logs: 1 line for title + up to 5 content lines + 1 for "..." if expanded
		const isCollapsed = collapsedStates[log.id];
		if (isCollapsed || !log.content) return 1;

		const contentLines = log.content?.split('\n') || 0;
		const displayedLines = Math.min(contentLines.length, 5);
		const hasMore = contentLines.length > 5;
		return 1 + displayedLines + (hasMore ? 1 : 0);
	};

	// Calculate visible window of logs using the scrollable list hook
	const TITLED_BOX_BORDERS = 2; // Top and bottom borders
	const TITLED_BOX_PADDING = 2; // Top and bottom padding
	const BUFFER_LINES = 2; // Extra buffer to ensure logs render properly
	const availableLines = logsListHeight - TITLED_BOX_BORDERS - TITLED_BOX_PADDING + BUFFER_LINES;

	const {
		visibleItems: visibleLogs,
		startIndex,
		endIndex,
		hasItemsAbove: hasLogsAbove,
		hasItemsBelow: hasLogsBelow,
	} = useScrollableList({
		items: filteredLogs,
		selectedIndex,
		height: availableLines,
		getItemHeight: getLogHeight,
		centerSelected: true,
	});

	// Generate filter status text
	const activeFilterNames = Object.entries(activeFilters)
		.filter(([_, active]) => active)
		.map(([type, _]) => (type === 'subagent' ? 'agents' : type));
	const filterText =
		activeFilterNames.length === 5
			? ''
			: ` | Filters: ${activeFilterNames.join(', ')}`;

	// Outer box title: show parent session breadcrumb if this is an agent session
	const outerBoxTitle = session.parentSessionId
		? `Session: ${session.parentSessionId} > Agent: ${sessionId}`
		: sessionId
		? `Session: ${sessionId}`
		: 'Session';

	return (
		<Box flexDirection="column" width={width}>
			<TitledBox
				flexDirection="column"
				width={width}
				borderStyle="single"
				borderColor="gray"
				padding={1}
				titles={[outerBoxTitle]}
				key={session.parentSessionId ? `agent-${sessionId}` : 'session'}
			>
				<Summary session={session} width={width} />

				<LogsList
					width={width}
					logs={visibleLogs}
					selectedIndex={selectedIndex - startIndex}
					collapsedStates={collapsedStates}
					hasLogsAbove={hasLogsAbove}
					hasLogsBelow={hasLogsBelow}
					filteredLogs={filteredLogs}
					startIndex={startIndex}
					endIndex={endIndex}
				/>
			</TitledBox>

			{/* Search Input Display */}
			{searchMode && (
				<Box justifyContent="center" marginTop={1} marginBottom={1}>
					<Text>Search: {searchQuery}</Text>
					<Text dimColor> (Enter to apply, Esc to cancel)</Text>
				</Box>
			)}
			{!searchMode && activeSearch && (
				<Box justifyContent="center" marginTop={1} marginBottom={1}>
					<Text dimColor>Active search: </Text>
					<Text>{activeSearch}</Text>
					<Text dimColor> (Esc to clear)</Text>
				</Box>
			)}

			{/* Help Text */}
			<Box
				justifyContent="center"
				marginTop={searchMode || activeSearch ? 0 : 1}
			>
				<Text dimColor>
					↑/↓: Navigate logs | →: Detail | ←/Esc: Browser | Enter: Expand/Collapse | u/d/t/b: Jump | /: Search | a/c: All | 1-5: Filter
					{filterText} | {selectedIndex + 1}/{filteredLogs.length}
				</Text>
			</Box>
		</Box>
	);
}
