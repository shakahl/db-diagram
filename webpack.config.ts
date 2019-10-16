import webpack from "webpack";
import path from "path";
import TerserPlugin from "terser-webpack-plugin";
import { PluginFactory } from "@krobkrong/resources-utilities";

let pluginSvg = PluginFactory.getPlugins({
   glob: `${__dirname}/resources/icons/*.svg`,
   merge: [`${__dirname}/resources/icons/`],
   output: `${__dirname}/src/@types`,
   mergeFilenameAsId: true,
   cleanSvgPresentationAttr: true
});

let pluginCss = PluginFactory.getPlugins({
   glob: `${__dirname}/resources/styles/*.scss`,
   output: `${__dirname}/src/@types`
});

const config: webpack.Configuration = {
   mode: "development",
   entry: {
      main: "./src/index.ts"
   },
   output: {
      path: path.resolve(__dirname, "dist"),
      library: "DBDiagram"
   },
   resolve: {
      extensions: [".ts", ".js", ".css", ".scss", ".svg"],
      alias: {
         "@db-diagram/assets/icons": path.resolve(__dirname, `resources/icons`),
         "@db-diagram/assets/styles": path.resolve(__dirname, `resources/styles`),
         "@db-diagram/tests": path.resolve(__dirname, "tests"),
         "@db-diagram": path.resolve(__dirname, "src")
      },
      plugins: [pluginSvg, pluginCss]
   },
   devtool: "inline-source-map",
   module: {
      rules: [
         {
            test: /\.ts$/,
            use: {
               loader: "ts-loader",
               options: {
                  configFile: "tsconfig.json"
               }
            },
         }
      ]
   },
   optimization: {
      minimizer: [
         new TerserPlugin({
            test: /\.ts(\?.*)?$/i,
            sourceMap: true
         }),
      ],
   },
   plugins: [pluginSvg, pluginCss],
   devServer: {
      contentBase: [
         path.join(__dirname, "./demo"),
         path.join(__dirname, "./"),
      ],
      compress: true,
      port: 8080,
      host: "0.0.0.0"
   }
};

export default config;