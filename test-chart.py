#!/usr/bin/env python3
"""
Chart component demos - Python version

Demonstrates BarChart and Histogram with various data distributions.
"""

import random
import math


class BarChart:
    """A bar chart.

    This is a base chart object that assumes data has been processed such that:

        1. x-coordinates are integers from 0-len(data),
        2. y-coordinates are integers from 0-height * nbars,

    where `nbars` is the number of

    Args:
        data: a list of values to be plotted
        height: the number of rows to use
    """

    def __init__(self, data: list[int], height: int):
        self.data = data
        self.height = height

    def render(self) -> str:
        chart = ""
        for row_index in range(self.height, -1, -1):
            chart += BarChartRow(row_index, self.data).render()

        return chart


class BarChartRow:
    bars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"]
    nbars = len(bars)

    def __init__(self, index: int, data: list[int]):
        self.index = index
        self.data = data

    @property
    def min_y(self):
        return self.index * self.nbars

    @property
    def max_y(self):
        return (self.index + 1) * self.nbars

    def render(self) -> str:
        row = ""
        for value in self.data:
            if value >= self.max_y:
                row += self.bars[self.nbars - 1]
            elif value > self.min_y:
                row += self.bars[value % self.nbars - 1]
            else:
                row += " "

        return row + "\n"


def xrange(start, stop, n):
    step = (stop - start) / n
    return [start + step * i for i in range(n + 1)]


class Histogram:
    """A textual histrogram based.

    The histogram represents *y-weighted* counts of x values. That is, the height of bars is equal to the sum of the `y[i]` for each `x[i]` in the bar's bin. To produce a standard histogram of x values, use `y = ones(len(x))`.

    - x-values are binned to a length-`width` grid [x_min - x_tol, ..., x_max + x_tol]
    - y-values are binned to a length-`n x height + 1` grid [y_min - y_tol, ..., y_max + y_tol],

    where `n` is the number of steps per row (default: 8). The binning process results in a new length-`width` data vector, `data`, where each element is in `[0, 1, ..., n x height]`.

    Args:
        x: list of x-values to plot
        y: list of y-values to plot
        width: the number of columns to use
        height: the number of rows to use
    """

    bars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"]
    nbars = len(bars)

    def __init__(
        self,
        x: list[float],
        y: list[int],
        width: int,
        height: int,
        x_min: float | None,
        x_max: float | None,
    ):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.x_min = x_min
        self.x_max = x_max

    def data(self) -> list[int]:
        self.x_min = self.x_min if self.x_min is not None else min(self.x)
        self.x_max = self.x_max if self.x_max is not None else max(self.x)
        self.x_step = (self.x_max - self.x_min) / self.width

        data = [0 for _ in range(self.width)]
        for xindex, value in enumerate(self.x):
            dindex = int(math.floor((value - self.x_min) / self.x_step))
            if dindex == self.width:
                dindex -= 1
            data[dindex] += self.y[xindex]

        self.y_min = 0
        self.y_max = max(data)
        self.y_step = (self.y_max - self.y_min) / (self.height * self.nbars)

        data = [int(math.floor(value / self.y_step)) for value in data]

        return data

    def render(self) -> str:
        return BarChart(self.data(), self.height).render()


def print_demo(title: str, content: str):
    """Print a demo section with a title"""
    print(f"\033[1m{title}\033[0m")  # Bold title
    print(content)
    print()  # Empty line after each demo


def main():
    print("\033[1mChart Component Demos\033[0m")
    print()

    # Example 1: Simple BarChart with predefined data
    print_demo(
        "1. BarChart - Parabolic curve",
        BarChart(
            [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 36, 32, 28, 24, 20, 16, 12, 8, 4],
            height=5
        ).render()
    )

    # Example 2: Histogram with random uniform distribution
    n1 = 10_000
    uniform_x = [random.random() for _ in range(n1)]
    uniform_y = [1 for _ in range(n1)]

    print_demo(
        "2. Histogram - Uniform distribution [0, 1]",
        Histogram(uniform_x, uniform_y, width=40, height=8, x_min=0.0, x_max=1.0).render()
    )

    # Example 3: Histogram with normal distribution (Box-Muller transform)
    n2 = 10_000
    normal_x = []
    for i in range(n2):
        u1 = random.random()
        u2 = random.random()
        z0 = math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)
        normal_x.append(z0)
    normal_y = [1 for _ in range(n2)]

    print_demo(
        "3. Histogram - Normal distribution",
        Histogram(normal_x, normal_y, width=40, height=8, x_min=-4, x_max=4).render()
    )

    # Example 4: Weighted histogram
    n3 = 1_000
    weighted_x = [random.random() for _ in range(n3)]
    weighted_y = [random.randint(1, 10) for _ in range(n3)]

    print_demo(
        "4. Histogram - Weighted random data",
        Histogram(weighted_x, weighted_y, width=40, height=8, x_min=0.0, x_max=1.0).render()
    )


if __name__ == "__main__":
    main()
