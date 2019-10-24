import path from "path";
import webpack from "webpack";
import "webpack-dev-server";

const config: webpack.Configuration = {
    devServer: {
        compress: true,
        contentBase: [
            path.join(__dirname, "demo"),
            path.join(__dirname, "./"),
        ],
        host: "0.0.0.0",
        port: 8080,
    },
    devtool: "inline-source-map",
    entry: {
        main: "./src/index.ts",
    },
    module: {
        rules: [
            {
                test: /\.svg$/,
                loader: 'svg-inline-loader'
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.ts$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        configFile: "tsconfig.json",
                    },
                },
            },
        ],
    },
    output: {
        library: "Sample",
        path: path.resolve(__dirname, "demo"),
    },
    resolve: {
        alias: {
            "@krobkrong/db-diagram/dist/resources": path.resolve(__dirname, "node_modules", "@krobkrong", "db-diagram", "dist", "resources")
        },
        extensions: [".ts", ".js", ".css", ".scss", ".svg"],
    },
};

export default config;
