import React, {useState, useEffect} from 'react';
import {Box, Text, useInput, useStdout} from 'ink';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {parseSession, parseLogFile, getSessionMetadata} from './parser.js';
import Browser from './views/Browser/index.js';
import Session from './views/Session/index.js';
import Details from './views/Details/index.js';

export default function App({sessionDir = './data', sessionId = null}) {
	const {stdout} = useStdout();
	const width = stdout?.columns || 80;

	// Data state
	const [data, setData] = useState(null);
	const [error, setError] = useState(null);
	const [currentSessionPath, setCurrentSessionPath] = useState(null);
	const [currentProject, setCurrentProject] = useState(null);
	const [currentSessionDir, setCurrentSessionDir] = useState(null);

	// View state
	const [viewMode, setViewMode] = useState('browser'); // 'browser', 'session', or 'detail'
	const [agentViewData, setAgentViewData] = useState(null); // {agentId, logs, parentLogs}

	// Browser state
	const [projects, setProjects] = useState([]);
	const [browserItems, setBrowserItems] = useState([]);
	const [lastSelectedSession, setLastSelectedSession] = useState(null);
	const [browserFilterMode, setBrowserFilterMode] = useState(false);
	const [browserFilterInput, setBrowserFilterInput] = useState('');
	const [browserFilterQuery, setBrowserFilterQuery] = useState('');

	// Session/List state
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [collapsedStates, setCollapsedStates] = useState({});
	const [activeFilters, setActiveFilters] = useState({
		user: true,
		assistant: true,
		tool: true,
		thinking: true,
		subagent: true,
	});
	const [savedFilters, setSavedFilters] = useState(null);
	const [searchMode, setSearchMode] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [activeSearch, setActiveSearch] = useState('');

	// Detail state
	const [detailScrollOffset, setDetailScrollOffset] = useState(0);

	// Scan for projects and sessions on mount
	useEffect(() => {
		const claudeDir = path.join(os.homedir(), '.claude', 'projects');

		try {
			if (!fs.existsSync(claudeDir)) {
				setProjects([]);
				return;
			}

			const projectDirs = fs.readdirSync(claudeDir, { withFileTypes: true })
				.filter(dirent => dirent.isDirectory())
				.map(dirent => dirent.name);

			const projectsData = projectDirs.map(projectName => {
				const projectPath = path.join(claudeDir, projectName);
				const projectStats = fs.statSync(projectPath);

				// Find project cwd by checking session files until we find one
				const sessionFiles = fs.readdirSync(projectPath)
					.filter(file => file.endsWith('.jsonl') && !file.startsWith('agent-'));

				let projectCwd = projectName;
				for (const file of sessionFiles) {
					const filePath = path.join(projectPath, file);
					const metadata = getSessionMetadata(filePath);
					if (metadata.cwd) {
						projectCwd = metadata.cwd;
						break;
					}
				}

				const sessions = sessionFiles
					.map(file => {
						const filePath = path.join(projectPath, file);
						const metadata = getSessionMetadata(filePath);

						return {
							session: file,
							project: projectCwd,
							usage: metadata.usage,
							logCount: metadata.logCount,
							created: metadata.created ? new Date(metadata.created) : null,
							modified: metadata.modified ? new Date(metadata.modified) : null,
							// Keep legacy fields for compatibility
							name: file,
							path: filePath,
							projectName,
							mtime: metadata.modified ? new Date(metadata.modified) : new Date(),
							birthtime: metadata.created ? new Date(metadata.created) : new Date()
						};
					})
					.sort((a, b) => b.mtime - a.mtime); // Sort most recent first

				// Get the most recent session mtime as the project's last modified time
				const lastModified = sessions.length > 0 ? sessions[0].mtime : projectStats.mtime;

				return {
					name: projectName,
					path: projectPath,
					sessions,
					birthtime: projectStats.birthtime,  // Project creation time
					mtime: lastModified  // Last modified (most recent session)
				};
			}).filter(project => project.sessions.length > 0);

			setProjects(projectsData);
		} catch (error) {
			console.error('Error scanning projects:', error);
			setProjects([]);
		}
	}, []);

	// Build flat list of all sessions for navigation
	useEffect(() => {
		const items = [];
		// Sort projects alphabetically
		const sortedProjects = [...projects].sort((a, b) =>
			a.name.localeCompare(b.name)
		);
		sortedProjects.forEach(project => {
			// Get the actual filesystem path from the project.path
			// This is more reliable than trying to parse the dash-separated name
			const projectPath = project.path;

			// Sessions are already sorted by mtime (most recent first)
			project.sessions.forEach(session => {
				items.push({
					...session,
					projectPath: projectPath
				});
			});
		});
		setBrowserItems(items);
	}, [projects]);

	// Filter browser items based on active filter (or current input if in filter mode)
	const activeFilterQuery = browserFilterMode ? browserFilterInput : browserFilterQuery;
	const filteredBrowserItems = browserItems.filter(item => {
		if (!activeFilterQuery) return true;
		const projectPath = item.project || item.projectName || '';
		return projectPath.toLowerCase().includes(activeFilterQuery.toLowerCase());
	});

	// Load session when sessionId changes or when a new session is selected
	useEffect(() => {
		if (!currentSessionPath && !sessionId) {
			// No session selected, stay in browser mode
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

	// Reset collapsed states when logs or agent view changes
	useEffect(() => {
		const initial = {};
		const logsToInit = agentViewData ? agentViewData.logs : (data?.logs || []);
		logsToInit.forEach(log => {
			initial[log.id] = true; // Start all collapsed
		});
		setCollapsedStates(initial);
	}, [data?.logs, agentViewData]);

	// Use agent logs if in agent view, otherwise use session logs
	const currentLogs = agentViewData ? agentViewData.logs : (data?.logs || []);

	// Parse search query into field filters
	const parseSearchQuery = (query) => {
		if (!query.trim()) return [];
		const filters = [];
		const parts = query.match(/(\w+):([^\s]+)/g) || [];
		parts.forEach(part => {
			const [field, value] = part.split(':');
			filters.push({ field: field.toLowerCase(), value: value.toLowerCase() });
		});
		return filters;
	};

	// Check if log matches search filters
	const matchesSearch = (log, searchFilters) => {
		if (searchFilters.length === 0) return true;

		return searchFilters.every(filter => {
			switch (filter.field) {
				case 'type':
					return log.type.toLowerCase().includes(filter.value);
				case 'content':
					return log.content?.toLowerCase().includes(filter.value);
				case 'agent':
					return log.agentId?.toLowerCase().includes(filter.value);
				case 'tool':
					return log.toolName?.toLowerCase().includes(filter.value);
				default:
					return true;
			}
		});
	};

	// Parse active search filters
	const searchFilters = parseSearchQuery(activeSearch);

	// Filter logs based on active filters and search
	const filteredLogs = currentLogs.filter(log =>
		activeFilters[log.type] && matchesSearch(log, searchFilters)
	);

	// Helper to check if a log is selectable
	const isSelectable = (log) => {
		// Skip subagent end rows (isLast = true)
		if (log.type === 'subagent' && log.isLast) {
			return false;
		}
		return true;
	};

	// Find next selectable index
	const findNextSelectable = (currentIndex, direction) => {
		let nextIndex = currentIndex + direction;
		while (nextIndex >= 0 && nextIndex < filteredLogs.length) {
			if (isSelectable(filteredLogs[nextIndex])) {
				return nextIndex;
			}
			nextIndex += direction;
		}
		return currentIndex; // Stay at current if no selectable found
	};

	// Find Nth selectable index in a direction
	const findNthSelectable = (currentIndex, direction, n) => {
		let nextIndex = currentIndex;
		let count = 0;
		while (count < n && nextIndex >= 0 && nextIndex < filteredLogs.length) {
			nextIndex = findNextSelectable(nextIndex, direction);
			if (nextIndex === currentIndex || (direction > 0 && nextIndex >= filteredLogs.length - 1) || (direction < 0 && nextIndex <= 0)) {
				break; // Reached end of list
			}
			count++;
		}
		return nextIndex;
	};

	// Calculate viewport size
	const terminalHeight = stdout?.rows || 40;
	const availableHeight = terminalHeight - 14;
	const viewportSize = Math.min(25, Math.max(15, availableHeight));

	// Handle keyboard input
	useInput((input, key) => {
		// Handle browser filter mode input
		if (browserFilterMode) {
			if (key.return) {
				// Exit filter mode, keep current input as active filter
				setBrowserFilterQuery(browserFilterInput);
				setBrowserFilterMode(false);
				return;
			} else if (key.escape) {
				// Cancel filter and clear everything
				const currentItem = filteredBrowserItems[selectedIndex];
				setBrowserFilterInput('');
				setBrowserFilterQuery('');
				setBrowserFilterMode(false);

				// Try to preserve selection in unfiltered list
				if (currentItem) {
					const newIndex = browserItems.findIndex(
						item => item.session === currentItem.session
					);
					if (newIndex !== -1) {
						setSelectedIndex(newIndex);
					} else {
						setSelectedIndex(0);
					}
				} else {
					setSelectedIndex(0);
				}
				return;
			} else if (key.upArrow && selectedIndex > 0) {
				// Allow navigation while filtering
				setSelectedIndex(prev => prev - 1);
				return;
			} else if (key.downArrow && selectedIndex < filteredBrowserItems.length - 1) {
				// Allow navigation while filtering
				setSelectedIndex(prev => prev + 1);
				return;
			} else if (key.backspace || key.delete) {
				// Remove last character
				const newInput = browserFilterInput.slice(0, -1);
				const currentItem = filteredBrowserItems[selectedIndex];

				setBrowserFilterInput(newInput);

				// Check if current selection will still be in the filtered list
				if (currentItem) {
					const projectPath = currentItem.project || currentItem.projectName || '';
					const stillMatches = !newInput || projectPath.toLowerCase().includes(newInput.toLowerCase());

					if (!stillMatches) {
						setSelectedIndex(0);
					}
				}
				return;
			} else if (input && !key.ctrl && !key.meta) {
				// Add character to query
				const newInput = browserFilterInput + input;
				const currentItem = filteredBrowserItems[selectedIndex];

				setBrowserFilterInput(newInput);

				// Check if current selection will still be in the filtered list
				if (currentItem) {
					const projectPath = currentItem.project || currentItem.projectName || '';
					const stillMatches = projectPath.toLowerCase().includes(newInput.toLowerCase());

					if (!stillMatches) {
						setSelectedIndex(0);
					} else {
						setSelectedIndex(0);
					}
				}
				return;
			}
			return; // Ignore other keys in filter mode
		}

		// Handle search mode input
		if (searchMode) {
			if (key.return) {
				// Apply search
				setActiveSearch(searchQuery);
				setSearchMode(false);
				return;
			} else if (key.escape) {
				// Cancel search
				setSearchQuery('');
				setSearchMode(false);
				return;
			} else if (key.backspace || key.delete) {
				// Remove last character
				setSearchQuery(prev => prev.slice(0, -1));
				return;
			} else if (input && !key.ctrl && !key.meta) {
				// Add character to query
				setSearchQuery(prev => prev + input);
				return;
			}
			return; // Ignore other keys in search mode
		}

		// Enter search mode with '/'
		if (input === '/' && viewMode === 'session') {
			setSearchMode(true);
			setSearchQuery('');
			return;
		}

		// Clear search with Escape (when not in search mode but search is active)
		if (key.escape && activeSearch && viewMode === 'session') {
			setActiveSearch('');
			return;
		}

		// Handle navigation within agent view
		if (agentViewData) {
			// Escape: return to browser from any mode
			if (key.escape) {
				setAgentViewData(null);
				setViewMode('browser');
				setSelectedIndex(0);
				setSavedFilters(null);
				setCurrentSessionPath(null);
				setCurrentProject(null);
				setData(null);
				return;
			}

			// Left arrow: return to session list from detail, or exit agent view from session
			if (key.leftArrow) {
				if (viewMode === 'detail') {
					setViewMode('session');
					setDetailScrollOffset(0);
					return;
				} else if (viewMode === 'session') {
					setAgentViewData(null);
					// Restore saved filters when exiting agent view
					if (savedFilters) {
						setActiveFilters(savedFilters);
						setSavedFilters(null);
					}
					return;
				}
			}
		}

		// Escape: return to browser from session/detail view
		if (key.escape && (viewMode === 'session' || viewMode === 'detail')) {
			setViewMode('browser');
			setSavedFilters(null);
			// Find and select the last selected session
			if (lastSelectedSession) {
				const index = browserItems.findIndex(
					session => session.path === lastSelectedSession
				);
				if (index !== -1) {
					setSelectedIndex(index);
				} else {
					setSelectedIndex(0);
				}
			} else {
				setSelectedIndex(0);
			}
			setCurrentSessionPath(null);
			setCurrentProject(null);
			setData(null);
			setAgentViewData(null);
			return;
		}

		// Enter filter mode with '/' in browser
		if (input === '/' && viewMode === 'browser') {
			setBrowserFilterMode(true);
			setBrowserFilterInput('');
			return;
		}

		// Clear filter with Escape (when not in filter mode but filter is active)
		if (key.escape && browserFilterQuery && viewMode === 'browser') {
			setBrowserFilterQuery('');
			setSelectedIndex(0);
			return;
		}

		// Browser mode navigation
		if (viewMode === 'browser') {
			if (key.upArrow && selectedIndex > 0) {
				setSelectedIndex(prev => prev - 1);
			} else if (key.downArrow && selectedIndex < filteredBrowserItems.length - 1) {
				setSelectedIndex(prev => prev + 1);
			} else if (key.return || key.rightArrow) {
				// Select session and switch to session view
				const session = filteredBrowserItems[selectedIndex];
				if (session) {
					setLastSelectedSession(session.path);
					setCurrentSessionPath(session.path);
					setCurrentSessionDir(path.dirname(session.path));
					setCurrentProject(session.projectName);
					// Reset filters when navigating from browser to session
					setActiveFilters({
						user: true,
						assistant: true,
						tool: true,
						thinking: true,
						subagent: true,
					});
					setSavedFilters(null);
					setViewMode('session');
					setSelectedIndex(0);
				}
			}
			return;
		}

		// Left arrow: return to session view from detail view
		if (key.leftArrow && viewMode === 'detail') {
			setViewMode('session');
			setDetailScrollOffset(0);
			return;
		}

		// Right arrow: switch to detail view or agent view
		if (key.rightArrow && viewMode === 'session') {
			const selectedLog = filteredLogs[selectedIndex];
			// If it's a subagent log, load agent history
			if (selectedLog?.type === 'subagent' && selectedLog.agentId && currentSessionDir) {
				const agentFilePath = path.join(currentSessionDir, `agent-${selectedLog.agentId}.jsonl`);
				if (fs.existsSync(agentFilePath)) {
					try {
						const agentLogs = parseLogFile(agentFilePath);
						// Assign sequential IDs to agent logs
						agentLogs.forEach((log, index) => {
							log.id = index + 1;
						});
						const agentData = {
							agentId: selectedLog.agentId,
							logs: agentLogs,
							parentLogs: data?.logs || []
						};
						setAgentViewData(agentData);
						setViewMode('session'); // Stay in session mode but with agent logs
						setSelectedIndex(0);
						setDetailScrollOffset(0);
						// Save current filters and reset when entering agent view
						setSavedFilters(activeFilters);
						setActiveFilters({
							user: true,
							assistant: true,
							tool: true,
							thinking: true,
							subagent: true,
						});
						return;
					} catch (e) {
						// Fall through to detail view on error
					}
				}
			}
			setViewMode('detail');
			setDetailScrollOffset(0);
			return;
		}

		// Handle scrolling in detail mode
		if (viewMode === 'detail') {
			if (key.upArrow) {
				setDetailScrollOffset(prev => Math.max(0, prev - 1));
			} else if (key.downArrow) {
				setDetailScrollOffset(prev => prev + 1);
			} else if (input === 'u') {
				setDetailScrollOffset(prev => Math.max(0, prev - 10));
			} else if (input === 'd') {
				setDetailScrollOffset(prev => prev + 10);
			} else if (input === 't') {
				setDetailScrollOffset(0);
			} else if (input === 'b') {
				// Jump to bottom - calculate max offset
				const log = filteredLogs[selectedIndex];
				if (log && log.content) {
					const detailAvailableHeight = 30;
					const contentLines = log.content.split('\n');
					const totalLines = contentLines.length;
					const maxOffset = Math.max(0, totalLines - detailAvailableHeight);
					setDetailScrollOffset(maxOffset);
				}
			}
			return;
		}

		// Filter toggles (work in session mode)
		if (viewMode === 'session') {
			if (input === '1') {
				setActiveFilters(prev => ({...prev, user: !prev.user}));
				return;
			} else if (input === '2') {
				setActiveFilters(prev => ({...prev, assistant: !prev.assistant}));
				return;
			} else if (input === '3') {
				setActiveFilters(prev => ({...prev, tool: !prev.tool}));
				return;
			} else if (input === '4') {
				setActiveFilters(prev => ({...prev, thinking: !prev.thinking}));
				return;
			} else if (input === '5') {
				setActiveFilters(prev => ({...prev, subagent: !prev.subagent}));
				return;
			}
		}

		// Only handle list navigation in session mode
		if (viewMode === 'session') {
			if (key.upArrow) {
				setSelectedIndex(prev => findNextSelectable(prev, -1));
			} else if (key.downArrow) {
				setSelectedIndex(prev => findNextSelectable(prev, 1));
			} else if (input === 'd') {
				// d: jump down 10 messages
				setSelectedIndex(prev => findNthSelectable(prev, 1, 10));
			} else if (input === 'u') {
				// u: jump up 10 messages
				setSelectedIndex(prev => findNthSelectable(prev, -1, 10));
			} else if (input === 't') {
				// t: jump to top
				const firstSelectable = filteredLogs.findIndex(log => isSelectable(log));
				if (firstSelectable !== -1) setSelectedIndex(firstSelectable);
			} else if (input === 'b') {
				// b: jump to bottom
				for (let i = filteredLogs.length - 1; i >= 0; i--) {
					if (isSelectable(filteredLogs[i])) {
						setSelectedIndex(i);
						break;
					}
				}
			} else if (key.return) {
				const selectedLog = filteredLogs[selectedIndex];
				if (selectedLog?.content) {
					setCollapsedStates(prev => ({
						...prev,
						[selectedLog.id]: !prev[selectedLog.id],
					}));
				}
			} else if (input === 'a') {
				// Expand all
				const newStates = {};
				filteredLogs.forEach(log => {
					newStates[log.id] = false;
				});
				setCollapsedStates(newStates);
			} else if (input === 'c') {
				// Collapse all
				const newStates = {};
				filteredLogs.forEach(log => {
					newStates[log.id] = true;
				});
				setCollapsedStates(newStates);
			}
		}
	});

	// Render error state
	if (error) {
		return (
			<Box flexDirection="column">
				<Box marginBottom={1}>
					<Text color="red">Error: {error}</Text>
				</Box>
				<Browser
					width={width}
					browserItems={filteredBrowserItems}
					selectedIndex={selectedIndex}
					browserFilterMode={browserFilterMode}
					browserFilterInput={browserFilterInput}
					browserFilterQuery={browserFilterQuery}
					/>
			</Box>
		);
	}

	// Render Browser view
	if (viewMode === 'browser') {
		return (
			<Browser
				width={width}
				browserItems={filteredBrowserItems}
				selectedIndex={selectedIndex}
				browserFilterMode={browserFilterMode}
				browserFilterInput={browserFilterInput}
				browserFilterQuery={browserFilterQuery}
			/>
		);
	}

	// Render Detail view
	if (viewMode === 'detail') {
		const selectedLog = filteredLogs[selectedIndex];
		return (
			<Details
				width={width}
				log={selectedLog}
				sessionId={data?.sessionId}
				agentViewData={agentViewData}
				detailScrollOffset={detailScrollOffset}
				availableHeight={30}
			/>
		);
	}

	// Render Session view
	return (
		<Session
			width={width}
			logs={data?.logs || []}
			filteredLogs={filteredLogs}
			sessionId={data?.sessionId}
			project={currentProject || data?.project}
			startDatetime={data?.startDatetime}
			agentViewData={agentViewData}
			selectedIndex={selectedIndex}
			viewportSize={viewportSize}
			activeFilters={activeFilters}
			searchMode={searchMode}
			searchQuery={searchQuery}
			activeSearch={activeSearch}
			collapsedStates={collapsedStates}
		/>
	);
}
