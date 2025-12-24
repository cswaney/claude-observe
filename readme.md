# claude-observe

A terminal UI for observing and analyzing Claude conversation logs.

## Features

- **Session Browser** - View Claude sessions with metadata (project, created/modified dates, number of logs)
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

- `↑/↓` - Navigate sessions
- `u/d` - Jump 10 sessions up/down
- `/` - Filter sessions by project
- `Enter` or `→` - Open selected session

**Session Inspector**: View session data and browse logs

- `↑/↓` - Navigate logs
- `u/d` - Jump 10 logs up/down
- `←` - Return to session browser
- `→` - View selected log details
- `/` - Search logs (e.g., "type:tool_use")
- `1-5` - Hot key log type filtering
- `Enter` - Expand content preview
- `Esc` - Back to session browser

**Log Inspector**: View log details

- `↑/↓` - Scroll content
- `←` - Return to session view
- `Shifrt + ←/→` - Go to previous/next log
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
npm run test
```

Run formatting and linting:

```bash
npm run format
npm run lint
```

Prepare to push/publish (format, lint, and test):

```bash
npm run check
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © Colin Swaney
