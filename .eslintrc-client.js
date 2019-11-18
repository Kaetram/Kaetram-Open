module.exports = {
    root: true,
    env: {
        browser: true,
        jquery: true,
        node: false,
        es6: false
    },
    extends: ['eslint:recommended', 'standard', 'google'],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly'
    },
    rules: {
        curly: ['error', 'multi'],
        indent: ['warn', 4, { SwitchCase: 1 }],
        'linebreak-style': ['error', 'unix'],
        quotes: ['error', 'single'],
        semi: ['error', 'always'],
        'operator-linebreak': 0,
        'no-var': 0,
        'prefer-const': 0,
        'comma-dangle': ['error', 'never'],
        'arrow-parens': 0,
        // "no-undef": 0,

        'no-unused-vars': 0,
        'max-len': 0,
        'no-prototype-builtins': 0,
        'standard/no-callback-literal': 0,
        'no-useless-constructor': 0,

        // Remove this if you want to add documentation to all files
        'require-jsdoc': 0
    }
};
