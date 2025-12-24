import {useMemo, useCallback} from 'react';
import {calculateTextViewport} from '../utils/calculateTextViewport.js';

/**
 * Custom hook for managing scrollable text viewport
 *
 * Provides viewport calculation for text content based on scroll offset
 * and available height. Splits text into lines automatically and calculates
 * line wrapping based on available width.
 *
 * @param {Object} options
 * @param {string} options.text - Full text content
 * @param {number} options.scrollOffset - Current scroll position (line number)
 * @param {number} options.height - Maximum viewport height in rows
 * @param {number} options.width - Viewport width in columns (for wrapping calculation)
 * @param {Function} [options.getLineHeight] - Optional custom height calculator: (line, index) => number
 *
 * @returns {Object} Viewport state
 * @returns {string[]} return.visibleLines - Lines to display
 * @returns {number} return.startLineIndex - Index of first visible line
 * @returns {number} return.endLineIndex - Index of last visible line
 * @returns {number} return.totalLines - Total line count
 * @returns {number} return.rowsAbove - Rows hidden above viewport
 * @returns {number} return.rowsBelow - Rows hidden below viewport
 * @returns {boolean} return.hasLinesAbove - Whether there are hidden lines above
 * @returns {boolean} return.hasLinesBelow - Whether there are hidden lines below
 * @returns {number} return.maxScrollOffset - Maximum valid scroll offset
 */
export function useScrollableText({
	text = '',
	scrollOffset = 0,
	height,
	width,
	getLineHeight: customGetLineHeight,
}) {
	// Split text into lines (memoized to avoid re-splitting on every render)
	const lines = useMemo(() => {
		return text.split('\n');
	}, [text]);

	// Create default getLineHeight function if not provided
	// This calculates how many rows a line will take based on text wrapping
	const defaultGetLineHeight = useCallback(
		(line, _) => {
			// Calculate gutter width for line numbers
			// Example: if we have 999 lines, gutter is "[999] " = 6 chars
			const maxLineNumber = lines.length;
			const gutterWidth = String(maxLineNumber).length + 3; // "[N] "

			// Account for container padding/borders
			// TitledBox has padding={1} which is 2 chars total (left + right)
			const PADDING = 2;

			// Calculate available width for text content
			const availableWidth = width - gutterWidth - PADDING;

			// Handle edge cases
			if (line.length === 0) return 1; // Empty lines still take 1 row
			if (availableWidth <= 0) return 1; // Fallback if width calculation is wrong

			// Calculate wrapped height
			// If line is 150 chars and available width is 70, it wraps to 3 rows
			return Math.ceil(line.length / availableWidth);
		},
		[lines.length, width],
	);

	// Use custom or default getLineHeight
	const getLineHeight = customGetLineHeight || defaultGetLineHeight;

	// Memoize viewport calculation to avoid recalculating on every render
	const viewport = useMemo(() => {
		return calculateTextViewport({
			lines,
			scrollOffset,
			height,
			getLineHeight,
		});
	}, [lines, scrollOffset, height, getLineHeight]);

	// Return viewport data with additional boolean helpers
	return {
		...viewport,
		hasLinesAbove: viewport.rowsAbove > 0,
		hasLinesBelow: viewport.rowsBelow > 0,
	};
}
