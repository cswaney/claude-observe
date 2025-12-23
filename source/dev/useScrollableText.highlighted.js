#!/usr/bin/env node
import React, {useState, useMemo} from 'react';
import {render, Box, Text, useInput} from 'ink';
import {TitledBox} from '@mishieck/ink-titled-box';
import {useScrollableText} from '../hooks/useScrollableText.js';

// Copy of HighlightedJSON component from Details
function HighlightedJSON({line}) {
	const tokens = [];
	let currentIndex = 0;

	const patterns = [
		{regex: /"([^"\\]|\\.)*"\s*:/, type: 'key'},
		{regex: /"([^"\\]|\\.)*"/, type: 'string'},
		{regex: /\b(true|false|null)\b/, type: 'keyword'},
		{regex: /-?\d+\.?\d*/, type: 'number'},
		{regex: /[{}[\],:]/, type: 'punctuation'},
	];

	while (currentIndex < line.length) {
		let matched = false;

		for (const pattern of patterns) {
			const regex = new RegExp(`^${pattern.regex.source}`);
			const match = line.slice(currentIndex).match(regex);

			if (match) {
				const text = match[0];
				tokens.push({text, type: pattern.type});
				currentIndex += text.length;
				matched = true;
				break;
			}
		}

		if (!matched) {
			tokens.push({text: line[currentIndex], type: 'plain'});
			currentIndex++;
		}
	}

	return (
		<Text>
			{tokens.map((token, idx) => {
				const key = `${token.type}-${idx}`;
				switch (token.type) {
					case 'key': {
						return (
							<Text key={key} color="cyan">
								{token.text}
							</Text>
						);
					}

					case 'string': {
						return (
							<Text key={key} color="green">
								{token.text}
							</Text>
						);
					}

					case 'keyword': {
						return (
							<Text key={key} color="magenta">
								{token.text}
							</Text>
						);
					}

					case 'number': {
						return (
							<Text key={key} color="yellow">
								{token.text}
							</Text>
						);
					}

					case 'punctuation': {
						return (
							<Text key={key} dimColor>
								{token.text}
							</Text>
						);
					}

					default: {
						return <Text key={key}>{token.text}</Text>;
					}
				}
			})}
		</Text>
	);
}

// Sample JSON with tabs (will be expanded)
const jsonWithTabs = `{
	"name": "Tab Expansion Demo",
	"nested": {
		"key": "This is a very long value that will wrap in the terminal when the available width is narrow enough to cause text wrapping behavior"
	},
	"array": [
		1,
		2,
		3
	],
	"done": true
}`;

function HighlightedScrollableDemo() {
	const [scrollOffset, setScrollOffset] = useState(0);
	const [tabSize, setTabSize] = useState(2); // 2 or 4 spaces
	const terminalWidth = Math.min(process.stdout.columns || 80, 80);
	const viewportHeight = 12;

	// IMPORTANT: Preprocess text to expand tabs
	// This affects BOTH the content AND the length calculations
	const processedText = useMemo(() => {
		const spaces = ' '.repeat(tabSize);
		return jsonWithTabs.replace(/\t/g, spaces);
	}, [tabSize]);

	// Use the hook with preprocessed text
	const viewport = useScrollableText({
		text: processedText,
		scrollOffset,
		height: viewportHeight,
		width: terminalWidth,
	});

	useInput((input, key) => {
		if (key.upArrow) {
			setScrollOffset(previous => Math.max(0, previous - 1));
		} else if (key.downArrow) {
			setScrollOffset(previous =>
				Math.min(viewport.maxScrollOffset, previous + 1),
			);
		} else
			switch (input) {
				case 'u': {
					setScrollOffset(previous => Math.max(0, previous - 5));

					break;
				}

				case 'd': {
					setScrollOffset(previous =>
						Math.min(viewport.maxScrollOffset, previous + 5),
					);

					break;
				}

				case 't': {
					setScrollOffset(0);

					break;
				}

				case 'b': {
					setScrollOffset(viewport.maxScrollOffset);

					break;
				}

				case '2': {
					setTabSize(2);
					setScrollOffset(0);

					break;
				}

				case '4': {
					setTabSize(4);
					setScrollOffset(0);

					break;
				}

				case 'q': {
					process.exit(0);

					break;
				}
				// No default
			}
	});

	return (
		<Box flexDirection="column" padding={1}>
			<Text bold color="cyan">
				Syntax Highlighted Scrollable Text Demo
			</Text>
			<Text dimColor>
				Tab size: {tabSize} spaces (press 2/4 to change) | Width:{' '}
				{terminalWidth} | Height: {viewportHeight}
			</Text>
			<Text> </Text>

			<TitledBox
				flexDirection="column"
				titles={['JSON with Syntax Highlighting']}
				borderStyle="single"
				borderColor="green"
				padding={1}
				width={terminalWidth - 4}
			>
				{/* Scroll indicator - above */}
				{viewport.hasLinesAbove && (
					<Box height={1}>
						<Text dimColor>
							↑ {viewport.rowsAbove} rows above (scroll up to see)
						</Text>
					</Box>
				)}

				{/* Visible content with syntax highlighting */}
				{viewport.visibleLines.map((line, idx) => (
					<Box key={idx}>
						<Box width={4}>
							<Text dimColor>[{viewport.startLineIndex + idx}]</Text>
						</Box>
						<HighlightedJSON line={line} />
					</Box>
				))}

				{/* Scroll indicator - below */}
				{viewport.hasLinesBelow && (
					<Box height={1}>
						<Text dimColor>
							↓ {viewport.rowsBelow} rows below (scroll down to see)
						</Text>
					</Box>
				)}
			</TitledBox>

			{/* Status */}
			<Box marginTop={1}>
				<Text dimColor>
					Position: {scrollOffset}/{viewport.maxScrollOffset} | Lines:{' '}
					{viewport.startLineIndex}-{viewport.endLineIndex}/
					{viewport.totalLines - 1}
				</Text>
			</Box>

			{/* Key insight */}
			<Box marginTop={1} flexDirection="column">
				<Text bold color="yellow">
					Key Insight:
				</Text>
				<Text>
					• Tabs expanded to {tabSize} spaces BEFORE calculating line heights
				</Text>
				<Text>
					• Line 4 length with tab=2: ~
					{processedText.split('\n')[3]?.length || 0} chars
				</Text>
				<Text>• Line 4 length with tab=4: would be ~2 chars longer</Text>
				<Text>• This affects wrapping calculations and viewport!</Text>
			</Box>

			{/* Controls */}
			<Box marginTop={1}>
				<Text dimColor>
					↑/↓: Scroll | u/d: Page | t/b: Top/Bottom | 2/4: Tab size | q: Quit
				</Text>
			</Box>
		</Box>
	);
}

render(<HighlightedScrollableDemo />);
