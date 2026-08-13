import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
    ...nextVitals,
    ...nextTs,

    {
        // Playwright fixtures take a `use` callback param (see tests/**/fixtures.ts) —
        // react-hooks/rules-of-hooks otherwise misreads it as the React `use` hook.
        files: ['tests/**'],
        rules: {
            'react-hooks/rules-of-hooks': 'off',
        },
    },

    globalIgnores([
        '.next/**',
        'node_modules/**',
        'playwright-report/**',
        'test-results/**',
        'src/generated/**',
        '.history/**',
        'scratch/**',
    ]),
]);