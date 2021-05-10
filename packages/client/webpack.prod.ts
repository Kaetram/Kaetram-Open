import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import PreloadWebpackPlugin from '@vue/preload-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { GenerateSW } from 'workbox-webpack-plugin';

import { name } from 'kaetram/package.json';

import config, { env, exclude, maxSize, plugins, resolve, rules } from './webpack.common';
import type { Config } from './webpack.common';

plugins.push(
    new CleanWebpackPlugin(),
    new PreloadWebpackPlugin({
        as: 'font',
        include: 'allAssets',
        fileWhitelist: [/\.woff$/i]
    }),
    new MiniCssExtractPlugin() as () => void,
    new GenerateSW({
        cacheId: name,
        maximumFileSizeToCacheInBytes: maxSize,
        skipWaiting: true,
        clientsClaim: true
    })
);

rules.push({
    test: /\.s?[ac]ss$/i,
    use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader'],
    exclude
});

export default Object.assign(config, {
    mode: 'production',
    devtool: 'source-map',
    output: {
        publicPath: env.ASSET_PATH || '/',
        path: resolve('dist')
    },
    module: { rules },
    plugins
} as Config);
