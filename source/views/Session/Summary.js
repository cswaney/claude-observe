import React from 'react';
import {Box, Text} from 'ink';
import {TitledBox} from '@mishieck/ink-titled-box';
import {Histogram} from '../../components/Chart.js';
import {formatTokens} from '../../utils.js';

/**
 *
 * @param {} -
 * @param {} -
 * @returns
 */
function SessionInfo({session, width = 72, height = 9, padding = 1}) {
	const totalUsage = session.logs.reduce(
		(sum, log) => sum + (log.usage || 0),
		0,
	);

	let duration = 'N/A';
	const timestamps = session.logs
		.map(log => new Date(log.timestamp))
		.filter(Boolean);
	if (timestamps.length > 0) {
		const startTime = timestamps[0];
		const endTime = timestamps[timestamps.length - 1];
		const elapsedMilliseconds = endTime - startTime;
		const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
		const hours = Math.floor(elapsedSeconds / 3600);
		const minutes = Math.floor((elapsedSeconds % 3600) / 60);
		const seconds = elapsedSeconds % 60;
		duration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
			2,
			'0',
		)}:${String(seconds).padStart(2, '0')}`;
	}

	return (
		<TitledBox
			borderStyle="single"
			borderColor="gray"
			titles={['Info']}
			padding={padding}
			width={width}
			height={height}
		>
			<Box flexDirection="column">
				<Box>
					<Text dimColor>Project: </Text>
					<Text>{session.project || 'N/A'}</Text>
				</Box>
				<Box>
					<Text dimColor>Created At: </Text>
					<Text>{new Date(session.created).toLocaleString()}</Text>
				</Box>
				<Box>
					<Text dimColor>Last Modified: </Text>
					<Text>{new Date(session.modified).toLocaleString()}</Text>
				</Box>
				<Box>
					<Text dimColor>Logs: </Text>
					<Text>{session.logs.length}</Text>
				</Box>
				<Box>
					<Text dimColor>Duration: </Text>
					<Text>{duration}</Text>
				</Box>
				<Box>
					<Text dimColor>Usage: </Text>
					<Text>{totalUsage.toLocaleString()} tokens</Text>
				</Box>
			</Box>
		</TitledBox>
	);
}

/**
 *
 * @param {*} logs
 * @param {*} width
 * @param {*} height
 * @param {*} padding
 * @returns
 */
function TokenDistribution({session, width, height = 9, padding = 1}) {
	const totalUsage = session.logs.reduce(
		(sum, log) => sum + (log.usage || 0),
		0,
	);

	const tokensByType = {
		user: 0,
		assistant: 0,
		tool: 0,
		thinking: 0,
		subagent: 0,
	};

	for (const log of session.logs) {
		const usage = log.usage || 0;
		switch (log.type) {
			case 'user': {
				tokensByType.user += usage;

				break;
			}

			case 'assistant': {
				tokensByType.assistant += usage;

				break;
			}

			case 'tool_use':
			case 'tool_result': {
				tokensByType.tool += usage;

				break;
			}

			case 'thinking': {
				tokensByType.thinking += usage;

				break;
			}

			case 'subagent': {
				tokensByType.subagent += usage;

				break;
			}
			// No default
		}
	}

	const data = [
		{label: 'Assistant', value: tokensByType.assistant, color: '#2ecc71'},
		{label: 'Tool', value: tokensByType.tool, color: '#3498db'},
		{label: 'Thinking', value: tokensByType.thinking, color: '#9b59b6'},
		{label: 'Agents', value: tokensByType.subagent, color: '#e74c3c'},
	];

	const stackedBars = (data, totalValue, barWidth) => {
		const segments = data.map(item => ({
			...item,
			percentage: (item.value / totalValue) * 100,
			width: Math.round((item.value / totalValue) * barWidth),
		}));

		// Adjust for rounding errors to ensure total width matches barWidth
		const totalWidth = segments.reduce((sum, seg) => sum + seg.width, 0);
		if (totalWidth < barWidth && segments.length > 0) {
			segments[segments.length - 1].width += barWidth - totalWidth;
		}

		return segments;
	};

	return (
		<TitledBox
			borderStyle="single"
			borderColor="gray"
			titles={['Usage']}
			padding={padding}
			height={height}
		>
			{totalUsage > 0 && data.length > 0 && (
				<Box flexDirection="column">
					<Box>
						{stackedBars(data, totalUsage, width - 6).map(segment => (
							<Text key={`segment-${segment.label}`} color={segment.color}>
								{'█'.repeat(segment.width)}
							</Text>
						))}
					</Box>

					<Box flexDirection="column" marginTop={1} gap={1}>
						<Box justifyContent="center" gap={2}>
							{data.slice(0, 2).map(item => {
								const percentage = (item.value / totalUsage) * 100;
								return (
									<Box key={`legend-${item.label}`} gap={1}>
										<Text color={item.color}>█</Text>
										<Text>{item.label}:</Text>
										<Text dimColor>{percentage.toFixed(1)}%</Text>
										<Text dimColor>({formatTokens(item.value)})</Text>
									</Box>
								);
							})}
						</Box>
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
	);
}

/**
 * Chart component representing session activity.
 *
 * The chart displays the number of tokens for each log type per unit of time over the
 * duration of the session. Data is normalized so that comparisons can be made across
 * log types.
 *
 * @param {array} logs - Array of session logs as returned by `parseLogFile`
 * @param {int} width - Width (columns) of the plotted area
 * @param {int} height - Height (rows) of the plotted area
 */
function TokenSparklines({session, width = 120, height = 3}) {
	const logsWithData = session.logs.filter(
		log => log.timestamp && log.usage > 0,
	);

	if (logsWithData.length === 0) {
		return <Text>No log data available with timestamps and usage</Text>;
	}

	const timestamps = logsWithData.map(
		log => new Date(log.timestamp).getTime() / 1000,
	);
	const minTime = Math.min(...timestamps);
	const maxTime = Math.max(...timestamps);
	const startDate = new Date(minTime * 1000);
	const endDate = new Date(maxTime * 1000);

	const logTypes = [
		{name: 'assistant', color: '#2ecc71', label: 'Assistant'},
		{name: 'tool_use', color: '#3498db', label: 'Tool Use'},
		{name: 'thinking', color: '#9b59b6', label: 'Thinking'},
		// { name: 'subagent', color: '#e74c3c', label: 'Agents' }
	];

	const dataByType = logTypes.map(({name}) => {
		const filtered = logsWithData.filter(log => log.type === name);
		return {
			x: filtered.map(log => new Date(log.timestamp).getTime() / 1000),
			y: filtered.map(log => log.usage),
			totalTokens: filtered.reduce((sum, log) => sum + log.usage, 0),
			count: filtered.length,
		};
	});

	const totalTokens = dataByType.reduce(
		(sum, data) => sum + data.totalTokens,
		0,
	);

	const chartWidth = width - 4; // Account for border (2) and padding (2)

	const histogram = data => {
		const xStep = (maxTime - minTime) / chartWidth;
		const bins = Array.from({length: chartWidth}, () => 0);

		for (const [xIndex, value] of data.x.entries()) {
			let dIndex = Math.floor((value - minTime) / xStep);
			if (dIndex === chartWidth) {
				dIndex -= 1;
			}

			if (dIndex >= 0 && dIndex < chartWidth) {
				bins[dIndex] += data.y[xIndex];
			}
		}

		return bins;
	};

	const binsByType = dataByType.map(data => histogram(data));
	const yMax = Math.max(...binsByType.flat());

	return (
		<Box flexDirection="column">
			<TitledBox
				borderStyle="single"
				borderColor="gray"
				padding={1}
				paddingBottom={0}
				titles={['Activity (Normalized)']}
				width={width}
			>
				<Box flexDirection="column" marginTop={-1}>
					{logTypes.map(({name, color, _}, idx) => {
						const data = dataByType[idx];

						return (
							<Box key={name} flexDirection="column">
								{data.x.length > 0 ? (
									<Histogram
										x={data.x}
										y={data.y}
										width={chartWidth}
										height={height}
										xMin={minTime}
										xMax={maxTime}
										yMin={0}
										yMax={yMax}
										color={color}
									/>
								) : (
									<Box height={height + 1}>
										<Text> </Text>
									</Box>
								)}
							</Box>
						);
					})}

					<TimeAxisLegend
						data={dataByType}
						logs={logsWithData}
						types={logTypes}
						startDate={startDate}
						endDate={endDate}
						totalTokens={totalTokens}
						width={chartWidth}
					/>
				</Box>
			</TitledBox>
		</Box>
	);
}

/**
 * Combined time axis and legened of Sparkline plot.
 *
 * @param {array} data - An array whose `i`-th entry contain token data for the `i`-th log type.
 * @param {array} types - An array of log types ('Assistant', 'Thinking', and 'Tool Use').
 * @returns
 */
function TimeAxisLegend({data, logs, types, totalTokens, width}) {
	const timestamps = logs.map(log => new Date(log.timestamp).getTime() / 1000);
	const minTime = Math.min(...timestamps);
	const maxTime = Math.max(...timestamps);
	const startDate = new Date(minTime * 1000);
	const endDate = new Date(maxTime * 1000);
	const isMultiDaySession = startDate.toDateString() !== endDate.toDateString();

	const formatTimeLabel = date => {
		const time = date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
		});

		if (isMultiDaySession) {
			const dateString = date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
			});
			return `${dateString} ${time}`;
		}

		return time;
	};

	return (
		<Box marginTop={1} justifyContent="space-between" width={width}>
			<Text dimColor>{formatTimeLabel(startDate)}</Text>
			<Box gap={3}>
				{types.map(({name, color, label}, idx) => {
					const percentage =
						totalTokens > 0
							? ((data[idx].totalTokens / totalTokens) * 100).toFixed(1)
							: 0;
					return (
						<Box key={`legend-${name}`} gap={1}>
							<Text color={color}>█</Text>
							<Text>{label}</Text>
							<Text dimColor>({percentage}%)</Text>
						</Box>
					);
				})}
			</Box>
			<Text dimColor>{formatTimeLabel(endDate)}</Text>
		</Box>
	);
}

export default function Summary({session, width = 80}) {
	return (
		<Box flexDirection="column">
			<Box>
				<SessionInfo session={session} width={72} />

				<TokenDistribution session={session} width={width - 72 - 2} />
			</Box>

			<TokenSparklines session={session} width={width - 4} />
		</Box>
	);
}
