#!/usr/bin/env node
import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';

/**
 * Advanced Test Harness for Ink Components
 *
 * Features:
 * - Multiple test cases
 * - Terminal size info
 * - Keyboard controls (q to quit, n for next test)
 * - Props inspector
 *
 * Usage:
 * 1. Import or paste your component below
 * 2. Add test cases to the TEST_CASES array
 * 3. Run: node test-component-advanced.js
 */

// ============================================================================
// PASTE YOUR TEST COMPONENT HERE
// ============================================================================

import { TitledBox } from '@mishieck/ink-titled-box';

function ExampleComponent({ title = 'Example', width = 40, color = 'cyan' }) {
	return (
		<TitledBox
			borderStyle="single"
			borderColor={color}
			titles={[title]}
			padding={1}
			width={width}
		>
			<Box flexDirection="column">
				<Text>This is an example component</Text>
				<Text dimColor>Width: {width}</Text>
				<Text dimColor>Color: {color}</Text>
			</Box>
		</TitledBox>
	);
}

// ============================================================================
// TEST CASES - Add your test scenarios here
// ============================================================================

const TEST_CASES = [
	{
		name: 'Default Props',
		description: 'Component with default props',
		props: {}
	},
	{
		name: 'Custom Title',
		description: 'Component with custom title',
		props: {
			title: 'My Custom Title',
			color: 'green'
		}
	},
	{
		name: 'Wide Layout',
		description: 'Component with wider width',
		props: {
			title: 'Wide Component',
			width: 60,
			color: 'magenta'
		}
	},
	{
		name: 'Narrow Layout',
		description: 'Component with narrow width',
		props: {
			title: 'Narrow',
			width: 25,
			color: 'yellow'
		}
	}
];

// ============================================================================
// TEST HARNESS IMPLEMENTATION
// ============================================================================

function TestHarness() {
	const [currentTestIndex, setCurrentTestIndex] = useState(0);
	const { exit } = useApp();

	const currentTest = TEST_CASES[currentTestIndex];

	useInput((input, key) => {
		if (input === 'q' || key.escape) {
			exit();
		} else if (input === 'n' || key.rightArrow) {
			setCurrentTestIndex((prev) => (prev + 1) % TEST_CASES.length);
		} else if (input === 'p' || key.leftArrow) {
			setCurrentTestIndex((prev) => (prev - 1 + TEST_CASES.length) % TEST_CASES.length);
		}
	});

	return (
		<Box flexDirection="column" padding={1}>
			{/* Header */}
			<Box borderStyle="double" borderColor="blue" padding={1} marginBottom={1}>
				<Box flexDirection="column">
					<Text bold color="cyan">Ink Component Test Harness</Text>
					<Box marginTop={1}>
						<Text dimColor>
							Test {currentTestIndex + 1} of {TEST_CASES.length} | Press 'n' for next, 'p' for previous, 'q' to quit
						</Text>
					</Box>
				</Box>
			</Box>

			{/* Test Case Info */}
			<Box flexDirection="column" marginBottom={1}>
				<Box>
					<Text color="yellow" bold>Test: </Text>
					<Text>{currentTest.name}</Text>
				</Box>
				<Box>
					<Text color="yellow" bold>Description: </Text>
					<Text dimColor>{currentTest.description}</Text>
				</Box>
			</Box>

			{/* Props Inspector */}
			<Box borderStyle="round" borderColor="gray" padding={1} marginBottom={1}>
				<Box flexDirection="column">
					<Text bold underline>Props:</Text>
					{Object.keys(currentTest.props).length === 0 ? (
						<Text dimColor>{'  (using defaults)'}</Text>
					) : (
						Object.entries(currentTest.props).map(([key, value]) => (
							<Box key={key}>
								<Text color="green">  {key}: </Text>
								<Text>{JSON.stringify(value)}</Text>
							</Box>
						))
					)}
				</Box>
			</Box>

			{/* Component Render Area */}
			<Box borderStyle="classic" borderColor="white" padding={1} marginBottom={1}>
				<ExampleComponent {...currentTest.props} />
			</Box>

			{/* Footer */}
			<Box justifyContent="space-between">
				<Text dimColor>Terminal size: {process.stdout.columns}x{process.stdout.rows}</Text>
				<Text dimColor>Node: {process.version}</Text>
			</Box>
		</Box>
	);
}

// ============================================================================
// RENDER
// ============================================================================

const { waitUntilExit } = render(<TestHarness />);
await waitUntilExit();
