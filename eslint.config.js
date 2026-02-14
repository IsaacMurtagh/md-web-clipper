export default [
  {
    files: ['extension/src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        requestAnimationFrame: 'readonly',
        setTimeout: 'readonly',
        console: 'readonly',
        Blob: 'readonly',
        ClipboardItem: 'readonly',
        // Extension globals
        chrome: 'readonly',
        browser: 'readonly',
        // Libraries injected before content/converter
        TurndownService: 'readonly',
        turndownPluginGfm: 'readonly',
        marked: 'readonly',
        // Our converter global
        convertToMarkdown: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-redeclare': 'error',
      'no-constant-condition': 'error',
      'no-dupe-args': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-unreachable': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',
      eqeqeq: ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },
  {
    files: ['extension/src/converter.js'],
    languageOptions: {
      globals: {
        convertToMarkdown: 'off',
      },
    },
    rules: {
      'no-redeclare': 'off',
    },
  },
];
