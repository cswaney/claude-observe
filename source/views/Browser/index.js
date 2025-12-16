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
	filterQuery = ''
}) {
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

							{sessions.map((item, index) => {
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
					↑/↓: Navigate | Enter/→: Select Session | /: Filter
				</Text>
			</Box>
		</Box>
	);
}
