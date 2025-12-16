import React from 'react';
import { Box, Text } from 'ink';

// Format token counts with k/M suffixes (imported from Summary.js pattern)
function formatTokens(count) {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k';
  }
  return count.toString();
}

// Simple JSON syntax highlighter component
function HighlightedJSON({ line }) {
  // Parse the line to identify JSON syntax elements
  const tokens = [];
  let currentIndex = 0;

  // Regex patterns for different JSON elements
  const patterns = [
    { regex: /"([^"\\]|\\.)*"\s*:/, type: 'key' },      // JSON keys
    { regex: /"([^"\\]|\\.)*"/, type: 'string' },       // String values
    { regex: /\b(true|false|null)\b/, type: 'keyword' }, // Keywords
    { regex: /-?\d+\.?\d*/, type: 'number' },           // Numbers
    { regex: /[{}\[\],:]/, type: 'punctuation' }        // Punctuation
  ];

  while (currentIndex < line.length) {
    let matched = false;

    for (const pattern of patterns) {
      const regex = new RegExp(`^${pattern.regex.source}`);
      const match = line.slice(currentIndex).match(regex);

      if (match) {
        const text = match[0];
        tokens.push({ text, type: pattern.type });
        currentIndex += text.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // No pattern matched, add as plain text
      tokens.push({ text: line[currentIndex], type: 'plain' });
      currentIndex++;
    }
  }

  return (
    <Text>
      {tokens.map((token, idx) => {
        switch (token.type) {
          case 'key':
            return <Text key={idx} color="cyan">{token.text}</Text>;
          case 'string':
            return <Text key={idx} color="green">{token.text}</Text>;
          case 'keyword':
            return <Text key={idx} color="magenta">{token.text}</Text>;
          case 'number':
            return <Text key={idx} color="yellow">{token.text}</Text>;
          case 'punctuation':
            return <Text key={idx} dimColor>{token.text}</Text>;
          default:
            return <Text key={idx}>{token.text}</Text>;
        }
      })}
    </Text>
  );
}

// Format usage object into readable string
function formatUsage(usage, rawLog) {
  if (!usage) return 'N/A';

  // Extract usage from raw log if available
  const message = rawLog?.message;
  const usageObj = message?.usage;

  if (!usageObj) {
    // Fallback: just show total
    return `${formatTokens(usage)} total`;
  }

  const input = usageObj.input_tokens || 0;
  const output = usageObj.output_tokens || 0;
  const cacheRead = usageObj.cache_read_input_tokens || 0;
  const cacheWrite = usageObj.cache_creation_input_tokens || 0;

  const total = input + output + cacheRead + cacheWrite;

  return `${formatTokens(total)} total (${formatTokens(input)} in, ${formatTokens(output)} out, ${formatTokens(cacheWrite)} cache write, ${formatTokens(cacheRead)} cache read)`;
}

