import React from 'react';
import {Box, Text} from 'ink';

export default function Test({counter = 0}) {
	return (
		<Box flexDirection="column">
			<Box borderStyle="single" borderColor="cyan" padding={1}>
				<Box flexDirection="column">
					<Text bold>Test View - Counter: {counter}</Text>
					<Text> </Text>
					<Text>This is a simple test view to debug rendering issues.</Text>
					<Text>
						If you see multiple boxes stacking, it's an Ink rendering problem.
					</Text>
					<Text>
						If you only see one box that updates, the rendering works correctly.
					</Text>
				</Box>
			</Box>
			<Box justifyContent="center" marginTop={1}>
				<Text dimColor>Press ←/→ to change counter | Esc to go back</Text>
			</Box>
		</Box>
	);
}
