# Developer Notes

## Publishing

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
