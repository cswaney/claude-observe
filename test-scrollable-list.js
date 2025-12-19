#!/usr/bin/env node
import React, { useState } from 'react';
import { render, Box, Text, useInput } from 'ink';
import ScrollableList from './source/components/ScrollableList.js';

/**
 * Test application for ScrollableList component
 *
 * Features tested:
 * - Basic scrolling with arrow keys
 * - Centering selected item
 * - Overflow indicators
 * - Variable height items
 * - Different viewport sizes
 */

function TestApp() {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [viewportHeight, setViewportHeight] = useState(10);

	// Generate test data
	const items = Array.from({ length: 50 }, (_, i) => ({
		id: i,
		title: `Item ${i + 1}`,
		description: `This is item number ${i + 1} with some additional content`,
	}));

	// Handle keyboard input
	useInput((input, key) => {
		if (key.upArrow) {
			setSelectedIndex(prev => Math.max(0, prev - 1));
		} else if (key.downArrow) {
			setSelectedIndex(prev => Math.min(items.length - 1, prev + 1));
		} else if (input === '+') {
			setViewportHeight(prev => prev + 1);
		} else if (input === '-') {
			setViewportHeight(prev => Math.max(3, prev - 1));
		} else if (key.return) {
			process.exit(0);
		}
	});

	// Custom render function for each item
	const renderItem = (item, index, isSelected) => {
		return (
			<Box flexDirection="column">
				<Text bold={isSelected} color={isSelected ? '#3498db' : 'white'}>
					{isSelected ? '> ' : '  '}[{item.id}] {item.title}
				</Text>
				{isSelected && (
					<Text dimColor>    {item.description}</Text>
				)}
			</Box>
		);
	};

	// Get item height (selected items are taller)
	const getItemHeight = (item, index) => {
		return index === selectedIndex ? 2 : 1;
	};

	return (
		<Box flexDirection="column" padding={1}>
			<Text bold color="#2ecc71">
				ScrollableList Test Application
			</Text>
			<Text dimColor>
				Use ↑/↓ to navigate, +/- to change viewport height, Enter to exit
			</Text>
			<Text dimColor>
				Current: Item {selectedIndex + 1}/{items.length} | Viewport: {viewportHeight} rows
			</Text>
			<Box marginTop={1} borderStyle="single" borderColor="gray" padding={1}>
				<ScrollableList
					items={items}
					selectedIndex={selectedIndex}
					height={viewportHeight}
					renderItem={renderItem}
					getItemHeight={getItemHeight}
					centerSelected={true}
					showOverflowIndicators={true}
				/>
			</Box>
		</Box>
	);
}

render(<TestApp />);
