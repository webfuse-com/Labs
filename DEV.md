## Development

### Setup

``` console
npm install
npx husky
```

> Husky must not be installed through `npm prepare`, as it would interfere with framework install via NPM from GitHub.

### Utilities

`npm run bundle` &emsp; Bundle the test extension.  
`npm run bundle:debug` &emsp; Bundle the test extension, without minification.  
`npm run bundle:watch` &emsp; Bundle the test extension, watch files.  

`npm run preview` &emsp; Start the preview environment, without bundler.  
`npm run preview:watch` &emsp; Start the preview environment.  

`npm test` &emsp; Run test suite.  