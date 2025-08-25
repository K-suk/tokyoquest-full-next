import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import securityPlugin from 'eslint-plugin-security';

export default [
  js.configs.recommended,
  // セキュリティプラグインの推奨設定を追加
  {
    ...securityPlugin.configs.recommended,
    files: ['**/*.{js,jsx,ts,tsx}'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        console: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',

        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        Image: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLVideoElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLSpanElement: 'readonly',
        SVGSVGElement: 'readonly',
        MediaStream: 'readonly',
        HTMLImageElement: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        crypto: 'readonly',

        // Jest/Testing globals
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',

        // React globals
        React: 'readonly',
        JSX: 'readonly',
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      '@typescript-eslint': tseslint,
      security: securityPlugin,
    },
    rules: {
      // TypeScript推奨ルール
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Next.js推奨ルール
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'error',
      '@next/next/no-sync-scripts': 'error',
      '@next/next/no-unwanted-polyfillio': 'error',

      // React推奨ルール
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // セキュリティルール（プロジェクトに適したレベルで設定）
      'security/detect-object-injection': 'warn', // オブジェクトインジェクションは警告レベル
      'security/detect-non-literal-regexp': 'error',
      'security/detect-unsafe-regex': 'warn', // 環境変数のregexで検出されるため警告レベル
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn', // プロセス実行は警告レベル
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'warn', // ファイルパスは警告レベル
      'security/detect-non-literal-require': 'warn', // 動的requireは警告レベル
      'security/detect-possible-timing-attacks': 'warn', // タイミング攻撃は警告レベル
      'security/detect-pseudoRandomBytes': 'error',

      // 追加のセキュリティルール
      'no-eval': 'error', // eval使用を禁止
      'no-implied-eval': 'error', // 暗黙的なeval使用を禁止
      'no-new-func': 'error', // Function コンストラクタ使用を禁止
    },
  },
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'dist/**'],
  },
];
