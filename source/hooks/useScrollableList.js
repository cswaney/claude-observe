import { useMemo } from 'react';
import { calculateViewport } from '../utils/calculateViewport.js';

/**
 * Custom hook for managing scrollable list viewport
 *
 * Provides viewport calculation logic without prescribing UI.
 * Returns data about which items should be visible based on
 * selected index and available height.
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
 * @returns {boolean} return.hasItemsAbove - Whether there are items above viewport
 * @returns {boolean} return.hasItemsBelow - Whether there are items below viewport
 */
export function useScrollableList({
	items = [],
	selectedIndex = 0,
	height,
	getItemHeight,
	centerSelected = true,
}) {
	// Memoize viewport calculation to avoid recalculating on every render
	const viewport = useMemo(
		() =>
			calculateViewport({
				items,
				selectedIndex,
				height,
				getItemHeight,
				centerSelected,
			}),
		[items, selectedIndex, height, getItemHeight, centerSelected]
	);

	return {
		...viewport,
		hasItemsAbove: viewport.rowsAbove > 0,
		hasItemsBelow: viewport.rowsBelow > 0,
	};
}
