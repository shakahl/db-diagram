import { State } from "@db-diagram/elements/state";
import { GlobalAttribute } from "@db-diagram/elements/utils/attributes";

/**
 * Event listener interface that provide event when position or size is changed.
 */
export interface ElementCoordinateListener<T extends UIElement<SVGGraphicsElement, GlobalAttribute>> {
   /**
    * Call when element position is change.
    * @param element diagram element
    */
   onPositionChange(element: T): void;

   /**
    * Call when element size is changed.
    * @param element diagram element
    */
   onSizeChange(element: T): void;
}

/**
 * UI base element represent an absract diagram element.
 */
export abstract class UIElement<T extends SVGGraphicsElement, A extends GlobalAttribute> extends State<T, A> {

   /**
    * Get bounding box of the current element. This bounding box is including the transformation
    * and the coordinate of element is relative to SVG root element rather than it parent element.
    */
   public box(): DOMRect {
      return this.applyTranform(this.native.getBBox());
   }

   /**
    * Apply tranformation to the bounding box.
    * @param box a bounding box of the native svg element.
    */
   protected abstract applyTranform(box: DOMRect): DOMRect;

}
