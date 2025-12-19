#!/usr/bin/env node
import React from 'react';
import { render, Box, Text } from 'ink';
import ControlledScrollableList from './source/components/ControlledScrollableList.js';
import { calculateViewport } from './source/utils/calculateViewport.js';

/**
 * Test demonstrating the controlled ScrollableList component
 * with the calculateViewport helper function
 */

function ControlledListTest() {
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
			<Text bold color="#2ecc71">Controlled ScrollableList Tests</Text>

			{/* Test 1: Selected at top */}
			<Box flexDirection="column">
				<Text bold>Test 1: Parent controls viewport (selected at top)</Text>
				{(() => {
					const viewport = calculateViewport({
						items,
						selectedIndex: 0,
						height: 8,
					});
					return (
						<Box borderStyle="single" borderColor="gray" padding={1}>
							<ControlledScrollableList
								items={viewport.visibleItems}
								startIndex={viewport.startIndex}
								selectedIndex={0}
								renderItem={renderItem}
								rowsAbove={viewport.rowsAbove}
								rowsBelow={viewport.rowsBelow}
							/>
						</Box>
					);
				})()}
			</Box>

			{/* Test 2: Selected in middle (centered) */}
			<Box flexDirection="column">
				<Text bold>Test 2: Parent controls viewport (centered at index 15)</Text>
				{(() => {
					const viewport = calculateViewport({
						items,
						selectedIndex: 15,
						height: 8,
						centerSelected: true,
					});
					return (
						<Box borderStyle="single" borderColor="gray" padding={1}>
							<ControlledScrollableList
								items={viewport.visibleItems}
								startIndex={viewport.startIndex}
								selectedIndex={15}
								renderItem={renderItem}
								rowsAbove={viewport.rowsAbove}
								rowsBelow={viewport.rowsBelow}
							/>
						</Box>
					);
				})()}
			</Box>

			{/* Test 3: Variable height items */}
			<Box flexDirection="column">
				<Text bold>Test 3: Variable height items (selected at index 5)</Text>
				{(() => {
					// Custom height function - selected items are taller
					const getItemHeight = (item, index) => (index === 5 ? 2 : 1);

					const viewport = calculateViewport({
						items,
						selectedIndex: 5,
						height: 10,
						getItemHeight,
					});

					// Custom renderer that shows 2 lines for selected item
					const renderVariableItem = (item, index, isSelected) => {
						return (
							<Box flexDirection="column">
								<Text bold={isSelected} color={isSelected ? '#3498db' : 'white'}>
									{isSelected ? '> ' : '  '}[{index}] {item.title}
								</Text>
								{isSelected && (
									<Text dimColor>    (This item has 2 lines)</Text>
								)}
							</Box>
						);
					};

					return (
						<Box borderStyle="single" borderColor="gray" padding={1}>
							<ControlledScrollableList
								items={viewport.visibleItems}
								startIndex={viewport.startIndex}
								selectedIndex={5}
								renderItem={renderVariableItem}
								rowsAbove={viewport.rowsAbove}
								rowsBelow={viewport.rowsBelow}
							/>
						</Box>
					);
				})()}
			</Box>

			<Text dimColor>
				The parent component uses calculateViewport() to control what's displayed.
			</Text>
		</Box>
	);
}

const { unmount } = render(<ControlledListTest />);

// Exit after displaying
setTimeout(() => {
	unmount();
	process.exit(0);
}, 100);
