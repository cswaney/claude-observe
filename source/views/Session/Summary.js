import React from 'react';
import { Box, Text } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';

// Format token counts with k/M suffixes
function formatTokens(count) {
	if (count >= 1000000) {
		return (count / 1000000).toFixed(1) + 'M';
	} else if (count >= 1000) {
		return (count / 1000).toFixed(1) + 'k';
	}
	return count.toString();
}

function TokenDistribution({ data, totalUsage, maxWidth }) {

	const createStackedBar = (data, totalValue, barWidth) => {
		const segments = data.map(item => ({
			...item,
			percentage: (item.value / totalValue) * 100,
			width: Math.round((item.value / totalValue) * barWidth)
		}));

		// Adjust for rounding errors to ensure total width matches barWidth
		const totalWidth = segments.reduce((sum, seg) => sum + seg.width, 0);
		if (totalWidth < barWidth && segments.length > 0) {
			segments[segments.length - 1].width += (barWidth - totalWidth);
		}

		return segments;
	};

	return <TitledBox
		borderStyle="single"
		borderColor="gray"
		padding={1}
		titles={["Usage"]}
		// marginTop={1}
		height={9}
	>
		{totalUsage > 0 && data.length > 0 && (
			<Box flexDirection="column">

				<Box>
					{createStackedBar(data, totalUsage, maxWidth - 6).map((segment, idx) => (
						<Text key={`segment-${idx}`} color={segment.color}>
							{'█'.repeat(segment.width)}
						</Text>
					))}
				</Box>

				<Box
					flexDirection="column"
					marginTop={1}
					gap={1}
				>
					{/* First row: Assistant and Tool */}
					<Box justifyContent="center" gap={2}>
						{data.slice(0, 2).map((item, idx) => {
							const percentage = (item.value / totalUsage) * 100;
							return (
								<Box key={`legend-${idx}`} gap={1}>
									<Text color={item.color}>█</Text>
									<Text>{item.label}:</Text>
									<Text dimColor>{percentage.toFixed(1)}%</Text>
									<Text dimColor>({formatTokens(item.value)})</Text>
								</Box>
							);
						})}
					</Box>
					{/* Second row: Thinking and Agents */}
					<Box justifyContent="center" gap={2}>
						{data.slice(2, 4).map((item, idx) => {
							const percentage = (item.value / totalUsage) * 100;
							return (
								<Box key={`legend-${idx + 2}`} gap={1}>
									<Text color={item.color}>█</Text>
									<Text>{item.label}:</Text>
									<Text dimColor>{percentage.toFixed(1)}%</Text>
									<Text dimColor>({formatTokens(item.value)})</Text>
								</Box>
							);
						})}
					</Box>
				</Box>
			</Box>
		)}
	</TitledBox>
}

function ActivityChart({ activityByType, activityStats, timeLabels }) {
	return <TitledBox
		borderStyle="single"
		borderColor="gray"
		padding={1}
		// marginTop={1}
    paddingBottom={0}
		// titles={["Activity (tokens/min, log scale)"]}
		titles={["Activity"]}
	>
		{activityByType.assistant.length > 0 && (
			<Box flexDirection="column" marginTop={1}>
				{/* Assistant activity */}
				<Box>
					{activityByType.assistant.map((point, idx) => (
						<Text key={`assistant-${idx}`} color="#2ecc71">
							{point.char}
						</Text>
					))}
				</Box>

				{/* Tool activity */}
				<Box marginTop={1}>
					{activityByType.tool.map((point, idx) => (
						<Text key={`tool-${idx}`} color="#3498db">
							{point.char}
						</Text>
					))}
				</Box>

				{/* Thinking activity */}
				<Box marginTop={1}>
					{activityByType.thinking.map((point, idx) => (
						<Text key={`thinking-${idx}`} color="#9b59b6">
							{point.char}
						</Text>
					))}
				</Box>

				{/* Agent activity */}
				<Box marginTop={1}>
					{activityByType.subagent.map((point, idx) => (
						<Text key={`subagent-${idx}`} color="red">
							{point.char}
						</Text>
					))}
				</Box>

				{/* Time axis */}
				{timeLabels.length > 0 && (
					<Box marginTop={1} justifyContent="space-between">
						{timeLabels.map((label, idx) => (
							<Text key={`time-${idx}`} dimColor>{label.time}</Text>
						))}
					</Box>
				)}

				{/* Stats labels below sparklines */}
				{/* <Box marginTop={1} justifyContent="flex-end">
					<Text dimColor>Max: {Math.max(activityStats.assistant.max, activityStats.tool.max, activityStats.thinking.max, activityStats.subagent.max).toLocaleString()}, Avg: {Math.round((activityStats.assistant.avg + activityStats.tool.avg + activityStats.thinking.avg + activityStats.subagent.avg) / 4).toLocaleString()}</Text>
				</Box> */}
			</Box>
		)}
	</TitledBox>
}

