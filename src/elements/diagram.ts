import { Base } from "@db-diagram/elements/base";
import { Pointer, PointerEvt } from "@db-diagram/elements/pointer";
import { SelectionListener } from "@db-diagram/elements/state";
import { Table } from "@db-diagram/elements/table";

import { ApplyViewBox, SvgAttribute, ViewBox } from "@db-diagram/elements/utils/attributes";
import { DiagramOptions, TableOptions } from "@db-diagram/elements/utils/options";
import { Point } from "@db-diagram/elements/utils/types";

import { PanZoomEventType, WheelData, ZoomEventListener } from "@db-diagram/event/panzoom";
import { Preference } from "@db-diagram/preference/pref";
import { onDomReady, Visualization } from "@db-diagram/shares/elements";

/**
 * Database diagram class.
 */
export class Diagram extends Pointer<SVGSVGElement, SvgAttribute> {

   private tables: Table[] = [];

   private panEnable: boolean = false;
   private zoomEnable: boolean = false;
   private diagramOptions: DiagramOptions;

   private zoomLevel: number = 1;
   private viewBoxData?: ViewBox;

   private pref?: Preference;

   // use to track wheel event trigger time spent.
   private lastWheelEventTime: number = 0;

   // a group of svg element that hold all visual graphic that represent table or relationship.
   private diagramHolder: SVGGElement;

   private zoomListener?: ZoomEventListener;
   private tableSelectionChange!: SelectionListener<Table>;

   /** use to prevent dealock call loop */
   private inAction: boolean = false;

   /**
    * Return current ViewBox of the diagram.
    */
   public get viewBox(): ViewBox {
      if (!this.viewBoxData) {
         const domRect = this.native.getBoundingClientRect();
         this.viewBoxData = ApplyViewBox({
            height: this.native.height.baseVal.unitType === 2 ? domRect.height : this.native.height.baseVal.value,
            minX: this.native.x.baseVal.value,
            minY: this.native.y.baseVal.value,
            width: this.native.width.baseVal.unitType === 2 ? domRect.width : this.native.width.baseVal.value,
         })!;
      }
      return this.viewBoxData;
   }

   /**
    * Return a Visualization object that bound to current diagram.
    */
   public get visualization(): Visualization {
      return Visualization.getInstance(this.native);
   }

   /**
    * Return a preference that bound to current diagram.
    */
   public get preference(): Preference {
      if (!this.pref) { this.pref = new Preference(this.visualization); }
      return this.pref;
   }

   /**
    * Return group element that contain all database diagram such table, relationship ...etc
    */
   public get holder(): SVGGElement {
      return this.diagramHolder;
   }

   /**
    * Return number of table in the diagram.
    */
   public get tableCount(): number {
      return this.tables ? this.tables.length : 0;
   }

   /**
    * Create diagram object.
    */
   constructor(attr: SvgAttribute = {}, options?: DiagramOptions) {
      super(Visualization.getInstance().createSvgRootElement(), ((a: SvgAttribute): SvgAttribute => {
         a.viewBox = ApplyViewBox(a.viewBox);
         return a;
      })(attr));
      this.diagramOptions = options || {};
      if (attr && attr.viewBox) {
         this.viewBoxData = attr.viewBox;
      } else {
         onDomReady(() => { const _ = this.viewBox; });
      }

      this.diagramHolder = Base.createElement("g");
      this.native.appendChild(this.diagramHolder);

      const thisDiagram = this;
      this.tableSelectionChange = function(this: Table, selected: boolean): void {
         if (selected) { thisDiagram.onTableSelected(this); }
      };
      this.clickEvent(true);
      this.pannable(true);
      this.zoomable(true);

      this.native.addEventListener(PanZoomEventType.onPanZoomBegin, (evt) => this.onPanZoomStart(evt as CustomEvent));
      this.native.addEventListener(PanZoomEventType.onPanZoomMove, (evt) => this.onPanZoomMove(evt as CustomEvent));
      this.native.addEventListener(PanZoomEventType.onPanZoomEnd, (evt) => this.onPanZoomEnd(evt as CustomEvent));
   }

   /**
    * Override to forbid any change to x and y axis of SVG native element as
    * diagram should be move by x and y axis.
    */
   public x(x?: boolean): number;
   public x(x: number): this;
   public x(): this | number {
      throw new Error(`x axis value is not accessible or assignable for Diagram object`);
   }

   /**
    * Override to forbid any change to x and y axis of SVG native element as
    * diagram should be move by x and y axis.
    */
   public y(y?: boolean): number;
   public y(y: number): this;
   public y(): this | number {
      throw new Error(`y axis value is not accessible or assignable for Diagram object`);
   }

