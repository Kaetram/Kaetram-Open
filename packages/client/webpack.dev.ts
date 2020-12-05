import config, { plugins, exclude } from './webpack.config';

import { HotModuleReplacementPlugin } from 'webpack';

plugins.unshift(new HotModuleReplacementPlugin());

export default Object.assign(config, {
    mode: 'development',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.html?$/i,
                loader: 'html-loader',
                exclude
            },
            {
                test: /\.s?[ac]ss$/i,
                use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader'],
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
    devServer: {
        contentBase: __dirname,
        compress: true,
        port: 9000
    },
    plugins
});
