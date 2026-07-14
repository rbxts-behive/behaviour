import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import prettier from 'eslint-plugin-prettier/recommended'
import roblox from 'eslint-plugin-roblox-ts'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import ts from 'typescript-eslint'

export default defineConfig(
	{ ignores: ['out/**/*'] },

	// js/ts lint settings
	{
		files: ['**/*.{js,mjs,ts,mts}'],
		extends: [
			js.configs.recommended,
			ts.configs.strictTypeChecked,
			ts.configs.stylisticTypeChecked,
			roblox.configs.recommended,
		],
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ['eslint.config.mjs'],
				},
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-namespace': 'off',
			// Disable rules that conflict with roblox-ts
			'@typescript-eslint/no-require-imports': 'off',
			// Disable rules that conflict with regular tsc type checking
			'no-undef': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/unbound-method': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			// Incorrectly flags `typeIs` since it doesn't recognise the `value is Type` return type as a boolean type
			'roblox-ts/lua-truthiness': 'off',
		},
	},

	// Import sorting
	{
		settings: {
			'import/resolver': {
				typescript: {
					alwaysTryTypes: true,
				},
			},
		},
		plugins: {
			'simple-import-sort': simpleImportSort,
		},
		rules: {
			'simple-import-sort/imports': [
				'error',
				{
					groups: [
						// Side effect imports
						['^\\u0000'],

						// NodeJS built-ins
						['^node:'],

						// External packages
						['^@?\\w'],

						// Internal aliases
						['^@spec/'],
						['^@/'],

						// Relative imports
						['^\\.\\.(?!/?$)', '^\\.\\./?$'],
						['^\\./(?=.*/)', '^\\.(?!/?$)', '^\\./?$'],
					],
				},
			],
			'simple-import-sort/exports': 'error',
		},
	},

	// Must be last
	prettier,
)
