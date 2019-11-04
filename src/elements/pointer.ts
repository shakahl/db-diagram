import { Base } from "@db-diagram/elements/base";
import { Diagram } from "@db-diagram/elements/diagram";
import { GlobalAttribute } from "@db-diagram/elements/utils/attributes";
import { Point } from "@db-diagram/services/documents/types";

/**
 * Add custom properties to a window object to reference to diagram object.
 */
declare global {
   interface Window {
      __dbref: Base<SVGElement, GlobalAttribute> | undefined;
   }
}

/**
 * A pointer event data
 */
export interface PointerEvt {
   // SVG coordinate unit
   point?: DOMPoint;
   // Delta x axis change since started. The is an SVG unit space not a dom pixel unit.
   deltaX?: number;
   // Delta y axis change since started. The is an SVG unit space not a dom pixel unit.
   deltaY?: number;
   // original pointer event
   event?: PointerEvent;
}

/**
 * Type alias to Pointer event callback.
 */
export type PointerCallback = (event: PointerEvent) => any;

/**
 * Pointer class use to handle pointer event.
 */
export abstract class Pointer<T extends SVGGraphicsElement, A extends GlobalAttribute> extends Base<T, A> {

   protected static POINTER_DOWN: number = 1;
   protected static POINTER_MOVE: number = 2;
   protected static POINTER_UP: number = 3;

   // reference variable
   private static onPointerDown: PointerCallback;
   private static onPointerMove: PointerCallback;
   private static onPointerUp: PointerCallback;
   private static onPointerAbort: PointerCallback;

   // distant consider as movement action.
   private static readonly TOUCH_CLIK_SLOP = 1;

