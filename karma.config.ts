import karma from "karma";
import { join, resolve } from "path";
import webpack from "webpack";
import { KarmaPlugins } from "./tests/helpers/karma";
import webpackConfig from "./webpack.config";

module.exports = (config: karma.Config) => {
   const mod = webpackConfig.module!;
   mod.rules.push({
      enforce: "post",
      include: resolve("src/"),
      test: /\.ts$/,
      use: { loader: "istanbul-instrumenter-loader" },
   } as webpack.RuleSetRule);

   config.set({
      autoWatch: false,
      basePath: "",
      colors: true,
      coverageReporter: {
         // specify a common output directory
         dir: "./coverage",
         includeAllSources: true,
         reporters: [
            { type: "html", subdir: "report-html" },
            { type: "lcov", subdir: "report-lcov" },
            { type: "json", subdir: "report-json" },
            { type: "text" },
         ],
      },
      customLaunchers: {
         ChromeHeadlessNoSandbox: {
            base: "ChromeHeadless",
            flags: ["--no-sandbox", "--disable-gpu", "--disable-software-rasterizer", "--disable-dev-shm-usage"],
         },
      },
      files: [{
         pattern: "tests/**/*.spec.ts",
      }, {
         pattern: "tests/fixtures/*.{json,html}",
      }],
      frameworks: ["jasmine"],
      logLevel: config.LOG_ERROR,
      plugins: [
         KarmaPlugins.Fixtures(join(__dirname, "tests", "fixtures")),
         KarmaPlugins.Reporter(),
         "karma-jasmine",
         "karma-webpack",
         "karma-coverage",
         "karma-sourcemap-loader",
         "karma-chrome-launcher",
         "karma-firefox-launcher",
         "karma-safari-launcher",
      ],
      port: 9876,
      preprocessors: {
         "tests/**/*.spec.ts": ["webpack", "sourcemap"],
         "tests/fixtures/**/*.{json,html}": ["fixtures"],
      },
      reporters: ["spec", "coverage"],
      singleRun: true,
      webpack: {
         devtool: webpackConfig.devtool,
         module: mod,
         output: webpackConfig.output,
         plugins: webpackConfig.plugins,
         resolve: webpackConfig.resolve,
      },
      webpackMiddleware: {
         stats: "errors-only",
      },
   });
};
