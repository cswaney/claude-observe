import React from 'react';
import { Box, Text } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';
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
	activeFilters = {},
	searchMode = false,
	searchQuery = '',
	activeSearch = '',
	collapsedStates = {},
	sessionMetadata = null,
	logsListHeight = 15
}) {
	// Calculate how many lines a log takes
	const getLogHeight = (log) => {
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

		const contentLines = log.content.split('\n');
		const displayedLines = Math.min(contentLines.length, 5);
		const hasMore = contentLines.length > 5;
		return 1 + displayedLines + (hasMore ? 1 : 0);
	};

	// Calculate visible window of logs to render based on available height
	// Try to keep the selected log centered in the viewport
	const availableLines = logsListHeight - 4; // Subtract borders and padding
	const targetCenterLines = Math.floor(availableLines / 2);

	let startIndex = 0;
	let endIndex = 0;

	// Count total lines above selected log
	let linesAboveSelected = 0;
	for (let i = 0; i < selectedIndex; i++) {
		linesAboveSelected += getLogHeight(filteredLogs[i]);
	}

	// Count total lines below selected log
	let linesBelowSelected = 0;
	for (let i = selectedIndex + 1; i < filteredLogs.length; i++) {
		linesBelowSelected += getLogHeight(filteredLogs[i]);
	}

	// Determine where to start the viewport
	if (linesAboveSelected < targetCenterLines) {
		// Near the top - not enough content above to center, so start from beginning
		startIndex = 0;
	} else if (linesBelowSelected < targetCenterLines) {
		// Near the bottom - not enough content below to center, so work backward from end
		// Fill backward until we run out of space or logs
		let lines = 0;
		let idx = filteredLogs.length;
		while (idx > 0 && lines < availableLines) {
			const logHeight = getLogHeight(filteredLogs[idx - 1]);
			if (lines + logHeight > availableLines) break;
			lines += logHeight;
			idx--;
		}
		startIndex = idx;
	} else {
		// Enough content on both sides - center the selected log
		// Walk backward from selected to build up to the center point
		let lines = 0;
		let idx = selectedIndex;
		while (idx > 0 && lines < targetCenterLines) {
			const logHeight = getLogHeight(filteredLogs[idx - 1]);
			if (lines + logHeight > targetCenterLines) break;
			lines += logHeight;
			idx--;
		}
		startIndex = idx;
	}

	// Fill viewport forward from startIndex
	let lines = 0;
	endIndex = startIndex;
	while (endIndex < filteredLogs.length && lines < availableLines) {
		const logHeight = getLogHeight(filteredLogs[endIndex]);
		if (lines + logHeight > availableLines) break;
		lines += logHeight;
		endIndex++;
	}

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

	// Outer box title: show agent ID when in agent view, otherwise show session
	const outerBoxTitle = agentViewData
		? `Session: ${sessionId} > Agent: ${agentViewData.agentId}`
		: (sessionId ? `Session: ${sessionId}` : 'Session');

	return (
		<Box flexDirection="column" width={width}>
			<TitledBox
				flexDirection="column"
				width={width}
				borderStyle="single"
				borderColor="gray"
				padding={1}
				titles={[outerBoxTitle]}
				key={agentViewData ? `agent-${agentViewData.agentId}` : 'session'}
			>

				<Summary
					width={width}
					logs={summaryLogs}
					project={project}
					session={sessionId}
					startDatetime={startDatetime}
					title={summaryTitle}
					sessionMetadata={sessionMetadata}
				/>

				{/* Logs List */}
				{/* <TitledBox
					borderStyle="single"
					borderColor="gray"
					padding={1}
					key={listViewKey}
					titles={["Logs"]}
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
				</TitledBox> */}
				<LogsList
					width={width}
					logs={visibleLogs}
					selectedIndex={selectedIndex - startIndex}
					collapsedStates={collapsedStates}
					listViewKey={listViewKey}
					hasLogsAbove={hasLogsAbove}
					hasLogsBelow={hasLogsBelow}
					filteredLogs={filteredLogs}
					startIndex={startIndex}
					endIndex={endIndex}
					height={logsListHeight}
				>

				</LogsList>
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
			<Box justifyContent="center" marginTop={searchMode || activeSearch ? 0 : 1}>
				<Text dimColor>
					↑/↓: Navigate | d: Down 10 | u: Up 10 | t: Top | b: Bottom | Enter: Expand/Collapse | →: Detail | /: Search | a/c: All | 1-5: Filter{filterText} | {selectedIndex + 1}/{filteredLogs.length}
				</Text>
			</Box>
		</Box>
	);
}