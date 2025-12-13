import React from 'react';
import {Box, Text} from 'ink';
import {TitledBox} from '@mishieck/ink-titled-box';
import Summary from './Summary.js';
import LogsList from './LogsList.js';

export default function Session({
	width = 80,
	logs = [],
	filteredLogs = [],
	sessionId = null,
	project = null,
	startDatetime = null,
	agentViewData = null,
	selectedIndex = 0,
	viewportSize = 25,
	activeFilters = {},
	searchMode = false,
	searchQuery = '',
	activeSearch = '',
	collapsedStates = {}
}) {
	// Calculate visible window of logs to render
	const startIndex = Math.max(0, selectedIndex - Math.floor(viewportSize / 2));
	const endIndex = Math.min(filteredLogs.length, startIndex + viewportSize);
	const visibleLogs = filteredLogs.slice(startIndex, endIndex);

	// Show indicators when there are more logs above/below
	const hasLogsAbove = startIndex > 0;
	const hasLogsBelow = endIndex < filteredLogs.length;

	// Generate filter status text
	const activeFilterNames = Object.entries(activeFilters)
		.filter(([_, active]) => active)
		.map(([type, _]) => type === 'subagent' ? 'agents' : type);
	const filterText = activeFilterNames.length === 5 ? '' : ` | Filters: ${activeFilterNames.join(', ')}`;

	// Determine what logs to show in Summary
	const summaryLogs = agentViewData ? agentViewData.logs : logs;

	const summaryTitle = agentViewData
		? `${project}/${sessionId}/agent-${agentViewData.agentId}`
		: (sessionId ? `${project}/${sessionId}` : null);

	const listViewTitle = agentViewData
		? `Agent: ${sessionId}/agent-${agentViewData.agentId}`
		: (sessionId ? `Session: ${sessionId}` : 'Log Browser');

	const listViewKey = agentViewData ? `agent-view-${agentViewData.agentId}` : 'list-view';

	return (
		<Box flexDirection="column" width={width}>
			{/* Summary Component */}
			<Summary
				width={width}
				logs={summaryLogs}
				project={project}
				session={sessionId}
				startDatetime={startDatetime}
				title={summaryTitle}
			/>

			{/* Logs List */}
			<TitledBox
				borderStyle="single"
				borderColor="gray"
				padding={1}
				key={listViewKey}
				titles={[listViewTitle]}
			>
				<Box flexDirection="column">
					{hasLogsAbove && (
						<Text dimColor>
							... {startIndex} more above ...
						</Text>
					)}
					<LogsList
						width={width}
						logs={visibleLogs}
						selectedIndex={selectedIndex - startIndex}
						collapsedStates={collapsedStates}
					/>
					{hasLogsBelow && (
						<Text dimColor>
							... {filteredLogs.length - endIndex} more below ...
						</Text>
					)}
				</Box>
			</TitledBox>

			{/* Search Input Display */}
			{searchMode && (
				<Box marginTop={1}>
					<Text>Search: {searchQuery}</Text>
					<Text dimColor> (Enter to apply, Esc to cancel)</Text>
				</Box>
			)}
			{!searchMode && activeSearch && (
				<Box marginTop={1}>
					<Text dimColor>Active search: </Text>
					<Text>{activeSearch}</Text>
					<Text dimColor> (Esc to clear)</Text>
				</Box>
			)}

			{/* Help Text */}
			<Box marginTop={searchMode || activeSearch ? 0 : 1}>
				<Text dimColor>
					↑/↓: Navigate | d: Down 10 | u: Up 10 | t: Top | b: Bottom | Enter: Expand/Collapse | →: Detail | /: Search | a/c: All | 1-5: Filter{filterText} | {selectedIndex + 1}/{filteredLogs.length}
				</Text>
			</Box>
		</Box>
	);
}
