import path from 'path';
import dotEnvExtended from 'dotenv-extended';
import dotenvParseVariables from 'dotenv-parse-variables';
import { WebpackOptions } from 'webpack/declarations/WebpackOptions';

import { HotModuleReplacementPlugin, DefinePlugin } from 'webpack';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { InjectManifest } from 'workbox-webpack-plugin';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import SitemapPlugin from 'sitemap-webpack-plugin';
import RobotstxtPlugin from 'robotstxt-webpack-plugin';
import ResourceHintWebpackPlugin from 'resource-hints-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

import { version, description } from '../../package.json';

const env = dotenvParseVariables(dotEnvExtended.load());
const { NODE_ENV } = env;

const inProduction = NODE_ENV === 'production';

const exclude = /(node_modules|bower_components)/;

const iconPath = path.resolve(__dirname, 'img/icon.png');

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
        new CopyWebpackPlugin({
            patterns: ['img/icon.png']
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
        new FaviconsWebpackPlugin({
            logo: iconPath,
            prefix: '',
            favicons: {
                appName: 'Kaetram',
                appDescription: description,
                version,
                background: '#000000',
                theme_color: '#000000',
                display: 'fullscreen',
                start_url: '/?utm_source=a2hs',
                pixel_art: true
            }
        }),
        new SitemapPlugin('https://kaetram.com', ['/']),
        new RobotstxtPlugin({
            sitemap: 'https://kaetram.com/sitemap.xml',
            host: 'https://kaetram.com'
        }),
        new MiniCssExtractPlugin({
            filename: '[name].[hash].css',
            chunkFilename: '[name].[chunkhash].css'
        }),
        new ResourceHintWebpackPlugin(),
        new InjectManifest({
            swSrc: './lib/sw.ts',
            maximumFileSizeToCacheInBytes: 5e6
        })
    ]
};

export default config;
