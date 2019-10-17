
/**
 * Remove double quote if available.
 * @param str string to remove double quote.
 */
export function noQuote(str: string): string {
    str = str.trim();
    if (str.startsWith("\"")) {
        str = str.substr(1);
    }
    if (str.endsWith("\"")) {
        str = str.substr(0, str.length - 1);
    }
    return str;
}