module.exports = {
  root: true,
  env: {
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: ['@sentry-internal/sdk'],
  ignorePatterns: ['build/**', 'dist/**', 'esm/**', 'examples/**', 'scripts/**', 'src/js/Ionic/**', '__tests__/**'],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.d.ts'],
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    {
      files: ['src/js/__tests__/**'],
      rules: {
        'jsdoc/require-jsdoc': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@sentry-internal/sdk/no-async-await': 'off',
        '@sentry-internal/sdk/no-optional-chaining': 'off',
        '@sentry-internal/sdk/no-nullish-coalescing': 'off',
      },
    },
  ],
};
