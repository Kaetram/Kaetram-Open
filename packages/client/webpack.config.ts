import path from 'path';
import dotEnvExtended from 'dotenv-extended';
import dotenvParseVariables from 'dotenv-parse-variables';

import type { Configuration, WebpackOptionsNormalized } from 'webpack';
import { DefinePlugin, WebpackPluginInstance } from 'webpack';

import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

// import { version, description } from '../../package.json';

const env = dotenvParseVariables(dotEnvExtended.load()) as Record<string, string>;
const { ASSET_PATH } = env;

export const exclude = /(node_modules|bower_components)/;

/** 5 MiB */
export const maxSize = 5e6;

// const iconPath = path.resolve(__dirname, 'img/icon.png');

/** Plugins for both production and development. */
export const plugins: WebpackPluginInstance[] = [
    new CleanWebpackPlugin(),
    new DefinePlugin({
        'process.env': JSON.stringify(env)
    }),
    new CopyWebpackPlugin({
        patterns: ['robots.txt', 'img/icon.png']
    }),
    new HtmlWebpackPlugin({
        template: path.join(__dirname, './index.html'),
        minify: 'auto'
    }),
    // new FaviconsWebpackPlugin({
    //     logo: iconPath,
    //     prefix: '',
    //     favicons: {
    //         appName: 'Kaetram',
    //         appDescription: description,
    //         version,
    //         background: '#000000',
    //         theme_color: '#000000',
    //         display: 'fullscreen',
    //         start_url: '/?utm_source=a2hs',
    //         pixel_art: true
    //     }
    // }),
    // new SitemapPlugin('https://kaetram.com', ['/']),
    new MiniCssExtractPlugin({
        filename: '[name].[fullhash].css',
        chunkFilename: '[name].[chunkhash].css'
    })
];

export type Config = Configuration & Pick<WebpackOptionsNormalized, 'devServer'>;

const config: Config = {
    name: 'Client',
    target: 'web',
    entry: ['./index.html', './scss/main.scss', './src/main.ts'].map((file) =>
        path.resolve(__dirname, file)
    ),
    performance: {
        maxEntrypointSize: maxSize,
        maxAssetSize: maxSize
    },
    output: {
        publicPath: ASSET_PATH || '/',
        path: path.resolve(__dirname, './dist'),
        filename: '[name].[fullhash].js',
        chunkFilename: '[name].[chunkhash].js',
        libraryTarget: 'umd'
    },
    resolve: {
        extensions: 'ts js json io-client'.split(' ').map((ext) => `.${ext}`)
    },
    plugins
};

export default config;
