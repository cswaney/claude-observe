# Development Scripts

This directory contains demo scripts and manual tests for development purposes.

These files are **not** run by the automated test suite (`npm test`). They're meant for:

- Manual testing during development
- Interactive demos of components
- Exploratory testing with real data

## Running dev scripts

```bash
node source/dev/parser.test.js
node source/dev/useScrollableText.test.js
```

## Note

For proper unit tests that run in CI, create `*.test.js` files in the appropriate source directories (e.g., `source/utils/`, `source/hooks/`). AVA will automatically discover and run them.
