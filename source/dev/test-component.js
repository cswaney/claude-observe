#!/usr/bin/env node
import React from 'react';
import {render, Box, Text} from 'ink';

/**
 * Quick Test Harness for Ink Components
 *
 * Usage:
 * 1. Import or paste your component below
 * 2. Render it in the TestHarness component
 * 3. Run: node test-component.js
 */

// ============================================================================
// PASTE YOUR TEST COMPONENT HERE
// ============================================================================

function ExampleComponent({message = 'Hello, Ink!'}) {
	return (
		<Box
			flexDirection="column"
			padding={1}
			borderStyle="round"
			borderColor="cyan"
		>
			<Text bold color="green">
				Test Component
			</Text>
			<Text>{message}</Text>
		</Box>
	);
}

// ============================================================================
// TEST HARNESS - Configure your test setup below
// ============================================================================

function TestHarness() {
	// Configure test data/props here
	const testProps = {
		message: 'This is a test message!',
	};

	return (
		<Box flexDirection="column" padding={1}>
			<Box marginBottom={1}>
				<Text dimColor>{'='.repeat(80)}</Text>
			</Box>

			<Box marginBottom={1}>
				<Text bold color="yellow">
					Component Test Harness
				</Text>
			</Box>

			{/* Your component renders here */}
			<ExampleComponent {...testProps} />

			<Box marginTop={1}>
				<Text dimColor>{'='.repeat(80)}</Text>
			</Box>
		</Box>
	);
}

// ============================================================================
// RENDER
// ============================================================================

const {unmount, waitUntilExit} = render(<TestHarness />);

// Auto-exit after render (useful for static components)
// Comment out if you want interactive components
// setTimeout(() => {
// 	unmount();
// 	process.exit(0);
// }, 100);

// Cleanup on exit
await waitUntilExit();
