import icons from "@db-diagram/assets/icons";
import styles from "@db-diagram/assets/styles/style-dark.scss";
import { Base } from "@db-diagram/elements/base";
import {
    applyAttribute, getAttributeNumber, PathAttribute, TextAttribute, UseAttribute,
} from "@db-diagram/elements/utils/attributes";
import { FieldOptions, TableOptions } from "@db-diagram/elements/utils/options";
import { Box, DataType } from "@db-diagram/elements/utils/types";

/**
 * add custom properties to hold visualization object. This field is only used
 * when database diagram is being used under a custom web component.
 */
declare global {
    interface SVGSVGElement {
        __visualization: Visualization;
    }
}

/**
 * Callback to execute code until dom is ready.
 * @param callBack callback function
 */
export const onDomReady = (callBack: () => void) => {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", callBack);
    } else {
        callBack();
    }
};

/**
 * Type alias callback
 */
type ElementCallback = <T extends SVGElement>(ele: T) => void;

/**
 * Padding data
 */
export interface Padding {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
}

/**
 * A share object providing access to share data that accelerate calculation
 * when create diagram element.
 */
export class Visualization {

    /**
     * Return singleton instance of Visualization.
     * @param root root native element of the diagram.
     */
    public static getInstance(root: HTMLElement | SVGSVGElement = document.documentElement): Visualization {
        if (root instanceof SVGSVGElement) {
            if (root.__visualization) { return root.__visualization; }

            const customRoot = this.findCustomRootElement(root);
            if (customRoot !== undefined && customRoot.shadowRoot) {
                if (!root.__visualization) {
                    root.__visualization = new Visualization(root as SVGSVGElement);
                    onDomReady(() => {
                        customRoot!.shadowRoot!.appendChild(root.__visualization.shareSvg);
                        root.__visualization.updatePropertiesValue();
                    });
                }
                return root.__visualization;
            }
        }
        // use globals
        if (!Visualization.instance) {
            Visualization.instance = new Visualization(root);
            onDomReady(() => {
                document.body.appendChild(Visualization.instance.shareSvg);
                Visualization.instance.updatePropertiesValue();
            });
        }
        return Visualization.instance;
    }

    /**
     * Create a reference use svg element.
     * @param id id of actual element
     * @param attr attribute to be apply to the use element.
     */
    public static createReferencePathIcon(id: string, attr?: PathAttribute): SVGUseElement {
        return applyAttribute(Base.createElement("use"), Object.assign({}, {
            href: `#${id}`,
        } as UseAttribute, attr));
    }

    /**
     * Find the parent web component element. If diagram did not use under a web component,
     * it will return undefined value.
     * @param ele svg root diagram element.
     */
    public static findCustomRootElement(ele: Element): Element | undefined {
        if (ele.tagName.includes("-")) {
            return ele;
        } else if (ele.parentElement) {
            return this.findCustomRootElement(ele.parentElement);
        } else {
            return undefined;
        }
    }

    private static instance: Visualization;

    private static tableTextPadding = { left: 6, right: 6, top: 8, bottom: 8 };
    private static tableFieldpadding = { left: 6, right: 6, top: 4, bottom: 4 };
    private static space = 20;

    private static getFieldOptionsKind(options: FieldOptions): string {
        return options.primary ? "primary" : options.foreign ? "foreign" : options.unique ? "unique" : "name";
    }

    /** Return text padding that use for all text inside table. */
    public static get TableTextPadding(): Padding { return this.tableTextPadding; }
    /** Return field padding. The padding is adding space around the field element inside the table. */
    public static get TableFieldPadding(): Padding { return this.tableFieldpadding; }
    /** Return minimum space between field name and field type text. */
    public static get FieldNameTypeSpacing(): number { return this.space; }

    /** Return table header height */
    public get tableHeaderHeight(): number {
        if (this.headerHeight === 0) {
            this.headerHeight = this.getTableHeaderSize().height;
        }
        return this.headerHeight;
    }

    /** Return table footer height */
    public get tableFooterHeight(): number {
        if (this.footerHeight === 0) {
            this.footerHeight = this.getTableFooterSize({ name: "", engine: "Unknown" }).height;
        }
        return this.footerHeight;
    }

    /** Return table field height */
    public get tableFieldHeight(): number {
        if (this.fieldHeight === 0) {
            this.fieldHeight = this.getTableFieldSize().height;
        }
        return this.fieldHeight;
    }

    /** Return table field icons width */
    public get tableFieldIconWidth(): number {
        return this.fieldIconWidth;
    }

