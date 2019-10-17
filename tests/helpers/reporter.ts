import chalk from "chalk";
import karma from "karma";
import { ConsoleTable, DataTable, TableOptions } from "./tables";

/** */
interface Browser {
    id: string;
    name: string;
    fullName: string;
    lastResult: karma.TestResults;
    disconnectsCount: number;
}

/** */
interface TestResult {
    id: string;
    fullName: string;
    description: string;
    skipped: boolean;
    disabled: boolean;
    pending: boolean;
    success: boolean;
    suite: string[];
    log: string[];
    time: number;
    executedExpectationsCount: number;
}

/** */
type ErrFun = (err: Error | string, space: string) => string;

/**
 *
 * @param hasColor
 */
export class ReportSpec {

    public static $inject = ["formatError", "config.colors"];

    private dotCount: number = 0;

    private pass: string;
    private fail: string;
    private skip: string;

    private failure: Map<string, DataTable>;
    private errFun: ErrFun;
    private tbConfig: TableOptions;

    constructor(formatError: ErrFun, hasColor: boolean) {
        chalk.enabled = hasColor;

        this.pass = hasColor ? chalk.green("●") : "●";
        this.fail = hasColor ? chalk.red("●") : "●";
        this.skip = hasColor ? chalk.gray("●") : "●";
        this.failure = new Map();

        this.errFun = formatError;
        this.tbConfig = {
            header: [
                { name: chalk.green("Suite") },
                { name: chalk.blue("Test") },
                { name: "Time" },
                { name: chalk.red("Failure") },
            ],
            maxTableChar: 81,
        };
    }

    public onRunStart() { this.dotCount = 0; }

    public onBrowserStart(browser: Browser) { process.stdout.write(`\nStart Test ${browser.name}\n`); }

    public onBrowserError(browser: Browser, error: any) {
        process.stderr.write(`\n${browser.name}\n ${this.errFun(error, "  ")}`);
    }

    // log from browser
    public onBrowserLog(browser: Browser, log: any, type: any) {
        process.stderr.write(`\n${browser.name}\n${type}\n${log}`);
    }

    public onSpecComplete(browser: Browser, result: TestResult) {
        if (result.skipped) {
            this.write(this.skip);
        } else if (result.success) {
            this.write(this.pass);
        } else {
            const td = this.failure.get(browser.name) || [];
            this.failure.set(browser.name, this.renderFailureResult(result, td));
            this.write(this.fail);
        }
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
            } catch (e) { process.stderr.write(e); }
            this.failure.delete(browser.name);
        }
    }

    public onRunComplete() { process.stdout.write("\n"); }

    private renderFailureResult(result: TestResult, td: DataTable): DataTable {
        const logRow = (result.suite && result.suite.length > 0) ? [result.suite[0]] : [""];
        logRow.push(result.description);
        logRow.push(`${new Date().getMilliseconds() - result.time}ms`);

        // log parser
        if (result.log && result.log.length > 0) {
            const multiLineLog = result.log.join("\n").split("\n");
            const regex = /webpack\:\/\/(.*)\<\-\s*(\S*)$/gm;
            let msg = "";
            for (const line of multiLineLog) {
                const cause = this.errFun(line, "  ");
                if (cause.includes("Error:") || cause.includes("Expected")) {
                    msg += " " + cause;
                } else if (cause.includes(".spec.ts") || cause.includes(".ts")) {
                    let m: RegExpMatchArray | null;
                    // tslint:disable-next-line: no-conditional-assignment
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

    private write(str: string) {
        process.stdout.write(str);
        this.dotCount = (1 + this.dotCount) % 30;
        if (this.dotCount === 0) { process.stdout.write("\n"); }
    }
}
