# TODO

## Dev

- [x] Update README
- [x] Add CI/CD
- [x] Add pre-commit/dev scripts
- [ ] Ship as binary?
- [ ] Publishing to npm
  - [x] Add `prepublishOnly` script to auto-build before publish
  - [x] Add metadata: description, repository, keywords, author
  - [x] Create README with installation and usage
  - [ ] Create NPM_TOKEN and add it as repo secret

## Bugs

- [ ] Session view shows line instead of log count in navigation
- [ ] Sparkline timestamps do not match created/modified timestamps

## Features

- [ ] Add `logdir` arg to CLI (default: ~/.claude/projects)
- [ ] Display tool call and result side-by-side in detail view?
- [ ] Allow users to delete sessions? Projects?
- [ ] Live data updates!
- [x] Filter sessions by project, created, modified
- [ ] Sort sessions by project, created, modified, logs, tokens
- [x] Auto color all sessions with same project as the currently selected session
- [ ] Explorer mode

```shell
claude-observe -s <pattern>
```

where `-s, --session` option jumpbs directly to the session ID view.

- [ ] Query mode

```shell
claude-observe find [query]
```

where `query` is a JSON query string, e.g.,

```javascript
{
  "type": "user",
  "message": {
    "content": [
      {
        "content": $MATCHES("Hello"),
      }
    ]
  }
}
```

means "find any message that matches this structure". This command returns the matches logs "as-is",
i.e., as jsonl-formatted strings.

## Refactor

- [ ] Agent view
- [x] Implement unified navigation scheme across all views
- [ ] Removing `wrap="truncate-end"` in favor of proper text wrapping (detail content)?

**Context**: Currently using `wrap="truncate-end"` on Text components in Details view to prevent text from wrapping and breaking box boundaries. This was necessary because:

1. Tool results contain `JSON.stringify()` output with literal tab characters (`\t`)
2. These literal tabs expand to 4-8 columns in terminals, breaking width calculations
3. Even with preprocessing to expand escaped characters (`\\n`, `\\t`), literal tabs from source code remain
4. Text wrapping in Ink was causing content to overflow TitledBox boundaries

**Current solution** (lines 170, 294 in [Details/index.js](source/views/Details/index.js)):

- Replace literal tabs with 2 spaces: `text = text.replace(/\t/g, '  ')`
- Use `wrap="truncate-end"` to prevent Ink's automatic wrapping
- Set `getLineHeight = () => 1` (each line = exactly 1 row)

**Tradeoff**: Long lines get truncated instead of wrapped, potentially hiding content.

**Future improvement**: Implement proper manual text wrapping that:

- Calculates wrapping based on available width
- Accounts for all UI chrome (gutter, padding, borders)
- Updates viewport calculations to handle multi-row lines
- Ensures wrapped content stays within box boundaries
