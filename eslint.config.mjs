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
      'apps/web/.pw-browsers/**',
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
  {
    // vanilla-extract css.ts 约束（architecture.md §6 检查单）：
    // 1) 固定像素场景字号必须引用 FONT token（@mathpaws/ui tokens.ts 9 档），禁散值字面量；
    //    装饰 emoji 等孤例用 eslint-disable 注明理由；
    // 2) css.ts 禁止 import 图片资产（ve 构建期求值不走资产管线，须在 tsx import 后注入）
    files: ['apps/web/src/**/*.css.ts', 'packages/ui/src/**/*.css.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Property[key.name='fontSize'][value.type='Literal']",
          message:
            '字号请使用 FONT token（@mathpaws/ui tokens.ts）；确需偏离用 eslint-disable 注明理由',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.webp', '**/*.gif', '**/*.svg', '**/*.avif'],
              message:
                '.css.ts 禁止 import 图片资产（ve 构建期求值不走资产管线）；请在 tsx import 后经内联 / CSS 变量注入',
            },
          ],
        },
      ],
    },
  },
  {
    // 流式场景（clamp / vmin / cqw / 容器查询）、舞台外组件与 dev 工具页不走逻辑 px 字号 token
    files: [
      'apps/web/src/scenes/dev/**/*.css.ts',
      'apps/web/src/scenes/Gacha/**/*.css.ts',
      'apps/web/src/scenes/Backpack/**/*.css.ts',
      'apps/web/src/scenes/Quiz/**/*.css.ts',
      'apps/web/src/scenes/Result/**/*.css.ts',
      'apps/web/src/components/ChestPanel/**/*.css.ts',
      'apps/web/src/components/ComingSoonToast/**/*.css.ts',
    ],
    rules: { 'no-restricted-syntax': 'off' },
  },
  prettier,
)
