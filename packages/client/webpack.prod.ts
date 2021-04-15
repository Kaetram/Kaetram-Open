import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import PreloadWebpackPlugin from '@vue/preload-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { GenerateSW } from 'workbox-webpack-plugin';

import type { Configuration } from 'webpack';

import config, { maxSize, plugins, resolve, rules } from './webpack.common';
import type { Plugin } from './webpack.common';

import { name } from 'kaetram/package.json';

plugins.push(
    new CleanWebpackPlugin(),
    new PreloadWebpackPlugin({
        as: 'font',
        include: 'allAssets',
        fileWhitelist: [/\.woff$/i]
    }),
    new MiniCssExtractPlugin() as Plugin,
    new GenerateSW({
        cacheId: name,
        maximumFileSizeToCacheInBytes: maxSize,
        skipWaiting: true,
        clientsClaim: true
    })
);

rules.push({
    test: /\.s?[ac]ss$/i,
    use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader']
});

export default Object.assign(config, {
    mode: 'production',
    devtool: 'source-map',
    output: {
        path: resolve('dist')
    },
    module: { rules },
    plugins
} as Configuration);
