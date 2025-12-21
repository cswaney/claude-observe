# claude-observe

A terminal UI for observing and analyzing Claude conversation logs.

Browse your Claude sessions, inspect messages, view token usage, and explore tool calls—all from the comfort of your terminal.

## Features

- **Session Browser** - View all your Claude sessions with metadata (project, created/modified dates, token usage)
- **Filter & Search** - Filter sessions by project name and search through conversation content
- **Message Inspector** - Inspect user messages, assistant responses, tool calls, and thinking blocks
- **Token Analytics** - Track token usage patterns across sessions
- **Agent Support** - Inspect subagent logs and nested tool calls
- **Keyboard Navigation** - Fast, vim-inspired keyboard shortcuts for efficient browsing

## Installation

```bash
npm install --global claude-observe
```

## Usage

Launch the TUI:

```bash
claude-observe
```

### Keyboard Shortcuts

**Session Browser**: Browse and select a session to explore

- `↑/↓`, `u/d` - Navigate sessions
- `/` - Filter sessions by project
- `Enter` or `→` - Open selected session

**Session Inspector**: View session data and browse logs

- `↑/↓` or `k/j` - Navigate logs
- `/` - Search logs (e.g., "type:tool_use")
- `Enter` - Expand content preview
- `f` - Toggle message type filters (user/assistant/tool/thinking)
- `Esc` - Back to session browser

**Log Inspector**: View log details

- `↑/↓` - Scroll content
- `←/→` - Go to previous/next log
- `Esc` - Back to session browser

## Data Location

Claude conversation logs are stored in:

```shell
~/.claude/projects/
```

Each project directory contains `.jsonl` files with session data.

## Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/cswaney/claude-observe.git
cd claude-observe
npm install
```

Run locally:

```bash
npm run build && node ./dist/cli.js
```

Run tests:

```bash
npm test
```

Run linting and formatting:

```bash
npm run check
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © Colin Swaney
