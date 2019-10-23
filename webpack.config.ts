import { PluginFactory } from "@krobkrong/resources-utilities";
import path from "path";
import TerserPlugin from "terser-webpack-plugin";
import webpack from "webpack";
import "webpack-dev-server";

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

export interface CommandArgument {
   mode: "production" | "development" | "none";
   domain: "browser" | "node";
}

export default function (_: {}, argv: CommandArgument) {

   let parentDir = "";
   let libTarget: webpack.LibraryTarget = "var";
   if (argv.domain === "browser") {
      parentDir = "browser/";
   } else {
      libTarget = "commonjs2";
   }

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
      mode: argv.mode,
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
               test: /\.js(\?.*)?$/i,
            }),
         ],
      },
      output: {
         library: "DBDiagram",
         filename: (): string => {
            const includeDefault = process.env.NODE_ENV === "production" ? "" : ".default";
            const suffix = argv.mode === "production" ? ".min" : "";
            return `${parentDir}db-diagram${includeDefault}${suffix}.js`;
         },
         libraryTarget: libTarget,
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

   return config;
};
