import React, {useState, useEffect} from 'react';
import {Box, Text, useInput, useStdout} from 'ink';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {loadSession, loadSessionMetadata} from './parser.js';
import Browser from './views/Browser/index.js';
import Session from './views/Session/index.js';
import Details from './views/Details/index.js';

export default function App({sessionPath = null}) {
	const {stdout} = useStdout();
	const width = stdout?.columns || 80;

	// Data state
	const [error, setError] = useState(null);
	const [currentSessionDir, setCurrentSessionDir] = useState(null);
	const [currentSessionPath, setCurrentSessionPath] = useState(null);
	const [sessionData, setSessionData] = useState(null);

	// View state
	const [viewMode, setViewMode] = useState('browser');

	// Browser state
	const [projects, setProjects] = useState([]);
	const [browserItems, setBrowserItems] = useState([]);
	const [lastSelectedSession, setLastSelectedSession] = useState(null);
	const [browserFilterMode, setBrowserFilterMode] = useState(false);
	const [browserFilterInput, setBrowserFilterInput] = useState('');
	const [browserFilterQuery, setBrowserFilterQuery] = useState('');
	const activeFilterQuery = browserFilterMode
		? browserFilterInput
		: browserFilterQuery;
	const filteredBrowserItems = browserItems.filter(item => {
		if (!activeFilterQuery) return true;
		const projectPath = item.project || item.projectName || '';
		return projectPath.toLowerCase().includes(activeFilterQuery.toLowerCase());
	});

	// Session state
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
	const [savedSelectedIndex, setSavedSelectedIndex] = useState(null); // Save selectedIndex when entering agent view
	const [searchMode, setSearchMode] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [activeSearch, setActiveSearch] = useState('');

	// Detail state
	const [detailScrollOffset, setDetailScrollOffset] = useState(0);

	// Initialize currentSessionPath from prop if provided
	useEffect(() => {
		if (sessionPath) {
			setCurrentSessionPath(sessionPath);
		}
	}, [sessionPath]);

	// Load project and session data on mount
	useEffect(() => {
		const claudeDir = path.join(os.homedir(), '.claude', 'projects');

		try {
			if (!fs.existsSync(claudeDir)) {
				setProjects([]);
				return;
			}

			const projectDirs = fs
				.readdirSync(claudeDir, {withFileTypes: true})
				.filter(dirent => dirent.isDirectory())
				.map(dirent => dirent.name);

			const projectsData = projectDirs
				.map(projectDir => {
					const projectPath = path.join(claudeDir, projectDir);
					const projectStats = fs.statSync(projectPath);

					const sessionFiles = fs
						.readdirSync(projectPath)
						.filter(
							file => file.endsWith('.jsonl') && !file.startsWith('agent-'),
						);

					const sessions = sessionFiles
						.map(file => {
							const filePath = path.join(projectPath, file);
							const metadata = loadSessionMetadata(filePath);

							return {
								session: path.parse(file).name,
								project: metadata.project,
								usage: metadata.usage,
								logCount: metadata.logCount,
								created: metadata.created ? new Date(metadata.created) : null,
								modified: metadata.modified
									? new Date(metadata.modified)
									: null,
								// Keep legacy fields for compatibility
								name: file,
								path: filePath,
								projectName: projectDir,
								mtime: metadata.modified
									? new Date(metadata.modified)
									: new Date(),
								birthtime: metadata.created
									? new Date(metadata.created)
									: new Date(),
							};
						})
                        .filter(project => project.logCount > 0)
						.sort((a, b) => b.mtime - a.mtime);

					const lastModified =
						sessions.length > 0 ? sessions[0].mtime : projectStats.mtime;

                    const projectName = 
                        sessions.length > 0 ? sessions[0].project : projectDir;

					return {
						name: projectName,
						path: projectPath,
						sessions,
						birthtime: projectStats.birthtime, // Project creation time
						mtime: lastModified, // Last modified (most recent session)
					};
				})
				.filter(project => project.sessions.length > 0);

			setProjects(projectsData);
		} catch (error) {
			console.error('Error scanning projects:', error);
			setProjects([]);
		}
	}, []);

	// Build flat list of sessions on project change
	useEffect(() => {
		const sessions = [];
		const sortedProjects = [...projects].sort(
			(a, b) => a.name.localeCompare(b.name), // sort alphabetically
		);
		sortedProjects.forEach(project => {
			const projectPath = project.path;
			// Sessions are already sorted by mtime
			project.sessions.forEach(session => {
				sessions.push({
					...session,
					projectPath: projectPath,
				});
			});
		});
		setBrowserItems(sessions);
	}, [projects]);

	// Load session data and switch to session view on session select
	useEffect(() => {
		if (!currentSessionPath) {
			setSessionData(null);
			return;
		}

		try {
			const loadedSessionData = loadSession(currentSessionPath);
			setSessionData(loadedSessionData);
			setError(null);
			setViewMode('session');
		} catch (err) {
			setError(err.message);
			setSessionData(null);
		}
	}, [currentSessionPath]);

	// Reset collapsed states when logs change
	useEffect(() => {
		const initial = {};
		const logsToInit = sessionData?.logs || [];
		logsToInit.forEach(log => {
			initial[log.id] = true; // Start all collapsed
		});
		setCollapsedStates(initial);
	}, [sessionData?.logs]);

	// Reset selected index on navigation to session from browser
	useEffect(() => {
		if (viewMode == 'session') {
			if (!savedSelectedIndex) {
				setSelectedIndex(0);
			}
		}
	}, [viewMode]);

	// Current logs from session
	const currentLogs = sessionData?.logs || [];

	// Parse search query into field filters
	const parseSearchQuery = query => {
		if (!query.trim()) return [];
		const filters = [];
		const parts = query.match(/(\w+):([^\s]+)/g) || [];
		parts.forEach(part => {
			const [field, value] = part.split(':');
			filters.push({field: field.toLowerCase(), value: value.toLowerCase()});
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
	// Map tool_use and tool_result to the 'tool' filter category
	const getFilterCategory = (logType) => {
		if (logType === 'tool_use' || logType === 'tool_result') {
			return 'tool';
		}
		return logType;
	};

	const filteredLogs = currentLogs.filter(
		log => activeFilters[getFilterCategory(log.type)] && matchesSearch(log, searchFilters),
	);

	// Helper to check if a log is selectable
	const isSelectable = log => {
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
			if (
				nextIndex === currentIndex ||
				(direction > 0 && nextIndex >= filteredLogs.length - 1) ||
				(direction < 0 && nextIndex <= 0)
			) {
				break; // Reached end of list
			}
			count++;
		}
		return nextIndex;
	};

	// Calculate viewport size
	const terminalHeight = stdout?.rows || 40;
	const logsListHeight = Math.max(15, terminalHeight - 40);
	const browserHeight = Math.max(15, terminalHeight - 40);

	useInput((input, key) => {
		if (viewMode === 'browser') {
			if (browserFilterMode) {
				if (key.return) {
					setBrowserFilterQuery(browserFilterInput);
					setBrowserFilterMode(false);
					return;
				} else if (key.escape) {
					const currentItem = filteredBrowserItems[selectedIndex];
					setBrowserFilterInput('');
					setBrowserFilterQuery('');
					setBrowserFilterMode(false);
					if (currentItem) {
						const newIndex = browserItems.findIndex(
							item => item.session === currentItem.session,
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
					setSelectedIndex(prev => prev - 1);
					return;
				} else if (
					key.downArrow &&
					selectedIndex < filteredBrowserItems.length - 1
				) {
					setSelectedIndex(prev => prev + 1);
					return;
				} else if (key.backspace || key.delete) {
					const newInput = browserFilterInput.slice(0, -1);
					const currentItem = filteredBrowserItems[selectedIndex];
					setBrowserFilterInput(newInput);
					if (currentItem) {
						const projectPath =
							currentItem.project || currentItem.projectName || '';
						const stillMatches =
							!newInput ||
							projectPath.toLowerCase().includes(newInput.toLowerCase());

						if (!stillMatches) {
							setSelectedIndex(0);
						}
					}
					return;
				} else if (input && !key.ctrl && !key.meta) {
					const newInput = browserFilterInput + input;
					const currentItem = filteredBrowserItems[selectedIndex];
					setBrowserFilterInput(newInput);
					if (currentItem) {
						const projectPath =
							currentItem.project || currentItem.projectName || '';
						const stillMatches = projectPath
							.toLowerCase()
							.includes(newInput.toLowerCase());

						if (!stillMatches) {
							setSelectedIndex(0);
						} else {
							setSelectedIndex(0);
						}
					}
					return;
				}

				return;
			}

			if (input === '/') {
				setBrowserFilterMode(true);
				setBrowserFilterInput('');
				return;
			}

			if (key.upArrow && selectedIndex > 0) {
				setSelectedIndex(prev => prev - 1);
			} else if (
				key.downArrow &&
				selectedIndex < filteredBrowserItems.length - 1
			) {
				setSelectedIndex(prev => prev + 1);
			} else if (input === 'd') {
				// d: jump down 10
				setSelectedIndex(prev =>
					Math.min(filteredBrowserItems.length - 1, prev + 10),
				);
			} else if (input === 'u') {
				// u: jump up 10
				setSelectedIndex(prev => Math.max(0, prev - 10));
			} else if (input === 't') {
				// t: jump to top
				setSelectedIndex(0);
			} else if (input === 'b') {
				// b: jump to bottom
				setSelectedIndex(filteredBrowserItems.length - 1);
			} else if (key.return || key.rightArrow) {
				const session = filteredBrowserItems[selectedIndex];
				if (session) {
					setLastSelectedSession(session.path);
					setCurrentSessionPath(session.path);
					setCurrentSessionDir(path.dirname(session.path));
					setActiveFilters({
						user: true,
						assistant: true,
						tool: true,
						thinking: true,
						subagent: true,
					});
					setSavedFilters(null);
				}
			}

			if (key.escape && browserFilterQuery) {
				setBrowserFilterQuery('');
				setSelectedIndex(0);
				return;
			}

			return;
		}

		if (viewMode === 'session') {
			if (searchMode) {
				if (key.return) {
					setActiveSearch(searchQuery);
					setSearchMode(false);
					return;
				} else if (key.escape) {
					setSearchQuery('');
					setSearchMode(false);
					return;
				} else if (key.backspace || key.delete) {
					setSearchQuery(prev => prev.slice(0, -1));
					return;
				} else if (input && !key.ctrl && !key.meta) {
					setSearchQuery(prev => prev + input);
					return;
				}
				return;
			}

			if (input === '/') {
				setSearchMode(true);
				setSearchQuery('');
				return;
			}

			if (key.escape && activeSearch) {
				setActiveSearch('');
				return;
			}

			// Hot Keys
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

			// Navigation
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
				const firstSelectable = filteredLogs.findIndex(log =>
					isSelectable(log),
				);
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
			} else if (key.rightArrow) {
				const selectedLog = filteredLogs[selectedIndex];
				// If it's a subagent start log (not end), navigate into agent session
				if (
					selectedLog?.type === 'subagent' &&
					!selectedLog.isLast &&
					selectedLog.agentId &&
					currentSessionDir
				) {
					const agentFilePath = path.join(
						currentSessionDir,
						`agent-${selectedLog.agentId}.jsonl`,
					);
					if (fs.existsSync(agentFilePath)) {
						// Save current selectedIndex before navigating
						setSavedSelectedIndex(selectedIndex);
						// Navigate to agent session
						setCurrentSessionPath(agentFilePath);
						setSelectedIndex(0);
						setDetailScrollOffset(0);
						return;
					}
				}
				setViewMode('detail');
				setDetailScrollOffset(0);
				return;
			} else if (key.escape) {
				// If we're in an agent session, go back to parent session
				if (sessionData?.parentSessionId && currentSessionDir) {
					const parentSessionPath = path.join(
						currentSessionDir,
						`${sessionData.parentSessionId}.jsonl`,
					);
					if (fs.existsSync(parentSessionPath)) {
						setCurrentSessionPath(parentSessionPath);
						// Restore saved selectedIndex if available
						if (savedSelectedIndex !== null) {
							setSelectedIndex(savedSelectedIndex);
							setSavedSelectedIndex(null);
						} else {
							setSelectedIndex(0);
						}
						return;
					}
				}

				// Otherwise go back to browser
				setViewMode('browser');
				setSavedFilters(null);
				setSavedSelectedIndex(null);
				if (lastSelectedSession) {
					const index = browserItems.findIndex(
						session => session.path === lastSelectedSession,
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
				setSessionData(null);
				return;
			}
		}

		if (viewMode === 'detail') {
			// Navigation
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
				const log = filteredLogs[selectedIndex];
				if (log && log.content) {
					const detailAvailableHeight = 30;
					const contentLines = log.content.split('\n');
					const totalLines = contentLines.length;
					const maxOffset = Math.max(0, totalLines - detailAvailableHeight);
					setDetailScrollOffset(maxOffset);
				}
			} else if (key.leftArrow) {
				if (selectedIndex > 0) {
					setSelectedIndex(prev => prev - 1);
					setDetailScrollOffset(0);
				}
			} else if (key.rightArrow) {
				if (selectedIndex < filteredLogs.length - 1) {
					setSelectedIndex(prev => prev + 1);
					setDetailScrollOffset(0);
				}
			} else if (key.escape) {
				setViewMode('session');
				return;
			}

			return;
		}
	});

	if (error) {
		return (
			<Box flexDirection="column">
				<Box marginBottom={1}>
					<Text color="red">Error: {error}</Text>
				</Box>
				<Browser
					width={width}
					sessions={filteredBrowserItems}
					selectedIndex={selectedIndex}
					filterMode={browserFilterMode}
					filterInput={browserFilterInput}
					filterQuery={browserFilterQuery}
					browserHeight={browserHeight}
				/>
			</Box>
		);
	}

	if (viewMode === 'session') {
		return (
			<Session
				session={sessionData}
				filteredLogs={filteredLogs}
				selectedIndex={selectedIndex}
				activeFilters={activeFilters}
				searchMode={searchMode}
				searchQuery={searchQuery}
				activeSearch={activeSearch}
				collapsedStates={collapsedStates}
				logsListHeight={logsListHeight}
				width={width}
			/>
		);
	}

	if (viewMode === 'detail') {
		const selectedLog = filteredLogs[selectedIndex];
		if (!selectedLog) return null;

		return <Details log={selectedLog} width={width} />;
	}

	return (
		<Browser
			width={Math.min(width, 124)}
			sessions={filteredBrowserItems}
			selectedIndex={selectedIndex}
			filterMode={browserFilterMode}
			filterInput={browserFilterInput}
			filterQuery={browserFilterQuery}
			browserHeight={browserHeight}
		/>
	);
}
