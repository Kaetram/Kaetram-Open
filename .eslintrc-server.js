module.exports = {
    root: true,
    env: {
        browser: false,
        jquery: false,
        node: true,
        es6: true
    },
    extends: ['eslint:recommended', 'standard', 'google'],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly'
    },
    rules: {
        curly: ['error', 'multi-or-nest'],
        indent: ['warn', 4, { SwitchCase: 1 }],
        'linebreak-style': ['error', 'unix'],
        quotes: ['error', 'single'],
        semi: ['error', 'always'],
        'operator-linebreak': 0,
        'no-var': 2,
        'one-var': 0,
        'prefer-const': 2,
        'block-spacing': ['error', 'always'],
        'comma-dangle': ['error', 'never'],
        'arrow-parens': ['warn', 'as-needed'],
        'no-undef': 0,

        'no-unused-vars': 0,
        'max-len': 0,
        'no-prototype-builtins': 0,
        'standard/no-callback-literal': 0,
        'no-useless-constructor': 0,

        // Remove this if you want to add documentation to all files
        'require-jsdoc': [
            'error',
            {
                require: {
                    FunctionDeclaration: false,
                    MethodDefinition: false,
                    ClassDeclaration: false,
                    ArrowFunctionExpression: false,
                    FunctionExpression: false
                }
            }
        ]
    }
};
