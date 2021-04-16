import path from 'path';

import CopyWebpackPlugin from 'copy-webpack-plugin';
import dotEnvExtended from 'dotenv-extended';
import dotenvParseVariables from 'dotenv-parse-variables';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import { DefinePlugin, ProgressPlugin } from 'webpack';
import type { Configuration, RuleSetRule, WebpackPluginInstance, Compiler } from 'webpack';

import { version, description } from 'kaetram/package.json';

export const resolve = (dir: string): string => path.resolve(__dirname, dir);

/** 5 MiB */
export const maxSize = 5e6;

export type Plugin = (compiler: Compiler) => void;

const env = dotenvParseVariables(dotEnvExtended.load());

/** Plugins for both production and development. */
export const plugins: WebpackPluginInstance[] = [
    new DefinePlugin({
        'process.env': JSON.stringify(env)
    }),
    new CopyWebpackPlugin({
        patterns: ['static']
    }) as Plugin,
    new HtmlWebpackPlugin({
        template: resolve('index.html'),
        minify: {
            collapseWhitespace: true,
            keepClosingSlash: true,
            processScripts: ['application/ld+json'],
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true
        }
    }),
    new FaviconsWebpackPlugin({
        prefix: '',
        logo: resolve('static/icon.png'),
        manifest: {
            display_override: 'fullscreen standalone minimal-ui browser'.split(' '),
            screenshots: [
                {
                    src: 'screenshot.png',
                    sizes: '750x1334',
                    type: 'image/png'
                }
            ]
        },
        favicons: {
            version,
            appName: 'Kaetram',
            appDescription: description,
            background: '#000000',
            theme_color: '#000000',
            display: 'fullscreen',
            pixel_art: true
        }
    }),
    new ProgressPlugin({
        percentBy: 'entries'
    })
];

/** Rules for both production and development. */
export const rules: RuleSetRule[] = [
    {
        test: /\.html?$/i,
        loader: 'html-loader'
    },
    {
        test: /\.ts?$/i,
        use: ['babel-loader', 'ts-loader']
    },
    {
        test: /\.((png|svg|gif)|(mp3)|(ttf|woff|eot))$/i,
        loader: 'file-loader'
    }
];

const config: Configuration = {
    name: 'Client',
    target: 'web',
    entry: 'index.html scss/main.scss src/main.ts'.split(' ').map((src) => resolve(src)),
    performance: {
        maxEntrypointSize: maxSize,
        maxAssetSize: maxSize
    },
    resolve: {
        extensions: 'ts js json io-client'.split(' ').map((ext) => `.${ext}`)
    },
    module: { rules },
    plugins
};

export default config;
