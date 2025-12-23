#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import {useScrollableText} from './useScrollableText.js';

// Simple demo component to test the hook
function ScrollableTextDemo() {
	// Test data: JSON-like content with varying line lengths
	const text = `{
  "short": "value",
  "very_long_key_with_very_long_value": "This is a very long string that would definitely wrap in a narrow terminal window when displayed because it exceeds the typical line width and continues for quite some time",
  "another": "value",
  "nested": {
    "key1": "value1",
    "key2": "value2 that is also somewhat long and might wrap depending on the terminal width"
  },
  "array": [1, 2, 3, 4, 5],
  "done": true
}`;

	console.log('=== useScrollableText Hook Demo ===\n');
	console.log('Text content:');
	console.log(text);
	console.log('\n--- Testing viewport calculations ---\n');

	// Test 1: scrollOffset=0, height=5, width=80
	console.log('Test 1: scrollOffset=0, height=5, width=80');
	const viewport1 = useScrollableText({
		text,
		scrollOffset: 0,
		height: 5,
		width: 80,
	});
	console.log('Visible lines:', viewport1.visibleLines);
	console.log('Range:', viewport1.startLineIndex, '-', viewport1.endLineIndex);
	console.log('Overflow:', {
		hasLinesAbove: viewport1.hasLinesAbove,
		hasLinesBelow: viewport1.hasLinesBelow,
		rowsAbove: viewport1.rowsAbove,
		rowsBelow: viewport1.rowsBelow,
	});
	console.log('Max scroll offset:', viewport1.maxScrollOffset);
	console.log('Total lines:', viewport1.totalLines);
	console.log();

	// Test 2: scrollOffset=3, height=5, width=80
	console.log('Test 2: scrollOffset=3, height=5, width=80');
	const viewport2 = useScrollableText({
		text,
		scrollOffset: 3,
		height: 5,
		width: 80,
	});
	console.log('Visible lines:', viewport2.visibleLines);
	console.log('Range:', viewport2.startLineIndex, '-', viewport2.endLineIndex);
	console.log('Overflow:', {
		hasLinesAbove: viewport2.hasLinesAbove,
		hasLinesBelow: viewport2.hasLinesBelow,
	});
	console.log();

	// Test 3: Narrow width (wrapping test)
	console.log('Test 3: scrollOffset=0, height=10, width=40 (narrow terminal)');
	const viewport3 = useScrollableText({
		text,
		scrollOffset: 0,
		height: 10,
		width: 40,
	});
	console.log('Visible lines:', viewport3.visibleLines);
	console.log('Range:', viewport3.startLineIndex, '-', viewport3.endLineIndex);
	console.log('Overflow:', {
		hasLinesAbove: viewport3.hasLinesAbove,
		hasLinesBelow: viewport3.hasLinesBelow,
	});
	console.log(
		'Note: With narrow width, long lines wrap more, fewer lines fit in viewport',
	);
	console.log();

	// Test 4: Custom getLineHeight
	console.log('Test 4: Custom getLineHeight (always 2 rows per line)');
	const viewport4 = useScrollableText({
		text,
		scrollOffset: 0,
		height: 6,
		width: 80,
		getLineHeight: () => 2, // Force every line to take 2 rows
	});
	console.log('Visible lines:', viewport4.visibleLines);
	console.log('Range:', viewport4.startLineIndex, '-', viewport4.endLineIndex);
	console.log('Total lines:', viewport4.totalLines);
	console.log('Note: Each line takes 2 rows, so 6 row viewport fits 3 lines');
	console.log();

	console.log('=== Demo complete ===');

	// Return null since we're just logging, not rendering
	return null;
}

// Run the demo
render(<ScrollableTextDemo />);
