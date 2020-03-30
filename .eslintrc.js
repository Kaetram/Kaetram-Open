module.exports = {
    env: {
        browser: true,
        es6: true,
        amd: true,
        node: true,
        jquery: true,
        mongo: true
    },
    plugins: [
        'prettier',
        '@typescript-eslint'
        // 'eslint-plugin-tsdoc'
    ],
    extends: [
        // 'airbnb',
        'standard',
        'plugin:prettier/recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module'
    },
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
        importScripts: 'readonly',
        workbox: 'readonly',
    },
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-new': 'off',
        'no-continue': 'off',
        'no-restricted-globals': 'off',
        'import/extensions': 'off',
        'import/no-unresolved': 'off',
        'default-case': 'off',
        'no-caller': 'off',
        'consistent-return': 'off',
        radix: ['off', 'as-needed'],
        'class-methods-use-this': 'off',
        'no-param-reassign': 'off',
        'no-nested-ternary': 'off',
        'no-useless-constructor': 'off',
        'standard/no-callback-literal': 'off',
        'no-fallthrough': 'off',
        'no-plusplus': ['off', { allowForLoopAfterthoughts: true }],
        '@typescript-eslint/no-this-alias': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/ban-ts-ignore': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        'no-prototype-builtins': 'off',
        'no-case-declarations': 'off',
        'no-shadow': 'off',
        'prettier/prettier': 'warn',
        // 'tsdoc/syntax': 'warn',
        semi: ['warn', 'always'],
        indent: [
            'off',
            4,
            {
                SwitchCase: 1,
                flatTernaryExpressions: true
            }
        ],
        quotes: ['warn', 'single']
    },
    ignorePatterns: [
        'node_modules/',
        '*.json',
        '*.json-dist',
        './client/lib/',
        './client/**/lib/'
    ]
};
