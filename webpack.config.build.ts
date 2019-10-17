import { readFileSync } from "fs";
import { dirname, join, relative, resolve } from "path";
import ts from "typescript";
import webpack from "webpack";
import config from "./webpack.config";

// delete mode to allow webpack inherit mode from command line instead.
delete config.mode;

// change typescript config to remove test file from compiles.
const ruleset = config.module!.rules[0].use as webpack.RuleSetLoader;
(ruleset.options as any).configFile = "tsconfig.build.json";

// add typescript transformation to change alias path
interface ResolveImportFile { originalFileName: string; resolvedFileName: string; }

const transform = (context: ts.TransformationContext): ts.TransformerFactory<ts.SourceFile> => {
    const stringVisitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
        if (ts.isStringLiteral(node) && ts.isSourceFile(node.parent.parent)) {
            if (node.text.startsWith("@db-diagram")) {
                const source = node.parent.parent;
                const sourceFile = source.fileName;
                const resolveFiles = (source as any).resolvedModules as Map<string, ResolveImportFile>;
                const importResolver = (importStmt: string) => {
                    if (!importStmt.startsWith(".")) {
                        importStmt = `./${importStmt}`;
                    }
                    if (importStmt.endsWith(".ts")) {
                        const lastDot = importStmt.lastIndexOf(".");
                        return ts.createLiteral(importStmt.substring(0, lastDot));
                    } else {
                        return ts.createLiteral(importStmt);
                    }
                };
                if (resolveFiles.get(node.text) !== undefined) {
                    const relativeImport = relative(dirname(sourceFile), resolveFiles.get(node.text)!.resolvedFileName);
                    return importResolver(relativeImport);
                } else {
                    const parentConfig = require(resolve("tsconfig.json"));
                    if (parentConfig.compilerOptions &&
                        parentConfig.compilerOptions.declaration &&
                        parentConfig.compilerOptions.declarationDir) {
                        const file = resolve(join(__dirname, "src", node.text.substring(node.text.indexOf("/"))));
                        const relativeImport = relative(dirname(sourceFile), file);
                        return importResolver(relativeImport);
                    }
                }
            }
        }
        return ts.visitEachChild(node, stringVisitor, context);
    };
    const visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
        if (ts.isImportDeclaration(node)) {
            return ts.visitEachChild(node, stringVisitor, context);
        } else if (ts.isExportDeclaration(node)) {
            return ts.visitEachChild(node, stringVisitor, context);
        }
        return ts.visitEachChild(node, visitor, context);
    };
    return (node: any) => ts.visitNode(node, visitor);
};

(ruleset.options as any).getCustomTransformers = () => {
    return {
        afterDeclarations: [transform],
    };
};

export default config;
