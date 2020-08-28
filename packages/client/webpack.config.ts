import path from 'path';
import dotEnvExtended from 'dotenv-extended';
import { WebpackOptions } from 'webpack/declarations/WebpackOptions';

import { HotModuleReplacementPlugin, DefinePlugin } from 'webpack';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import dotenvParseVariables from 'dotenv-parse-variables';
import HtmlWebpackPlugin from 'html-webpack-plugin';
// import CopyPlugin from 'copy-webpack-plugin';

import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const env = dotenvParseVariables(dotEnvExtended.load());
const { NODE_ENV } = env;

const inProduction = NODE_ENV === 'production';

const exclude = /(node_modules|bower_components)/;

const config: WebpackOptions = {
    name: 'Client',
    target: 'web',
    mode: NODE_ENV as 'development' | 'production',
    entry: ['./index.html', './css/main.css', './ts/main.js'].map((file) =>
        path.resolve(__dirname, file)
    ),
    devtool: inProduction ? 'source-map' : 'inline-source-map',
    output: {
        path: path.resolve(__dirname, './dist'),
        libraryTarget: 'umd'
    },
    module: {
        rules: [
            {
                test: /\.html?$/i,
                loader: 'html-loader',
                exclude
            },
            {
                test: /\.css$/i,
                use: [
                    inProduction ? MiniCssExtractPlugin.loader : 'style-loader',
                    'css-loader'
                    // , 'postcss-loader',
                    // 'sass-loader'
                ],
                exclude
            },
            {
                test: /\.js?$/i,
                use: ['babel-loader'],
                exclude
            },
            {
                test: /worker\.js$/i,
                use: ['worker-loader', 'babel-loader'],
                exclude
            },
            {
                test: /\.(png|svg|ttf|woff|eot)$/i,
                loader: 'file-loader',
                exclude
            }
        ]
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
        // , new CopyPlugin({
        //     patterns: [
        //         { from: 'css', to: 'css' },
        //         { from: 'img', to: 'img' },
        //         { from: 'fonts', to: 'fonts' },
        //         { from: 'data', to: 'data' },
        //         { from: 'sw.js', to: 'sw.js' },
        //         { from: 'favicon.ico', to: 'favicon.ico' },
        //         { from: 'manifest.json', to: 'manifest.json' },
        //         { from: 'ts/map/mapworker.js', to: 'ts/map/mapworker.js' },
        //         { from: 'ts/lib/underscore.min.js', to: 'ts/lib/underscore.min.js' }
        //     ]
        // })
        new HtmlWebpackPlugin({
            template: path.join(__dirname, './index.html'),
            minify: inProduction
                ? // eslint-disable-next-line indent
                  {
                      collapseWhitespace: true,
                      removeComments: true,
                      removeRedundantAttributes: true,
                      useShortDoctype: true,
                      processScripts: ['application/ld+json']
                  }
                : false
        }),
        new MiniCssExtractPlugin()
    ]
};

export default config;
