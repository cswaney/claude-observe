#!/usr/bin/env node
import React from 'react';
import { render, Box, Text } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';
import { useScrollableText } from './useScrollableText.js';

// Test content with a very long line
const testContent = `Line 1: Short
Line 2: This is a very long line that exceeds the terminal width and will wrap to multiple rows when displayed in a narrow terminal window
Line 3: Medium length
Line 4: Short
Line 5: Another very long line that demonstrates how wrapping affects viewport calculations and how many lines can fit in the available space when some lines take multiple rows`;

function ComparisonDemo() {
	const width = 60; // Simulate narrow terminal
	const height = 8;
	const scrollOffset = 0;

	// With wrapping support (our hook)
	const withWrapping = useScrollableText({
		text: testContent,
		scrollOffset,
		height,
		width,
	});

	// Without wrapping support (old approach)
	const lines = testContent.split('\n');
	const withoutWrapping = {
		visibleLines: lines.slice(scrollOffset, scrollOffset + height),
		totalLines: lines.length,
		hasLinesAbove: scrollOffset > 0,
		hasLinesBelow: scrollOffset + height < lines.length,
	};

	return (
		<Box flexDirection="column" padding={1}>
			<Text bold color="cyan">
				Wrapping Comparison Demo
			</Text>
			<Text dimColor>Width: {width} | Height: {height}</Text>
			<Text> </Text>

			{/* Side by side comparison */}
			<Box>
				{/* Left: With wrapping */}
				<Box flexDirection="column" marginRight={2}>
					<TitledBox
						flexDirection="column"
						titles={['WITH Wrapping Support ✓']}
						borderStyle="single"
						borderColor="green"
						padding={1}
						width={width}
					>
						<Text dimColor>
							Visible lines: {withWrapping.startLineIndex}-
							{withWrapping.endLineIndex} of{' '}
							{withWrapping.totalLines - 1}
						</Text>
						<Text dimColor>
							Rows above: {withWrapping.rowsAbove} | Below:{' '}
							{withWrapping.rowsBelow}
						</Text>
						<Text> </Text>
						{withWrapping.visibleLines.map((line, idx) => (
							<Box key={idx}>
								<Text dimColor>
									[{withWrapping.startLineIndex + idx}]
								</Text>
								<Text> {line.substring(0, 45)}...</Text>
							</Box>
						))}
					</TitledBox>
				</Box>

				{/* Right: Without wrapping */}
				<Box flexDirection="column">
					<TitledBox
						flexDirection="column"
						titles={['WITHOUT Wrapping Support ✗']}
						borderStyle="single"
						borderColor="red"
						padding={1}
						width={width}
					>
						<Text dimColor>
							Visible lines: {scrollOffset}-
							{scrollOffset + withoutWrapping.visibleLines.length - 1}{' '}
							of {withoutWrapping.totalLines - 1}
						</Text>
						<Text dimColor color="red">
							⚠️ Assumes 1 line = 1 row (incorrect!)
						</Text>
						<Text> </Text>
						{withoutWrapping.visibleLines.map((line, idx) => (
							<Box key={idx}>
								<Text dimColor>[{scrollOffset + idx}]</Text>
								<Text> {line.substring(0, 45)}...</Text>
							</Box>
						))}
					</TitledBox>
				</Box>
			</Box>

			{/* Explanation */}
			<Box marginTop={1} flexDirection="column">
				<Text bold>Key Differences:</Text>
				<Text>
					• <Text color="green">With wrapping:</Text> Correctly
					calculates that line 2 takes ~3 rows
				</Text>
				<Text>
					  Shows fewer lines but accurately fills viewport height
				</Text>
				<Text>
					• <Text color="red">Without wrapping:</Text> Assumes all lines
					take 1 row
				</Text>
				<Text>
					  Would overflow viewport when long lines wrap, causing visual
					glitches
				</Text>
				<Text> </Text>
				<Text dimColor>
					Line lengths: [13, 142, 18, 10, 153] chars
				</Text>
				<Text dimColor>
					Actual row heights at width=60: [1, 3, 1, 1, 3] rows
				</Text>
			</Box>
		</Box>
	);
}

render(<ComparisonDemo />);
