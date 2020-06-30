const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const dotenv = require('dotenv');
const dotenvParseVariables = require('dotenv-parse-variables');

const clientEnvKeys = ['IP', 'PORT', 'VERSION', 'SSL', 'DEBUG', 'WORLD_SWITCH'];

const envConfig = dotenv.config().parsed || process.env;

console.log(Object.keys(envConfig));

const config = Object.keys(envConfig)
    .filter((key) => clientEnvKeys.includes(key))
    .reduce(
        (result, key) => ({
            ...result,
            [key]: envConfig[key],
        }),
        {}
    );

console.log(config);
console.log(dotenvParseVariables(config));

module.exports = {
    mode: 'development',
    entry: './js/main.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.js',
        // publicPath: 'js',
        libraryTarget: 'umd',
    },
    devServer: {
        contentBase: __dirname,
        compress: true,
        port: 9000,
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(dotenvParseVariables(config)),
        }),
        new HtmlWebpackPlugin({ template: path.join(__dirname, 'index.html') }),
        new CopyPlugin({
            patterns: [
                { from: 'css', to: 'css' },
                { from: 'img', to: 'img' },
                { from: 'fonts', to: 'fonts' },
                { from: 'data', to: 'data' },
                { from: 'sw.js', to: 'sw.js' },
                { from: 'favicon.ico', to: 'favicon.ico' },
                { from: 'manifest.json', to: 'manifest.json' },
                { from: 'js/map/mapworker.js', to: 'js/map/mapworker.js' },
                { from: 'js/lib/underscore.min.js', to: 'js/lib/underscore.min.js' },
            ],
        }),
    ],
};
