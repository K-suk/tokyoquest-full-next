import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import securityPlugin from 'eslint-plugin-security';
import securityNodePlugin from 'eslint-plugin-security-node';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      security: securityPlugin,
      'security-node': securityNodePlugin,
    },
    rules: {
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

      // セキュリティルール
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-non-literal-require': 'error',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'error',

      // Node.jsセキュリティルール
      'security-node/detect-crlf': 'error',
      'security-node/detect-unsafe-regex': 'error',
      'security-node/detect-buffer-unsafe-allocation': 'error',
      'security-node/detect-child-process': 'error',
      'security-node/detect-dangerous-regex': 'error',
      'security-node/detect-eval-with-expression': 'error',
      'security-node/detect-no-csrf-before-method-override': 'error',
      'security-node/detect-non-literal-fs-filename': 'error',
      'security-node/detect-non-literal-require': 'error',
      'security-node/detect-possible-timing-attacks': 'error',
      'security-node/detect-pseudoRandomBytes': 'error',
    },
  },
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'dist/**'],
  },
];
