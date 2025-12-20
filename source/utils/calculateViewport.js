/**
 * Calculate viewport window for a scrollable list
 *
 * Given a full list of items, selected index, and viewport height,
 * this function calculates which items should be visible to keep
 * the selected item centered (when possible).
 *
 * @param {Object} options
 * @param {Array} options.items - Full array of items
 * @param {number} options.selectedIndex - Index of the currently selected item
 * @param {number} options.height - Maximum viewport height in rows
 * @param {Function} [options.getItemHeight] - Function to get height of an item: (item, index) => number (defaults to 1)
 * @param {boolean} [options.centerSelected=true] - Whether to keep selected item centered in viewport
 *
 * @returns {Object} Viewport state
 * @returns {number} return.startIndex - Index where visible items start
 * @returns {number} return.endIndex - Index where visible items end (inclusive)
 * @returns {Array} return.visibleItems - Slice of items to display
 * @returns {number} return.rowsAbove - Number of rows hidden above
 * @returns {number} return.rowsBelow - Number of rows hidden below
 */
export function calculateViewport({
	items = [],
	selectedIndex = 0,
	height,
	getItemHeight = () => 1,
	centerSelected = true,
}) {
	// Early return if no items
	if (items.length === 0) {
		return {
			startIndex: 0,
			endIndex: -1,
			visibleItems: [],
			rowsAbove: 0,
			rowsBelow: 0,
		};
	}

	// Calculate item heights
	const itemHeights = items.map((item, index) => getItemHeight(item, index));

	// Calculate cumulative heights for efficient range queries
	const cumulativeHeights = [0];
	for (let i = 0; i < itemHeights.length; i++) {
		cumulativeHeights.push(cumulativeHeights[i] + itemHeights[i]);
	}

	const totalHeight = cumulativeHeights[cumulativeHeights.length - 1];

	// If no height limit or all items fit, show everything
	if (!height || totalHeight <= height) {
		return {
			startIndex: 0,
			endIndex: items.length - 1,
			visibleItems: items,
			rowsAbove: 0,
			rowsBelow: 0,
		};
	}

	// Ensure selected index is valid
	const validSelectedIndex = Math.max(
		0,
		Math.min(selectedIndex, items.length - 1),
	);

	// Calculate selected item position and height
	const selectedHeight = itemHeights[validSelectedIndex];
	const selectedStartHeight = cumulativeHeights[validSelectedIndex];

	let startIndex = 0;
	let endIndex = items.length - 1;
	let viewportHeight = 0;

	if (centerSelected) {
		// Try to center the selected item
		const halfAvailableHeight = Math.floor((height - selectedHeight) / 2);

		// Calculate the ideal start height (cumulative height where we want to start)
		let targetStartHeight = selectedStartHeight - halfAvailableHeight;

		// Clamp to beginning if needed
		if (targetStartHeight <= 0) {
			startIndex = 0;
			viewportHeight = 0;

			// Fill from start until we run out of space
			for (let i = 0; i < items.length; i++) {
				if (viewportHeight + itemHeights[i] > height) {
					endIndex = i - 1;
					break;
				}
				viewportHeight += itemHeights[i];
				endIndex = i;
			}
		}
		// Clamp to end if needed
		else if (targetStartHeight + height >= totalHeight) {
			// Fill from end backwards
			viewportHeight = 0;
			for (let i = items.length - 1; i >= 0; i--) {
				if (viewportHeight + itemHeights[i] > height) {
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
				if (viewportHeight + itemHeights[i] > height) {
					endIndex = i - 1;
					break;
				}
				viewportHeight += itemHeights[i];
				endIndex = i;
			}
		}
	} else {
		// No centering: just ensure selected item is visible
		// If selected item is at the beginning
		if (validSelectedIndex === 0) {
			for (let i = 0; i < items.length; i++) {
				if (viewportHeight + itemHeights[i] > height) {
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
				if (viewportHeight + itemHeights[i] > height) {
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
			while (
				endIndex < items.length - 1 &&
				viewportHeight + itemHeights[endIndex + 1] <= height
			) {
				endIndex++;
				viewportHeight += itemHeights[endIndex];
			}

			// Then expand upwards if there's room
			while (
				startIndex > 0 &&
				viewportHeight + itemHeights[startIndex - 1] <= height
			) {
				startIndex--;
				viewportHeight += itemHeights[startIndex];
			}
		}
	}

	return {
		startIndex,
		endIndex,
		visibleItems: items.slice(startIndex, endIndex + 1),
		rowsAbove: startIndex,
		rowsBelow: items.length - endIndex - 1,
	};
}
