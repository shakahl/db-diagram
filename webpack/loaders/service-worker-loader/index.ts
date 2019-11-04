import loaderUtils from "loader-utils";
import path from "path";
import util from "util";
import webpack from "webpack";
import SingleEntryPlugin from "webpack/lib/SingleEntryPlugin";
import WebWorkerTemplatePlugin from "webpack/lib/webworker/WebWorkerTemplatePlugin";

import { readFileSync } from "fs";
import ts from "typescript";

// cache object
interface Cache {
    compiler: any;
    options: any;
    filename: string;
    outputOptions: any;
    webWokerTempPlugin: WebWorkerTemplatePlugin;
    singleEntryPlugin: SingleEntryPlugin;
}

let cache: Cache;
const runtimeFile = path.join(__dirname, "../../../src/services/runtime.ts");

// default loader, pitch does not required loader to be implemented.
export default function loader() { return; }

function serviceWorker(file: string) {
    const options = require(path.join(process.cwd(), "tsconfig.json"));
    const source = readFileSync(runtimeFile).toString();
    const result = ts.transpileModule(source.toString(), options);
    return result.outputText.replace("\"[[script-url]]\"", file);
}

export function pitch(this: webpack.loader.LoaderContext, request: any) {
    const identifier = "service-worker-loader";

    if (!cache) {
        const opt = loaderUtils.getOptions(this) || {};
        const filename = loaderUtils.interpolateName(
            this,
            opt.name || "[name].js",
            {
                context: opt.context || this.rootContext || this.context,
                regExp: opt.regExp,
            },
        );
        cache = {
            filename,
            options: opt,
            outputOptions: {
                chunkFilename: `[id].${filename}`,
                filename,
                namedChunkFilename: null,
            },
        } as Cache;

        this.cacheable(false);

        this._compiler.hooks.afterCompile.tap(identifier, (compilation) => {
            compilation.fileDependencies.add(runtimeFile);
        });
    }

    cache.webWokerTempPlugin = new WebWorkerTemplatePlugin(cache.options);
    cache.singleEntryPlugin = new SingleEntryPlugin(this.context, `!!${request}`, "main");

    cache.compiler = this._compilation.createChildCompiler(identifier, cache.outputOptions);
    cache.webWokerTempPlugin.apply(cache.compiler);
    cache.singleEntryPlugin.apply(cache.compiler);

    const subCache = `subcache ${__dirname} ${request}`;
    cache.compiler.hooks.compilation.tap(identifier, (compilation: { cache: { [x: string]: any; }; }) => {
        if (compilation.cache) {
            if (!compilation.cache[subCache]) {
                compilation.cache[subCache] = {};
            }
            compilation.cache = compilation.cache[subCache];
        }
    });

    const cb = this.async()!;
    const rootCompiler = this._compiler;
    const fs = rootCompiler.outputFileSystem;
    const unlink = util.promisify(fs.unlink.bind(fs));
    const writeFile = util.promisify(fs.writeFile.bind(fs));
    cache.compiler.runAsChild((err: Error, entries: webpack.Entry[]) => {

        if (err) {
            return cb(err);
        }

        if (entries[0]) {

            const file = entries[0].files[0];
            const code = serviceWorker(JSON.stringify(file));

            if (!file) {
                return cb(new Error("No file."));
            }

            if (cache.options.outputOptions) {
                rootCompiler.hooks.afterEmit.tapAsync(identifier, (compilation) => {
                    const asset = compilation.assets[file];
                    return Promise.all([
                        unlink(asset.existsAt),
                        writeFile(
                            path.join(cache.options.outputPath, file),
                            asset.source(),
                        ),
                    ]);
                });
            }
            return cb(undefined, code);
        }

        return cb(undefined, undefined);
    });
}
