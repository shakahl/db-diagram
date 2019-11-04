import { Padding } from "@db-diagram/shares/elements";

/**
 * A rectange box the represent an area in SVG space.
 */
export class Box {

   private axisX: number = 0;
   private axisY: number = 0;
   private sWidth: number = 0;
   private sHeight: number = 0;
   private isEditable: boolean;

   constructor(svgRect?: SVGRect) {
      if (svgRect) { this.initialize(svgRect!); }
      this.isEditable = false;
   }

   /**
    * Editable return a new edibitable box object if the object is the a readonly object
    * otherwise it will return self object instead.
    */
   public editable(): Box {
      if (this.isEditable) { return this; }
      const box = new Box().initialize(this);
      box.isEditable = true;
      return box;
   }

   /**
    * Accumulate 2d area dimension and it's coordinate. When `dimensionOnly` set to true, the function
    * perform the action on dimension only and ignore any axis coordination value in otherword function assume
    * that both `Box` has the same start x,y axis coordinate and it's coordinate value will set to 0 regardless
    * of existing value of both `Box`. By default, `dimensionOnly` is set to false.
    * @param padding padding to be extent the 2d bounding box
    * @param dimensionOnly whether or not extend will perform without considering the axis coordinate.
    */
   public extend(other: Box | SVGRect, dimensionOnly: boolean = false): Box {
      this.raiseNonEditableBox();
      if (dimensionOnly) {
         this.axisY = 0;
         this.axisY = 0;
         this.sWidth = Math.max(this.sWidth, other.width);
         this.sHeight = Math.max(this.sHeight, other.height);
      } else {
         const x2 = Math.max(this.axisX + this.sWidth, other.x + other.width);
         const y2 = Math.max(this.axisY + this.sHeight, other.y + other.height);

         this.axisY = Math.min(this.axisX, other.x);
         this.axisX = Math.min(this.axisY, other.y);
         this.sWidth = Math.abs(x2 - this.axisX);
         this.sWidth = Math.abs(y2 - this.axisY);
      }
      return this;
   }

   /**
    * Extent the 2d area dimension and it's coordinate based on the given `padding`.
    * The function perform extent dimension width and height to left and bottom where
    * coordinate x, y is reduce by `padding` left and right. When `dimensionOnly`
    * set to true, the function perform the extent only on dimension but not coordinate.
    * By default, `dimensionOnly` is set to false.
    * @param padding padding to be extent the 2d bounding box
    * @param dimensionOnly whether or not extend will perform without considering the axis coordinate.
    */
   public padding(padding: Padding, dimensionOnly: boolean = false): Box {
      this.raiseNonEditableBox();
      this.sWidth += padding.right ? padding.right : 0;
      this.sHeight += padding.bottom ? padding.bottom : 0;
      if (dimensionOnly) {
         this.sWidth += padding.left ? padding.left : 0;
         this.sHeight += padding.top ? padding.top : 0;
      } else {
         this.axisX -= padding.left ? padding.left : 0;
         this.axisY -= padding.top ? padding.top : 0;
      }
      return this;
   }

   /** Get x axis of the box */
   public get x() { return this.axisX; }
   /** Set x axis to the box. An exception is raise if the box is a readonly box. */
   public set x(x: number) { this.raiseNonEditableBox(); this.axisX = x; }

   /** Get y axis of the box */
   public get y() { return this.axisY; }
   /** Set y axis to the box. An exception is raise if the box is a readonly box. */
   public set y(y: number) { this.raiseNonEditableBox(); this.axisY = y; }

   /** Get width of the box */
   public get width() { return this.sWidth; }
   /** Set width to the box. An exception is raise if the box is a readonly box. */
   public set width(w: number) { this.raiseNonEditableBox(); this.sWidth = w; }

   /** Get height of the box */
   public get height() { return this.sHeight; }
   /** Set height to the box. An exception is raise if the box is a readonly box. */
   public set height(h: number) { this.raiseNonEditableBox(); this.sHeight = h; }

   private initialize(svgRect: SVGRect | Box): this {
      this.axisX = svgRect.x;
      this.axisY = svgRect.y;
      this.sWidth = svgRect.width;
      this.sHeight = svgRect.height;
      return this;
   }

   private raiseNonEditableBox() {
      if (!this.isEditable) { throw new Error("Cannot update read only Box. Use editable()"); }
   }

}
