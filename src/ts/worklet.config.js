const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    name: 'worklet',
    entry: './worklet.js',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'worklet.min.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
            },
        ],
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
    },
    mode: 'production',
};
