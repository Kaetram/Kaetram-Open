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
    entry: ['./index.html', './scss/main.scss', './ts/main.ts'].map((file) =>
        path.resolve(__dirname, file)
    ),
    devtool: inProduction ? 'source-map' : 'inline-source-map',
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].[hash].js',
        chunkFilename: '[name].[chunkhash].js',
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
                test: /\.s?[ac]ss$/i,
                use: [
                    inProduction ? MiniCssExtractPlugin.loader : 'style-loader',
                    'css-loader',
                    'postcss-loader',
                    'sass-loader'
                ],
                exclude
            },
            {
                test: /\.ts?$/i,
                use: ['babel-loader', 'ts-loader'],
                exclude
            },
            {
                test: /worker\.ts$/i,
                use: ['worker-loader', 'babel-loader', 'ts-loader'],
                exclude
            },
            {
                test: /\.((png|svg|gif)|(mp3)|(ttf|woff|eot))$/i,
                loader: 'file-loader',
                exclude
            }
        ]
    },
    resolve: {
        extensions: 'ts js json io-client'.split(' ').map((ext) => `.${ext}`)
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
        new MiniCssExtractPlugin({
            filename: '[name].[hash].css',
            chunkFilename: '[name].[chunkhash].css'
        })
    ]
};

export default config;
