import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import importPlugin from 'eslint-plugin-import'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: [
      '.trae/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/.pnpm-store/**',
      '**/.pnpm-cache/**',
      '**/coverage/**',
      'design/.venv-art/**',
      'ml/mnist/venv312/**',
      '**/_tmp/**',
      '**/ref_assets/**',
      'apps/web/dev-dist/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mts}'],
    plugins: {
      'react-hooks': reactHooks,
      import: importPlugin,
    },
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // tsc (noUnusedLocals/strict) 已覆盖的检查交给 tsc
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      // 依赖方向：packages 不得 import apps
      'import/no-restricted-paths': [
        'error',
        { zones: [{ target: './packages', from: './apps' }] },
      ],
      'import/order': [
        'warn',
        { 'newlines-between': 'always', alphabetize: { order: 'asc' } },
      ],
      // 中文排版允许全角空格出现在字符串/模板/JSX 文本中
      'no-irregular-whitespace': [
        'error',
        { skipStrings: true, skipTemplates: true, skipJSXText: true },
      ],
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // design/ 下为 Node CommonJS 工具脚本，允许 require
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // zustand store 编排层：use*Subscribe 等命名会误触 hooks 规则，这里无组件语义
    files: ['apps/web/src/stores/**/*.ts'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
  prettier,
)
