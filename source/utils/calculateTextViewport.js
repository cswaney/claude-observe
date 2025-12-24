/**
 * Calculate viewport window for scrollable text
 *
 * Given text content split into lines, a scroll offset, and viewport height,
 * calculates which lines should be visible. Supports variable line heights
 * for text wrapping.
 *
 * @param {Object} options
 * @param {string[]} options.lines - Array of text lines
 * @param {number} options.scrollOffset - Current scroll position (line number)
 * @param {number} options.height - Viewport height in rows
 * @param {Function} [options.getLineHeight] - Function to get height of a line: (line, index) => number (defaults to 1)
 *
 * @returns {Object} Viewport state
 * @returns {number} return.startLineIndex - Index of first visible line
 * @returns {number} return.endLineIndex - Index of last visible line
 * @returns {string[]} return.visibleLines - Slice of lines to display
 * @returns {number} return.totalLines - Total number of lines
 * @returns {number} return.rowsAbove - Height of hidden content above (in rows)
 * @returns {number} return.rowsBelow - Height of hidden content below (in rows)
 * @returns {number} return.maxScrollOffset - Maximum valid scroll offset
 */
export function calculateTextViewport({
	lines = [],
	scrollOffset = 0,
	height,
	getLineHeight = () => 1,
}) {
	// Edge case: no lines
	if (lines.length === 0) {
		return {
			startLineIndex: 0,
			endLineIndex: -1,
			visibleLines: [],
			totalLines: 0,
			rowsAbove: 0,
			rowsBelow: 0,
			maxScrollOffset: 0,
		};
	}

	// Calculate height for each line
	const lineHeights = lines.map((line, index) => getLineHeight(line, index));

	// Build cumulative heights array
	// cumulative[i] = total rows taken by lines 0 through i-1
	// Example: lines with heights [1, 3, 1] => cumulative [0, 1, 4, 5]
	const cumulativeHeights = [0];
	for (const [i, lineHeight] of lineHeights.entries()) {
		cumulativeHeights.push(cumulativeHeights[i] + lineHeight);
	}

	const totalHeight = cumulativeHeights[cumulativeHeights.length - 1];

	// If all content fits in viewport, show everything
	if (!height || totalHeight <= height) {
		return {
			startLineIndex: 0,
			endLineIndex: lines.length - 1,
			visibleLines: lines,
			totalLines: lines.length,
			rowsAbove: 0,
			rowsBelow: 0,
			maxScrollOffset: 0,
		};
	}

	// Clamp scrollOffset to valid range
	const validScrollOffset = Math.max(
		0,
		Math.min(scrollOffset, lines.length - 1),
	);

	// Start from the scrollOffset line
	const startLineIndex = validScrollOffset;
	let endLineIndex = validScrollOffset;

	// Calculate how many rows we've used so far
	let usedHeight = lineHeights[validScrollOffset];

	// Try to fit as many lines as possible into the viewport
	// Expand downward from scrollOffset
	while (endLineIndex < lines.length - 1) {
		const nextLineHeight = lineHeights[endLineIndex + 1];
		if (usedHeight + nextLineHeight > height) {
			// Next line doesn't fit
			break;
		}

		endLineIndex++;
		usedHeight += nextLineHeight;
	}

	// Calculate rows above (cumulative height up to startLineIndex)
	const rowsAbove = cumulativeHeights[startLineIndex];

	// Calculate rows below (total height - cumulative height through endLineIndex)
	const rowsBelow = totalHeight - cumulativeHeights[endLineIndex + 1];

	// Calculate maximum valid scroll offset
	// This is the line index where if we start there, we can fill the viewport
	// without going past the end
	let maxScrollOffset = 0;
	for (let i = lines.length - 1; i >= 0; i--) {
		// Try starting from line i, see if content from i to end fits
		const heightFromIToEnd = totalHeight - cumulativeHeights[i];
		if (heightFromIToEnd >= height) {
			maxScrollOffset = i;
			break;
		}
	}

	return {
		startLineIndex,
		endLineIndex,
		visibleLines: lines.slice(startLineIndex, endLineIndex + 1),
		totalLines: lines.length,
		rowsAbove,
		rowsBelow,
		maxScrollOffset,
	};
}
