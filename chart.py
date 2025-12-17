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
        import math

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


import random

x = [random.random() for _ in range(10_000)]
# y = [random.randint(1, 10) for _ in range(10_000)]
y = [1 for _ in range(10_000)]
print(Histogram(x, y, 20, 10, x_min=0.0, x_max=1.0).render())
