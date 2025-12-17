#!/usr/bin/env node
import React from 'react';
import { render, Box, Text } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';
import { Histogram } from './source/components/Chart.js';
import { parseLogFile } from './source/parser.js';

function ActivityChart() {
	const sessionPath = '/Users/colinswaney/.claude/projects/-Users-colinswaney-Desktop-claude-observe/7e462c02-4cf8-4535-8d32-6e6242eaab26.jsonl';

	console.log('Loading session...');
	const logs = parseLogFile(sessionPath);
	console.log(`Loaded ${logs.length} logs\n`);

	const logsWithData = logs.filter(log =>
		log.raw.timestamp && log.usage > 0
	);

	if (logsWithData.length === 0) {
		return <Text>No log data available with timestamps and usage</Text>;
	}

	// Calculate time range
	const allTimestamps = logsWithData.map(log => new Date(log.raw.timestamp).getTime() / 1000);
	const minTime = Math.min(...allTimestamps);
	const maxTime = Math.max(...allTimestamps);
	const duration = maxTime - minTime;
	const durationMinutes = duration / 60;

	// Format time labels
	const startDate = new Date(minTime * 1000);
	const endDate = new Date(maxTime * 1000);

	// Check if session spans multiple days
	const spanMultipleDays = startDate.toDateString() !== endDate.toDateString();

	const formatTimeLabel = (date) => {
		const time = date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		});

		if (spanMultipleDays) {
			const dateStr = date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric'
			});
			return `${dateStr} ${time}`;
		}

		return time;
	};

	// Separate data by type
	const logTypes = [
		{ name: 'assistant', color: '#2ecc71', label: 'Assistant' },
		{ name: 'tool_use', color: '#3498db', label: 'Tool Use' },
		{ name: 'thinking', color: '#9b59b6', label: 'Thinking' },
		// { name: 'subagent', color: '#e74c3c', label: 'Agents' }
	];

	const dataByType = logTypes.map(({ name }) => {
		const filtered = logsWithData.filter(log => log.type === name);
		return {
			x: filtered.map(log => new Date(log.raw.timestamp).getTime() / 1000),
			y: filtered.map(log => log.usage),
			totalTokens: filtered.reduce((sum, log) => sum + log.usage, 0),
			count: filtered.length
		};
	});

	const totalTokens = dataByType.reduce((sum, data) => sum + data.totalTokens, 0);

	// Chart dimensions
	const width = 120;
	const boxWidth = width;
	const chartWidth = width - 4; // Account for border (2) and padding (2)
	const chartHeight = 3;

	// Calculate global max for normalized chart
	// We need to bin the data for each type to find the maximum bin value across all types
	const calculateBinnedData = (data) => {
		const xStep = (maxTime - minTime) / chartWidth;
		const bins = Array(chartWidth).fill(0);

		data.x.forEach((value, xIndex) => {
			let dIndex = Math.floor((value - minTime) / xStep);
			if (dIndex === chartWidth) {
				dIndex -= 1;
			}
			if (dIndex >= 0 && dIndex < chartWidth) {
				bins[dIndex] += data.y[xIndex];
			}
		});

		return bins;
	};

	const allBins = dataByType.map(data => calculateBinnedData(data));
	const globalYMax = Math.max(...allBins.flat());

	return (
		<Box flexDirection="column" padding={1}>
			<Box flexDirection="column" marginBottom={1}>
				<Text dimColor>Duration: {Math.floor(durationMinutes)} minutes</Text>
				<Text dimColor>Total Tokens: {totalTokens.toLocaleString()}</Text>
			</Box>

			{/* Auto-scaled chart */}
			<TitledBox
				borderStyle="single"
				borderColor="gray"
				padding={1}
				paddingBottom={0}
				titles={["Activity"]}
				width={boxWidth}
			>
				<Box flexDirection="column" marginTop={-1}>
					{/* Chart histograms */}
					{logTypes.map(({ name, color, label }, idx) => {
						const data = dataByType[idx];

						return (
							<Box key={name} flexDirection="column">
								{data.x.length > 0 ? (
									<Histogram
										x={data.x}
										y={data.y}
										width={chartWidth}
										height={chartHeight}
										xMin={minTime}
										xMax={maxTime}
										color={color}
									/>
								) : (
									<Box height={chartHeight + 1}>
										<Text> </Text>
									</Box>
								)}
							</Box>
						);
					})}

					{/* Time axis and legend combined */}
					<Box marginTop={1} justifyContent="space-between" width={chartWidth}>
						<Text dimColor>{formatTimeLabel(startDate)}</Text>

						{/* Legend */}
						<Box gap={3}>
							{logTypes.map(({ name, color, label }, idx) => {
								const data = dataByType[idx];
								const percentage = totalTokens > 0 ? ((data.totalTokens / totalTokens) * 100).toFixed(1) : 0;
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
				</Box>
			</TitledBox>

			{/* Normalized chart */}
			<TitledBox
				borderStyle="single"
				borderColor="gray"
				padding={1}
				paddingBottom={0}
				titles={["Activity (Normalized)"]}
				width={boxWidth}
				marginTop={1}
			>
				<Box flexDirection="column" marginTop={-1}>
					{/* Chart histograms - all use same yMax */}
					{logTypes.map(({ name, color, label }, idx) => {
						const data = dataByType[idx];

						return (
							<Box key={name} flexDirection="column">
								{data.x.length > 0 ? (
									<Histogram
										x={data.x}
										y={data.y}
										width={chartWidth}
										height={chartHeight}
										xMin={minTime}
										xMax={maxTime}
										yMin={0}
										yMax={globalYMax}
										color={color}
									/>
								) : (
									<Box height={chartHeight + 1}>
										<Text> </Text>
									</Box>
								)}
							</Box>
						);
					})}

					{/* Time axis and legend combined */}
					<Box marginTop={1} justifyContent="space-between" width={chartWidth}>
						<Text dimColor>{formatTimeLabel(startDate)}</Text>

						{/* Legend */}
						<Box gap={3}>
							{logTypes.map(({ name, color, label }, idx) => {
								const data = dataByType[idx];
								const percentage = totalTokens > 0 ? ((data.totalTokens / totalTokens) * 100).toFixed(1) : 0;
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
				</Box>
			</TitledBox>
		</Box>
	);
}

render(<ActivityChart />);
