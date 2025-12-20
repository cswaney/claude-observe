#!/usr/bin/env node
import React, {useState, useEffect} from 'react';
import {render, Box, Text} from 'ink';
import {TitledBox} from '@mishieck/ink-titled-box';
import {Histogram} from './source/components/Chart.js';
import {parseLogFile} from './source/parser.js';

function LiveActivityChart() {
	const sessionPath =
		'/Users/colinswaney/.claude/projects/-Users-colinswaney-Desktop-claude-observe/7e462c02-4cf8-4535-8d32-6e6242eaab26.jsonl';

	const [progress, setProgress] = useState(0);
	const [isComplete, setIsComplete] = useState(false);

	// Load logs once
	const logs = parseLogFile(sessionPath);
	const logsWithData = logs.filter(log => log.raw.timestamp && log.usage > 0);

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
	const spanMultipleDays = startDate.toDateString() !== endDate.toDateString();

	const formatTimeLabel = date => {
		const time = date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
		});

		if (spanMultipleDays) {
			const dateStr = date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
			});
			return `${dateStr} ${time}`;
		}

		return time;
	};

	// Separate data by type
	const logTypes = [
		{name: 'assistant', color: '#2ecc71', label: 'Assistant'},
		{name: 'tool_use', color: '#3498db', label: 'Tool Use'},
		{name: 'thinking', color: '#9b59b6', label: 'Thinking'},
	];

	// Filter data up to current progress (0-100%)
	const progressTime = minTime + (maxTime - minTime) * (progress / 100);
	const filteredLogs = logsWithData.filter(log => {
		const timestamp = new Date(log.raw.timestamp).getTime() / 1000;
		return timestamp <= progressTime;
	});

	const dataByType = logTypes.map(({name}) => {
		const filtered = filteredLogs.filter(log => log.type === name);
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

	// Chart dimensions
	const width = 120;
	const boxWidth = width;
	const chartWidth = width - 4;
	const chartHeight = 3;

	// Animation effect
	useEffect(() => {
		if (progress >= 100) {
			setIsComplete(true);
			return;
		}

		const timer = setInterval(() => {
			setProgress(prev => {
				const next = prev + 2; // Increment by 2% each step
				return next > 100 ? 100 : next;
			});
		}, 150); // Update every 50ms

		return () => clearInterval(timer);
	}, [progress]);

	// Calculate current time position - use progressTime as the end time
	const currentEndDate = new Date(progressTime * 1000);
	const currentDuration = progressTime - minTime;
	const currentDurationMinutes = currentDuration / 60;

	return (
		<Box flexDirection="column" padding={1}>
			<Box flexDirection="column" marginBottom={1}>
				<Text bold color={isComplete ? 'green' : 'gray'}>
					{isComplete ? '✓ Session Complete' : '⟳ Loading Session Data...'}
				</Text>
				<Text dimColor>
					Duration: {Math.floor(currentDurationMinutes)} minutes
				</Text>
				<Text dimColor>Tokens Loaded: {totalTokens.toLocaleString()}</Text>
				<Text dimColor>Progress: {progress.toFixed(0)}%</Text>
			</Box>

			<TitledBox
				borderStyle="single"
				borderColor="gray"
				padding={1}
				paddingBottom={0}
				titles={['Live Activity Stream']}
				width={boxWidth}
			>
				<Box flexDirection="column" marginTop={-1}>
					{/* Chart histograms - always fill width using current progress time as end */}
					{logTypes.map(({name, color, label}, idx) => {
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
										xMax={progressTime}
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

					{/* Time axis and legend */}
					<Box marginTop={1} justifyContent="space-between" width={chartWidth}>
						<Text dimColor>{formatTimeLabel(startDate)}</Text>

						{/* Legend - always visible with updating percentages */}
						<Box gap={3}>
							{logTypes.map(({name, color, label}, idx) => {
								const data = dataByType[idx];
								const percentage =
									totalTokens > 0
										? ((data.totalTokens / totalTokens) * 100).toFixed(1)
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

						<Text dimColor>{formatTimeLabel(currentEndDate)}</Text>
					</Box>
				</Box>
			</TitledBox>
		</Box>
	);
}

render(<LiveActivityChart />);