   // initialize Pointer Event callback
   private static initilize() {
      if (Pointer.onPointerDown) {
         return;
      }

      // A callback event to handle event when touch down or mouse click.
      Pointer.onPointerDown = function(this: SVGElement, event: PointerEvent): any {
         const pointer = this.__dbref as Pointer<SVGGraphicsElement, GlobalAttribute>;

         if ((!pointer.dragRegistered && !pointer.clickEvent)) {
            return;
         }

         if (event.buttons > 1 || event.button !== 0) {
            // avoid right click
            return;
         }

         event.preventDefault();
         event.stopPropagation();

         pointer.pointerState = Pointer.POINTER_DOWN;
         pointer.originalTransformMatrix = pointer.cloneTransformMatrix(pointer.transformMatrix!);
         pointer.originalState = pointer.toSvgCoordinate(event).matrixTransform(pointer.transformMatrix!.inverse());

         if (!pointer.pEvt) { pointer.pEvt = {}; }

         pointer.pEvt.point = pointer.originalState;
         pointer.pEvt.deltaX = 0;
         pointer.pEvt.deltaY = 0;
         pointer.pEvt.event = event;
         pointer.onPointerDown(pointer.pEvt);
         pointer.inSmallRegion = true;

         window.__dbref = pointer;
         window.addEventListener("pointermove", Pointer.onPointerMove);
      };

      // A callback event to handle event when touch move or mouse click move.
      Pointer.onPointerMove = function(this: SVGElement, event: PointerEvent): any {
         const pointer = (this.__dbref || window.__dbref) as Pointer<SVGGraphicsElement, GlobalAttribute>;
         if (pointer.dragRegistered && (pointer.pointerState === Pointer.POINTER_DOWN ||
            pointer.pointerState === Pointer.POINTER_MOVE)) {

            event.preventDefault();
            event.stopPropagation();

            const svgPoint = pointer.toSvgCoordinate(event)
               .matrixTransform(pointer.originalTransformMatrix!.inverse());
            pointer.pEvt!.event = event;
            pointer.pEvt!.point = svgPoint;
            pointer.pEvt!.deltaX = svgPoint.x - pointer.originalState!.x;
            pointer.pEvt!.deltaY = svgPoint.y - pointer.originalState!.y;

            const delta = Math.max(Math.abs(pointer.pEvt!.deltaX), Math.abs(pointer.pEvt!.deltaY));

            // small movement is ignored and consider that as single click or tap.
            if (delta > Pointer.TOUCH_CLIK_SLOP) {
               pointer.inSmallRegion = false;
               if (!(pointer instanceof Diagram)) {
                  const parentMatrix = (pointer.rootSvg!.__dbref as Diagram).transformMatrix!;
                  pointer.transformMatrix = pointer.originalTransformMatrix!
                     .multiply(parentMatrix.inverse())
                     .translate(pointer.pEvt!.deltaX, pointer.pEvt!.deltaY)
                     .multiply(parentMatrix);
               } else {
                  pointer.transformMatrix = pointer.originalTransformMatrix!
                     .translate(pointer.pEvt!.deltaX, pointer.pEvt!.deltaY);
               }

               pointer.transformMatrix!.e = Math.round(pointer.transformMatrix!.e);
               pointer.transformMatrix!.f = Math.round(pointer.transformMatrix!.f);

               if (pointer.pointerState !== Pointer.POINTER_MOVE) {
                  pointer.pointerState = Pointer.POINTER_MOVE;
                  pointer.onDragStart(pointer.pEvt!);
               }
               pointer.onDragMove(pointer.pEvt!);
            }
         }
      };

      // A callback event to handle event when touch up or mouse click up.
      Pointer.onPointerUp = function(this: SVGElement, event: PointerEvent): any {
         const pointer = this.__dbref as Pointer<SVGGraphicsElement, GlobalAttribute>;
         if ((!pointer.dragRegistered && !pointer.clickRegistered) || pointer.pEvt === undefined) {
            return;
         }

         event.preventDefault();
         event.stopPropagation();

         pointer.pEvt.deltaX = 0;
         pointer.pEvt.deltaY = 0;
         pointer.pEvt.event = event;
         pointer.pEvt.point = pointer.toSvgCoordinate(event);

         if (pointer.inSmallRegion) {
            pointer.onClick(pointer.pEvt);
         }
         pointer.onDragEnd(pointer.pEvt);
         pointer.onPointerUp(pointer.pEvt);

         pointer.pointerState = Pointer.POINTER_UP;

         delete window.__dbref;
         window.removeEventListener("pointermove", Pointer.onPointerMove);

         pointer.pEvt = undefined;
         pointer.originalState = undefined;
         pointer.originalTransformMatrix = undefined;
      };

      // A callback event to handle event when the pointer event is abort.
      Pointer.onPointerAbort = function(this: SVGElement, event: PointerEvent): any {
         const pointer = this.__dbref as Pointer<SVGGraphicsElement, GlobalAttribute>;
         if ((!pointer.dragRegistered && !pointer.clickRegistered) || pointer.pEvt === undefined) {
            return;
         }
         event.preventDefault();
         event.stopPropagation();

         pointer.pEvt.deltaX = 0;
         pointer.pEvt.deltaY = 0;
         pointer.pEvt.event = event;
         pointer.pEvt.point = pointer.toSvgCoordinate(event);

         pointer.onDragAbort(pointer.pEvt);

         delete window.__dbref;
         window.removeEventListener("pointermove", Pointer.onPointerMove);

         pointer.pEvt = undefined;
         pointer.originalState = undefined;
         pointer.originalTransformMatrix = undefined;
      };
   }

   protected originalState?: DOMPoint;
   protected originalTransformMatrix?: DOMMatrix;

   protected transformMatrix?: DOMMatrix;
   protected rootSvg?: SVGSVGElement;

   // DOM x axis coordinate. It's the same as left value from DOMRect
   private axisX: number;
   // DOM y axis coordinate. It's the same as top value from DOMRect
   private axisY: number;

   // pointer properties
   private pointerState = 0;
   private pEvt?: PointerEvt;
   private clickRegistered = false;
   private dragRegistered = false;
   private inSmallRegion = true;

   constructor(element: T, attr?: A) {
      super(element, attr);
      this.axisX = 0;
      this.axisY = 0;
      Pointer.initilize();
   }

