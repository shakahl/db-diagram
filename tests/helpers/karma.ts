import { format } from "util";
import { resolve } from "path";
import chalk from "chalk";
import karma from "karma";
import { DataTable, TableOptions, ConsoleTable } from "./tables";

/** */
type FileState = {
    path: string
    originalPath: string
    contentPath: string
    mtime?: Date
    isUrl?: boolean
    doNotCache?: boolean
}

/** */
enum FixtureDataType {
    html = "HTML",
    object = "JSON",
    script = "JAVASCRIPT"
}

/** */
export type Fixture<T> = {
    data: T
    reset?: () => void
}

/** */
type FixtureData<T> = {
    content: () => Fixture<T>
    type: FixtureDataType
}

/** */
declare global {
    interface Window {
        __contextFixtures__: {
            [index: string]: FixtureData<any>;
        }
    }
}

/** */
const fixtureVariable = "__contextFixtures__";

/**
 * 
 * @param name 
 */
export function loadFixtures<T>(name: string): Fixture<T> {
    if (!window.__contextFixtures__) {
        throw "Did you forget to setup fixtures plugin in your Karma configuration ?";
    }
    if (undefined === window.__contextFixtures__[name]) {
        throw `No fixture name ${name} avaialble, Did you forget to add them into karma pattern ?`;
    }
    return window.__contextFixtures__[name].content();
}

/** */
const loadFixtureData = (fixtureDir: string) => {
    return (content: string, file: FileState, done: (script: string) => void) => {
        const lastDot = file.originalPath.lastIndexOf(".");
        if (lastDot > 0) {
            var fixtureName = file.originalPath.replace(fixtureDir + "/", '');
            let temp = `window.${fixtureVariable} = window.${fixtureVariable} || {};\n` +
                `window.${fixtureVariable}["%s"] = %s\n`;

            switch (file.originalPath.substring(lastDot)) {
                case ".json":
                    // transform file path
                    file.path = file.path.replace(/\.json$/, '.js');
                    done(format(temp, fixtureName, `{
                        content: () => {
                            return Object.assign({}, { data:${content} });
                        },
                        type: "${FixtureDataType.object.toString()}",
                    }`));
                    return;

                case ".html":
                    file.path = file.path.replace(/\.html$/, '.js');
                    done(format(temp, fixtureName, `{
                        content: () => {
                            let div = document.createElement("div");
                            div.innerHTML = \`${content}\`;
                            var now = new Date();
                            div.children[0].setAttribute("id", "_ab" + now.getTime());
                            let fixtureElement = document.body.appendChild(div.children[0]);
                            return { 
                                data: fixtureElement,
                                reset: () => {
                                    fixtureElement.remove();
                                }
                            };
                        },
                        type: "${FixtureDataType.html.toString()}",
                    }`));
                    return;

            }
        }
        done(content);
    };
};

/** */
interface Browser {
    id: string
    name: string
    fullName: string
    lastResult: karma.TestResults
    disconnectsCount: number
}

/** */
interface TestResult {
    id: string
    fullName: string
    description: string
    skipped: boolean
    disabled: boolean
    pending: boolean
    success: boolean
    suite: string[]
    log: string[]
    time: number
    executedExpectationsCount: number
}

/** */
type ErrFun = (err: Error | String, space: string) => string;

/**
 * 
 * @param hasColor 
 */
export class ReportSpec {

    private dotCount: number = 0;

    private pass: string;
    private fail: string;
    private skip: string;

    private failure: Map<string, DataTable>;
    private errFun: ErrFun;
    private tbConfig: TableOptions;

    public static $inject = ["formatError", "config.colors"];

    constructor(formatError: ErrFun, hasColor: boolean) {
        chalk.enabled = hasColor;

        this.pass = hasColor ? chalk.green("●") : "●";
        this.fail = hasColor ? chalk.red("●") : "●";
        this.skip = hasColor ? chalk.gray("●") : "●";
        this.failure = new Map();

        this.errFun = formatError;
        this.tbConfig = {
            maxTableChar: 81,
            header: [ 
                { name: chalk.green("Suite") }, 
                { name: chalk.blue("Test") }, 
                { name: "Time" },
                { name: chalk.red("Failure") }
            ]
        };
    }

    public onRunStart() { this.dotCount = 0; }

    public onBrowserStart(browser: Browser) { process.stdout.write(`\nStart Test ${browser.name}\n`); }

    public onBrowserError(browser: Browser, error: any) {
        console.log("\n", browser.name, "\n", this.errFun(error, "  "));
    }

    // log from browser
    public onBrowserLog(browser: Browser, log: any, type: any) { 
        console.log("\n", browser.name, "\n", type, "\n", log);
    }

    public onSpecComplete(browser: Browser, result: TestResult) {
        if (result.skipped) {
            this.write(this.skip);
        } else if (result.success) {
            this.write(this.pass);
        } else {
            let td = this.failure.get(browser.name) || [];
            this.failure.set(browser.name, this.renderFailureResult(result, td));
            this.write(this.fail);
        }
    }

    private renderFailureResult(result: TestResult, td: DataTable): DataTable {
        let logRow = (result.suite && result.suite.length > 0) ? [result.suite[0]] : [""];
        logRow.push(result.description);
        logRow.push(`${new Date().getMilliseconds() - result.time}ms`);

        // log parser
        if (result.log && result.log.length > 0) {
            const multiLineLog = result.log.join("\n").split("\n");
            const regex = /webpack\:\/\/(.*)\<\-\s*(\S*)$/gm;
            let msg = "";
            for (let i = 0; i < multiLineLog.length; i++) {
                let cause = this.errFun(multiLineLog[i], "  ");
                if (cause.includes("Error:") || cause.includes("Expected")) {
                    msg += " " + cause;
                } else if (cause.includes(".spec.ts") || cause.includes(".ts")) {
                    let m: RegExpMatchArray | null;
                    while ((m = regex.exec(cause.trim())) !== null) {
                        if (m.index === regex.lastIndex) {
                            regex.lastIndex++;
                        }
                        msg += " 🔥・" + chalk.red(m![1].substring(m![1].indexOf("/") + 1));
                    }
                }
            }
            logRow.push(chalk.red(msg));
        }
        td.push(logRow);
        return td;
    }

    public onBrowserComplete(browser: Browser) {
        const result = browser.lastResult;
        const msg = `\nBrowser: ${browser.name} complete with ${result.error ? "error" : "no error"}: ` +
            chalk.green(`success(${result.success}) `) +
            chalk.red(`failed(${result.failed}) `) +
            `exit(${result.exitCode ? result.exitCode : 0})\n`;
        process.stdout.write(msg);
        if (this.failure.get(browser.name)) {
            try {
                process.stdout.write(ConsoleTable(this.failure.get(browser.name)!, this.tbConfig));
            } catch (e) { console.log(e); }
            this.failure.delete(browser.name);
        }
    }

    public onRunComplete() { process.stdout.write("\n"); }

    private write(str: string) {
        process.stdout.write(str);
        this.dotCount = (1 + this.dotCount) % 30;
        if (this.dotCount === 0) process.stdout.write("\n");
    }
}

/**
 * 
 * @param base 
 */
export class KarmaPlugins {
    public static Fixtures(base: string) {
        const fixtureDir = resolve(base);
        return {
            "preprocessor:fixtures": ["factory", () => {
                return loadFixtureData(fixtureDir);
            }]
        };
    }

    public static Reporter() {
        return {
            "reporter:spec": ["type", ReportSpec]
        };
    }
};