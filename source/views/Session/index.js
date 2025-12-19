import React from 'react';
import {Box, Text} from 'ink';
import {TitledBox} from '@mishieck/ink-titled-box';
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
	// Strategy: Position selected log's first line at floor(availableLines / 2)
	const TITLED_BOX_BORDERS = 2; // Top and bottom borders
	const TITLED_BOX_PADDING = 2; // Top and bottom padding
	const BUFFER_LINES = 2; // Extra buffer to ensure logs render properly
	const availableLines = logsListHeight - TITLED_BOX_BORDERS - TITLED_BOX_PADDING + BUFFER_LINES;
	const targetLineForSelected = Math.floor(availableLines / 2);

	let startIndex = 0;
	let endIndex = 0;

	// Count how many lines we could fill above the selected log
	let linesAbove = 0;
	let tempIndex = selectedIndex;
	while (tempIndex > 0) {
		const logHeight = getLogHeight(filteredLogs[tempIndex - 1]);
		linesAbove += logHeight;
		tempIndex--;
	}

	// Decide viewport strategy based on content above selected log
	if (linesAbove < targetLineForSelected) {
		// Near the top - not enough content above to center
		// Start from beginning and fill entire viewport
		startIndex = 0;
	} else {
		// Enough content above - try to center the selected log
		// Fill backward from selected log to get close to targetLineForSelected
		linesAbove = 0;
		startIndex = selectedIndex;
		while (startIndex > 0) {
			const logHeight = getLogHeight(filteredLogs[startIndex - 1]);
			const wouldBe = linesAbove + logHeight;

			// If adding this log would exceed target, decide whether to include it
			if (wouldBe > targetLineForSelected) {
				// Include it if we're currently further from target than we would be with it
				const distanceWithout = targetLineForSelected - linesAbove;
				const distanceWith = wouldBe - targetLineForSelected;
				if (distanceWith < distanceWithout) {
					linesAbove = wouldBe;
					startIndex--;
				}
				break;
			}

			linesAbove += logHeight;
			startIndex--;
		}
	}

	// Now fill forward from startIndex until we run out of space
	// Always include the selected log, and stop after we've filled availableLines
	let totalLines = 0;
	endIndex = startIndex;
	while (endIndex < filteredLogs.length) {
		const logHeight = getLogHeight(filteredLogs[endIndex]);
		const isSelected = endIndex === selectedIndex;

		// Check if adding this log would exceed available space
		if (totalLines + logHeight > availableLines) {
			// Always include the selected log even if it exceeds space
			if (isSelected) {
				totalLines += logHeight;
				endIndex++;
			}
			// Stop - we've filled the viewport
			break;
		}

		totalLines += logHeight;
		endIndex++;
	}

	const visibleLogs = filteredLogs.slice(startIndex, endIndex);

	// Show indicators when there are more logs above/below
	const hasLogsAbove = startIndex > 0;
	const hasLogsBelow = endIndex < filteredLogs.length;

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
					height={logsListHeight}
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
					↑/↓: Navigate | d: Down 10 | u: Up 10 | t: Top | b: Bottom | Enter:
					Expand/Collapse | →: Detail | /: Search | a/c: All | 1-5: Filter
					{filterText} | {selectedIndex + 1}/{filteredLogs.length}
				</Text>
			</Box>
		</Box>
	);
}