   /**
    * Override parent object to initialize view box as well as other options value such as
    * minimum and maximum zoom.
    *
    * @param it an HTML ELement or HTML Element id.
    */
   public attach(it: string | HTMLElement): this {
      super.attach(it);
      this.viewBoxData = undefined;
      onDomReady(() => {
         const _ = this.viewBox;
         this.diagramOptions.minZoom = this.diagramOptions.minZoom || this.preference.diagram.minimumZoom;
         this.diagramOptions.maxZoom = this.diagramOptions.maxZoom || this.preference.diagram.maximumZoom;
         this.diagramOptions.showMinimap = this.diagramOptions.showMinimap || this.preference.diagram.showMinimap;
         this.diagramOptions.showZoom = this.diagramOptions.showZoom || this.preference.diagram.showZoom;
      });
      return this;
   }

   /**
    * Enable or disable drag event on diagram svg.
    * @param enable boolean value
    */
   public pannable(enable: boolean): this {
      if (this.panEnable !== enable) {
         this.panEnable = enable;
         this.dragEvent(enable);
      }
      return this;
   }

   /**
    * Return true if diagram is draggable otherwise false.
    */
   public isPannable(): boolean {
      return this.panEnable;
   }

   /**
    * Enable or disable zoom on diagram.
    * @param enable boolean value
    */
   public zoomable(enable: boolean): this {
      if (this.zoomEnable !== enable) {
         this.zoomEnable = enable;
         if (!this.zoomListener) {
            this.zoomListener = new ZoomEventListener(this.native);
         }
         if (this.zoomEnable) {
            this.zoomListener!.register();
         } else {
            this.zoomListener!.unregister();
         }
      }
      return this;
   }

   /**
    * Return true if zoom is enable otherwise false is returned.
    */
   public isZoomable(): boolean {
      return this.zoomEnable;
   }

   /**
    * Get current zoom level.
    */
   public get zoom(): number {
      return this.zoomLevel;
   }

   /**
    * Set zoom level.
    * @param level zoom level.
    */
   public set zoom(level: number) {
      if (this.zoomEnable) {
         this.setZoom(level);
      }
   }

   /**
    * Set zoom level with an additional point where zoom should focus on.
    * By default, if point is not provided then the middle point of diagram is used.
    * @param level zoom level.
    * @param point zoom's focus point.
    */
   public setZoom(level: number, point?: Point) {
      if (this.zoomEnable && this.zoomLevel !== level) {
         if (!point) {
            const bound = this.native.getBoundingClientRect();
            point = { x: bound.left + bound.width / 2, y: bound.top + bound.height / 2 };
         }
         this.setZoomAmount(level / this.zoomLevel, point, level);
      }
   }

   /**
    * Create or remove table from diagram. If searchOnly is set to true the diagram will not create
    * the table if it's not exist and instead it return undefined.
    *
    * @param options a table options
    * @param remove boolean indicate whether diagram should remove the table base on the given options.
    * @param searchOnly boolean indicate whether diagram should only search for table.
    */
   public table(options: TableOptions, remove: boolean = false, searchOnly: boolean = false): Table | undefined {
      if (this.inAction) { return undefined; }

      let tableIndex = -1;
      let table: Table | undefined;
      for (let i = 0; i < this.tables.length; i++) {
         if (this.tables[i].name === options.name) {
            tableIndex = i;
            table = this.tables[i];
            break;
         }
      }

      // return undefine if table is not found.
      if (searchOnly) { return table; }

      // return removed table if it existed.
      if (remove && options) {
         if (tableIndex === -1) { return undefined; }
         this.tables.splice(tableIndex, 1);
         try {
            this.inAction = true;
            table!.detach();
         } finally { this.inAction = false; }
         return table;
      }

      // table with the given name is already existed
      if (tableIndex > -1) { return table; }

      table = new Table(this, options).addSelectionListener(this.tableSelectionChange);
      this.tables.push(table);
      return table;
   }

   /**
    * Return a list of iterator of the table.
    */
   public allTables(): IterableIterator<Table> {
      return this.tables.values();
   }

   /**
    * Return index of the table. If table not found then -1 is returned.
    * @param table table or table options.
    */
   public indexOf(input: Table | TableOptions): number {
      for (let i = 0; i < this.tables.length; i++) {
         if (this.tables[i].name === input.name) {
            return i;
         }
      }
      return -1;
   }

   /**
    * Clear remove all table from diagram. This also remove any relationship that connect to the table.
    */
   public clear(): Table[] {
      const clone = this.tables.map((t) => Object.assign({}, t));
      this.tables.forEach((table) => {
         table.detach();
      });
      this.tables = [];
      return clone;
   }

   /**
    * Call when a click event trigger on SVG Root diagram.
    * @param evt a pointer event.
    */
   protected onClick(evt: PointerEvt) {
      evt.event!.preventDefault();
      evt.event!.stopPropagation();
      this.tables.forEach((t: Table) => {
         t.select(false);
      });
   }

   /**
    * Call when user mouse click is down or touch down.
    */
   protected onPointerDown(): void {
      this.native.classList.add(this.visualization.getStylesDts().move);
   }

   /**
    * Call when user mouse click is up or touch up.
    */
   protected onPointerUp(): void {
      this.native.classList.remove(this.visualization.getStylesDts().move);
   }

