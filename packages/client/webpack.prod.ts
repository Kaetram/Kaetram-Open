import config, { plugins, maxSize, exclude } from './webpack.config';

import ResourceHintWebpackPlugin from 'resource-hints-webpack-plugin';
import { GenerateSW } from 'workbox-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

plugins.push(
    new ResourceHintWebpackPlugin(),
    new GenerateSW({
        cacheId: 'kaetram',
        maximumFileSizeToCacheInBytes: maxSize
    })
);

export default Object.assign(config, {
    mode: 'production',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.html?$/i,
                loader: 'html-loader',
                exclude
            },
            {
                test: /\.s?[ac]ss$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader'],
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
    plugins
});
