import config from "./webpack.config";
import webpack from "webpack";
import ts from "typescript";
import { relative, dirname, resolve, join } from "path";
import { readFileSync } from "fs";

// delete mode to allow webpack inherit mode from command line instead.
delete config.mode;

// change typescript config to remove test file from compiles.
const ruleset = config.module!.rules[0].use as webpack.RuleSetLoader;
(ruleset.options as any).configFile = "tsconfig.build.json";

// add typescript transformation to change alias path
type ResolveImportFile = { originalFileName: string, resolvedFileName: string };

let transform = (context: ts.TransformationContext): ts.TransformerFactory<ts.SourceFile> => {
    var stringVisitor = function (node: ts.Node): ts.VisitResult<ts.Node> {
        if (ts.isStringLiteral(node) && ts.isSourceFile(node.parent.parent)) {
            if (node.text.startsWith("@db-diagram")) {
                let source = node.parent.parent;
                let sourceFile = source.fileName;
                let resolveFiles = (source as any).resolvedModules as Map<string, ResolveImportFile>;
                let importResolver = (_import: string) => {
                    if (!_import.startsWith(".")) {
                        _import = `./${_import}`;
                    }
                    if (_import.endsWith(".ts")) {
                        let lastDot = _import.lastIndexOf(".");
                        return ts.createLiteral(_import.substring(0, lastDot));
                    } else {
                        return ts.createLiteral(_import);
                    }
                }
                if (resolveFiles.get(node.text) !== undefined) {
                    let relativeImport = relative(dirname(sourceFile), resolveFiles.get(node.text)!.resolvedFileName);
                    return importResolver(relativeImport);
                } else {
                    let config = require(resolve("tsconfig.json"));
                    if (config.compilerOptions &&
                        config.compilerOptions.declaration &&
                        config.compilerOptions.declarationDir) {
                        let file = resolve(join(__dirname, "src", node.text.substring(node.text.indexOf("/"))));
                        let relativeImport = relative(dirname(sourceFile), file);
                        return importResolver(relativeImport);
                    }
                }
            }
        }
        return ts.visitEachChild(node, stringVisitor, context);;
    }
    var visitor = function (node: ts.Node): ts.VisitResult<ts.Node> {
        if (ts.isImportDeclaration(node)) {
            return ts.visitEachChild(node, stringVisitor, context);
        } else if (ts.isExportDeclaration(node)) {
            return ts.visitEachChild(node, stringVisitor, context);
        }
        return ts.visitEachChild(node, visitor, context);
    }
    return function (node: any) { return ts.visitNode(node, visitor); };
};

(ruleset.options as any).getCustomTransformers = () => {
    return {
        afterDeclarations: [transform]
    };
};

export default config;