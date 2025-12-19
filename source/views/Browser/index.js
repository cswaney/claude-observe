import React from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import { TitledBox } from '@mishieck/ink-titled-box';

const version = process.env.PACKAGE_VERSION || '0.0.0';

function formatLogs(count) {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k';
  }
  return count.toString();
}

export default function Browser({
	width = 80,
	sessions = [],
	selectedIndex = 0,
	filterMode = false,
	filterInput = '',
	filterQuery = '',
	browserHeight = 15
}) {
	// Calculate visible window of sessions to render based on available height
	// Try to keep the selected session centered in the viewport
	const TITLED_BOX_BORDERS = 2; // Top and bottom borders
	const TITLED_BOX_PADDING = 2; // Top and bottom padding
	const TABLE_HEADER_ROWS = 2; // Column titles + separator line
	const availableLines = browserHeight - TITLED_BOX_BORDERS - TITLED_BOX_PADDING - TABLE_HEADER_ROWS;
	const targetCenterLines = Math.floor(availableLines / 2);

	let startIndex = 0;
	let endIndex = 0;

	// Each session item takes 1 line
	const sessionItemHeight = 1;

	// Count total lines above selected session
	const linesAboveSelected = selectedIndex * sessionItemHeight;

	// Count total lines below selected session
	const linesBelowSelected = (sessions.length - selectedIndex - 1) * sessionItemHeight;

	// Determine where to start the viewport
	if (linesAboveSelected < targetCenterLines) {
		// Near the top - not enough content above to center, so start from beginning
		startIndex = 0;
	} else if (linesBelowSelected < targetCenterLines) {
		// Near the bottom - not enough content below to center, so work backward from end
		// Fill backward until we run out of space or sessions
		let lines = 0;
		let idx = sessions.length;
		while (idx > 0 && lines < availableLines) {
			if (lines + sessionItemHeight > availableLines) break;
			lines += sessionItemHeight;
			idx--;
		}
		startIndex = idx;
	} else {
		// Enough content on both sides - center the selected session
		startIndex = selectedIndex - targetCenterLines;
	}

	// Fill viewport forward from startIndex
	let lines = 0;
	endIndex = startIndex;
	while (endIndex < sessions.length && lines < availableLines) {
		if (lines + sessionItemHeight > availableLines) break;
		lines += sessionItemHeight;
		endIndex++;
	}

	const visibleSessions = sessions.slice(startIndex, endIndex);

	// Show indicators when there are more sessions above/below
	const hasSessionsAbove = startIndex > 0;
	const hasSessionsBelow = endIndex < sessions.length;

	return (
		<Box flexDirection="column" width={width}>
			<Box flexDirection="column">
				<Text> </Text>
				<Text bold>Welcome to</Text>
				<Gradient colors={['#2ecc71', '#3498db']}>
					<BigText text="Claude" font="block" />
					<BigText text="Observe" font="block" />
				</Gradient>
				<Text dimColor> v {version}</Text>
				<Text> </Text>

				<TitledBox
					borderStyle="single"
					borderColor="gray"
					padding={1}
					titles={['Sessions']}
					height={browserHeight}
				>
					{sessions.length === 0 ? (
						<Text dimColor>No sessions found in ~/.claude/projects</Text>
					) : (
						<Box flexDirection="column">
							<Box>
								<Box width={1}><Text></Text></Box>
								<Box width={44} marginRight={3} justifyContent="flex-start"><Text dimColor bold>Project</Text></Box>
								<Box width={44} justifyContent="flex-start"><Text dimColor bold>Session</Text></Box>
								<Box width={12} justifyContent="flex-end"><Text dimColor bold>Logs</Text></Box>
								<Box width={14} justifyContent="flex-end"><Text dimColor bold>Created</Text></Box>
								<Box width={14} justifyContent="flex-end"><Text dimColor bold>Modified</Text></Box>
								<Box width={1}><Text></Text></Box>
							</Box>

							<Box>
								<Text dimColor>{' '.repeat(1)}</Text>
								<Text dimColor>{'─'.repeat(width - 6)}</Text>
							</Box>

							{hasSessionsAbove && (
								<Box>
									<Text dimColor>
										{' '.repeat(1)}... {startIndex} more above ...
									</Text>
								</Box>
							)}

							{visibleSessions.map((item, visibleIndex) => {
								const index = startIndex + visibleIndex;
								const isSelected = index === selectedIndex;
								const selectedProject = sessions[selectedIndex]?.project || sessions[selectedIndex]?.projectName;
								const itemProject = item.project || item.projectName;
								const isSameProject = itemProject === selectedProject;
								const created = item.birthtime ? new Date(item.birthtime).toLocaleDateString() : 'N/A';
								const modified = item.mtime ? new Date(item.mtime).toLocaleDateString() : 'N/A';
								const logCount = formatLogs(item.logCount || 0);
								const tokens = item.usage ? (item.usage / 1000).toFixed(0) + 'k' : '0';

								// Color: blue for same project, dimmed for others
								const textColor = isSameProject ? '#3498db' : undefined;

								return (
									<Box key={`session-${item.path}`}>
										<Box width={1}>
											<Text color="#3498db">{isSelected ? '•' : ''}</Text>
										</Box>
										<Box width={44} justifyContent="flex-start" marginRight={3}>
											<Text wrap="truncate-middle" bold={isSelected} dimColor={!isSameProject && !isSelected} color={textColor}>
												{item.project || item.projectName}
											</Text>
										</Box>
										<Box width={44} justifyContent="flex-start" overflowX="hidden">
											<Text bold={isSelected} dimColor={!isSameProject && !isSelected} color={textColor}>{item.session || item.name}</Text>
										</Box>
										<Box width={12} justifyContent="flex-end">
											<Text bold={isSelected} dimColor={!isSameProject && !isSelected} color={textColor}>{logCount}</Text>
										</Box>
										<Box width={14} justifyContent="flex-end">
											<Text bold={isSelected} dimColor={!isSameProject && !isSelected} color={textColor}>{created}</Text>
										</Box>
										<Box width={14} justifyContent="flex-end">
											<Text bold={isSelected} dimColor={!isSameProject && !isSelected} color={textColor}>{modified}</Text>
										</Box>
										<Box width={1}><Text></Text></Box>
									</Box>
								);
							})}

							{hasSessionsBelow && (
								<Box>
									<Text dimColor>
										{' '.repeat(1)}... {sessions.length - endIndex} more below ...
									</Text>
								</Box>
							)}
						</Box>
					)}
				</TitledBox>
			</Box>

			{/* Filter input UI */}
			{filterMode && (
				<Box justifyContent="center">
					<Text>Filter: {filterInput}</Text>
				</Box>
			)}

			{/* Active filter indicator */}
			{!filterMode && filterQuery && (
				<Box justifyContent="center">
					<Text dimColor>Filter: {filterQuery} (Esc to clear)</Text>
				</Box>
			)}

			{/* Debug index message */}
			{/* <Box justifyContent="center">
				<Text dimColor>Index: {selectedIndex}</Text>
			</Box> */}

			{/* Help text */}
			<Box justifyContent="center">
				<Text dimColor>
					↑/↓: Navigate | d: Down 10 | u: Up 10 | t: Top | b: Bottom | Enter/→: Select Session | /: Filter
				</Text>
			</Box>
		</Box>
	);
}
