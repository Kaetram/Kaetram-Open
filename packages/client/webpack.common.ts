import path from 'path';

import CopyWebpackPlugin from 'copy-webpack-plugin';
import dotEnvExtended from 'dotenv-extended';
import dotenvParseVariables from 'dotenv-parse-variables';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import { description, version } from 'kaetram/package.json';

import { DefinePlugin } from 'webpack';
import type {
    Configuration,
    RuleSetRule,
    WebpackOptionsNormalized,
    WebpackPluginInstance
} from 'webpack';

export const env = dotenvParseVariables(dotEnvExtended.load());

export const exclude = /(node_modules|bower_components)/;

export const resolve = (dir: string): string => path.resolve(__dirname, dir);

/** 5 MiB */
export const maxSize = 5e6;

/** Plugins for both production and development. */
export const plugins: WebpackPluginInstance[] = [
    new DefinePlugin({
        'process.env': JSON.stringify(env)
    }),
    new CopyWebpackPlugin({
        patterns: ['static']
    }) as () => void,
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
        logo: resolve('static/icon.png'),
        prefix: '',
        favicons: {
            appName: 'Kaetram',
            appDescription: description,
            background: '#000000',
            theme_color: '#000000',
            display: 'fullscreen',
            version,
            pixel_art: true
        }
    })
];

/** Rules for both production and development. */
export const rules: RuleSetRule[] = [
    {
        test: /\.html?$/i,
        loader: 'html-loader',
        exclude
    },
    {
        test: /\.ts?$/i,
        use: ['babel-loader', 'ts-loader'],
        exclude
    },
    {
        test: /\.((png|svg|gif)|(mp3)|(ttf|woff|eot))$/i,
        loader: 'file-loader',
        exclude
    }
];

export type Config = Configuration & Pick<WebpackOptionsNormalized, 'devServer'>;

const config: Config = {
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
