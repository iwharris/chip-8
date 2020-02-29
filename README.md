# chip-8

<!-- [![codecov](https://codecov.io/gh/iwharris/typescript-starter/branch/master/graph/badge.svg)](https://codecov.io/gh/iwharris/typescript-starter)
[![CircleCI](https://circleci.com/gh/iwharris/typescript-starter.svg?style=svg)](https://circleci.com/gh/iwharris/typescript-starter) -->

CHIP-8 emulator implemented in Typescript

## Usage

### Development

Run the emulator with a ROM:

```bash
npm run dev <PATH_TO_ROM>
```

### Compile

```bash
# Compile typescript to dist/
npm run compile

# Compile in watch mode
npm run watch
```

### Lint

```bash
# Check for style issues
npm run prettier

# Automatically fix style issues
npm run prettier:fix
```

<!-- ### Test

```bash
# Run test suite
npm test

# Generate a coverage report
npm run test:coverage
``` -->

<!-- ### CI/CD

To set up CircleCI integration, set the following env vars on the CircleCI project:

-   `NPM_TOKEN`: auth token granting publish access
-   `CODECOV_TOKEN`: token for Codecov

To publish a new version to npm:

```bash
npm version patch # or minor, or major
git push
git push --tags
``` -->
