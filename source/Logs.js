import React, {useState, useEffect, useMemo} from 'react';
import {Box, Text, useInput, useStdout} from 'ink';
import {TitledBox} from '@mishieck/ink-titled-box';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {parseLogFile} from './parser.js';

// Sample data generator
export const generateSampleLogs = () => [
	{
		id: 1,
		type: 'user',
		timestamp: '00:00:00',
		content: 'Can you help me with this complex task?',
		collapsed: true,
		usage: 150,
	},
	{
		id: 2,
		type: 'assistant',
		timestamp: '00:00:02',
		content: 'I can help with that. Let me start multiple analyses...',
		collapsed: true,
		usage: 320,
	},
	// Three agents start
	{
		id: 3,
		type: 'subagent',
		timestamp: '00:00:05',
		agentId: 'agent-1',
		content: 'Code analysis',
		collapsed: true,
		isLast: false,
		usage: 450,
	},
	{
		id: 4,
		type: 'subagent',
		timestamp: '00:00:06',
		agentId: 'agent-2',
		content: 'Dependency check',
		collapsed: true,
		isLast: false,
		usage: 380,
	},
	{
		id: 5,
		type: 'subagent',
		timestamp: '00:00:07',
		agentId: 'agent-3',
		content: 'Security audit',
		collapsed: true,
		isLast: false,
		usage: 520,
	},
	{
		id: 6,
		type: 'tool',
		timestamp: '00:00:08',
		content: 'Reading multiple files...',
		collapsed: true,
		usage: 200,
	},
	// Agent-2 (middle) ends first
	{
		id: 7,
		type: 'subagent',
		timestamp: '00:00:10',
		agentId: 'agent-2',
		content: 'Dependencies checked',
		collapsed: true,
		isLast: true,
		usage: 290,
	},
	// Agent-4 starts (should reuse agent-2's position)
	{
		id: 8,
		type: 'subagent',
		timestamp: '00:00:11',
		agentId: 'agent-4',
		content: 'Performance analysis',
		collapsed: true,
		isLast: false,
		usage: 410,
	},
	{
		id: 9,
		type: 'tool',
		timestamp: '00:00:12',
		content: 'Running benchmarks...',
		collapsed: true,
		usage: 180,
	},
	// Agent-1 (leftmost) ends
	{
		id: 10,
		type: 'subagent',
		timestamp: '00:00:14',
		agentId: 'agent-1',
		content: 'Code analysis complete',
		collapsed: true,
		isLast: true,
		usage: 350,
	},
	// Agent-5 starts (should reuse agent-1's position)
	{
		id: 11,
		type: 'subagent',
		timestamp: '00:00:15',
		agentId: 'agent-5',
		content: 'Documentation check',
		collapsed: true,
		isLast: false,
		usage: 330,
	},
	{
		id: 12,
		type: 'tool',
		timestamp: '00:00:16',
		content: 'Parsing documentation...',
		collapsed: true,
		usage: 150,
	},
	// Agent-3 ends
	{
		id: 13,
		type: 'subagent',
		timestamp: '00:00:18',
		agentId: 'agent-3',
		content: 'Security audit complete',
		collapsed: true,
		isLast: true,
		usage: 480,
	},
	// Agent-4 ends
	{
		id: 14,
		type: 'subagent',
		timestamp: '00:00:20',
		agentId: 'agent-4',
		content: 'Performance analysis done',
		collapsed: true,
		isLast: true,
		usage: 390,
	},
	// Agent-5 ends (last one)
	{
		id: 15,
		type: 'subagent',
		timestamp: '00:00:22',
		agentId: 'agent-5',
		content: 'Documentation verified',
		collapsed: true,
		isLast: true,
		usage: 270,
	},
	{
		id: 16,
		type: 'assistant',
		timestamp: '00:00:25',
		content: 'All analyses complete!',
		collapsed: true,
		usage: 420,
	},
];

// Color palette for subagents
const AGENT_COLORS = ['#2ecc71', '#3498db', '#9b59b6', '#f1c40f', '#e67e22', '#e74c3c'];

