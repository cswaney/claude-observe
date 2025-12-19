import React from 'react';
import { Box, Text } from 'ink';

/**
 * A reusable scrollable list component for Ink.js
 *
 * Displays a list of items with automatic scrolling, keeping the selected
 * item centered when possible. Shows overflow indicators ("... X rows above/below")
 * when content extends beyond the viewport.
 *
 * @param {Object} props
 * @param {Array} props.items - Array of items to display
 * @param {number} props.selectedIndex - Index of the currently selected item
 * @param {number} [props.height] - Maximum viewport height in rows (excludes overflow indicators)
 * @param {number} [props.width] - Component width (for wrapping calculations)
 * @param {Function} props.renderItem - Function to render each item: (item, index, isSelected) => ReactElement
 * @param {boolean} [props.showOverflowIndicators=true] - Whether to show "... X rows above/below"
 * @param {boolean} [props.centerSelected=true] - Whether to keep selected item centered in viewport
 * @param {Function} [props.getItemHeight] - Function to get height of an item: (item, index) => number (defaults to 1)
 */
export default function ScrollableList({
	items = [],
	selectedIndex = 0,
	height,
	width = 80,
	renderItem,
	showOverflowIndicators = true,
	centerSelected = true,
	getItemHeight = () => 1,
}) {
	// Early return if no items
	if (items.length === 0) {
		return null;
	}

	// If no height limit, render all items
	if (!height) {
		return (
			<Box flexDirection="column">
				{items.map((item, index) => {
					const isSelected = index === selectedIndex;
					return (
						<Box key={index}>
							{renderItem(item, index, isSelected)}
						</Box>
					);
				})}
			</Box>
		);
	}

	// Calculate item heights
	const itemHeights = items.map((item, index) => getItemHeight(item, index));

	// Calculate cumulative heights for efficient range queries
	const cumulativeHeights = [0];
	for (let i = 0; i < itemHeights.length; i++) {
		cumulativeHeights.push(cumulativeHeights[i] + itemHeights[i]);
	}

	const totalHeight = cumulativeHeights[cumulativeHeights.length - 1];

	// Calculate viewport window
	const calculateViewport = () => {
		// Ensure selected index is valid
		const validSelectedIndex = Math.max(0, Math.min(selectedIndex, items.length - 1));

		// Available height (reserve space for overflow indicators if needed)
		let availableHeight = height;

		// If all items fit, show everything
		if (totalHeight <= availableHeight) {
			return {
				startIndex: 0,
				endIndex: items.length - 1,
				hasItemsAbove: false,
				hasItemsBelow: false,
			};
		}

		// Reserve space for overflow indicators
		const indicatorHeight = 1;

		// Calculate selected item position and height
		const selectedHeight = itemHeights[validSelectedIndex];
		const selectedStartHeight = cumulativeHeights[validSelectedIndex];

		if (centerSelected) {
			// Try to center the selected item
			const halfAvailableHeight = Math.floor((availableHeight - selectedHeight) / 2);

			// Calculate the ideal start height (cumulative height where we want to start)
			let targetStartHeight = selectedStartHeight - halfAvailableHeight;

			// Find the start index
			let startIndex = 0;
			let endIndex = items.length - 1;
			let viewportHeight = 0;

			// Clamp to beginning if needed
			if (targetStartHeight <= 0) {
				startIndex = 0;
				viewportHeight = 0;

				// Fill from start until we run out of space
				for (let i = 0; i < items.length; i++) {
					if (viewportHeight + itemHeights[i] > availableHeight) {
						endIndex = i - 1;
						break;
					}
					viewportHeight += itemHeights[i];
					endIndex = i;
				}
			}
			// Clamp to end if needed
			else if (targetStartHeight + availableHeight >= totalHeight) {
				// Fill from end backwards
				viewportHeight = 0;
				for (let i = items.length - 1; i >= 0; i--) {
					if (viewportHeight + itemHeights[i] > availableHeight) {
						startIndex = i + 1;
						break;
					}
					viewportHeight += itemHeights[i];
					startIndex = i;
				}
				endIndex = items.length - 1;
			}
			// Normal case: can center the selected item
			else {
				// Find start index based on target height
				for (let i = 0; i < items.length; i++) {
					if (cumulativeHeights[i + 1] > targetStartHeight) {
						startIndex = i;
						break;
					}
				}

				// Fill from start index until we run out of space
				viewportHeight = 0;
				for (let i = startIndex; i < items.length; i++) {
					if (viewportHeight + itemHeights[i] > availableHeight) {
						endIndex = i - 1;
						break;
					}
					viewportHeight += itemHeights[i];
					endIndex = i;
				}
			}

			return {
				startIndex,
				endIndex,
				hasItemsAbove: startIndex > 0,
				hasItemsBelow: endIndex < items.length - 1,
			};
		} else {
			// No centering: just ensure selected item is visible
			let startIndex = 0;
			let endIndex = 0;
			let viewportHeight = 0;

			// If selected item is at the beginning
			if (validSelectedIndex === 0) {
				for (let i = 0; i < items.length; i++) {
					if (viewportHeight + itemHeights[i] > availableHeight) {
						endIndex = i - 1;
						break;
					}
					viewportHeight += itemHeights[i];
					endIndex = i;
				}
			}
			// If selected item is at the end
			else if (validSelectedIndex === items.length - 1) {
				viewportHeight = 0;
				for (let i = items.length - 1; i >= 0; i--) {
					if (viewportHeight + itemHeights[i] > availableHeight) {
						startIndex = i + 1;
						break;
					}
					viewportHeight += itemHeights[i];
					startIndex = i;
				}
				endIndex = items.length - 1;
			}
			// Selected item is in the middle
			else {
				// Start from selected item and expand both directions
				startIndex = validSelectedIndex;
				endIndex = validSelectedIndex;
				viewportHeight = itemHeights[validSelectedIndex];

				// Expand downwards first
				while (endIndex < items.length - 1 && viewportHeight + itemHeights[endIndex + 1] <= availableHeight) {
					endIndex++;
					viewportHeight += itemHeights[endIndex];
				}

				// Then expand upwards if there's room
				while (startIndex > 0 && viewportHeight + itemHeights[startIndex - 1] <= availableHeight) {
					startIndex--;
					viewportHeight += itemHeights[startIndex];
				}
			}

			return {
				startIndex,
				endIndex,
				hasItemsAbove: startIndex > 0,
				hasItemsBelow: endIndex < items.length - 1,
			};
		}
	};

	const { startIndex, endIndex, hasItemsAbove, hasItemsBelow } = calculateViewport();

	// Render visible items
	const visibleItems = items.slice(startIndex, endIndex + 1);
	const rowsAbove = startIndex;
	const rowsBelow = items.length - endIndex - 1;

	return (
		<Box flexDirection="column">
			{showOverflowIndicators && hasItemsAbove && (
				<Text dimColor>
					... {rowsAbove} {rowsAbove === 1 ? 'row' : 'rows'} above
				</Text>
			)}
			{visibleItems.map((item, relativeIndex) => {
				const absoluteIndex = startIndex + relativeIndex;
				const isSelected = absoluteIndex === selectedIndex;
				return (
					<Box key={absoluteIndex}>
						{renderItem(item, absoluteIndex, isSelected)}
					</Box>
				);
			})}
			{showOverflowIndicators && hasItemsBelow && (
				<Text dimColor>
					... {rowsBelow} {rowsBelow === 1 ? 'row' : 'rows'} below
				</Text>
			)}
		</Box>
	);
}
