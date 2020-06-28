/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
    plugins: [new HtmlWebpackPlugin({ template: path.join(__dirname, 'index.html') })],
};