   /**
    * Attach the current object to a diagram or HTML Element.
    */
   public attach(id?: string | HTMLElement | Diagram): this {
      if (id instanceof Diagram) {
         this.rootSvg = id.native;
      } else if (this.native instanceof SVGSVGElement) {
         this.rootSvg = this.native;
      }
      if (this.rootSvg) {
         this.transformMatrix = this.rootSvg.createSVGMatrix();
         if (this.native.hasAttribute("transform")) {
            const transform = this.native.getAttribute("transform")!.trim();
            const index = transform.indexOf(",");
            const x = +transform.substring(transform.indexOf("("), index).trim();
            const y = +transform.substring(index + 1, transform.indexOf(")")).trim();
            this.transformMatrix = this.transformMatrix.translate(x, y);
         }
      }
      return super.attach(id);
   }

   /**
    * Set or Get x axis coordinate to this element. By default, the return axis value is a DOM axis value however
    * when svg argument is set to true then the axis value is an SVG unit.
    */
   public x(x?: boolean): number;
   public x(x: number): this;
   public x(x?: number | boolean, svg: boolean = false): this | number {
      if (typeof x === "boolean") {
         svg = x;
         x = undefined;
      }
      if (x === undefined) {
         return svg ? this.transformMatrix!.e : this.axisX;
      }
      // do not update y when pointer is down or move
      if (this.pointerState === Pointer.POINTER_DOWN || this.pointerState === Pointer.POINTER_MOVE) {
         return this;
      }

      if (svg) {
         this.axisX = this.toDomCoordinate({ x, y: this.transformMatrix!.f }).x;
         this.transformMatrix!.e = x;
      } else {
         this.axisX = x;
         this.transformMatrix!.e = this.toSvgCoordinate({ x, y: this.axisY }).x;
      }

      this.updateTransform();
      this.onPositionChange({ x, y: this.axisY });
      return this;
   }

   /**
    * Set or Get y axis coordinate to this element. By default, the return axis value is a DOM axis value however
    * when svg argument is set to true then the axis value is an SVG unit.
    */
   public y(y?: boolean): number;
   public y(y: number): this;
   public y(y?: number | boolean, svg: boolean = false): this | number {
      if (typeof y === "boolean") {
         svg = y;
         y = undefined;
      }
      if (y === undefined) {
         return svg ? this.transformMatrix!.f : this.axisY;
      }
      // do not update y when pointer is down or move
      if (this.pointerState === Pointer.POINTER_DOWN || this.pointerState === Pointer.POINTER_MOVE) {
         return this;
      }

      if (svg) {
         this.axisY = this.toDomCoordinate({ x: this.transformMatrix!.e, y }).y;
         this.transformMatrix!.f = y;
      } else {
         this.axisY = y;
         this.transformMatrix!.f = this.toSvgCoordinate({ x: this.axisX, y }).y;
      }

      this.updateTransform();
      this.onPositionChange({ x: this.axisX, y });
      return this;
   }

   /**
    * Convert dom coordinate to svg coordinate.
    * @param evt a pointer object or a pointer event or a custom event
    */
   public toSvgCoordinate(evt: PointerEvent | CustomEvent | Point): DOMPoint {
      if (!this.rootSvg) { throw new Error("Element have not attached to parent."); }
      const point = this.rootSvg!.createSVGPoint();
      if (evt instanceof PointerEvent) {
         point.x = evt.clientX;
         point.y = evt.clientY;
      } else if (evt instanceof CustomEvent) {
         const we = evt.detail as WheelEvent;
         point.x = we.clientX;
         point.y = we.clientY;
      } else {
         point.x = evt.x;
         point.y = evt.y;
      }
      return point.matrixTransform(this.rootSvg!.getScreenCTM()!.inverse());
   }

   /**
    * Convert svg coordinate to dom coordinate.
    * @param point SVG Point or a Point.
    */
   public toDomCoordinate(point: SVGPoint | Point): DOMPoint {
      if (!this.rootSvg) { throw new Error("Element have not attached to parent."); }
      const p = this.rootSvg!.createSVGPoint();
      p.x = point.x;
      p.y = point.y;
      return p.matrixTransform(this.native.getCTM()!);
   }

