#!/usr/bin/env node
import React from 'react';
import {render, Box, Text} from 'ink';
import {Histogram} from './source/components/Chart.js';
import {parseLogFile} from './source/parser.js';

function TokenHistogramByType() {
	const sessionPath =
		'/Users/colinswaney/.claude/projects/-Users-colinswaney-Desktop-claude-observe/7e462c02-4cf8-4535-8d32-6e6242eaab26.jsonl';

	console.log('Loading session...');
	const logs = parseLogFile(sessionPath);
	console.log(`Loaded ${logs.length} logs\n`);

	const logsWithData = logs.filter(log => log.raw.timestamp && log.usage > 0);

	if (logsWithData.length === 0) {
		return <Text>No log data available with timestamps and usage</Text>;
	}

	// Calculate time range
	const allTimestamps = logsWithData.map(
		log => new Date(log.raw.timestamp).getTime() / 1000,
	);
	const minTime = Math.min(...allTimestamps);
	const maxTime = Math.max(...allTimestamps);
	const duration = maxTime - minTime;
	const durationMinutes = duration / 60;

	// Format time labels
	const startDate = new Date(minTime * 1000);
	const endDate = new Date(maxTime * 1000);
	const formatTime = date => {
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
		});
	};

	// Separate data by type
	const logTypes = [
		{name: 'assistant', color: '#2ecc71', label: 'Assistant'},
		{name: 'tool_use', color: '#3498db', label: 'Tool Use'},
		{name: 'thinking', color: '#9b59b6', label: 'Thinking'},
	];

	const dataByType = logTypes.map(({name}) => {
		const filtered = logsWithData.filter(log => log.type === name);
		return {
			x: filtered.map(log => new Date(log.raw.timestamp).getTime() / 1000),
			y: filtered.map(log => log.usage),
			totalTokens: filtered.reduce((sum, log) => sum + log.usage, 0),
			count: filtered.length,
		};
	});

	const totalTokens = dataByType.reduce(
		(sum, data) => sum + data.totalTokens,
		0,
	);

	return (
		<Box flexDirection="column" padding={1}>
			<Text bold color="white">
				Token Usage by Type
			</Text>
			<Text dimColor>Session activity over time (separate histograms)</Text>
			<Text> </Text>

			<Box flexDirection="column" marginBottom={1}>
				<Text dimColor>
					Duration: {Math.floor(durationMinutes)} minutes (
					{formatTime(startDate)} - {formatTime(endDate)})
				</Text>
				<Text dimColor>Total Tokens: {totalTokens.toLocaleString()}</Text>
			</Box>

			{logTypes.map(({name, color, label}, idx) => {
				const data = dataByType[idx];
				const percentage =
					totalTokens > 0
						? ((data.totalTokens / totalTokens) * 100).toFixed(1)
						: 0;

				return (
					<Box key={name} flexDirection="column" marginBottom={1}>
						<Text bold color={color}>
							{label}: {data.totalTokens.toLocaleString()} tokens ({percentage}
							%) - {data.count} logs
						</Text>
						{data.x.length > 0 ? (
							<Histogram
								x={data.x}
								y={data.y}
								width={80}
								height={3}
								xMin={minTime}
								xMax={maxTime}
								color={color}
							/>
						) : (
							<Text dimColor>No data for this type</Text>
						)}
					</Box>
				);
			})}

			<Box marginTop={1} justifyContent="space-between" width={80}>
				<Text dimColor>{formatTime(startDate)}</Text>
				<Text dimColor>{formatTime(endDate)}</Text>
			</Box>

			<Text> </Text>
			<Text dimColor>
				Each histogram shows when that activity type occurred during the
				session.
			</Text>
		</Box>
	);
}

render(<TokenHistogramByType />);
