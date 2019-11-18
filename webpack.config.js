const path = require('path');

module.exports = {
    mode: 'production',
    entry: './client/js/lib/home.js',
    output: {
        libraryTarget: 'amd',
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'client/dist')
    }
    // externals: {
    //     jquery: 'jQuery'
    // }
};
