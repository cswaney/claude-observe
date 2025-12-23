#!/usr/bin/env node
import React from 'react';
import {render, Box, Text} from 'ink';
import {Histogram} from '../components/Chart.js';
import {parseLogFile} from '../parser.js';

function TokenHistogram() {
	// Load session data
	const sessionPath =
		'/Users/colinswaney/.claude/projects/-Users-colinswaney-Desktop-claude-observe/7e462c02-4cf8-4535-8d32-6e6242eaab26.jsonl';

	console.log('Loading session...');
	const logs = parseLogFile(sessionPath);
	console.log(`Loaded ${logs.length} logs\n`);

	// Filter logs that have timestamps and usage data
	const logsWithData = logs.filter(log => log.raw.timestamp && log.usage > 0);

	if (logsWithData.length === 0) {
		return <Text>No log data available with timestamps and usage</Text>;
	}

	// Convert timestamps to seconds since epoch for easier processing
	const x = logsWithData.map(log => {
		const date = new Date(log.raw.timestamp);
		return date.getTime() / 1000; // Convert to seconds
	});

	// Use token usage as weights
	const y = logsWithData.map(log => log.usage);

	// Calculate time range
	const minTime = Math.min(...x);
	const maxTime = Math.max(...x);
	const duration = maxTime - minTime;
	const durationMinutes = duration / 60;

	// Format time labels
	const startDate = new Date(minTime * 1000);
	const endDate = new Date(maxTime * 1000);
	const formatTime = date => {
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
		});
	};

	// Calculate total tokens
	const totalTokens = y.reduce((sum, value) => sum + value, 0);

	// Break down by type
	const tokensByType = {};
	for (const log of logsWithData) {
		if (!tokensByType[log.type]) {
			tokensByType[log.type] = 0;
		}

		tokensByType[log.type] += log.usage;
	}

	return (
		<Box flexDirection="column" padding={1}>
			<Text bold color="cyan">
				Token Usage Histogram
			</Text>
			<Text dimColor>Session activity over time (token-weighted)</Text>
			<Text> </Text>

			<Box flexDirection="column" marginBottom={1}>
				<Text dimColor>
					Duration: {Math.floor(durationMinutes)} minutes (
					{formatTime(startDate)} - {formatTime(endDate)})
				</Text>
				<Text dimColor>Total Tokens: {totalTokens.toLocaleString()}</Text>
				<Text dimColor>Total Logs: {logsWithData.length}</Text>
			</Box>

			<Box flexDirection="column" marginBottom={1}>
				<Text bold>Token distribution by type:</Text>
				{Object.entries(tokensByType)
					.sort((a, b) => b[1] - a[1])
					.map(([type, tokens]) => (
						<Text key={type} dimColor>
							{type}: {tokens.toLocaleString()} (
							{((tokens / totalTokens) * 100).toFixed(1)}%)
						</Text>
					))}
			</Box>

			<Text bold>Histogram:</Text>
			<Histogram
				x={x}
				y={y}
				width={80}
				height={12}
				xMin={minTime}
				xMax={maxTime}
				color="cyan"
			/>

			<Box marginTop={1} justifyContent="space-between" width={80}>
				<Text dimColor>{formatTime(startDate)}</Text>
				<Text dimColor>{formatTime(endDate)}</Text>
			</Box>

			<Text> </Text>
			<Text dimColor>
				Each bar represents a time bin. Height shows total token usage in that
				period.
			</Text>
		</Box>
	);
}

render(<TokenHistogram />);
