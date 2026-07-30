import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
    {
        ignores: ['dist/**', 'node_modules/**'],
    },
    js.configs.recommended,
    ...pluginVue.configs['flat/essential'],
    {
        files: ['**/*.{js,mjs,vue}'],
        languageOptions: {
            ecmaVersion: 'latest',
            globals: {
                ...globals.browser,
                ...globals.serviceworker,
                __APP_CONFIG__: 'readonly',
            },
            sourceType: 'module',
        },
        rules: {
            'no-console': ['warn', { allow: ['error', 'warn'] }],
            'vue/multi-word-component-names': 'off',
        },
    },
    {
        files: ['*.config.{js,mjs}', 'eslint.config.mjs', 'vite.config.mjs'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
];