export default function Logs({width = 80, logs = [], sessionId = null, onSessionSelect, onReturnToBrowser, onAgentView}) {
	const {stdout} = useStdout();
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [viewMode, setViewMode] = useState('browser'); // 'browser', 'list', or 'detail'
	const [detailScrollOffset, setDetailScrollOffset] = useState(0);
	const [projects, setProjects] = useState([]);
	const [expandedProjects, setExpandedProjects] = useState(new Set());
	const [browserItems, setBrowserItems] = useState([]);
	const [lastSelectedSession, setLastSelectedSession] = useState(null);
	const [currentSessionDir, setCurrentSessionDir] = useState(null);
	const [agentViewData, setAgentViewData] = useState(null); // {agentId, logs, parentLogs}
	const [localSessionId, setLocalSessionId] = useState(null); // Store sessionId locally for immediate title updates
	const [collapsedStates, setCollapsedStates] = useState(() => {
		const initial = {};
		logs.forEach(log => {
			initial[log.id] = log.collapsed;
		});
		return initial;
	});
	const [activeFilters, setActiveFilters] = useState({
		user: true,
		assistant: true,
		tool: true,
		thinking: true,
		subagent: true,
	});
	const [savedFilters, setSavedFilters] = useState(null); // Store filters before entering agent view

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
				const sessions = fs.readdirSync(projectPath)
					.filter(file => file.endsWith('.jsonl') && !file.startsWith('agent-'))
					.map(file => {
						const filePath = path.join(projectPath, file);
						const stats = fs.statSync(filePath);
						return {
							name: file,
							path: filePath,
							projectName,
							mtime: stats.mtime
						};
					})
					.sort((a, b) => b.mtime - a.mtime); // Sort most recent first

				return {
					name: projectName,
					path: projectPath,
					sessions
				};
			}).filter(project => project.sessions.length > 0);

			setProjects(projectsData);
		} catch (error) {
			console.error('Error scanning projects:', error);
			setProjects([]);
		}
	}, []);

	// Build flat list of browser items for navigation
	useEffect(() => {
		const items = [];
		projects.forEach(project => {
			items.push({ type: 'project', data: project });
			if (expandedProjects.has(project.name)) {
				project.sessions.forEach(session => {
					items.push({ type: 'session', data: session, projectName: project.name });
				});
			}
		});
		setBrowserItems(items);
	}, [projects, expandedProjects]);

	// Reset collapsed states when logs or agent view changes
	useEffect(() => {
		const initial = {};
		const logsToInit = agentViewData ? agentViewData.logs : logs;
		logsToInit.forEach(log => {
			initial[log.id] = true; // Start all collapsed
		});
		setCollapsedStates(initial);
	}, [logs, agentViewData]);

	// Use agent logs if in agent view, otherwise use session logs
	const currentLogs = agentViewData ? agentViewData.logs : logs;

	// Filter logs based on active filters
	const filteredLogs = currentLogs.filter(log => activeFilters[log.type]);

	// Memoize content lines for detail view (only when in detail mode)
	const selectedLog = filteredLogs[selectedIndex];
	const contentLines = useMemo(
		() => (selectedLog?.content || '').split('\n'),
		[selectedLog?.id, selectedLog?.content]
	);

	// Calculate viewport: how many logs to show at once
	// Reserve space for Summary (8 lines), box borders (4 lines), help text (2 lines)
	const terminalHeight = stdout?.rows || 40;
	const availableHeight = terminalHeight - 14;
	// Limit viewport to reduce re-render flashing (each log takes 1-2 lines when collapsed)
	// Show enough to fill screen but not so many that scrolling causes excessive re-renders
	const viewportSize = Math.min(25, Math.max(15, availableHeight));

	// Helper to check if a log is selectable (has content or can be expanded)
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

	// Handle keyboard input
	useInput((input, key) => {
		// Handle navigation within agent view
		if (agentViewData) {
			// Escape: return to welcome from any mode
			if (key.escape) {
				setAgentViewData(null);
				setViewMode('browser');
				setSelectedIndex(0);
				setSavedFilters(null); // Clear saved filters when returning to welcome
				if (onReturnToBrowser) {
					onReturnToBrowser(); // Clear session state in parent
				}
				if (onAgentView) {
					onAgentView(null); // Notify parent we're exiting agent view
				}
				return;
			}

			// Left arrow: return to agent list from detail, or exit agent view from list
			if (key.leftArrow) {
				if (viewMode === 'detail') {
					setViewMode('list');
					setDetailScrollOffset(0);
					return;
				} else if (viewMode === 'list') {
					setAgentViewData(null);
					setSelectedIndex(0);
					// Restore saved filters when exiting agent view
					if (savedFilters) {
						setActiveFilters(savedFilters);
						setSavedFilters(null);
					}
					if (onAgentView) {
						onAgentView(null); // Notify parent we're exiting agent view
					}
					return;
				}
			}
		}

		// Escape: return to browser from list/detail view
		if (key.escape && (viewMode === 'list' || viewMode === 'detail')) {
			setViewMode('browser');
			setSavedFilters(null); // Clear saved filters when returning to browser
			// Find and select the last selected session
			if (lastSelectedSession) {
				const index = browserItems.findIndex(
					item => item.type === 'session' && item.data.path === lastSelectedSession
				);
				if (index !== -1) {
					setSelectedIndex(index);
				} else {
					setSelectedIndex(0);
				}
			} else {
				setSelectedIndex(0);
			}
			if (onReturnToBrowser) {
				onReturnToBrowser();
			}
			return;
		}

		// Browser mode navigation
		if (viewMode === 'browser') {
			if (key.upArrow && selectedIndex > 0) {
				setSelectedIndex(prev => prev - 1);
			} else if (key.downArrow && selectedIndex < browserItems.length - 1) {
				setSelectedIndex(prev => prev + 1);
			} else if (key.return || key.rightArrow) {
				const item = browserItems[selectedIndex];
				if (item?.type === 'project') {
					// Toggle project expansion
					setExpandedProjects(prev => {
						const next = new Set(prev);
						if (next.has(item.data.name)) {
							next.delete(item.data.name);
						} else {
							next.add(item.data.name);
						}
						return next;
					});
				} else if (item?.type === 'session') {
					// Select session and switch to list view
					setLastSelectedSession(item.data.path);
					setCurrentSessionDir(path.dirname(item.data.path));
					// Extract sessionId from filename for immediate title update
					const sessionFileName = path.basename(item.data.path, '.jsonl');
					setLocalSessionId(sessionFileName);
					if (onSessionSelect) {
						onSessionSelect(item.data.path, item.data.projectName);
					}
					// Reset filters when navigating from welcome to session
					setActiveFilters({
						user: true,
						assistant: true,
						tool: true,
						thinking: true,
						subagent: true,
					});
					setSavedFilters(null);
					setViewMode('list');
					setSelectedIndex(0);
				}
			} else if (key.leftArrow) {
				// Collapse current project or parent project
				const item = browserItems[selectedIndex];
				if (item?.type === 'project') {
					// Collapse this project if expanded
					setExpandedProjects(prev => {
						const next = new Set(prev);
						next.delete(item.data.name);
						return next;
					});
				} else if (item?.type === 'session') {
					// Collapse parent project
					setExpandedProjects(prev => {
						const next = new Set(prev);
						next.delete(item.projectName);
						return next;
					});
				}
			}
			return;
		}

		// Left arrow: return to list view from detail view
		if (key.leftArrow && viewMode === 'detail') {
			setViewMode('list');
			setDetailScrollOffset(0); // Reset scroll when returning
			return;
		}

		// Right arrow: switch to detail view or agent view
		if (key.rightArrow && viewMode === 'list') {
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
							parentLogs: logs
						};
						setAgentViewData(agentData);
						setViewMode('list'); // Ensure we're in list mode
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
						if (onAgentView) {
							onAgentView(agentData); // Notify parent we're entering agent view
						}
						return;
					} catch (e) {
						// Fall through to detail view on error
					}
				}
			}
			setViewMode('detail');
			setDetailScrollOffset(0); // Reset scroll when entering
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
					const terminalHeight = stdout?.rows || 40;
					const availableHeight = terminalHeight - 17;
					const contentLines = log.content.split('\n');
					const totalLines = contentLines.length;
					const maxOffset = Math.max(0, totalLines - availableHeight);
					setDetailScrollOffset(maxOffset);
				}
			}
			return;
		}

		// Filter toggles (work in both modes)
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

		// Only handle list navigation in list mode
		if (viewMode === 'list') {
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
				if (selectedLog.content) {
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

	// Track active agents and assign colors
	const activeAgents = new Map(); // agentId -> { pos, color }
	const agentColorMap = new Map();
	let colorIndex = 0;

	// Render the logs
	const renderLog = (log, index) => {
		const isSelected = index === selectedIndex;
		const isCollapsed = collapsedStates[log.id];

		// Update active agents tracking
		if (log.type === 'subagent' && !log.isLast) {
			if (!agentColorMap.has(log.agentId)) {
				agentColorMap.set(log.agentId, AGENT_COLORS[colorIndex % AGENT_COLORS.length]);
				colorIndex++;
			}
			// Calculate arrow length: minimum 24 dashes, then +2 for each additional agent
			// Find the lowest available position index by checking which indices are in use
			const usedIndices = new Set(
				Array.from(activeAgents.values()).map(agent => (agent.pos - 24) / 2)
			);
			let agentIndex = 0;
			while (usedIndices.has(agentIndex)) {
				agentIndex++;
			}
			const arrowLength = 24 + (agentIndex * 2);

			activeAgents.set(log.agentId, {
				pos: arrowLength,  // Position where the vertical bar will be (in dashes)
				color: agentColorMap.get(log.agentId),
			});
		}

		// Build vertical bars suffix (comes AFTER the message content)
		// Returns JSX with colored bars positioned at exact arrow endpoint positions
		const renderVerticalBarsSuffix = (prefixLength = 0, keyPrefix = '') => {
			// Get current active agents each time this is called (not cached)
			const currentActiveAgents = Array.from(activeAgents.entries());
			if (currentActiveAgents.length === 0) return null;

			// Sort agents by position
			const sortedAgents = [...currentActiveAgents].sort((a, b) => a[1].pos - b[1].pos);

			// Filter out agents whose bars would be covered by the prefix (to the left)
			const visibleAgents = sortedAgents.filter(([agentId, agent]) => {
				const targetIdx = 11 + agent.pos;
				return targetIdx >= prefixLength; // Only show bars at or after the prefix
			});

			if (visibleAgents.length === 0) return null;

			// Calculate spacing: "* subagent " is 11 chars (indices 0-10), then dashes, then "│"
			// The bar "│" itself is at index (11 + agent.pos) in 0-indexed
			let result = [];
			let currentPos = prefixLength;

			visibleAgents.forEach(([agentId, agent]) => {
				const targetIdx = 11 + agent.pos; // 0-indexed position where "│" should be
				const spacing = targetIdx - currentPos;
				result.push(
					<Text key={`${keyPrefix}-bar-${agentId}`} color={agent.color}>
						{' '.repeat(spacing)}│
					</Text>
				);
				currentPos = targetIdx + 1;
			});

			return <>{result}</>;
		};

		// Render subagent stop arrow
		const renderSubagentStop = () => {
			const agentData = activeAgents.get(log.agentId);
			if (!agentData) return null;

			const arrowLength = agentData.pos;
			// The corner "╯" needs to be at position (11 + arrowLength) to align with vertical bar
			// "  agentId [timestamp] ◂" - variable length based on agentId
			const prefix = `  ${log.agentId} [${log.timestamp}] ◂`;
			const prefixLength = prefix.length;
			// We need: prefixLength + dashCount = 11 + arrowLength (position of corner)
			const dashCount = (11 + arrowLength) - prefixLength;

			// Build the stop arrow with spacing for alignment
			const textBeforeArrow = `  ${log.agentId} `;
			const timestamp = `[${log.timestamp}]`;
			const arrow = ' ◂' + '─'.repeat(dashCount);
			const totalPrefixLen = textBeforeArrow.length + timestamp.length + arrow.length;

			// Remove this agent before rendering suffix bars so it doesn't show its own bar
			activeAgents.delete(log.agentId);

			return (
				<Box>
					<Text color={agentData.color}>
						{textBeforeArrow}
						<Text dimColor>{timestamp}</Text>
						{arrow}{'╯'}
					</Text>
					{renderVerticalBarsSuffix(totalPrefixLen + 1, `${log.id}-stop`)}
				</Box>
			);
		};

		// Clean up agent after rendering stop
		if (log.type === 'subagent' && log.isLast) {
			const stopElement = renderSubagentStop();
			return <Box key={log.id}>{stopElement}</Box>;
		}

		// For subagent start, show the arrow instead of regular title
		if (log.type === 'subagent' && !log.isLast) {
			const agent = activeAgents.get(log.agentId);
			// "> agentId [timestamp] " - variable length based on agentId
			const prefix = `> ${log.agentId} [${log.timestamp}] `;
			const prefixLength = prefix.length;
			// Corner "╮" should be at position (11 + agent.pos)
			const dashCount = (11 + agent.pos) - prefixLength;
			// Corner "╮" is at position (11 + agent.pos), so after it we're at (12 + agent.pos)
			const arrowEndPos = 12 + agent.pos;

			return (
				<Box key={log.id} flexDirection="column">
					{/* Subagent start arrow row */}
					<Box>
						<Text inverse={isSelected} color={agent?.color}>
							{'> '}{log.agentId} <Text dimColor>[{log.timestamp}]</Text> {'─'.repeat(dashCount)}{'╮'}
						</Text>
						{renderVerticalBarsSuffix(arrowEndPos, `${log.id}-start-title`)}
					</Box>

					{/* Content Row (if expanded) */}
					{!isCollapsed && log.content && (
						<Box>
							<Text dimColor>    "{log.content}"</Text>
							{renderVerticalBarsSuffix(4 + 1 + log.content.length + 1, `${log.id}-start-content`)}
						</Box>
					)}
				</Box>
			);
		}

		// Regular log entries (user, assistant, tool, thinking)
		// Add emojis for special types
		let displayTitle = log.type;
		if (log.type === 'tool') {
			displayTitle = '🔧 tool';
		} else if (log.type === 'thinking') {
			displayTitle = '💭 thinking';
		}

		// Generate preview for title line (only when collapsed)
		const firstLine = log.content?.split('\n')[0] || '';
		// Calculate available width for preview
		// Format: "[HH:MM:SS] > displayTitle preview"
		const prefixLength = 1 + log.timestamp.length + 2 + 2 + displayTitle.length + 1; // brackets, spaces, arrow
		const availableWidth = Math.max(0, width - prefixLength - 7); // -7 buffer for borders/padding
		const preview = firstLine.length > availableWidth ? firstLine.substring(0, availableWidth) + '...' : firstLine;
		const previewText = (isCollapsed && preview) ? ` ${preview}` : '';

		// Calculate indentation for expanded content to align with title
		// Format: "[HH:MM:SS] > title"
		const contentIndent = ' '.repeat(1 + log.timestamp.length + 2 + 2); // align with title

		const hasExpandableContent = Boolean(log.content);

		return (
			<Box key={log.id} flexDirection="column">
				{/* Title Row */}
				<Box>
					<Text inverse={isSelected}>
						<Text dimColor>[{log.timestamp}] </Text>
						<Text>{isCollapsed ? '> ' : '⌄ '}</Text>
						<Text>
							{displayTitle}
						</Text>
						<Text dimColor>{previewText}</Text>
					</Text>
					{renderVerticalBarsSuffix(1 + log.timestamp.length + 2 + 2 + displayTitle.length + previewText.length, `${log.id}-title`)}
				</Box>

				{/* Content Row (if expanded) - show up to 5 lines */}
				{!isCollapsed && hasExpandableContent && (
					<Box flexDirection="column">
						{(() => {
							const lines = (log.content || '').split('\n').slice(0, 5);
							const hasMore = (log.content || '').split('\n').length > 5;
							const maxLineLength = Math.max(0, width - contentIndent.length - 7); // -7 buffer for borders/padding
							return lines.map((line, idx) => {
								const displayLine = line.length > maxLineLength ? line.substring(0, maxLineLength) + '...' : line;
								return (
									<Box key={`${log.id}-line-${idx}`}>
										<Text dimColor>{contentIndent}{displayLine}</Text>
										{renderVerticalBarsSuffix(contentIndent.length + displayLine.length, `${log.id}-content-${idx}`)}
									</Box>
								);
							}).concat(
								hasMore ? (
									<Box key={`${log.id}-more`}>
										<Text dimColor>{contentIndent}...</Text>
										{renderVerticalBarsSuffix(contentIndent.length + 3, `${log.id}-more`)}
									</Box>
								) : []
							);
						})()}
					</Box>
				)}
			</Box>
		);
	};

	// Render detail view for a single log
	const renderDetailView = () => {
		const log = selectedLog;
		if (!log) return null;

		// Use localSessionId if sessionId prop isn't available yet
		const currentSessionId = sessionId || localSessionId;

		let displayTitle = log.type;
		if (log.type === 'tool') {
			displayTitle = '🔧 tool';
		} else if (log.type === 'thinking') {
			displayTitle = '💭 thinking';
		}

		// Use fixed viewport height to prevent re-layout flashing
		// Don't calculate based on terminal height - keep it constant
		const detailAvailableHeight = 30;
		const totalLines = contentLines.length;

		// Adjust scroll offset if it's too far down
		const maxOffset = Math.max(0, totalLines - detailAvailableHeight);
		const actualOffset = Math.min(detailScrollOffset, maxOffset);

		const visibleLines = contentLines.slice(actualOffset, actualOffset + detailAvailableHeight);
		// Pad with empty lines to keep constant height
		while (visibleLines.length < detailAvailableHeight) {
			visibleLines.push('');
		}
		const hasLinesAbove = actualOffset > 0;
		const hasLinesBelow = actualOffset + detailAvailableHeight < totalLines;

		const detailTitle = agentViewData
			? `Log: ${currentSessionId}/agent-${agentViewData.agentId}/${log.uuid || log.id}`
			: `Log: ${currentSessionId}/${log.uuid || log.id}`;

		return (
			<Box flexDirection="column" width={width}>
				<TitledBox
					borderStyle="single"
					borderColor="gray"
					padding={1}
					key="detail-view"
					titles={[detailTitle]}
				>
					<Box flexDirection="column">
						<Text>
							<Text dimColor>[{log.timestamp}] </Text>
							<Text>{displayTitle}</Text>
						</Text>
						<Box flexDirection="column" marginTop={1}>
							{log.uuid && (
								<Text dimColor>UUID: {log.uuid}</Text>
							)}
							{log.isoTimestamp && (
								<Text dimColor>Timestamp: {log.isoTimestamp}</Text>
							)}
							{log.usage !== undefined && (
								<Text dimColor>Token Usage: {log.usage.toLocaleString()}</Text>
							)}
							{log.type === 'subagent' && log.agentId && (
								<Text dimColor>Agent ID: {log.agentId}</Text>
							)}
							{log.type === 'tool' && log.toolInput && (
								<Box flexDirection="column" marginTop={1}>
									<Text dimColor>Tool Parameters:</Text>
									<Text dimColor>{JSON.stringify(log.toolInput, null, 2)}</Text>
								</Box>
							)}
						</Box>
						<Text dimColor>─────────────────────</Text>
						<Box flexDirection="column" marginTop={1}>
							{hasLinesAbove && (
								<Text dimColor>... {actualOffset} more above ...</Text>
							)}
							{visibleLines.map((line, idx) => (
								<Text key={idx}>{line}</Text>
							))}
							{hasLinesBelow && (
								<Text dimColor>... {totalLines - (actualOffset + availableHeight)} more below ...</Text>
							)}
						</Box>
					</Box>
				</TitledBox>
				<Box>
					<Text dimColor>
						←: Back to list | ↑/↓: Scroll | u: Up 10 | d: Down 10 | t: Top | b: Bottom | Line {actualOffset + 1}-{Math.min(actualOffset + availableHeight, totalLines)}/{totalLines}
					</Text>
				</Box>
			</Box>
		);
	};

	// Render browser view
	const renderBrowserView = () => {
		return (
			<Box flexDirection="column" width={width}>
				<Box flexDirection="column">
					<Text> </Text>
					<Text bold>Welcome to</Text>
					<Gradient colors={['#2ecc71', '#3498db']}>
						<BigText text="Claude" font="block" />
						<BigText text="Observe" font="block" />
					</Gradient>
					<Text dimColor> v 0.0.0</Text>
					<Text> </Text>
					<Text>Select a session:</Text>
					<Text> </Text>
					{browserItems.length === 0 ? (
						<Text dimColor>No projects found in ~/.claude/projects</Text>
					) : (
						browserItems.map((item, index) => {
							const isSelected = index === selectedIndex;
							if (item.type === 'project') {
								const isExpanded = expandedProjects.has(item.data.name);
								return (
									<Box key={`project-${item.data.name}`}>
										<Text inverse={isSelected}>
											{isExpanded ? '⌄ ' : '> '}{item.data.name}
										</Text>
									</Box>
								);
							} else {
								// Session
								const timestamp = item.data.mtime.toLocaleString();
								return (
									<Box key={`session-${item.data.path}`}>
										<Text inverse={isSelected}>
											{'  '}{item.data.name} <Text dimColor>({timestamp})</Text>
										</Text>
									</Box>
								);
							}
						})
					)}
				</Box>
				<Box>
					<Text dimColor>
						↑/↓: Navigate | Enter/→: Expand/Select | ←: Collapse | Esc: Back
					</Text>
				</Box>
			</Box>
		);
	};

	// If in browser mode, show browser view
	if (viewMode === 'browser') {
		return renderBrowserView();
	}

	// If in detail mode, show detail view
	if (viewMode === 'detail') {
		return renderDetailView();
	}

	// Calculate visible window of logs to render
	const startIndex = Math.max(0, selectedIndex - Math.floor(viewportSize / 2));
	const endIndex = Math.min(filteredLogs.length, startIndex + viewportSize);
	const visibleLogs = filteredLogs.slice(startIndex, endIndex);

	// Show indicators when there are more logs above/below
	const hasLogsAbove = startIndex > 0;
	const hasLogsBelow = endIndex < filteredLogs.length;

	// Generate filter status text
	const activeFilterNames = Object.entries(activeFilters)
		.filter(([_, active]) => active)
		.map(([type, _]) => type === 'subagent' ? 'agents' : type);
	const filterText = activeFilterNames.length === 5 ? '' : ` | Filters: ${activeFilterNames.join(', ')}`;

	// Use localSessionId if sessionId prop isn't available yet
	const currentSessionId = sessionId || localSessionId;
	const listViewTitle = agentViewData
		? `Agent: ${currentSessionId}/agent-${agentViewData.agentId}`
		: (currentSessionId ? `Session: ${currentSessionId}` : 'Log Browser');

	const listViewKey = agentViewData ? `agent-view-${agentViewData.agentId}` : 'list-view';

	return (
		<Box flexDirection="column" width={width}>
			<TitledBox
				borderStyle="single"
				borderColor="gray"
				padding={1}
				key={listViewKey}
				titles={[listViewTitle]}
			>
				<Box flexDirection="column">
					{hasLogsAbove && (
						<Text dimColor>
							... {startIndex} more above ...
						</Text>
					)}
					{visibleLogs.map((log, visibleIndex) => {
						const actualIndex = startIndex + visibleIndex;
						const keyPrefix = agentViewData ? `agent-${agentViewData.agentId}-` : '';
						return <Box key={`${keyPrefix}${log.id}`}>{renderLog(log, actualIndex)}</Box>;
					})}
					{hasLogsBelow && (
						<Text dimColor>
							... {filteredLogs.length - endIndex} more below ...
						</Text>
					)}
				</Box>
			</TitledBox>
			<Box>
				<Text dimColor>
					↑/↓: Navigate | d: Down 10 | u: Up 10 | t: Top | b: Bottom | Enter: Expand/Collapse | →: Detail | a/c: All | 1-5: Filter{filterText} | {selectedIndex + 1}/{filteredLogs.length}
				</Text>
			</Box>
		</Box>
	);
}
