import chalk from "chalk";
import stripAnsi from "strip-ansi";

/** */
export type DataTable = string[][];

/** */
export interface HeaderField {
    name: string;
    width?: number;
}

/** */
export interface TableOptions {
    maxTableChar: number;
    header: HeaderField[];
}

export function ConsoleTable(data: DataTable, options: TableOptions) {
    const maxWidth = options.maxTableChar - (3 * options.header.length) - 1;
    const pad = (text: string = "", length: number) => {
        const stripTxt = stripAnsi(text);
        const txtLen = stripTxt.charCodeAt(0) > 255 ? stripTxt.length + 1 : stripTxt.length;
        return text + new Array(Math.max(length - txtLen + 1, 0)).join(" ");
    };

    const headerFields = options.header;
    let allWidth = 0;

    const widthCalulcation = (n: number, index: number) => {
        let cWidth = Math.max(headerFields[index].width as number || 0, n);
        let nWidth = allWidth + cWidth;
        if (nWidth > maxWidth) {
            if (index < headerFields.length - 1) {
                throw new Error("Not enough room to display all text.");
            }
            cWidth -= (nWidth - maxWidth);
            nWidth = maxWidth;
        }
        allWidth = nWidth;
        headerFields[index].width = cWidth;
    };

    for (let i = 0; i < headerFields.length; i++) {
        if (!headerFields[i].width) {
            widthCalulcation(stripAnsi(headerFields[i].name).length, i);
        }
        headerFields[i].name = chalk.bold(headerFields[i].name);
    }

    const truncate = (txt: string, width: number): string => {
        txt = txt.trim();
        if (txt.length >= width) {
            txt = txt.substr(0, 3) + "..." + txt.substr(txt.length - width + 8);
        }
        return txt;
    };

    for (let row = 0; row < data.length; row++) {
        const line = data[row];
        allWidth = 0;
        line.forEach((value, column) => {
            const stripTxt = stripAnsi(value);
            const txtLen = stripTxt.length;
            widthCalulcation(txtLen, column);
            if (column === line.length - 1 && txtLen > headerFields[column].width!) {
                // column wrapped for long error
                let spaceIndex = -1;
                let initIndex = 0;
                let wrapCount = 0;
                let injectIndex = row + 1;
                for (let i = 0; i < txtLen; i++) {
                    if (stripTxt.charCodeAt(i) === 32) {
                        spaceIndex = i;
                    }
                    if (i - initIndex > headerFields[column].width! && spaceIndex !== -1) {
                        const subIndex = spaceIndex === -1 ? i : spaceIndex;
                        const txt = truncate(stripTxt.substring(initIndex, subIndex), headerFields[column].width!);
                        if (wrapCount === 0) {
                            line[column] = chalk.red(txt);
                        } else {
                            data.splice(injectIndex, 0, ["", "", "", chalk.red(txt)]);
                            injectIndex += 1;
                        }
                        initIndex = spaceIndex !== -1 ? subIndex + 1 : subIndex;
                        spaceIndex = -1;
                        wrapCount += 1;
                    }
                }
                if (initIndex < txtLen) {
                    const txt = truncate(stripTxt.substring(initIndex), headerFields[column].width!);
                    data.splice(injectIndex, 0, ["", "", "", chalk.red(txt)]);
                    wrapCount += 1;
                }
                // shirt row to skip the wrap row data.
                row += wrapCount - 1;
            }
        });
    }

    const output: string[] = [];

    const separator = [""]
        .concat(headerFields.map((h) => new Array(h.width as number + 1).join("-")))
        .concat([""])
        .join("-|-");

    output.push(separator);
    output.push([""].concat(headerFields.map((e) => pad(e.name, e.width as number)))
        .concat([""])
        .join(" | "));
    output.push(separator);

    data.forEach((row) => {
        output.push([""].concat(headerFields.map((h, i) => pad(row[i], h.width as number)))
            .concat([""])
            .join(" | "));
    });
    output.push(separator);

    return output.map((e) => e.replace(/^[ -]/, "").replace(/[ -]$/, "")).join("\n") + "\n";
}
