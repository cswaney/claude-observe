import { parseSession, parseLogFile, getTotalUsage } from './source/parser.js';

// const sessionPath = '/Users/cs7101/.claude/projects/-Users-cs7101-Development-claude-kit/404fc69d-751b-4662-b5c0-5c708a100632.jsonl';
const sessionPath = '/Users/colinswaney/.claude/projects/-Users-colinswaney-Desktop-claude-observe/7e462c02-4cf8-4535-8d32-6e6242eaab26.jsonl';

console.log('Loading session...\n');

// const { logs, sessionId, project, startDatetime } = parseSession(null, null, sessionPath);

// console.log('Session loaded successfully!');
// console.log(`Session ID: ${sessionId}`);
// console.log(`Project: ${project}`);
// console.log(`Total logs: ${logs.length}`);
// console.log(`Start: ${startDatetime}\n`);

const logs = parseLogFile(sessionPath);

// Example: Calculate total usage
// const totalUsage = logs.reduce((sum, log) => sum + (log.usage || 0), 0);
// console.log(`Total usage: ${totalUsage.toLocaleString()} tokens\n`);

// Example: Count by type
// const countByType = logs.reduce((acc, log) => {
// 	acc[log.type] = (acc[log.type] || 0) + 1;
// 	return acc;
// }, {});

// console.log('Log count by type:');
// Object.entries(countByType).forEach(([type, count]) => {
// 	console.log(`  ${type}: ${count}`);
// });

// Example: Token distribution by type
// const tokensByType = logs.reduce((acc, log) => {
// 	if (!acc[log.type]) acc[log.type] = 0;
// 	acc[log.type] += (log.usage || 0);
// 	return acc;
// }, {});

// console.log('\nToken usage by type:');
// Object.entries(tokensByType).forEach(([type, usage]) => {
// 	console.log(`  ${type}: ${usage.toLocaleString()} tokens`);
// });

// Export logs for testing
// console.log('\n--- Logs are available in the "logs" variable for testing ---');
// console.log('You can modify this script to test Summary.js calculations\n');

// Example: Access first few logs
console.log('First 10 logs:');
// logs.slice(0, 3).forEach((log, idx) => {
// 	console.log(`  ${idx + 1}. [${log.timestamp}] ${log.type}: ${(log.content || '').substring(0, 50)}...`);
// });

// logs.slice(0, 5).forEach((log, idx) => {
// 	console.log(`[${idx}]`, log)
// })

// logs.slice(0, 20).forEach((log, idx) => {
// 	if (log.raw.message) {
// 		console.log(`[${idx}] type: ${log.type} usage: ${log.usage}`, log.raw.message.usage ? log.raw.message.usage : null)
// 	} else {
// 		console.log("Skipping agent log");
// 	}
// })

logs.slice(0, 20).forEach((log, idx) => {
	console.log(`[${idx}] type: ${log.type} timestamp: ${log.timestamp}, raw.timestamp: ${log.raw.timestamp}`);
})


// Create a histogram for each log type
function histogram(logs, categories, width) {
	if (!logs || logs.length === 0) {
		return {};
	}

	const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp);
	const startTime = new Date(sortedLogs[0].raw.timestamp);
	const endTime = new Date(sortedLogs[sortedLogs.length - 1].raw.timestamp);
	const duration = endTime - startTime;
	const binSize = duration / width;
	const hist = {};

	categories.forEach(category => {
		hist[category] = Array(width).fill(0);
	});

	sortedLogs.forEach(log => {
		if (!categories.includes(log.type)) {
			return;
		}
		const timeSinceStart = new Date(log.raw.timestamp) - startTime;
		let binIndex = Math.floor(timeSinceStart / binSize);
		if (binIndex >= width) {
			binIndex = width - 1;
		}
		hist[log.type][binIndex] += (log.usage || 0);
	});

	return hist;
}

/**
 * 
 * 
 * ▁▂▃▄▅▆▇█▁▂▃▄▅▆▇█▁▂▃▄▅▆▇█▁▂▃▄▅▆▇█▁▂▃▄▅▆▇█▁▂▃▄▅▆▇█▁▂▃▄▅▆▇█
 * 00:00 AM         00:00 AM         00:00 PM      00:00 PM
 * 
 * min labels: 2
 * label_gap: 12 (min. space between labels)
 * 
 * 
 * 
 * @param {*} logs 
 * @param {*} categories 
 * @param {*} width 
 * @param {*} height 
 */
function sparkline(logs, categories, width, height, gap) {
	// Decide how many labels can fit in width
	// labelWidth = "00:00 AM".length
	// labelGap = gap
	// availWidth = width - 2 * labelWidth
	// widthNeeded(n) = n * labelWidth + (n+1) * labelGap
	// => nlabels = Math.floor(Math.max(0, availWidth - labelGap)) / (labelWidth + labelGap)

	// labels are date.toLocaleTimeString() (minus seconds) of the bin's starting ms (?) 
	
	// Calculate the y-grid
	// y_min = 0
	// y_max = max over bins(sum bins over categories) * 1.05
	// Each row/line has 7 levels
	// => y_steps_total = 7 * height
	// => each y_step_size = y_max / (y_steps_total)
	// => each value is rounded down to nearest tick, i.e., Math.floor(y / y_step_size)

	// for each column, plot 

}

/**
 * 
 *    ┌────────────────────────────────────────────────┐
 *    │
 *    │
 *    │
 *    └───────────────────────────────────────────────┘
 * 
 * @param {array} data - Array of {timestamp: Date, value: number} objects
 * @param {number} width - Number of columns
 * @param {*} height - Number of rows
 */
function Barchart({data, width, height}) {
	const n = data.length;

	const labelGap = 9;
	const labelWidth = "00:00 AM".length;
	const availableWidth = width - 2 * labelWidth;
	const labelCount = Math.floor(Math.max(0, availableWidth - labelGap) / (labelWidth + labelGap))

	const timeFormat = {hour: '2-digit', minute: '2-digit'}
	const x_min = data[0].timestamp;
	const x_max = data[n - 1].timestamp;
	const x_step = (x_max - x_min) / (width - 1);
	// const x_grid = ...
	// const x_labels = ...

	const y_min = 0;
	const y_max = Math.max(...data.map(item => item.y));
	const y_steps_total = height * 7;
	const y_step_size = (y_max - y_min) / y_steps_total;
	// const y_labels = Math.floot(y / y_step_size) for y in data.map(item => item.y);

	// Now plot it!
	// 

	function buildLine(index) {
		let text = "";

	}

	return (
		<Box 
			borderStyle="single"
			borderColor="gray"
			width={width + 2}
			height={height+2}
		>
			
		</Box>
	);
}

function range(start, end, step = 1) {
  const length = Math.floor((end - start) / step) + 1;
  return Array.from({ length }, (_, idx) => start + (idx * step));
}

console.log(histogram(logs, ['assistant', 'tool_use', 'thinking'], 87))