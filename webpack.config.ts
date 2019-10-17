import { PluginFactory } from "@krobkrong/resources-utilities";
import path from "path";
import TerserPlugin from "terser-webpack-plugin";
import webpack from "webpack";

const pluginSvg = PluginFactory.getPlugins({
   cleanSvgPresentationAttr: true,
   glob: `${__dirname}/resources/icons/*.svg`,
   merge: [`${__dirname}/resources/icons/`],
   mergeFilenameAsId: true,
   output: `${__dirname}/src/@types`,
});

const pluginCss = PluginFactory.getPlugins({
   excludeSelectorSymbol: true,
   glob: `${__dirname}/resources/styles/*.scss`,
   output: `${__dirname}/src/@types`,
});

const config: webpack.Configuration = {
   devServer: {
      compress: true,
      contentBase: [
         path.join(__dirname, "./demo"),
         path.join(__dirname, "./"),
      ],
      host: "0.0.0.0",
      port: 8080,
   },
   devtool: "inline-source-map",
   entry: {
      main: "./src/index.ts",
   },
   mode: "development",
   module: {
      rules: [
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
   optimization: {
      minimizer: [
         new TerserPlugin({
            sourceMap: true,
            test: /\.ts(\?.*)?$/i,
         }),
      ],
   },
   output: {
      library: "DBDiagram",
      path: path.resolve(__dirname, "dist"),
   },
   plugins: [pluginSvg, pluginCss],
   resolve: {
      alias: {
         "@db-diagram/assets/icons": path.resolve(__dirname, `resources/icons`),
         "@db-diagram/assets/styles": path.resolve(__dirname, `resources/styles`),
         "@db-diagram/tests": path.resolve(__dirname, "tests"),
         // tslint:disable-next-line: object-literal-sort-keys
         "@db-diagram": path.resolve(__dirname, "src"),
      },
      extensions: [".ts", ".js", ".css", ".scss", ".svg"],
      plugins: [pluginSvg, pluginCss],
   },
};

export default config;
