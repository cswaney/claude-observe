import React from 'react';
import {Box, Text} from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';

// Version injected at build time via esbuild define
const version = process.env.PACKAGE_VERSION || '0.0.0';

export default function Browser({
	width = 80,
	browserItems = [],
	selectedIndex = 0,
	expandedProjects = new Set()
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
				<Text>Select a session:</Text>
				<Text> </Text>
				{browserItems.length === 0 ? (
					<Text dimColor>No projects found in ~/.claude/projects</Text>
				) : (
					browserItems.map((item, index) => {
						const isSelected = index === selectedIndex;
						if (item.type === 'project') {
							const isExpanded = expandedProjects.has(item.data.name);
							return (
								<Box key={`project-${item.data.name}`}>
									<Text inverse={isSelected}>
										{isExpanded ? '⌄ ' : '> '}{item.data.name}
									</Text>
								</Box>
							);
						} else {
							// Session
							const timestamp = item.data.mtime.toLocaleString();
							return (
								<Box key={`session-${item.data.path}`}>
									<Text inverse={isSelected}>
										{'  '}{item.data.name} <Text dimColor>({timestamp})</Text>
									</Text>
								</Box>
							);
						}
					})
				)}
			</Box>
			<Box>
				<Text dimColor>
					↑/↓: Navigate | Enter/→: Expand/Select | ←: Collapse | Esc: Back
				</Text>
			</Box>
		</Box>
	);
}