export default function Summary({ width = 80, logs = [], project = 'Unknown Project', session = 'Unknown Session', startDatetime = null, title = null, sessionMetadata = null }) {
	// Calculate statistics from logs
	const totalUsage = logs.reduce((sum, log) => sum + (log.usage || 0), 0);

	// Calculate token distribution by type
	const tokensByType = {
		user: 0,
		assistant: 0,
		tool: 0,
		thinking: 0,
		subagent: 0,
	};

	logs.forEach(log => {
		const usage = log.usage || 0;
		if (log.type === 'user') {
			tokensByType.user += usage;
		} else if (log.type === 'assistant') {
			tokensByType.assistant += usage;
		} else if (log.type === 'tool') {
			tokensByType.tool += usage;
		} else if (log.type === 'thinking') {
			tokensByType.thinking += usage;
		} else if (log.type === 'subagent') {
			tokensByType.subagent += usage;
		}
	});

	// Prepare data for chart visualization (matching AGENT_COLORS from Logs.js)
	const chartData = [
		{ label: 'Assistant', value: tokensByType.assistant, color: '#2ecc71' },
		{ label: 'Tool', value: tokensByType.tool, color: '#3498db' },
		{ label: 'Thinking', value: tokensByType.thinking, color: '#9b59b6' },
		{ label: 'Agents', value: tokensByType.subagent, color: 'red' },
	];

	// Calculate available width for TokenDistribution box
	// Total width minus Info box width
	const tokenDistributionWidth = width - 72 - 2;

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

	// Calculate activity over time (tokens per minute) by type
	const activityByType = {
		assistant: [],
		tool: [],
		thinking: [],
		subagent: []
	};

	const activityStats = {
		assistant: { max: 0, avg: 0 },
		tool: { max: 0, avg: 0 },
		thinking: { max: 0, avg: 0 },
		subagent: { max: 0, avg: 0 }
	};

	let timeLabels = [];

	if (timestamps.length > 0) {
		const parseTime = (timeStr) => {
			const [hours, minutes, seconds] = timeStr.split(':').map(Number);
			return hours * 3600 + minutes * 60 + seconds;
		};

		const startSeconds = parseTime(timestamps[0]);
		const endSeconds = parseTime(timestamps[timestamps.length - 1]);
		const durationMinutes = Math.ceil((endSeconds - startSeconds) / 60);

		// Create buckets for each minute and type
		const bucketsByType = {
			assistant: Array(Math.max(durationMinutes, 1)).fill(0),
			tool: Array(Math.max(durationMinutes, 1)).fill(0),
			thinking: Array(Math.max(durationMinutes, 1)).fill(0),
			subagent: Array(Math.max(durationMinutes, 1)).fill(0)
		};

		// Aggregate tokens by minute and type
		logs.forEach((log, idx) => {
			if (log.timestamp && log.usage) {
				const logSeconds = parseTime(log.timestamp);
				const minuteIndex = Math.floor((logSeconds - startSeconds) / 60);
				if (minuteIndex >= 0 && minuteIndex < bucketsByType.assistant.length) {
					if (log.type === 'assistant') {
						bucketsByType.assistant[minuteIndex] += log.usage;
					} else if (log.type === 'tool') {
						bucketsByType.tool[minuteIndex] += log.usage;
					} else if (log.type === 'thinking') {
						bucketsByType.thinking[minuteIndex] += log.usage;
					} else if (log.type === 'subagent' && !log.isLast) {
						// For agents, spread tokens across their duration
						// Find the end entry for this agent
						const endEntry = logs.find(l => l.type === 'subagent' && l.agentId === log.agentId && l.isLast);
						if (endEntry && endEntry.timestamp) {
							const endSeconds = parseTime(endEntry.timestamp);
							const startMinute = Math.floor((logSeconds - startSeconds) / 60);
							const endMinute = Math.floor((endSeconds - startSeconds) / 60);
							const durationMinutes = Math.max(endMinute - startMinute, 1);
							const tokensPerMinute = log.usage / durationMinutes;

							// Distribute tokens across the duration
							for (let m = startMinute; m <= endMinute; m++) {
								if (m >= 0 && m < bucketsByType.subagent.length) {
									bucketsByType.subagent[m] += tokensPerMinute;
								}
							}
						} else {
							// Fallback: add to single minute if no end found
							bucketsByType.subagent[minuteIndex] += log.usage;
						}
					}
				}
			}
		});

		// Create activity data for each type
		const blockChars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

		['assistant', 'tool', 'thinking', 'subagent'].forEach(type => {
			const buckets = bucketsByType[type];
			const maxTokens = Math.max(...buckets, 1);
			const nonZeroBuckets = buckets.filter(t => t > 0);
			const avgTokens = nonZeroBuckets.length > 0
				? nonZeroBuckets.reduce((sum, t) => sum + t, 0) / nonZeroBuckets.length
				: 0;

			activityStats[type] = {
				max: maxTokens,
				avg: Math.round(avgTokens)
			};

			buckets.forEach((tokens, idx) => {
				// Use log scale for better variation at lower values
				// intensity = log(tokens + 1) / log(maxTokens + 1)
				// This compresses high values and expands low values
				let charIndex;
				if (tokens === 0) {
					charIndex = 0; // Use ▁ for zero
				} else {
					const intensity = Math.log(tokens + 1) / Math.log(maxTokens + 1);
					charIndex = Math.min(Math.floor(intensity * blockChars.length), blockChars.length - 1);
				}
				activityByType[type].push({
					minute: idx,
					tokens,
					char: blockChars[charIndex],
					intensity: tokens === 0 ? 0 : Math.log(tokens + 1) / Math.log(maxTokens + 1)
				});
			});
		});

		// Calculate time axis labels
		const sparklineWidth = activityByType.assistant.length;
		const timestampWidth = 5; // "HH:MM" format

		// Determine how many intermediate timestamps we can fit (0-3)
		// Need space for timestamps: start (5) + end (5) + intermediate (5 each)
		// Plus spacing between them (~7 chars minimum)
		let numIntermediateTimestamps = 0;
		const minSpacing = 7;

		if (sparklineWidth >= 2 * timestampWidth + 3 * timestampWidth + 4 * minSpacing) {
			numIntermediateTimestamps = 3; // Can fit 5 total timestamps
		} else if (sparklineWidth >= 2 * timestampWidth + 2 * timestampWidth + 3 * minSpacing) {
			numIntermediateTimestamps = 2; // Can fit 4 total timestamps
		} else if (sparklineWidth >= 2 * timestampWidth + timestampWidth + 2 * minSpacing) {
			numIntermediateTimestamps = 1; // Can fit 3 total timestamps
		}
		// else 0 intermediate (just start and end)

		const totalTimestamps = 2 + numIntermediateTimestamps;

		// Calculate timestamp positions and values
		timeLabels = [];
		for (let i = 0; i < totalTimestamps; i++) {
			const fraction = i / (totalTimestamps - 1);
			const timeSeconds = startSeconds + Math.round(fraction * (endSeconds - startSeconds));
			const hours = Math.floor(timeSeconds / 3600) % 24;
			const minutes = Math.floor((timeSeconds % 3600) / 60);
			const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

			// Calculate position, accounting for timestamp width
			let position;
			if (i === 0) {
				// First timestamp: left-aligned at start
				position = 0;
			} else if (i === totalTimestamps - 1) {
				// Last timestamp: right-aligned at end
				position = sparklineWidth - timestampWidth;
			} else {
				// Middle timestamps: centered at their fractional position
				position = Math.round(fraction * (sparklineWidth - 1)) - Math.floor(timestampWidth / 2);
			}

			timeLabels.push({ time: timeStr, position: Math.max(0, position) });
		}
	}

	return (
		<Box
			flexDirection="column"
		>
			<Box>
				<TitledBox
					borderStyle="single"
					borderColor="gray"
					titles={['Info']}
					padding={1}
					width={72}
					height={9}
				>
					<Box
						flexDirection="column"
						// paddingLeft={1}
						// paddingRight={1}
					>
						<Box>
							<Text dimColor>Project: </Text>
							<Text>{project || 'N/A'}</Text>
						</Box>
						<Box>
							<Text dimColor>Created At: </Text>
							<Text>{sessionMetadata?.created ? new Date(sessionMetadata.created).toLocaleString() : 'N/A'}</Text>
						</Box>
						<Box>
							<Text dimColor>Last Modified: </Text>
							<Text>{sessionMetadata?.modified ? new Date(sessionMetadata.modified).toLocaleString() : 'N/A'}</Text>
						</Box>
						<Box>
							<Text dimColor>Logs: </Text>
							<Text>{(sessionMetadata?.logCount || logs.length).toLocaleString()}</Text>
						</Box>
						<Box>
							<Text dimColor>Duration: </Text>
							<Text>{duration}</Text>
						</Box>
						<Box>
							<Text dimColor>Usage: </Text>
							<Text>{totalUsage.toLocaleString()} tokens</Text>
						</Box>
						{/* <Box>
							<Text dimColor>Tool Calls:</Text>
							<Text>{toolCalls}</Text>
						</Box>
						<Box>
							<Text dimColor>Agent Calls:</Text>
							<Text>{agentCalls}</Text>
						</Box> */}
					</Box>
				</TitledBox>

				<TokenDistribution
					data={chartData}
					totalUsage={totalUsage}
					maxWidth={tokenDistributionWidth}
				/>
			</Box>


			<ActivityChart
				activityByType={activityByType}
				activityStats={activityStats}
				timeLabels={timeLabels}
			/>
		</Box>
	);
}