    // cache size of all svg icons use in the diagram
    private iconsSize: Map<string, Box> = new Map();
    private fieldHeight: number = 0;
    private headerHeight: number = 0;
    private footerHeight: number = 0;
    private fieldIconWidth: number = 0;

    private shareSvg: SVGSVGElement;
    private textElement: SVGTextElement;
    private root: HTMLElement | SVGSVGElement;

    private constructor(root: HTMLElement | SVGSVGElement) {
        this.root = root;
        this.shareSvg = Base.createElement("svg");
        this.textElement = this.shareSvg.appendChild(Base.createElement("text"));
        applyAttribute(this.shareSvg, { visibility: "hidden" });
    }

    /**
     * create root svg element.
     */
    public createSvgRootElement(): SVGSVGElement {
        const svg = Base.createElement("svg");
        const attr = { class: `${styles.dbdg.substr(1)}`, width: "100%", height: "100%" };
        return applyAttribute(svg, attr);
    }

    /**
     * Return styles declaration object.
     */
    public getStylesDts() {
        return styles;
    }

    /**
     * Return icons declaration object.
     */
    public getIconsDts() {
        return icons;
    }

    /**
     * Update share properties value.
     */
    public updatePropertiesValue() {
        // compute all icon size
        Object.entries(icons).forEach((pair) => {
            try {
                if (typeof pair[1] === "string") {
                    const a = this.getIconsElementSize(pair[1], true);
                }
            } catch (e) {/*Ignore error here*/ }
        });
        // compute table element height
        this.headerHeight = this.getTableHeaderSize().height;
        this.footerHeight = this.getTableFooterSize({ name: "", engine: "Unknown" }).height;
        this.fieldHeight = this.getTableFieldSize().height;

        this.fieldIconWidth = this.iconsSize.get(icons.foriegnKeyIcon)!.editable()
            .extend(this.iconsSize.get(icons.uniqueKeyIcon)!, true)
            .extend(this.iconsSize.get(icons.primaryKeyIcon)!, true)
            .padding(Visualization.TableTextPadding, true).width;
    }

    /**
     * Get icon element size.
     * @param id icon id
     * @param force if true it force re-calculate icons size.
     */
    public getIconsElementSize(id: string, force: boolean = false, eleCb?: ElementCallback): Box {
        if (this.iconsSize.get(id) === undefined || force) {
            const ele = document.querySelector(`#${id}`) as SVGElement;
            if (!ele) { throw new Error(`Element id: ${id} not found.`); }
            if (ele.tagName === "symbol") {
                // TODO: compute with viewbox value, refx and refy. For now we relied on pre-compute or
                // pre-optimization when use custom icon.
                const svgRect = this.shareSvg.createSVGRect();
                svgRect.x = getAttributeNumber(ele, "x");
                svgRect.y = getAttributeNumber(ele, "x");
                svgRect.width = getAttributeNumber(ele, "width");
                svgRect.height = getAttributeNumber(ele, "height");
                this.iconsSize.set(id, new Box(svgRect));
            } else if (ele instanceof SVGGraphicsElement) {
                this.iconsSize.set(id, new Box(ele.getBBox()));
            } else {
                throw new Error(`Element id: ${id} is not a graphical element.`);
            }
            if (eleCb) { eleCb(ele); }
        }
        // create new object to avoid accidentially change value
        return this.iconsSize.get(id)!;
    }

    /**
     * Return table header size
     * @param tableName a string represent table name.
     * @param textOnly
     */
    public getTableHeaderSize(tableName: string = "DUMP", textOnly: boolean = false): Box {
        const textSize = this.measureText(tableName, {
            fontFamily: this.readOnlyElementStyle().getPropertyValue(styles.dbdgTableTitleFontFamily),
            fontSize: this.readOnlyElementStyle().getPropertyValue(styles.dbdgTableTitleFontSize),
            fontStyle: this.readOnlyElementStyle().getPropertyValue(styles.dbdgTableTitleFontStyle).noQuote(),
            fontWeight: this.readOnlyElementStyle().getPropertyValue(styles.dbdgTableTitleFontWeight).noQuote(),
        });
        if (textOnly) { return new Box(textSize); }
        return this.getIconsElementSize(icons.tableIcon).editable()
            .extend(textSize, true).padding(Visualization.TableTextPadding, true);
    }

    /**
     * Return table footer size. This size is include the padding around the text. Use `getTableFooterTextSize`
     * to get text footer height.
     * @param options table options.
     */
    public getTableFooterSize(options: TableOptions): Box {
        const engineSize = new Box(this.getTableFooterTextSize(options.engine)).editable();
        const additionalSize = this.getTableFooterTextSize(options.additional);
        return engineSize.extend(additionalSize, true).padding(Visualization.TableTextPadding, true);
    }

