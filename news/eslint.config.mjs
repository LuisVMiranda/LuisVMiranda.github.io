import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'research/runs/**',
      'artifacts/**',
      'test-results/**',
      'playwright-report/**',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,js,mjs}'],
    rules: {
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-params': ['error', 5],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
];
