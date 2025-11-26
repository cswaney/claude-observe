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
	const [currentSessionPath, setCurrentSessionPath] = useState(null);
	const [currentProject, setCurrentProject] = useState(null);
	const [agentViewData, setAgentViewData] = useState(null); // {agentId, logs}

	// Load session when sessionId changes or when a new session is selected
	useEffect(() => {
		if (!currentSessionPath && !sessionId) {
			// No session selected, start in browser mode
			setData(null);
			return;
		}

		try {
			if (currentSessionPath) {
				// Load from selected session path
				const result = parseSession(null, null, currentSessionPath);
				setData(result);
				setError(null);
			} else if (sessionId) {
				// Load from passed sessionDir/sessionId
				const result = parseSession(sessionDir, sessionId);
				setData(result);
				setError(null);
			}
		} catch (err) {
			setError(err.message);
			setData(null);
		}
	}, [sessionDir, sessionId, currentSessionPath]);

	// Handle session selection from browser
	const handleSessionSelect = (sessionPath, projectName) => {
		setCurrentSessionPath(sessionPath);
		setCurrentProject(projectName);
	};

	// Handle return to browser (clear current session)
	const handleReturnToBrowser = () => {
		setCurrentSessionPath(null);
		setCurrentProject(null);
		setData(null);
		setAgentViewData(null);
	};

	// Handle agent view change
	const handleAgentView = (agentData) => {
		setAgentViewData(agentData);
	};

	if (error) {
		return (
			<Box flexDirection="column">
				<Box marginBottom={1}>
					<Text color="red">Error: {error}</Text>
				</Box>
				<Logs
					width={width}
					logs={[]}
					onSessionSelect={handleSessionSelect}
				onReturnToBrowser={handleReturnToBrowser}
				/>
			</Box>
		);
	}

	// Determine what to show in Summary
	const summaryLogs = agentViewData ? agentViewData.logs : (data?.logs || []);
	const summaryProject = currentProject || data?.project;
	const summaryTitle = agentViewData
		? `${summaryProject}/${data?.sessionId}/agent-${agentViewData.agentId}`
		: (data ? `${summaryProject}/${data.sessionId}` : null);

	return (
		<Box flexDirection="column">
			{data && (
				<Summary
					width={width}
					logs={summaryLogs}
					project={summaryProject}
					session={data.sessionId}
					startDatetime={data.startDatetime}
					title={summaryTitle}
				/>
			)}
			<Logs
				width={width}
				logs={data?.logs || []}
				sessionId={data?.sessionId}
				onSessionSelect={handleSessionSelect}
				onReturnToBrowser={handleReturnToBrowser}
				onAgentView={handleAgentView}
			/>
		</Box>
	);
}
