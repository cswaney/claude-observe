# Chart Components

Textual bar chart and histogram components for Ink.js, ported from Python implementation.

## Components

### BarChart

A basic vertical bar chart using Unicode block characters (▁▂▃▄▅▆▇█).

**Props:**
- `data` (number[]): Array of integer values to plot. Values should be in range [0, height × 8]
- `height` (number): Number of rows to use for the chart
- `color` (string, optional): Color for the bars (e.g., 'cyan', 'green', '#00ff00')

**Example:**
```jsx
import { BarChart } from './source/components/Chart.js';

// Create a simple parabolic curve
const data = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 36, 32, 28, 24, 20, 16, 12, 8, 4];

<BarChart data={data} height={5} color="cyan" />
```

### Histogram

A histogram that bins x-values and displays y-weighted counts.

**Props:**
- `x` (number[]): Array of x-values to plot
- `y` (number[]): Array of y-values (weights for each x). Use `Array(n).fill(1)` for standard histogram
- `width` (number): Number of columns/bins to use
- `height` (number): Number of rows to use
- `xMin` (number, optional): Minimum x value (defaults to min of x array)
- `xMax` (number, optional): Maximum x value (defaults to max of x array)
- `color` (string, optional): Color for the bars

**How it works:**
1. x-values are binned into `width` equally-spaced bins between `xMin` and `xMax`
2. For each bin, y-values are summed (allowing for weighted histograms)
3. The resulting counts are scaled to fit in `height × 8` vertical levels
4. Rendered using the BarChart component

**Example - Standard Histogram:**
```jsx
import { Histogram } from './source/components/Chart.js';

// Uniform random distribution
const n = 10000;
const x = Array.from({ length: n }, () => Math.random());
const y = Array.from({ length: n }, () => 1); // Standard histogram weights

<Histogram
  x={x}
  y={y}
  width={40}
  height={8}
  xMin={0.0}
  xMax={1.0}
  color="green"
/>
```

**Example - Weighted Histogram:**
```jsx
// Each data point has a different weight
const x = [0.1, 0.2, 0.3, 0.4, 0.5];
const y = [1, 5, 3, 8, 2]; // Different weights for each point

<Histogram
  x={x}
  y={y}
  width={20}
  height={5}
  xMin={0.0}
  xMax={1.0}
  color="yellow"
/>
```

## Running the Demo

To see the components in action:

```bash
node build-test-chart.js
node dist/test-chart.js
```

The demo shows:
1. A parabolic curve using BarChart
2. Uniform distribution histogram
3. Normal distribution histogram
4. Weighted random data histogram

## Implementation Details

The components use 8 Unicode block characters for rendering:
- ▁ (1/8 filled)
- ▂ (2/8 filled)
- ▃ (3/8 filled)
- ▄ (4/8 filled)
- ▅ (5/8 filled)
- ▆ (6/8 filled)
- ▇ (7/8 filled)
- █ (8/8 filled)

This provides 8 levels of granularity per row, giving `height × 8 + 1` total vertical levels of precision.

## Comparison to Python Implementation

The JavaScript implementation maintains the same algorithm and behavior as the Python version:
- Same binning logic for x-values
- Same y-weighted accumulation
- Same vertical scaling
- Same Unicode block characters
- Same rendering approach (row-by-row from top to bottom)