    /**
     * Return table footer text size.
     * @param text text to render in the footer.
     */
    public getTableFooterTextSize(text: string = "Footer"): SVGRect {
        return this.measureText(text, {
            fontFamily: this.readOnlyElementStyle().getPropertyValue(styles.dbdgTableFooterTextFontFamily),
            fontSize: this.readOnlyElementStyle().getPropertyValue(styles.dbdgTableFooterTextFontSize),
            fontStyle: this.readOnlyElementStyle().getPropertyValue(styles.dbdgTableFooterTextFontStyle.noQuote()),
            fontWeight: this.readOnlyElementStyle().getPropertyValue(styles.dbdgTableFooterTextFontWeight).noQuote(),
        });
    }

    /**
     * Return table field size. It is include the size of icon, text plus the padding space.
     */
    public getTableFieldSize(): Box {
        const opts = { name: "DB", type: DataType.Int, typeRaw: "INT" } as FieldOptions;
        const size = this.getIconsElementSize(icons.primaryKeyIcon).editable();
        size.extend(this.getTableTextFieldVariableSize(opts), true).extend(this.getTableTextFieldTypeSize(opts), true);
        opts.primary = true;
        size.extend(this.getIconsElementSize(icons.primaryKeyIcon), true);
        opts.primary = false;
        opts.foreign = true;
        size.extend(this.getIconsElementSize(icons.foriegnKeyIcon), true);
        opts.primary = false;
        opts.foreign = false;
        opts.unique = true;
        size.extend(this.getIconsElementSize(icons.uniqueKeyIcon), true);
        return size.padding(Visualization.TableFieldPadding, true);
    }

    /**
     * Return table field text size base the field options.
     * @param options field option
     */
    public getTableTextFieldVariableSize(options: FieldOptions): SVGRect {
        const fieldKind = Visualization.getFieldOptionsKind(options);
        return this.measureText(options.name, {
            fontFamily: this.readOnlyElementStyle().getPropertyValue(`--dbdg-field-text-${fieldKind}-font-family`),
            fontSize: this.readOnlyElementStyle().getPropertyValue(`--dbdg-field-text-${fieldKind}-font-size`),
            fontStyle: this.readOnlyElementStyle().getPropertyValue(`--dbdg-field-text-${fieldKind}-font-style`),
            fontWeight: this.readOnlyElementStyle().getPropertyValue(`--dbdg-field-text-${fieldKind}-font-weight`),
        });
    }

    /**
     * Return table field text size of a string represent type of the field.
     * @param options field option
     */
    public getTableTextFieldTypeSize(options: FieldOptions): SVGRect {
        return this.measureText(options.typeRaw!, {
            fontFamily: this.readOnlyElementStyle().getPropertyValue(styles.dbdgFieldTextTypeFontFamily),
            fontSize: this.readOnlyElementStyle().getPropertyValue(styles.dbdgFieldTextTypeFontSize),
            fontStyle: this.readOnlyElementStyle().getPropertyValue(styles.dbdgFieldTextTypeFontStyle).noQuote(),
            fontWeight: this.readOnlyElementStyle().getPropertyValue(styles.dbdgFieldTextTypeFontWeight).noQuote(),
        });
    }

    /**
     * Return a readonly style declaration.
     */
    public readOnlyElementStyle(): CSSStyleDeclaration {
        if (this.root.tagName.includes("-") && this.root.shadowRoot) {
            return getComputedStyle(this.root);
        } else {
            return getComputedStyle(document.documentElement);
        }
    }

    /**
     * Return a writable style declaration.
     */
    public writableElementStyle(): CSSStyleDeclaration {
        if (this.root.tagName.includes("-") && this.root.shadowRoot) {
            return this.root.style;
        } else {
            return document.documentElement.style;
        }
    }

    /**
     * Measure the text size.
     * @param text string to be measured
     * @param attr text element's attribute
     */
    public measureText(text: string, attr: TextAttribute): SVGRect {
        const textEle = this.textElement;
        let box: SVGRect;
        try {
            textEle.nodeValue = text;
            textEle.textContent = text;
            box = applyAttribute(textEle, attr).getBBox();
            return box;
        } finally {
            const allAttr = textEle.attributes;
            for (let i = allAttr.length - 1; i >= 0; i--) {
                if (allAttr[i].textContent === "visibility") {
                    continue;
                }
                textEle.removeAttributeNode(allAttr[i]);
            }
        }
    }

}
