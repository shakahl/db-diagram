import { LengthNumericType } from "@db-diagram/services/documents/types";

/**
 * provide generic attribute that support on all svg element
 */
export interface CoreAttribute {
   id?: string;
   tabindex?: number;
   lang?: string;
}

/**
 * provide generate style attribute that support on all svg element
 */
export interface StyleAttribute {
   "class"?: string;
   style?: string;
}

/**
 * the index attribute that extends from core and style attribute
 */
export interface GlobalAttribute extends CoreAttribute, StyleAttribute {
   [key: string]: string | number | undefined | null | {};
}

/**
 * define standard attribute for svg tag element
 */
export interface SvgAttribute extends GlobalAttribute, PresentationAttribute {
   x?: LengthNumericType;
   y?: LengthNumericType;
   width?: LengthNumericType;
   height?: LengthNumericType;
   viewBox?: ViewBox;
}

/**
 * Custom attribute to hold table informatoin in DOM hierarchy.
 */
export interface TableAttribute extends GroupAttribute {
   "data-name": string;
   // we might not need it.
   "data-engine"?: string;
   "data-additional"?: string;
}

/**
 * define standard attribute for svg group element
 */
export interface GroupAttribute extends GlobalAttribute, PresentationAttribute {
   cursor?: "pointer" | "move" | "wait" | "default" | "auto" | "inherit";
}

/**
 * define standard attribute for svg rectangle element
 */
export interface RectAttribute extends GlobalAttribute, PresentationAttribute,
   PositionAttribute, DimensionAttribute {
   rx?: LengthNumericType | "auto";
   ry?: LengthNumericType | "auto";
}

/**
 * define standard attribute for svg path element
 */
export interface PathAttribute extends GlobalAttribute, PresentationAttribute {
   d?: string;
}

/**
 * define standard attribute for svg text element.
 */
export interface TextAttribute extends GlobalAttribute, PresentationAttribute, PositionAttribute {
   dx?: LengthNumericType | "none";
   dy?: LengthNumericType | "none";
   fontSize?: string;
   fontFamily?: string;
   fontStyle?: "normal" | "italic" | "oblique" | "inherit" | string;

   fontWeight?: "normal" | "bold" | "bolder" | "lighter" |
   100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | "inherit" | string;

   textAnchor?: "start" | "middle" | "end" | "inherit";

   alignmentBaseline?: "auto" | "baseline" | "before-edge" | "text-before-edge" | "middle" |
   "top" | "bottom" | "central" | "after-edge" | "text-after-edge" | "ideographic" | "text-top" |
   "alphabetic" | "hanging" | "mathematical" | "inherit";

   dominantBaseline?: "auto" | "text-bottom" | "alphabetic" | "ideographic" |
   "middle" | "central" | "mathematical" | "hanging" | "text-top";
}

/**
 * The attribute to be used with SVG Use element.
 */
export interface UseAttribute extends GlobalAttribute, PositionAttribute,
   PresentationAttribute, DimensionAttribute {
   href: string;
}

/**
 * The attribute to be used with SVG Symbol element.
 */
export interface SymbolAttribute extends GlobalAttribute, PresentationAttribute, PositionAttribute, DimensionAttribute {
   viewBox?: ViewBox;
   refX?: LengthNumericType | "left" | "center" | "right";
   refY?: LengthNumericType | "top" | "center" | "bottom";
}

/**
 * the attribute that can be apply to svg element to change it's color appearance
 */
export interface PresentationAttribute {
   [key: string]: string | number | undefined | null | {};
   fill?: string | null;
   fillOpacity?: number;
   stroke?: string | null;
   strokeOpacity?: number;
   strokeWidth?: number;
   filter?: string | null;
   transform?: string | null;
   visibility?: "visible" | "hidden" | "collapse" | "inherit" | null;
}

/**
 * the attribute that provide a valid location properties to svg element
 */
export interface PositionAttribute {
   [key: string]: string | number | undefined | null | {};
   x?: LengthNumericType;
   y?: LengthNumericType;
}

/**
 * the attribute that provide a valid dimension properties to svg element
 */
export interface DimensionAttribute {
   [key: string]: string | number | undefined | null | {};
   width?: LengthNumericType;
   height?: LengthNumericType;
}

/**
 * define viewbox properties attribute
 */
export interface ViewBox {
   minX: number;
   minY: number;
   width: number;
   height: number;
}

/**
 * hack override toString on interface ViewBox to return proper viewbox svg format
 * rather than javascript default to string object.
 * @param vb a viewbox
 *
 * @deprecated
 */
export function ApplyViewBox(vb?: ViewBox): ViewBox | undefined {
   if (vb) {
      vb.toString = function(this: ViewBox): string {
         return `${this.minX} ${this.minY} ${this.width} ${this.height}`;
      };
   }
   return vb;
}

/**
 * Parse the viewBox attribute string value into ViewBox object.
 * @param svg The svg root element or a string represent viewBox attribute value.
 */
export function ParseViewBox(svg: SVGSVGElement | string): ViewBox | undefined {
   const viewBoxStr = svg instanceof SVGSVGElement ? svg.getAttribute("viewBox") : svg;
   if (viewBoxStr) {
      const regex = /(-?\d+)[\s|,](-?\d+)[\s|,](-?\d+)[\s|,](-?\d+)/;
      const matched = viewBoxStr.match(regex);
      return ApplyViewBox({
         height: +matched![4],
         minX: +matched![1],
         minY: +matched![2],
         width: +matched![3],
      });
   } else {
      return undefined;
   }
}

/**
 * Type alias to multiple SVG attribute.
 */
export type AnyAttribute = GlobalAttribute | PresentationAttribute | DimensionAttribute | PositionAttribute;

/**
 * apply attribute to the native svg element
 * @param element class extend from Base class
 * @param attr attribute object extend from Global Attribute Object
 */
export function applyAttribute<T extends SVGElement, A extends AnyAttribute>(element: T, attr?: A): T {
   if (attr) {
      Object.keys(attr).forEach((key) => {
         if (attr[key.toString()] !== undefined) {
            let attrKey = key;
            if (key !== "viewBox") {
               attrKey = toHyphen(key);
            }
            const attrVal = attr[key.toString()]!.toString();
            if (attrVal.length > 0 && attrVal !== "") {
               element.setAttribute(attrKey, attrVal);
            }
         }
      });
   }
   return element;
}

/**
 * Value of the attribute.
 * @param ele Svg element
 * @param attr name of attribute
 */
export function getAttributeNumber(ele: SVGElement, attr: string): number {
   const x = ele.getAttribute(attr);
   return (x !== undefined) ? +x! : 0;
}

/**
 * Convert camelCase into hyphen. NOTE: Loop is faster than regex
 * @param key string to be convert into hyphen case.
 */
function toHyphen(key: string): string {
   let hkey = "";
   for (let i = 0; i < key.length; i++) {
      if (key.charCodeAt(i) < 97 && key.charCodeAt(i) !== 45) {
         hkey += `-${String.fromCharCode(key.charCodeAt(i) + 32)}`;
      } else {
         hkey += key.charAt(i);
      }
   }
   return hkey;
}
