# Developer Notes

## Publishing

- Use `npm publish --dry-run` to test
- Use `npm version patch|minor|major` to bump version
- Publish with `npm publish --access public`

### Automated

```shell
npm version patch  # or minor/major
git push && git push --tags
```

Then go to GitHub, create release and CI publishes automatically.

### Manual

```shell
npm version path
npm publish # prepublishOnly runs checks
```
