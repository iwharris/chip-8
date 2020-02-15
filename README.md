# typescript-starter

[![codecov](https://codecov.io/gh/iwharris/typescript-starter/branch/master/graph/badge.svg)](https://codecov.io/gh/iwharris/typescript-starter)
[![CircleCI](https://circleci.com/gh/iwharris/typescript-starter.svg?style=svg)](https://circleci.com/gh/iwharris/typescript-starter)

Boilerplate repo for personal Typescript projects

## Components

| Component/Framework                                            | Purpose                | Comments                                                                   |
| -------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------- |
| [Jest](https://jestjs.io/)                                     | Test Framework         | Using [ts-jest](https://github.com/kulshekhar/ts-jest) for JIT compilation |
| [Prettier](https://prettier.io/)/[ESLint](https://eslint.org/) | Code style & linting   |
| [CircleCI](https://circleci.com/)                              | Continuous Integration | Supports publishing to NPM                                                 |
| [Codecov](https://codecov.io/)                                 | Code coverage tracking |

## Usage

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

### Test

```bash
# Run test suite
npm test

# Generate a coverage report
npm run test:coverage
```

### CI/CD

To set up CircleCI integration, set the following env vars on the CircleCI project:

-   `NPM_TOKEN`: auth token granting publish access
-   `CODECOV_TOKEN`: token for Codecov

To publish a new version to npm:

```bash
npm version patch # or minor, or major
git push
git push --tags
```
