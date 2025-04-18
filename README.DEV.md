## Development

### Setup

``` console
npm install
npx husky
```

> Husky must not be installed through `npm prepare`, as it would interfere with framework install via NPM from GitHub.

### Develop

| Command | Description |
| -: | :- |
| `npm run develop` | Compile TypeScript source. | 
| `npm run develop:watch` | Compile TypeScript source, watch files. |
| `npm run compile` | Compile TypeScript source as distributable library. |
| | |
| `npm lint` | Run linter. |
| `npm lint:fix` | Run linter, automatically fix simple issues. |
| | |
| `npm prepare:test` | Prepare library for test suite. |
| | |
| `npm run test:unit` | Run unit tests (targets bundler). |
| `npm run test:end-to-end` | Run end-to-end tests (targets preview application). |
| `npm run test:end-to-end:no-headless` | Run end-to-end tests, show browser. |
| `npm test` | Run entire test suite. |

### Verify

> Works on [Test Extension](./test-extension).

| Command | Description |
| -: | :- |
| `npm run bundle` | Bundle the test extension. |
| `npm run bundle:debug` | Bundle the test extension, without minification. |
| `npm run bundle:watch` | Bundle the test extension, watch files. |
| | |
| `npm run preview` | Start the preview environment, without bundler. |
| `npm run preview:watch` | Start the preview environment. |