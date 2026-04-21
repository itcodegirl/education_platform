import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default [
	{
		ignores: [
			'dist/**',
			'node_modules/**',
			'playwright-report/**',
			'test-results/**',
			'codeherway-v2/**',
		],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			parserOptions: {
				ecmaFeatures: { jsx: true },
			},
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		plugins: {
			react: reactPlugin,
			'react-hooks': reactHooks,
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			...reactPlugin.configs.recommended.rules,
			...reactHooks.configs.recommended.rules,
			'react-hooks/purity': 'off',
			'react-hooks/set-state-in-effect': 'off',
			'react/react-in-jsx-scope': 'off',
			'react/prop-types': 'off',
			'react/no-unescaped-entities': 'off',
			'no-useless-escape': 'off',
			'no-console': 'off',
			'no-unused-vars': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
		},
	},
	{
		files: ['**/*.test.{js,jsx,ts,tsx}', 'tests/**/*.{js,jsx,ts,tsx}'],
		rules: {
			'@typescript-eslint/no-unused-vars': 'off',
		},
	},
];