   /**
    * Call when user mouse move or touch move.
    * @param evt Pointer move event.
    */
   protected onDragMove(_: PointerEvt) {
      if (this.diagramHolder.transform.baseVal.numberOfItems === 0) {
         const transform = this.rootSvg!.createSVGTransformFromMatrix(this.transformMatrix!);
         this.diagramHolder.transform.baseVal.appendItem(transform);
      } else {
         this.diagramHolder.transform.baseVal.getItem(0).setMatrix(this.transformMatrix!);
      }
   }

   /**
    * Call when pan zoom or pin zoom by wheel event is started.
    * @param evt a custom event.
    */
   protected onPanZoomStart(evt: CustomEvent) {
      this.originalTransformMatrix = this.cloneTransformMatrix(this.transformMatrix!);
      this.originalState = this.toSvgCoordinate(evt).matrixTransform(this.transformMatrix!.inverse());
      this.native.classList.add(this.visualization.getStylesDts().zoom);
   }

   /**
    * Call when pan zoom or pin zoom by wheel event is ended.
    */
   protected onPanZoomEnd(_: CustomEvent) {
      this.originalState = undefined;
      this.originalTransformMatrix = undefined;
      this.lastWheelEventTime = 0;
      this.native.classList.remove(this.visualization.getStylesDts().zoom);
      this.native.classList.remove(this.visualization.getStylesDts().zoomIn);
      this.native.classList.remove(this.visualization.getStylesDts().zoomOut);
   }

   /**
    * Call when user is current pin zooom using either control key plus mouse wheel
    * or on touch pad devices with two finger gesture pan to zoom.
    */
   protected onPanZoomMove(evt: CustomEvent) {
      const wd = evt.detail as WheelData;
      let delta = wd.deltaY || 1;
      const timeDelta = Date.now() - this.lastWheelEventTime;
      const divider = 3 + Math.max(0, 30 - timeDelta);
      this.lastWheelEventTime = Date.now();

      delta = -0.3 < delta && delta < 0.3 ?
         delta : ((delta > 0 ? 1 : -1) * Math.log(Math.abs(delta) + 10)) / divider;

      const zoomAmount = Math.pow(1 + 0.1, -1 * delta);

      if (zoomAmount > 1) {
         this.native.classList.add(this.visualization.getStylesDts().zoomIn);
      } else if (zoomAmount < 1) {
         this.native.classList.add(this.visualization.getStylesDts().zoomOut);
      }

      this.setZoomAmount(zoomAmount, { x: wd.clientX, y: wd.clientY });
   }

   /** Performe zoom matrix calculate */
   private setZoomAmount(amount: number, point: Point, preciseZoomValue?: number) {
      // no need to process, zoom reach minimum and maximum zoom already
      if ((amount < 1 && this.transformMatrix!.a === this.diagramOptions.minZoom!) ||
         (amount > 1 && this.transformMatrix!.a === this.diagramOptions.maxZoom!)) { return; }

      const inversedScreenCTM = this.rootSvg!.getScreenCTM()!.inverse();
      const relativeMousePoint = this.toSvgCoordinate(point).matrixTransform(inversedScreenCTM);

      // align amount if zoom exceeded minimum and maximum zoom
      let nextScale = amount * this.transformMatrix!.a;
      let fixToMinMax = false;
      if (nextScale < this.diagramOptions.minZoom!) {
         nextScale = this.diagramOptions.minZoom!;
         amount = this.transformMatrix!.a / nextScale;
         fixToMinMax = true;
      } else if (nextScale > this.diagramOptions.maxZoom!) {
         nextScale = this.diagramOptions.maxZoom!;
         amount = this.transformMatrix!.a / nextScale;
         fixToMinMax = true;
      }

      const relativePoint = relativeMousePoint.matrixTransform(this.transformMatrix!.inverse());
      const modifier = this.rootSvg!
         .createSVGMatrix()
         .translate(relativePoint.x, relativePoint.y)
         .scale(amount)
         .translate(-relativePoint.x, -relativePoint.y);

      this.transformMatrix = this.transformMatrix!.multiply(modifier);
      if (fixToMinMax) {
         this.transformMatrix.a = nextScale;
         this.transformMatrix.d = nextScale;
      } else if (preciseZoomValue) {
         this.transformMatrix.a = preciseZoomValue;
         this.transformMatrix.d = preciseZoomValue;
      }
      this.zoomLevel = this.transformMatrix.a;

      if (this.diagramHolder.transform.baseVal.numberOfItems === 0) {
         const transform = this.rootSvg!.createSVGTransformFromMatrix(this.transformMatrix!);
         this.diagramHolder.transform.baseVal.appendItem(transform);
      } else {
         this.diagramHolder.transform.baseVal.getItem(0).setMatrix(this.transformMatrix!);
      }
   }

   /**
    * Call when a table is being selected.
    */
   private onTableSelected(selected: Table): void {
      if (this.tables) {
         this.tables.forEach((table: Table) => {
            if (table !== selected) {
               table.select(false);
            }
         });
      }
   }

}
