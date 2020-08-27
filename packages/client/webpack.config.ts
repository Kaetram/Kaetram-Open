import path from 'path';
import dotEnvExtended from 'dotenv-extended';
import { HotModuleReplacementPlugin, DefinePlugin } from 'webpack';
import { WebpackOptions } from 'webpack/declarations/WebpackOptions';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import dotenvParseVariables from 'dotenv-parse-variables';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';

const env = dotenvParseVariables(dotEnvExtended.load());
const { NODE_ENV } = env;

const config: WebpackOptions = {
    mode: (NODE_ENV as 'development' | 'production') || 'development',
    entry: path.resolve(__dirname, './ts/main.js'),
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'main.js'
        // , libraryTarget: 'umd'
    },
    resolve: {
        extensions: ['.ts', '.js', '.json']
    },
    devServer: {
        contentBase: __dirname,
        compress: true,
        port: 9000
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HotModuleReplacementPlugin(),
        new DefinePlugin({
            'process.env': JSON.stringify(env)
        }),
        new HtmlWebpackPlugin({ template: path.join(__dirname, './index.html') }),
        new CopyPlugin({
            patterns: [
                { from: 'css', to: 'css' },
                { from: 'img', to: 'img' },
                { from: 'fonts', to: 'fonts' },
                { from: 'data', to: 'data' },
                { from: 'sw.js', to: 'sw.js' },
                { from: 'favicon.ico', to: 'favicon.ico' },
                { from: 'manifest.json', to: 'manifest.json' },
                { from: 'ts/map/mapworker.js', to: 'ts/map/mapworker.js' },
                { from: 'ts/lib/underscore.min.js', to: 'ts/lib/underscore.min.js' }
            ]
        })
    ]
};

export default config;
