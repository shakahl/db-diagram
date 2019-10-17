
/**
 * Remove double quote if available.
 * @param str string to remove double quote.
 */
export function noQuote(str: string): string {
    let txt = str.trim();
    if (txt.startsWith("\"")) {
        txt = str.substr(1);
    }
    if (txt.endsWith("\"")) {
        txt = str.substr(0, txt.length - 1);
    }
    return txt;
}
