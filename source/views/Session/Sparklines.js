import {Box, Text} from 'ink';
import {TitledBox} from '@mishieck/ink-titled-box';
import {Histogram} from './source/components/Chart.js';

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
export default function Sparklines({logs, width = 120, height = 3}) {
	const logsWithData = logs.filter(log => log.timestamp && log.usage > 0);

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
		<Box flexDirection="column" padding={1}>
			{/* Normalized chart */}
			<TitledBox
				borderStyle="single"
				borderColor="gray"
				padding={1}
				paddingBottom={0}
				titles={['Activity (Normalized)']}
				width={width}
				marginTop={1}
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
						types={logTypes}
						startDate={startDate}
						endDate={endDate}
						totalTokens={totalTokens}
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
function TimeAxisLegend({data, types, startDate, endDate, totalTokens}) {
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
		<Box marginTop={1} justifyContent="space-between">
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
