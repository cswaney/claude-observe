#!/usr/bin/env node
import { calculateTextViewport } from './calculateTextViewport.js';

console.log('=== calculateTextViewport Manual Tests ===\n');

// Test 1: Empty lines
console.log('Test 1: Empty lines');
const test1 = calculateTextViewport({
	lines: [],
	scrollOffset: 0,
	height: 10,
	getLineHeight: () => 1,
});
console.log('Result:', test1);
console.log('Expected: startLineIndex=0, endLineIndex=-1, visibleLines=[], totalLines=0\n');

// Test 2: Content fits in viewport
console.log('Test 2: Content fits in viewport (3 lines, height=10)');
const lines2 = ['line 1', 'line 2', 'line 3'];
const test2 = calculateTextViewport({
	lines: lines2,
	scrollOffset: 0,
	height: 10,
	getLineHeight: () => 1,
});
console.log('Result:', test2);
console.log('Expected: Shows all 3 lines, rowsAbove=0, rowsBelow=0\n');

// Test 3: ScrollOffset at beginning
console.log('Test 3: ScrollOffset at beginning (5 lines, height=3, offset=0)');
const lines3 = ['line 1', 'line 2', 'line 3', 'line 4', 'line 5'];
const test3 = calculateTextViewport({
	lines: lines3,
	scrollOffset: 0,
	height: 3,
	getLineHeight: () => 1,
});
console.log('Result:', test3);
console.log('Expected: Shows lines 1-3, rowsAbove=0, rowsBelow=2, maxScrollOffset=2\n');

// Test 4: ScrollOffset in middle
console.log('Test 4: ScrollOffset in middle (5 lines, height=2, offset=2)');
const test4 = calculateTextViewport({
	lines: lines3,
	scrollOffset: 2,
	height: 2,
	getLineHeight: () => 1,
});
console.log('Result:', test4);
console.log('Expected: Shows lines 3-4, rowsAbove=2, rowsBelow=1\n');

// Test 5: Variable line heights (wrapping simulation)
console.log('Test 5: Variable line heights (wrapping)');
const lines5 = ['short', 'medium length line', 'very long line that wraps'];
const getLineHeight5 = (line) => {
	if (line === 'short') return 1;
	if (line === 'medium length line') return 2;
	return 3;
};
const test5 = calculateTextViewport({
	lines: lines5,
	scrollOffset: 0,
	height: 4,
	getLineHeight: getLineHeight5,
});
console.log('Lines:', lines5);
console.log('Heights: [1, 2, 3] (total: 6 rows)');
console.log('Viewport height: 4 rows');
console.log('Result:', test5);
console.log('Expected: Shows first 2 lines (1+2=3 rows), third line would overflow\n');

// Test 6: Cumulative heights with variable heights
console.log('Test 6: Cumulative heights calculation');
const lines6 = ['a', 'b', 'c', 'd'];
const heights6 = [1, 3, 1, 2];
const getLineHeight6 = (_, index) => heights6[index];
const test6 = calculateTextViewport({
	lines: lines6,
	scrollOffset: 1, // Start from 'b'
	height: 4,
	getLineHeight: getLineHeight6,
});
console.log('Lines:', lines6);
console.log('Heights:', heights6, '(cumulative: [0, 1, 4, 5, 7])');
console.log('Starting at line 1 (b), height=4');
console.log('Result:', test6);
console.log('Expected: Shows lines b,c (3+1=4 rows), rowsAbove=1, rowsBelow=2\n');

// Test 7: Real-world JSON wrapping scenario
console.log('Test 7: Real-world JSON wrapping scenario');
const jsonLines = [
	'{',
	'  "short": "value",',
	'  "very_long_key_with_very_long_value": "This is a very long string that would definitely wrap in a narrow terminal window when displayed because it exceeds the typical line width",',
	'  "another": "value"',
	'}',
];

// Simulate 80 column terminal with 6-char gutter
const availableWidth = 80 - 6 - 2; // 72 chars
const getJsonLineHeight = (line) => {
	if (line.length === 0) return 1;
	return Math.ceil(line.length / availableWidth);
};

const test7 = calculateTextViewport({
	lines: jsonLines,
	scrollOffset: 0,
	height: 5,
	getLineHeight: getJsonLineHeight,
});

console.log('JSON lines:');
jsonLines.forEach((line, i) => {
	const height = getJsonLineHeight(line);
	console.log(
		`  [${i}] (${line.length} chars, ${height} rows): ${line.substring(0, 50)}${line.length > 50 ? '...' : ''}`,
	);
});
console.log('\nViewport height: 5 rows');
console.log('Result:', test7);
console.log(
	'Expected: Line 2 is ~180 chars, wraps to 3 rows. Should fit lines 0-2 or 0-3 depending on exact calculations\n',
);

// Test 8: MaxScrollOffset calculation
console.log('Test 8: MaxScrollOffset with variable heights');
const test8 = calculateTextViewport({
	lines: ['a', 'b', 'c', 'd'],
	scrollOffset: 0,
	height: 5,
	getLineHeight: getLineHeight6, // [1, 3, 1, 2]
});
console.log('Lines: [a, b, c, d]');
console.log('Heights: [1, 3, 1, 2] (total: 7 rows)');
console.log('Viewport height: 5 rows');
console.log('Result:', test8);
console.log('maxScrollOffset:', test8.maxScrollOffset);
console.log('Expected: maxScrollOffset=1 (starting at line 1 gives 6 rows to end)');
console.log(
	'  - Line 0→end: 7 rows ✓',
	'\n  - Line 1→end: 6 rows ✓',
	'\n  - Line 2→end: 3 rows ✗',
	'\n  - Line 3→end: 2 rows ✗\n',
);

console.log('=== All tests complete ===');
