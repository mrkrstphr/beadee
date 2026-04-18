import reactPlugin from '@eslint-react/eslint-plugin';
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['build/**', 'node_modules/**', 'bin/**', '.react-router/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    ...reactPlugin.configs['recommended-type-checked'],
    plugins: {
      ...reactPlugin.configs['recommended-type-checked'].plugins,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ...reactPlugin.configs['recommended-type-checked'].languageOptions,
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      ...reactPlugin.configs['recommended-type-checked'].rules,
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
    },
  },
  {
    files: ['server/**/*.js', 'bin/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);
