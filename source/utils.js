export function formatTokens(count) {
	if (count >= 1_000_000) {
		return (count / 1_000_000).toFixed(1) + 'M';
	}

	if (count >= 1000) {
		return (count / 1000).toFixed(1) + 'k';
	}

	return count.toString();
}
