#!/usr/bin/env node
import React from 'react';
import {render, Box, Text} from 'ink';
import {BarChart, Histogram} from './Chart.js';

function ChartDemo() {
	// Example 1: Simple BarChart with predefined data
	// Data values should be in range [0, height * 8]
	const barData = [
		0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 36, 32, 28, 24, 20, 16, 12, 8, 4,
	];

	// Example 2: Histogram with random uniform distribution
	const n1 = 10_000;
	const uniformX = Array.from({length: n1}, () => Math.random());
	const uniformY = Array.from({length: n1}, () => 1);

	// Example 3: Histogram with normal-ish distribution (using Box-Muller transform)
	const n2 = 10_000;
	const normalX = [];
	for (let i = 0; i < n2; i++) {
		const u1 = Math.random();
		const u2 = Math.random();
		const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
		normalX.push(z0);
	}

	const normalY = Array.from({length: n2}, () => 1);

	// Example 4: Weighted histogram
	const n3 = 1000;
	const weightedX = Array.from({length: n3}, () => Math.random());
	const weightedY = Array.from(
		{length: n3},
		() => Math.floor(Math.random() * 10) + 1,
	);

	return (
		<Box flexDirection="column" padding={1}>
			<Text bold>Chart Component Demos</Text>
			<Text> </Text>

			<Box flexDirection="column" marginBottom={1}>
				<Text bold color="cyan">
					1. BarChart - Parabolic curve
				</Text>
				<BarChart data={barData} height={5} color="cyan" />
			</Box>

			<Box flexDirection="column" marginBottom={1}>
				<Text bold color="green">
					2. Histogram - Uniform distribution [0, 1]
				</Text>
				<Histogram
					x={uniformX}
					y={uniformY}
					width={40}
					height={8}
					xMin={0}
					xMax={1}
					color="green"
				/>
			</Box>

			<Box flexDirection="column" marginBottom={1}>
				<Text bold color="magenta">
					3. Histogram - Normal distribution
				</Text>
				<Histogram
					x={normalX}
					y={normalY}
					width={40}
					height={8}
					xMin={-4}
					xMax={4}
					color="magenta"
				/>
			</Box>

			<Box flexDirection="column" marginBottom={1}>
				<Text bold color="yellow">
					4. Histogram - Weighted random data
				</Text>
				<Histogram
					x={weightedX}
					y={weightedY}
					width={40}
					height={8}
					xMin={0}
					xMax={1}
					color="yellow"
				/>
			</Box>
		</Box>
	);
}

render(<ChartDemo />);