   /**
    * Create a new transform matrix from the given m matrix.
    * @param m DOM Matrix.
    */
   public cloneTransformMatrix(m: DOMMatrix): DOMMatrix {
      if (!this.rootSvg) { throw new Error("Element have not attached to parent."); }
      const nm = this.rootSvg!.createSVGMatrix();
      nm.a = m.a;
      nm.b = 0;
      nm.c = 0;
      nm.d = m.d;
      nm.e = m.e;
      nm.f = m.f;
      return nm;
   }

   /**
    * Register or unregister drag event.
    * @param register boolean indicate whether drag event is enabled.
    */
   protected dragEvent(register: boolean) {
      if (this.dragRegistered !== register) {
         this.dragRegistered = register;
         if (!this.clickRegistered) {
            if (this.dragRegistered) {
               this.native.addEventListener("pointercancel", Pointer.onPointerAbort);
               this.native.addEventListener("pointerdown", Pointer.onPointerDown);
               this.native.addEventListener("pointerup", Pointer.onPointerUp);
            } else {
               this.native.removeEventListener("pointerdown", Pointer.onPointerDown);
               this.native.removeEventListener("pointerup", Pointer.onPointerUp);
               this.native.removeEventListener("pointercancel", Pointer.onPointerAbort);
            }
         } else {
            if (this.dragRegistered) {
               this.native.addEventListener("pointercancel", Pointer.onPointerAbort);
            } else {
               this.native.removeEventListener("pointercancel", Pointer.onPointerAbort);
            }
         }
      }
   }

   /**
    * Register or unregister click event.
    * @param register boolean indicate whether click event is enabled.
    */
   protected clickEvent(register: boolean) {
      if (this.clickRegistered !== register) {
         this.clickRegistered = register;
         if (!this.dragRegistered) {
            if (this.clickRegistered) {
               this.native.addEventListener("pointerdown", Pointer.onPointerDown);
               this.native.addEventListener("pointerup", Pointer.onPointerUp);
            } else {
               this.native.removeEventListener("pointerdown", Pointer.onPointerDown);
               this.native.removeEventListener("pointerup", Pointer.onPointerUp);
            }
         }
      }
   }

   /**
    * Call when element a position has change. The given position is a DOM coordinate position.
    * If you have an SVG coordinate you must use method `toSvgCoordinate`.
    * @param p DOM coordinate change.
    */
   protected onPositionChange(_: Point): void { return; }

   /**
    * Call when element is click
    * @param event pointer click or touch event.
    */
   protected onClick(_: PointerEvt): void { return; }

   /**
    * Call when element has receive a pointer down event. This happen when user touch or mouse click
    * on the diagram native element.
    * @param event pointer event.
    */
   protected onPointerDown(_?: PointerEvt): void { return; }

   /**
    * Call when element has receive a pointer up event. This happen when user lift the finger or release
    * mouse click on the diagram native element.
    * @param event pointer event.
    */
   protected onPointerUp(_?: PointerEvt): void { return; }

   /**
    * Call when a drag event is detected from pointer move event.
    * @param event pointer event.
    */
   protected onDragStart(_: PointerEvt): void { return; }

   /**
    * Call when user drag and move the element.
    * @param event pointer event.
    */
   protected onDragMove(evt: PointerEvt): void {
      const domRect = this.toDomCoordinate({ x: this.transformMatrix!.e, y: this.transformMatrix!.f });
      this.axisX = domRect.x;
      this.axisY = domRect.y;
      this.updateTransform();
      this.onPositionChange({ x: evt.point!.x, y: evt.point!.y });
   }

   /**
    * Call when user stop moving element by lift the finger from a touch device or release mouse click
    * button on the diagram native element.
    * @param event pointer event
    */
   protected onDragEnd(_?: PointerEvt): void { return; }

   /**
    * Call when browser detected that the event is aborted.
    * @param event pointer event
    */
   protected onDragAbort(_?: PointerEvt): void { return; }

   /** perform transformation base value with a matrix */
   protected updateTransform() {
      if (this.native.transform.baseVal.numberOfItems === 0) {
         const transform = this.rootSvg!.createSVGTransformFromMatrix(this.transformMatrix!);
         this.native.transform.baseVal.appendItem(transform);
      } else {
         this.native.transform.baseVal.getItem(0).setMatrix(this.transformMatrix!);
      }
   }

}
