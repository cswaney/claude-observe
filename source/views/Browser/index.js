import React from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import { TitledBox } from '@mishieck/ink-titled-box';

// Version injected at build time via esbuild define
const version = process.env.PACKAGE_VERSION || '0.0.0';

export default function Browser({
	width = 80,
	browserItems = [],
	selectedIndex = 0,
	browserFilterMode = false,
	browserFilterInput = '',
	browserFilterQuery = ''
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
					{browserItems.length === 0 ? (
						<Text dimColor>No sessions found in ~/.claude/projects</Text>
					) : (
						<Box flexDirection="column">
							<Box>
								<Box width={2}>
									<Text></Text>
								</Box>
								<Box width={48} justifyContent="flex-start"><Text dimColor bold>Project</Text></Box>
								<Box flexGrow={1} justifyContent="flex-start"><Text dimColor bold>Session</Text></Box>
								<Box width={6} justifyContent="flex-end"><Text dimColor bold>Logs</Text></Box>
								<Box width={10} justifyContent="flex-end"><Text dimColor bold>Tokens</Text></Box>
								<Box width={14} justifyContent="flex-end"><Text dimColor bold>Created</Text></Box>
								<Box width={14} justifyContent="flex-end"><Text dimColor bold>Modified</Text></Box>
							</Box>

							<Box>
								<Text dimColor>{' '.repeat(2)}</Text>
								<Text dimColor>{'─'.repeat(width - 7)}</Text>
							</Box>

							{browserItems.map((item, index) => {
								const isSelected = index === selectedIndex;
								const selectedProject = browserItems[selectedIndex]?.project || browserItems[selectedIndex]?.projectName;
								const itemProject = item.project || item.projectName;
								const isSameProject = itemProject === selectedProject;
								const created = item.birthtime ? new Date(item.birthtime).toLocaleDateString() : 'N/A';
								const modified = item.mtime ? new Date(item.mtime).toLocaleDateString() : 'N/A';
								const logCount = item.logCount || 0;
								const tokens = item.usage ? (item.usage / 1000).toFixed(0) + 'k' : '0';

								// Color: blue for same project, dimmed for others
								const textColor = isSameProject ? '#3498db' : undefined;

								return (
									<Box key={`session-${item.path}`}>
										<Box width={1}>
											<Text color="#3498db">{isSelected ? '•' : ''}</Text>
										</Box>
										<Box width={48} justifyContent="flex-start">
											<Text bold={isSelected} dimColor={!isSameProject && !isSelected} color={textColor}>
												{item.project || item.projectName}
											</Text>
										</Box>
										<Box flexGrow={1} justifyContent="flex-start">
											<Text bold={isSelected} dimColor={!isSameProject && !isSelected} color={textColor}>{item.session || item.name}</Text>
										</Box>
										<Box width={6} justifyContent="flex-end">
											<Text bold={isSelected} dimColor={!isSameProject && !isSelected} color={textColor}>{logCount}</Text>
										</Box>
										<Box width={10} justifyContent="flex-end">
											<Text bold={isSelected} dimColor={!isSameProject && !isSelected} color={textColor}>{tokens}</Text>
										</Box>
										<Box width={14} justifyContent="flex-end">
											<Text bold={isSelected} dimColor={!isSameProject && !isSelected} color={textColor}>{created}</Text>
										</Box>
										<Box width={14} justifyContent="flex-end">
											<Text bold={isSelected} dimColor={!isSameProject && !isSelected} color={textColor}>{modified}</Text>
										</Box>
									</Box>
								);
							})}
						</Box>
					)}
				</TitledBox>
			</Box>

			{/* Filter input UI */}
			{browserFilterMode && (
				<Box justifyContent="center">
					<Text>Filter: {browserFilterInput}</Text>
				</Box>
			)}

			{/* Active filter indicator */}
			{!browserFilterMode && browserFilterQuery && (
				<Box justifyContent="center">
					<Text dimColor>Filter: {browserFilterQuery} (Esc to clear)</Text>
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
