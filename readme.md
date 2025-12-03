# claude-observe

## Install

```bash
npm install --global claude-observe
```

### Develop

```bash
npm run build && node ./dist/cli.js
```

## CLI

### Explorer

```shell
claude-observe -s <pattern>
```

where `-s, --session` option jumpbs directly to the session ID view.

### Tool

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
