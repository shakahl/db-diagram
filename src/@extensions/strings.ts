// this line allow prototype declare below
export {};

/**
 * Add new function to string prototypes.
 */
declare global {
    interface String {
        /**
         * convert string into number.
         */
        toNumber(): number;
        /**
         * remove the character symbol represent class and variable.
         */
        noTypeSelector(): string;
        /**
         * remove start and end double quote from the string
         */
        noQuote(): string;
    }
}

String.prototype.toNumber = function(): number {
    return +this;
};

String.prototype.noTypeSelector = function(): string {
    return this.substr(1);
};

String.prototype.noQuote = function(): string {
    let txt = this.trim();
    if (txt.startsWith("\"")) { txt = txt.substring(1); }
    if (txt.endsWith("\"")) { txt = txt.substr(0, txt.length - 1); }
    return txt;
};
