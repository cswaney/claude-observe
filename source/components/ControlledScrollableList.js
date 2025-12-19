import React from 'react';
import { Box, Text } from 'ink';

/**
 * A controlled scrollable list component for Ink.js
 *
 * This is a pure presentational component that displays a windowed view of items.
 * The parent component controls what items are visible and manages viewport state.
 *
 * @param {Object} props
 * @param {Array} props.items - Array of items to display in the viewport
 * @param {number} props.startIndex - Index in the full list where visible items start
 * @param {number} props.selectedIndex - Index of the currently selected item (in full list)
 * @param {Function} props.renderItem - Function to render each item: (item, index, isSelected) => ReactElement
 * @param {number} [props.rowsAbove=0] - Number of rows hidden above the viewport
 * @param {number} [props.rowsBelow=0] - Number of rows hidden below the viewport
 * @param {boolean} [props.showOverflowIndicators=true] - Whether to show "... X rows above/below"
 */
export default function ControlledScrollableList({
	items = [],
	startIndex = 0,
	selectedIndex = 0,
	renderItem,
	rowsAbove = 0,
	rowsBelow = 0,
	showOverflowIndicators = true,
}) {
	if (items.length === 0) {
		return null;
	}

	return (
		<Box flexDirection="column">
			{showOverflowIndicators && rowsAbove > 0 && (
				<Text dimColor>
					... {rowsAbove} {rowsAbove === 1 ? 'row' : 'rows'} above
				</Text>
			)}
			{items.map((item, relativeIndex) => {
				const absoluteIndex = startIndex + relativeIndex;
				const isSelected = absoluteIndex === selectedIndex;
				return (
					<Box key={absoluteIndex}>
						{renderItem(item, absoluteIndex, isSelected)}
					</Box>
				);
			})}
			{showOverflowIndicators && rowsBelow > 0 && (
				<Text dimColor>
					... {rowsBelow} {rowsBelow === 1 ? 'row' : 'rows'} below
				</Text>
			)}
		</Box>
	);
}
