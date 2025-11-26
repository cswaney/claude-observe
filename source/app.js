import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import {useStdout} from 'ink';
import Summary from './Summary.js';
import Logs from './Logs.js';
import {parseSession} from './parser.js';

export default function App({sessionDir = './data', sessionId = null}) {
	const {stdout} = useStdout();
	const width = stdout?.columns || 80;

	const [data, setData] = useState(null);
	const [error, setError] = useState(null);

	useEffect(() => {
		try {
			const result = parseSession(sessionDir, sessionId);
			setData(result);
		} catch (err) {
			setError(err.message);
		}
	}, [sessionDir, sessionId]);

	if (error) {
		return (
			<Box>
				<Text color="red">Error: {error}</Text>
			</Box>
		);
	}

	if (!data) {
		return (
			<Box>
				<Text dimColor>Loading...</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Summary
				width={width}
				logs={data.logs}
				project={data.project}
				session={data.sessionId}
			/>
			<Logs
				width={width}
				logs={data.logs}
			/>
		</Box>
	);
}
