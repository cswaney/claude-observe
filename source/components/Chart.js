import React from 'react';
import {Box, Text} from 'ink';

/**
 * A textual histogram component for Ink.js
 *
 * Creates a histogram representing y-weighted counts of x values.
 * The height of bars equals the sum of y[i] for each x[i] in the bar's bin.
 * For a standard histogram of x values, use y = ones(len(x)).
 *
 * - x-values are binned to a length-width grid [xMin - xTol, ..., xMax + xTol]
 * - y-values are binned to a length-(nbars * height + 1) grid [yMin - yTol, ..., yMax + yTol]
 *
 * @param {Object} props
 * @param {number[]} props.x - Array of x-values to plot
 * @param {number[]} props.y - Array of y-values to plot (weights for each x)
 * @param {number} props.width - Number of columns/bins to use
 * @param {number} props.height - Number of rows to use
 * @param {number} [props.xMin] - Minimum x value (defaults to min of x)
 * @param {number} [props.xMax] - Maximum x value (defaults to max of x)
 * @param {number} [props.yMin] - Minimum y value for scaling (defaults to 0)
 * @param {number} [props.yMax] - Maximum y value for scaling (defaults to max of binned data)
 * @param {string} [props.color] - Optional color for the bars
 */
export function Histogram({
	x,
	y,
	width,
	height,
	xMin,
	xMax,
	yMin,
	yMax,
	color,
}) {
	const bars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
	const nbars = bars.length;

	// Calculate binned data
	const calculateData = () => {
		const actualXMin = xMin !== undefined ? xMin : Math.min(...x);
		const actualXMax = xMax !== undefined ? xMax : Math.max(...x);
		const xStep = (actualXMax - actualXMin) / width;

		// Initialize bins
		const data = Array(width).fill(0);

		// Bin x values and accumulate y values
		x.forEach((value, xIndex) => {
			let dIndex = Math.floor((value - actualXMin) / xStep);
			if (dIndex === width) {
				dIndex -= 1;
			}
			if (dIndex >= 0 && dIndex < width) {
				data[dIndex] += y[xIndex];
			}
		});

		// Calculate y scaling
		const actualYMin = yMin !== undefined ? yMin : 0;
		const actualYMax = yMax !== undefined ? yMax : Math.max(...data);
		const yStep = (actualYMax - actualYMin) / (height * nbars);

		// Scale data to chart height
		const scaledData = data.map(value =>
			Math.floor((value - actualYMin) / yStep),
		);

		return scaledData;
	};

	const chartData = calculateData();

	return <BarChart data={chartData} height={height} color={color} />;
}

/**
 * A textual bar chart component for Ink.js
 *
 * Renders data as a vertical bar chart using Unicode block characters.
 * Data values should be integers from 0 to height * nbars, where nbars is 8 (the number of block characters).
 *
 * @param {Object} props
 * @param {number[]} props.data - Array of integer values to plot
 * @param {number} props.height - Number of rows to use for the chart
 * @param {string} [props.color] - Optional color for the bars
 */
function BarChart({data, height, color}) {
	const bars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
	const nbars = bars.length;

	const renderRow = (rowIndex, data) => {
		const minY = rowIndex * nbars;
		const maxY = (rowIndex + 1) * nbars;

		return data
			.map((value, idx) => {
				let char;
				if (value >= maxY) {
					char = bars[nbars - 1];
				} else if (value > minY) {
					char = bars[(value % nbars) - 1];
				} else if (rowIndex === 0) {
					char = bars[0];
				} else {
					char = ' ';
				}
				return char;
			})
			.join('');
	};

	const rows = [];
	for (let rowIndex = height; rowIndex >= 0; rowIndex--) {
		rows.push(
			<Text key={rowIndex} color={color}>
				{renderRow(rowIndex, data)}
			</Text>,
		);
	}

	return <Box flexDirection="column">{rows}</Box>;
}
