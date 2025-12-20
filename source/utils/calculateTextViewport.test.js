import test from 'ava';
import {calculateTextViewport} from './calculateTextViewport.js';

test('handles empty lines', t => {
	const result = calculateTextViewport({
		lines: [],
		scrollOffset: 0,
		height: 10,
		getLineHeight: () => 1,
	});

	t.deepEqual(result, {
		startLineIndex: 0,
		endLineIndex: -1,
		visibleLines: [],
		totalLines: 0,
		rowsAbove: 0,
		rowsBelow: 0,
		maxScrollOffset: 0,
	});
});

test('handles content that fits in viewport', t => {
	const lines = ['line 1', 'line 2', 'line 3'];
	const result = calculateTextViewport({
		lines,
		scrollOffset: 0,
		height: 10,
		getLineHeight: () => 1,
	});

	t.deepEqual(result, {
		startLineIndex: 0,
		endLineIndex: 2,
		visibleLines: lines,
		totalLines: 3,
		rowsAbove: 0,
		rowsBelow: 0,
		maxScrollOffset: 0,
	});
});

test('scrollOffset at beginning', t => {
	const lines = ['line 1', 'line 2', 'line 3', 'line 4', 'line 5'];
	const result = calculateTextViewport({
		lines,
		scrollOffset: 0,
		height: 3,
		getLineHeight: () => 1,
	});

	t.deepEqual(result, {
		startLineIndex: 0,
		endLineIndex: 2,
		visibleLines: ['line 1', 'line 2', 'line 3'],
		totalLines: 5,
		rowsAbove: 0,
		rowsBelow: 2,
		maxScrollOffset: 2,
	});
});

test('scrollOffset in middle', t => {
	const lines = ['line 1', 'line 2', 'line 3', 'line 4', 'line 5'];
	const result = calculateTextViewport({
		lines,
		scrollOffset: 2,
		height: 2,
		getLineHeight: () => 1,
	});

	t.deepEqual(result, {
		startLineIndex: 2,
		endLineIndex: 3,
		visibleLines: ['line 3', 'line 4'],
		totalLines: 5,
		rowsAbove: 2,
		rowsBelow: 1,
		maxScrollOffset: 3,
	});
});

test('handles different line heights for wrapping', t => {
	const lines = ['short', 'medium length line', 'very long line that wraps'];
	const getLineHeight = line => {
		if (line === 'short') return 1;
		if (line === 'medium length line') return 2;
		return 3;
	};

	const result = calculateTextViewport({
		lines,
		scrollOffset: 0,
		height: 4,
		getLineHeight,
	});

	t.deepEqual(result, {
		startLineIndex: 0,
		endLineIndex: 1,
		visibleLines: ['short', 'medium length line'],
		totalLines: 3,
		rowsAbove: 0,
		rowsBelow: 3,
		maxScrollOffset: 1,
	});
});

test('cumulative heights calculation', t => {
	const lines = ['a', 'b', 'c', 'd'];
	const heights = [1, 3, 1, 2];
	const getLineHeight = (_, index) => heights[index];

	const result = calculateTextViewport({
		lines,
		scrollOffset: 1,
		height: 4,
		getLineHeight,
	});

	t.deepEqual(result, {
		startLineIndex: 1,
		endLineIndex: 2,
		visibleLines: ['b', 'c'],
		totalLines: 4,
		rowsAbove: 1,
		rowsBelow: 2,
		maxScrollOffset: 1,
	});
});

test('maxScrollOffset with variable heights', t => {
	const lines = ['a', 'b', 'c', 'd'];
	const heights = [1, 3, 1, 2];
	const getLineHeight = (_, index) => heights[index];

	const result = calculateTextViewport({
		lines,
		scrollOffset: 0,
		height: 5,
		getLineHeight,
	});

	t.is(result.maxScrollOffset, 1);
});

test('JSON wrapping scenario', t => {
	const jsonLines = [
		'{',
		'  "short": "value",',
		'  "very_long_key_with_very_long_value": "This is a very long string that would definitely wrap in a narrow terminal window when displayed because it exceeds the typical line width",',
		'  "another": "value"',
		'}',
	];

	const availableWidth = 80 - 6 - 2;
	const getLineHeight = line => {
		if (line.length === 0) return 1;
		return Math.ceil(line.length / availableWidth);
	};

	const result = calculateTextViewport({
		lines: jsonLines,
		scrollOffset: 0,
		height: 5,
		getLineHeight,
	});

	t.is(result.startLineIndex, 0);
	t.true(result.visibleLines.length > 0);
	t.true(result.visibleLines.length <= jsonLines.length);
});
