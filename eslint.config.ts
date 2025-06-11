import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    // General ignores
    ignores: ['dist']
  },
  // Recommended ESLint rules for all JavaScript files
  js.configs.recommended,

  // General TypeScript rules (not type-aware)
  ...tseslint.configs.recommended,

  // Type-aware linting rules for TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json', // Path to your tsconfig.json
        tsconfigRootDir: import.meta.dirname, // Directory of this eslint.config.ts file
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // Overrides or additional type-aware rules
      'no-unused-vars': 'off', // Disable base ESLint rule for TS files
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Add more type-aware rule overrides here if needed
    },
  },

  // Configuration for React Hooks rules (apply to both JS and TS files)
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // Configuration for React Refresh rules (apply to both JS and TS files)
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
)
