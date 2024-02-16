/** @type {import("xo").Options} */
const config = {
  space: true,
  prettier: true,
  rules: {
    'new-cap': 'off',

    '@typescript-eslint/explicit-member-accessibility': [
      'error',
      { overrides: { constructors: 'no-public' } },
    ],
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowConciseArrowFunctionExpressionsStartingWithVoid: false,
        allowIIFEs: true,
      },
    ],
    '@typescript-eslint/naming-convention': 'off',

    'unicorn/filename-case': ['error', { case: 'snakeCase' }],
    'unicorn/no-array-callback-reference': 'off',

    'import/extensions': ['error', { js: 'never', ts: 'never' }],
  },
};

module.exports = config;