export default function Details({
  width = 80,
  log = null,
  sessionId = null,
  project = null,
  agentViewData = null,
  detailScrollOffset = 0,
  availableHeight = 30
}) {
  if (!log) return null;

  // Access raw JSONL entry from log
  const rawLog = log.rawLog;

  // Get type-specific display name
  let typeDisplay = log.type;
  if (log.type === 'tool' && log.toolName) {
    typeDisplay = `Tool (${log.toolName})`;
  } else if (log.type === 'thinking') {
    typeDisplay = 'Thinking';
  } else if (log.type === 'user') {
    typeDisplay = 'User';
  } else if (log.type === 'assistant') {
    typeDisplay = 'Assistant';
  }

  // Prepare content for display
  let contentLines = [];
  let isJSON = false;

  if (log.type === 'tool') {
    // For tool logs, show either input or result
    if (log.toolInput) {
      // This is a tool_use - show the input
      const jsonStr = JSON.stringify(log.toolInput, null, 2);
      contentLines = jsonStr.split('\n');
      isJSON = true;
    } else if (log.toolResult) {
      // This is a tool_result - show the result
      if (typeof log.toolResult === 'string') {
        contentLines = log.toolResult.split('\n');
        isJSON = false;
      } else {
        const jsonStr = JSON.stringify(log.toolResult, null, 2);
        contentLines = jsonStr.split('\n');
        isJSON = true;
      }
    }
  } else {
    // For other types, show the text content
    contentLines = (log.content || '').split('\n');
    isJSON = false;
  }

  const totalLines = contentLines.length;

  // Adjust scroll offset if it's too far down
  const maxOffset = Math.max(0, totalLines - availableHeight);
  const actualOffset = Math.min(detailScrollOffset, maxOffset);

  const visibleLines = contentLines.slice(actualOffset, actualOffset + availableHeight);

  const hasLinesAbove = actualOffset > 0;
  const hasLinesBelow = actualOffset + availableHeight < totalLines;

  // Format title
  const detailTitle = `Log: ${log.uuid || log.id}`;

  // Format timestamp for display
  const timestampDisplay = log.isoTimestamp
    ? new Date(log.isoTimestamp).toLocaleString()
    : log.timestamp;

  // Get model info from raw log if available
  const model = rawLog?.message?.model || 'N/A';
  const stopReason = rawLog?.message?.stop_reason || 'None';

  return (
    <Box flexDirection="column" width={width}>
      <Box borderStyle="single" borderColor="gray" padding={1}>
        <Box flexDirection="column">
          <Text bold>{detailTitle}</Text>
          <Text> </Text>
          {/* Metadata Section */}
          <Box flexDirection="column">
            <Box>
              <Text dimColor>Project: </Text>
              <Text>{project || 'N/A'}</Text>
            </Box>
            <Box>
              <Text dimColor>Session: </Text>
              <Text>{sessionId || 'N/A'}</Text>
            </Box>
            <Box>
              <Text dimColor>Type: </Text>
              <Text>{typeDisplay}</Text>
            </Box>
            <Box>
              <Text dimColor>Timestamp: </Text>
              <Text>{timestampDisplay}</Text>
            </Box>

            {/* Version (all types) */}
            <Box>
              <Text dimColor>Version: </Text>
              <Text>{rawLog?.version || 'N/A'}</Text>
            </Box>

            {/* Model (Assistant/Tool/Thinking) */}
            {(log.type === 'assistant' || log.type === 'tool' || log.type === 'thinking') && (
              <Box>
                <Text dimColor>Model: </Text>
                <Text>{model}</Text>
              </Box>
            )}

            {/* Usage (Assistant/Tool/Thinking) */}
            {(log.type === 'assistant' || log.type === 'tool' || log.type === 'thinking') && log.usage !== undefined && (
              <Box>
                <Text dimColor>Usage: </Text>
                <Text>{formatUsage(log.usage, rawLog)}</Text>
              </Box>
            )}

            {/* Stop Reason (Assistant/Tool/Thinking) */}
            {(log.type === 'assistant' || log.type === 'tool' || log.type === 'thinking') && (
              <Box>
                <Text dimColor>Stop Reason: </Text>
                <Text>{stopReason}</Text>
              </Box>
            )}
          </Box>

          {/* Separator */}
          <Text dimColor marginTop={1}>─────────────────────</Text>

          {/* Content Section */}
          <Box flexDirection="column" marginTop={1}>
            {hasLinesAbove && (
              <Text dimColor>... {actualOffset} more above ...</Text>
            )}
            {visibleLines.map((line, idx) => (
              isJSON ? (
                <HighlightedJSON key={idx} line={line} />
              ) : (
                <Text key={idx}>{line}</Text>
              )
            ))}
            {hasLinesBelow && (
              <Text dimColor>... {totalLines - (actualOffset + availableHeight)} more below ...</Text>
            )}
          </Box>
        </Box>
      </Box>

      {/* Help Text */}
      <Box justifyContent="center" marginTop={1}>
        <Text dimColor>
          Esc: Back | ←/→: Prev/Next Log | ↑/↓: Scroll | u: Up 10 | d: Down 10 | t: Top | b: Bottom | Line {actualOffset + 1}-{Math.min(actualOffset + availableHeight, totalLines)}/{totalLines}
        </Text>
      </Box>
    </Box>
  );
}