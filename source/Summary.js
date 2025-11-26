import React from 'react';
import {Box, Text} from 'ink';
import {TitledBox} from '@mishieck/ink-titled-box';

export default function Summary({width = 80, logs = [], project = 'Unknown Project', session = 'Unknown Session'}) {
	// Calculate statistics from logs
	const totalUsage = logs.reduce((sum, log) => sum + (log.usage || 0), 0);

	// Calculate duration (elapsed time between first and last timestamp)
	const timestamps = logs.map(log => log.timestamp).filter(Boolean);
	let duration = 'N/A';
	if (timestamps.length > 0) {
		const parseTime = (timeStr) => {
			const [hours, minutes, seconds] = timeStr.split(':').map(Number);
			return hours * 3600 + minutes * 60 + seconds;
		};
		const startSeconds = parseTime(timestamps[0]);
		const endSeconds = parseTime(timestamps[timestamps.length - 1]);
		const elapsedSeconds = endSeconds - startSeconds;

		const hours = Math.floor(elapsedSeconds / 3600);
		const minutes = Math.floor((elapsedSeconds % 3600) / 60);
		const seconds = elapsedSeconds % 60;

		duration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	}

	// Count tool calls
	const toolCalls = logs.filter(log => log.type === 'tool').length;

	// Count agent calls (subagent starts only, not ends)
	const agentCalls = logs.filter(log => log.type === 'subagent' && !log.isLast).length;

	return (
		<Box flexDirection="column" width={width}>
			<TitledBox
				borderStyle="single"
				borderColor="gray"
				padding={1}
				titles={['Summary']}
			>
				<Box flexDirection="column">
					<Box>
						<Text bold>{project}</Text>
						<Text dimColor> / </Text>
						<Text>{session}</Text>
					</Box>
					<Box marginTop={1} gap={3}>
						<Box>
							<Text dimColor>Total Usage: </Text>
							<Text>{totalUsage.toLocaleString()} tokens</Text>
						</Box>
						<Box>
							<Text dimColor>Duration: </Text>
							<Text>{duration}</Text>
						</Box>
						<Box>
							<Text dimColor>Tool Calls: </Text>
							<Text>{toolCalls}</Text>
						</Box>
						<Box>
							<Text dimColor>Agent Calls: </Text>
							<Text>{agentCalls}</Text>
						</Box>
					</Box>
				</Box>
			</TitledBox>
		</Box>
	);
}
