import karma from "karma";
import webpackConfig from "./webpack.config";
import { join, resolve } from "path";
import { KarmaPlugins } from "./tests/helpers/karma";
import webpack from "webpack";

module.exports = (config: karma.Config) => {
   const mod = webpackConfig.module!;
   mod.rules.push({
      test: /\.ts$/,
      enforce: "post",
      use: { loader: "istanbul-instrumenter-loader" },
      include: resolve("src/")
   } as webpack.RuleSetRule)

   config.set({
      basePath: "",
      frameworks: ["jasmine"],
      files: [{
         pattern: "tests/**/*.spec.ts"
      }, {
         pattern: "tests/fixtures/*.{json,html}"
      }],
      preprocessors: {
         "tests/**/*.spec.ts": ["webpack", "sourcemap"],
         "tests/fixtures/**/*.{json,html}": ["fixtures"]
      },
      plugins: [
         KarmaPlugins.Fixtures(join(__dirname, "tests", "fixtures")),
         KarmaPlugins.Reporter(),
         "karma-jasmine",
         "karma-webpack",
         "karma-coverage",
         "karma-sourcemap-loader",
         "karma-chrome-launcher",
         "karma-firefox-launcher",
         "karma-safari-launcher"
      ],
      webpack: {
         output: webpackConfig.output,
         devtool: webpackConfig.devtool,
         resolve: webpackConfig.resolve,
         plugins: webpackConfig.plugins,
         module: mod,
      },
      customLaunchers: {
         ChromeHeadlessNoSandbox: {
            base: "ChromeHeadless",
            flags: ["--no-sandbox", "--disable-gpu", "--disable-software-rasterizer", "--disable-dev-shm-usage"]
         }
      },
      webpackMiddleware: {
         stats: "errors-only"
      },
      port: 9876,
      colors: true,
      logLevel: config.LOG_ERROR,
      coverageReporter: {
         // specify a common output directory
         dir: "./coverage",
         includeAllSources: true,
         reporters: [
            { type: "html", subdir: "report-html" },
            { type: "lcov", subdir: "report-lcov" },
            { type: "json", subdir: "report-json" },
            { type: "text" }
         ]
      },
      autoWatch: false,
      reporters: ["spec", "coverage"],
      singleRun: true
   });
};