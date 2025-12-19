#!/usr/bin/env node
import React from 'react';
import { render, Box, Text } from 'ink';
import ScrollableList from './source/components/ScrollableList.js';

/**
 * Simple non-interactive test demonstrating ScrollableList features
 */

function SimpleTest() {
	// Test data
	const items = Array.from({ length: 30 }, (_, i) => ({
		id: i,
		title: `Row ${i + 1}`,
	}));

	// Custom render function
	const renderItem = (item, index, isSelected) => {
		return (
			<Text bold={isSelected} color={isSelected ? '#3498db' : 'white'}>
				{isSelected ? '> ' : '  '}[{index}] {item.title}
			</Text>
		);
	};

	return (
		<Box flexDirection="column" padding={1} gap={1}>
			<Text bold color="#2ecc71">ScrollableList Component Tests</Text>

			{/* Test 1: Selected at top */}
			<Box flexDirection="column">
				<Text bold>Test 1: Selected at top (index 0)</Text>
				<Box borderStyle="single" borderColor="gray" padding={1}>
					<ScrollableList
						items={items}
						selectedIndex={0}
						height={8}
						renderItem={renderItem}
					/>
				</Box>
			</Box>

			{/* Test 2: Selected in middle (centered) */}
			<Box flexDirection="column">
				<Text bold>Test 2: Selected in middle (index 15, centered)</Text>
				<Box borderStyle="single" borderColor="gray" padding={1}>
					<ScrollableList
						items={items}
						selectedIndex={15}
						height={8}
						renderItem={renderItem}
					/>
				</Box>
			</Box>

			{/* Test 3: Selected at bottom */}
			<Box flexDirection="column">
				<Text bold>Test 3: Selected at bottom (index 29)</Text>
				<Box borderStyle="single" borderColor="gray" padding={1}>
					<ScrollableList
						items={items}
						selectedIndex={29}
						height={8}
						renderItem={renderItem}
					/>
				</Box>
			</Box>

			{/* Test 4: Small viewport */}
			<Box flexDirection="column">
				<Text bold>Test 4: Small viewport (height 3, selected index 10)</Text>
				<Box borderStyle="single" borderColor="gray" padding={1}>
					<ScrollableList
						items={items}
						selectedIndex={10}
						height={3}
						renderItem={renderItem}
					/>
				</Box>
			</Box>
		</Box>
	);
}

const { unmount, waitUntilExit } = render(<SimpleTest />);

// Exit after displaying
setTimeout(() => {
	unmount();
	process.exit(0);
}, 100);
