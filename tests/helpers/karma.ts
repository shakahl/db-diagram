import { resolve } from "path";
import { format } from "util";
import { ReportSpec } from "./reporter";

/** */
interface FileState {
    path: string;
    originalPath: string;
    contentPath: string;
    mtime?: Date;
    isUrl?: boolean;
    doNotCache?: boolean;
}

/** */
enum FixtureDataType {
    html = "HTML",
    object = "JSON",
    script = "JAVASCRIPT",
}

/** */
export interface Fixture<T> {
    data: T;
    reset?: () => void;
}

/** */
interface FixtureData<T> {
    content: () => Fixture<T>;
    type: FixtureDataType;
}

/** */
declare global {
    interface Window {
        __contextFixtures__: {
            [index: string]: FixtureData<any>;
        };
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
        throw new Error("Did you forget to setup fixtures plugin in your Karma configuration ?");
    }
    if (undefined === window.__contextFixtures__[name]) {
        throw new Error(`No fixture name ${name} avaialble, Did you forget to add them into karma pattern ?`);
    }
    return window.__contextFixtures__[name].content();
}

/** */
const loadFixtureData = (fixtureDir: string) => {
    return (content: string, file: FileState, done: (script: string) => void) => {
        const lastDot = file.originalPath.lastIndexOf(".");
        if (lastDot > 0) {
            const fixtureName = file.originalPath.replace(fixtureDir + "/", "");
            const temp = `window.${fixtureVariable} = window.${fixtureVariable} || {};\n` +
                `window.${fixtureVariable}["%s"] = %s\n`;

            switch (file.originalPath.substring(lastDot)) {
                case ".json":
                    // transform file path
                    file.path = file.path.replace(/\.json$/, ".js");
                    done(format(temp, fixtureName, `{
                        content: () => {
                            return Object.assign({}, { data:${content} });
                        },
                        type: "${FixtureDataType.object.toString()}",
                    }`));
                    return;

                case ".html":
                    file.path = file.path.replace(/\.html$/, ".js");
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
            }],
        };
    }

    public static Reporter() {
        return {
            "reporter:spec": ["type", ReportSpec],
        };
    }
}
