#!/usr/bin/env node
import React, { useState } from 'react';
import { render, Box, Text, useInput } from 'ink';
import { TitledBox } from '@mishieck/ink-titled-box';
import { useScrollableList } from './source/hooks/useScrollableList.js';

/**
 * Example showing how to use useScrollableList hook with custom UI
 * This demonstrates the flexibility - you control ALL the rendering
 */

function SimpleListExample() {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const items = Array.from({ length: 30 }, (_, i) => ({
		id: i,
		title: `Item ${i + 1}`,
	}));

	const { visibleItems, startIndex, rowsAbove, rowsBelow } = useScrollableList({
		items,
		selectedIndex,
		height: 10,
	});

	useInput((input, key) => {
		if (key.upArrow) setSelectedIndex(i => Math.max(0, i - 1));
		if (key.downArrow) setSelectedIndex(i => Math.min(items.length - 1, i + 1));
	});

	return (
		<Box padding={1}>
			<TitledBox
				titles={['Simple List']}
				borderStyle="single"
				borderColor="gray"
				padding={1}
			>
				<Box flexDirection="column">
					{rowsAbove > 0 && (
						<Text dimColor>↑ {rowsAbove} more above</Text>
					)}
					{visibleItems.map((item, idx) => {
						const absoluteIndex = startIndex + idx;
						const isSelected = absoluteIndex === selectedIndex;
						return (
							<Text key={item.id} bold={isSelected} color={isSelected ? '#3498db' : 'white'}>
								{isSelected ? '▶ ' : '  '}{item.title}
							</Text>
						);
					})}
					{rowsBelow > 0 && (
						<Text dimColor>↓ {rowsBelow} more below</Text>
					)}
				</Box>
			</TitledBox>
		</Box>
	);
}

function CustomStyledListExample() {
	const [selectedIndex, setSelectedIndex] = useState(15);
	const items = Array.from({ length: 30 }, (_, i) => ({
		id: i,
		title: `Task ${i + 1}`,
		status: i % 3 === 0 ? 'done' : i % 3 === 1 ? 'pending' : 'failed',
	}));

	const { visibleItems, startIndex, rowsAbove, rowsBelow } = useScrollableList({
		items,
		selectedIndex,
		height: 8,
		centerSelected: true,
	});

	useInput((input, key) => {
		if (key.upArrow) setSelectedIndex(i => Math.max(0, i - 1));
		if (key.downArrow) setSelectedIndex(i => Math.min(items.length - 1, i + 1));
	});

	const getStatusColor = (status) => {
		switch (status) {
			case 'done': return '#2ecc71';
			case 'pending': return '#f1c40f';
			case 'failed': return '#e74c3c';
			default: return 'white';
		}
	};

	const getStatusIcon = (status) => {
		switch (status) {
			case 'done': return '✓';
			case 'pending': return '○';
			case 'failed': return '✗';
			default: return ' ';
		}
	};

	return (
		<Box padding={1}>
			<TitledBox
				titles={['Task List (Custom Styling)']}
				borderStyle="single"
				borderColor="gray"
				padding={1}
			>
				<Box flexDirection="column">
					{rowsAbove > 0 && (
						<Box>
							<Text color="#9b59b6">┈┈┈ </Text>
							<Text dimColor>{rowsAbove} tasks above</Text>
							<Text color="#9b59b6"> ┈┈┈</Text>
						</Box>
					)}
					{visibleItems.map((item, idx) => {
						const absoluteIndex = startIndex + idx;
						const isSelected = absoluteIndex === selectedIndex;
						return (
							<Box key={item.id}>
								<Text color={getStatusColor(item.status)}>
									{getStatusIcon(item.status)}
								</Text>
								<Text> </Text>
								<Text bold={isSelected} color={isSelected ? '#3498db' : 'white'}>
									{isSelected ? '▸ ' : '  '}{item.title}
								</Text>
								<Text dimColor> [{item.status}]</Text>
							</Box>
						);
					})}
					{rowsBelow > 0 && (
						<Box>
							<Text color="#9b59b6">┈┈┈ </Text>
							<Text dimColor>{rowsBelow} tasks below</Text>
							<Text color="#9b59b6"> ┈┈┈</Text>
						</Box>
					)}
				</Box>
			</TitledBox>
		</Box>
	);
}

function VariableHeightExample() {
	const [selectedIndex, setSelectedIndex] = useState(5);
	const items = Array.from({ length: 20 }, (_, i) => ({
		id: i,
		title: `Item ${i + 1}`,
		description: `This is a longer description for item ${i + 1}`,
	}));

	// Selected items show description, so they're taller
	const getItemHeight = (item, index) => {
		return index === selectedIndex ? 2 : 1;
	};

	const { visibleItems, startIndex, rowsAbove, rowsBelow } = useScrollableList({
		items,
		selectedIndex,
		height: 12,
		getItemHeight,
	});

	useInput((input, key) => {
		if (key.upArrow) setSelectedIndex(i => Math.max(0, i - 1));
		if (key.downArrow) setSelectedIndex(i => Math.min(items.length - 1, i + 1));
	});

	return (
		<Box padding={1}>
			<TitledBox
				titles={['Variable Height Items']}
				borderStyle="single"
				borderColor="gray"
				padding={1}
			>
				<Box flexDirection="column">
					{rowsAbove > 0 && (
						<Text dimColor>... {rowsAbove} items above ...</Text>
					)}
					{visibleItems.map((item, idx) => {
						const absoluteIndex = startIndex + idx;
						const isSelected = absoluteIndex === selectedIndex;
						return (
							<Box key={item.id} flexDirection="column">
								<Text bold={isSelected} color={isSelected ? '#2ecc71' : 'white'}>
									{isSelected ? '› ' : '  '}[{absoluteIndex}] {item.title}
								</Text>
								{isSelected && (
									<Text dimColor>    {item.description}</Text>
								)}
							</Box>
						);
					})}
					{rowsBelow > 0 && (
						<Text dimColor>... {rowsBelow} items below ...</Text>
					)}
				</Box>
			</TitledBox>
		</Box>
	);
}

function App() {
	return (
		<Box flexDirection="column">
			<Box>
				<Text bold color="#2ecc71">useScrollableList Hook Examples</Text>
			</Box>
			<Box marginTop={1}>
				<Text dimColor>Use ↑/↓ arrows to navigate • Press Ctrl+C to exit</Text>
			</Box>
			<Box marginTop={1} flexDirection="column" gap={1}>
				<SimpleListExample />
				<CustomStyledListExample />
				<VariableHeightExample />
			</Box>
			<Box marginTop={1}>
				<Text dimColor>
					Each list uses the same hook but renders completely different UI
				</Text>
			</Box>
		</Box>
	);
}

render(<App />);
