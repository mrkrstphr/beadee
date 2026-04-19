import reactPlugin from '@eslint-react/eslint-plugin';
import js from '@eslint/js';
import css from '@eslint/css';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { tailwind4 } from 'tailwind-csstree';

export default tseslint.config(
  {
    ignores: ['build/**', 'node_modules/**', 'bin/**', '.react-router/**'],
  },
  {
    plugins: {
      'better-tailwindcss': betterTailwindcss,
    },
    rules: {
      'better-tailwindcss/enforce-consistent-class-order': 'warn',
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
      'better-tailwindcss/no-deprecated-classes': 'warn',
      'better-tailwindcss/no-duplicate-classes': 'warn',
      'better-tailwindcss/no-unnecessary-whitespace': 'off',
      'better-tailwindcss/no-unknown-classes': 'off',
      'better-tailwindcss/enforce-canonical-classes': 'warn',
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: 'app/index.css',
      },
    },
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
  {
    files: ['**/*.css'],
    plugins: { css },
    language: 'css/css',
    languageOptions: {
      // @ts-expect-error — @eslint/css types don't include customSyntax yet
      customSyntax: tailwind4,
      tolerant: true,
    },
    rules: {
      'no-irregular-whitespace': 'off',
      'no-useless-assignment': 'off',
      'better-tailwindcss/enforce-consistent-class-order': 'off',
      'better-tailwindcss/no-deprecated-classes': 'off',
      'better-tailwindcss/enforce-canonical-classes': 'warn',
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: 'app/index.css',
      },
    },
  },
);
