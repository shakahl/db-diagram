import { Diagram } from "@db-diagram/elements/diagram";
import { applyAttribute, GlobalAttribute } from "@db-diagram/elements/utils/attributes";

/**
 * Define custom private properties to SVG Element which holding Javascript class object
 * of diagram UI Element.
 */
declare global {
   interface SVGElement {
      __dbref: Base<this, GlobalAttribute>;
   }
}

/**
 * Standard SVG namespace
 */
interface Namespace {
   xmlns: "http://www.w3.org/2000/svg";
}

/**
 * Base class represent diagram super class element.
 */
export abstract class Base<T extends SVGElement, A extends GlobalAttribute> {

   /**
    * Return standard svg namespace.
    */
   public static get namespace(): Namespace {
      return {
         xmlns: "http://www.w3.org/2000/svg",
      };
   }

   /**
    * Create svg element with the given name
    * @param qn a qualify name of svg element
    */
   public static createElement(qn: "style"): SVGStyleElement;
   public static createElement(qn: "defs"): SVGDefsElement;
   public static createElement(qn: "line"): SVGLineElement;
   public static createElement(qn: "g"): SVGGElement;
   public static createElement(qn: "rect"): SVGRectElement;
   public static createElement(qn: "use"): SVGUseElement;
   public static createElement(qn: "text"): SVGTextElement;
   public static createElement(qn: "path"): SVGPathElement;
   public static createElement(qn: "symbol"): SVGSymbolElement;
   public static createElement(qn: "svg"): SVGSVGElement;
   public static createElement(qn: string): SVGElement {
      return document.createElementNS(this.namespace.xmlns, qn);
   }

   // attribute of element
   protected attr?: A;

   // native SVG element
   private ne: T;

   /**
    * Create new diagram element.
    * @param element native svg element
    * @param attr native svg element's attribute
    */
   constructor(element: T, attr?: A) {
      this.ne = element;
      this.attr = attr;
      this.ne.__dbref = this;
      applyAttribute(this.ne, attr);
   }

   /**
    * Attach element to an HTML element or Diagram. If input value is a string then it's regards as an id.
    * @param it a string represent id or an HTML element or the diagram object.
    */
   public attach(it?: string | HTMLElement | Diagram): this {
      if (it) {
         let el: Element | null;
         if (it instanceof Diagram) {
            el = it.holder;
         } else if (it instanceof HTMLElement) {
            el = it;
         } else if (it.indexOf("#") >= 0) {
            el = document.querySelector(it);
         } else {
            el = document.getElementById(it);
         }
         if (el) {
            el.appendChild(this.ne);
            this.onAttached();
         }
      }
      return this;
   }

   /**
    * Remove the element from it parent.
    */
   public detach(): this {
      if (this.ne.parentElement) {
         this.ne.parentElement.removeChild(this.ne);
         this.onDetached();
      }
      return this;
   }

   /**
    * Bring the current element to front or top of other element.
    */
   public front(): this {
      if (this.ne.parentElement) {
         this.ne.parentElement.appendChild(this.ne);
      }
      return this;
   }

   /**
    * Return native svg element.
    */
   get native(): T { return this.ne; }

   /**
    * Fire after element is attached to it's parent.
    */
   protected onAttached(): this { return this; }

   /**
    * Fire after element is detached from it's parent.
    */
   protected onDetached(): this { return this; }

}
