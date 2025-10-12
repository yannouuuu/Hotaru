import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import { fileURLToPath } from 'node:url';
import globals from 'globals';

const tsconfigRootDir = fileURLToPath(new URL('.', import.meta.url));

export default [
    {
    ignores: ['dist/**', 'node_modules/**', '**/*.d.ts', 'eslint.config.js', 'docs/**', 'terminal.log', '/*.md', 'database.yml']
    },
    js.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: ['./tsconfig.json'],
                tsconfigRootDir,
                sourceType: 'module'
            },
            globals: {
                ...globals.node,
                ...globals.es2021
            }
        },
        plugins: {
            '@typescript-eslint': tsPlugin
        },
        rules: {
            ...tsPlugin.configs['recommended'].rules,
            '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
            '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-explicit-any': 'off'
        }
    }
];
