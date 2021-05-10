import { HotModuleReplacementPlugin } from 'webpack';
import type { Configuration } from 'webpack';

import config, { plugins, rules } from './webpack.common';

plugins.unshift(new HotModuleReplacementPlugin());

rules.push({
    test: /\.s?[ac]ss$/i,
    use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader']
});

export default Object.assign(config, {
    mode: 'development',
    devtool: 'inline-source-map',
    module: { rules },
    devServer: {
        host: 'localhost',
        port: 9000
    },
    plugins
} as Configuration);
