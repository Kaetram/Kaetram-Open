import config, { plugins, rules, maxSize, exclude, env } from './webpack.common';
import type { Config } from './webpack.common';

import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import ResourceHintWebpackPlugin from 'resource-hints-webpack-plugin';
import { GenerateSW } from 'workbox-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { resolve } from './webpack.common';

plugins.push(
    ...[
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin(),
        new ResourceHintWebpackPlugin(),
        new GenerateSW({
            cacheId: 'kaetram',
            maximumFileSizeToCacheInBytes: maxSize,
            clientsClaim: true,
            skipWaiting: true
        })
    ]
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
