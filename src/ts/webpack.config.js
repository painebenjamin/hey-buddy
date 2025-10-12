const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    name: 'main',
    entry: './src/hey-buddy.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'hey-buddy.min.js',
        library: 'hey-buddy',
        libraryTarget: 'umd',
        globalObject: 'this',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
        ],
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
    },
    mode: 'production',
};
