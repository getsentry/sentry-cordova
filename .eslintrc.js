module.exports = {
  root: true,
  env: {
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: ['@sentry-internal/sdk'],
  plugins: ['@sentry-internal/sdk'],
  ignorePatterns: ['build/**', 'dist/**', 'esm/**', 'sample/**', 'scripts/**', 'dangerfile.js', 'src/js/Ionic/**', '__tests__/**'],
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
        '@typescript-eslint/ban-ts-comment': [
          'error',
          {
            'ts-ignore': 'allow-with-description',
          },
        ],
      },
    },
  ],
  rules: {
    '@sentry-internal/sdk/no-async-await': 'off',
    '@sentry-internal/sdk/no-optional-chaining': 'off',
    '@sentry-internal/sdk/no-nullish-coalescing': 'off',
    '@sentry-internal/sdk/no-class-field-initializers': 'off',
    '@sentry-internal/sdk/no-unsupported-es6-methods' : 'off',
  }
};
