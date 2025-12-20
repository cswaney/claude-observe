#!/usr/bin/env node
import React, { useState } from 'react';
import { render, Box, Text, useInput } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';
import { useScrollableText } from './useScrollableText.js';

// Sample JSON content with varying line lengths
const sampleJSON = `{
  "name": "useScrollableText Demo",
  "short": "value",
  "very_long_key_with_very_long_value": "This is a very long string that would definitely wrap in a narrow terminal window when displayed because it exceeds the typical line width and continues for quite some time to demonstrate wrapping behavior",
  "another": "value",
  "nested": {
    "key1": "value1",
    "key2": "value2 that is also somewhat long and might wrap depending on the terminal width available in the current display context",
    "deep": {
      "level3": "nested value"
    }
  },
  "array": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  "boolean": true,
  "null_value": null,
  "empty_string": "",
  "description": "This demonstrates how the useScrollableText hook handles JSON content with various line lengths, including very long lines that wrap across multiple rows in the terminal display",
  "done": true
}`;

function ScrollableTextDemo() {
	const [scrollOffset, setScrollOffset] = useState(0);
	const terminalWidth = process.stdout.columns || 80;
	const viewportHeight = 15;

	// Use the hook
	const viewport = useScrollableText({
		text: sampleJSON,
		scrollOffset,
		height: viewportHeight,
		width: terminalWidth,
	});

	// Handle keyboard input
	useInput((input, key) => {
		if (key.upArrow) {
			setScrollOffset((prev) => Math.max(0, prev - 1));
		} else if (key.downArrow) {
			setScrollOffset((prev) =>
				Math.min(viewport.maxScrollOffset, prev + 1),
			);
		} else if (input === 'u') {
			setScrollOffset((prev) => Math.max(0, prev - 5));
		} else if (input === 'd') {
			setScrollOffset((prev) =>
				Math.min(viewport.maxScrollOffset, prev + 5),
			);
		} else if (input === 't') {
			setScrollOffset(0);
		} else if (input === 'b') {
			setScrollOffset(viewport.maxScrollOffset);
		} else if (input === 'q') {
			process.exit(0);
		}
	});

	return (
		<Box flexDirection="column" padding={1}>
			<Text bold color="cyan">
				useScrollableText Hook - Interactive Demo
			</Text>
			<Text dimColor>
				Terminal width: {terminalWidth} | Viewport height:{' '}
				{viewportHeight}
			</Text>
			<Text> </Text>

			<TitledBox
				flexDirection="column"
				titles={['Scrollable Content']}
				borderStyle="single"
				borderColor="green"
				padding={1}
				width={terminalWidth - 4}
				height={viewportHeight + 4}
			>
				{/* Scroll indicator - above */}
				{viewport.hasLinesAbove && (
					<Box height={1}>
						<Text dimColor>
							... {viewport.rowsAbove} rows above ...
						</Text>
					</Box>
				)}

				{/* Visible content */}
				{viewport.visibleLines.map((line, idx) => (
					<Box key={idx}>
						<Box width={6}>
							<Text dimColor>
								[{viewport.startLineIndex + idx}]
							</Text>
						</Box>
						<Text>{line}</Text>
					</Box>
				))}

				{/* Scroll indicator - below */}
				{viewport.hasLinesBelow && (
					<Box height={1}>
						<Text dimColor>
							... {viewport.rowsBelow} rows below ...
						</Text>
					</Box>
				)}
			</TitledBox>

			{/* Status bar */}
			<Box marginTop={1}>
				<Text dimColor>
					Scroll: {scrollOffset}/{viewport.maxScrollOffset} | Lines:{' '}
					{viewport.startLineIndex}-{viewport.endLineIndex}/
					{viewport.totalLines - 1} | Above: {viewport.rowsAbove} |
					Below: {viewport.rowsBelow}
				</Text>
			</Box>

			{/* Controls */}
			<Box marginTop={1}>
				<Text dimColor>
					↑/↓: Scroll line | u/d: Scroll page | t/b: Top/Bottom | q:
					Quit
				</Text>
			</Box>
		</Box>
	);
}

render(<ScrollableTextDemo />);
