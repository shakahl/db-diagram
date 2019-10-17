import { Base } from "@db-diagram/elements/base";
import { Diagram } from "@db-diagram/elements/diagram";
import { applyAttribute, GlobalAttribute } from "@db-diagram/elements/utils/attributes";
import { FieldOptions, RelationshipOptions } from "@db-diagram/elements/utils/options";
import { Point } from "@db-diagram/elements/utils/types";
import { Visualization } from "@db-diagram/shares/elements";

/**
 * Relation element represent relationship graphic between 2 table.
 */
export class Relation extends Base<SVGGElement, GlobalAttribute> {

   private foriegnField: FieldOptions;
   private options: RelationshipOptions;

   private path: SVGPathElement;
   private many!: SVGUseElement;
   private pone!: SVGUseElement;

   private parent: Diagram;

   constructor(parent: Diagram, options: RelationshipOptions) {
      super(Base.createElement("g"));
      this.parent = parent;

      const visual = parent.visualization;
      const styles = visual.getStylesDts();
      const icons = visual.getIconsDts();

      this.options = options;
      this.options.line = this.options.line || parent.preference.relationship.useStraightLine;

      applyAttribute(this.native, { class: styles.relation });

      if (options.foreignField === undefined) {
         try {
            const pfield = options.primaryTable.primaryField();
            const tname = options.primaryTable.name.toLowerCase().replace(" ", "_");
            options.foreignField = {
               foreign: true,
               name: `${tname}_${pfield.name}`,
               type: pfield.type,
               typeRaw: pfield.typeRaw,
               typeSize: pfield.typeSize,
            } as FieldOptions;
         } catch (e) {
            throw e;
         }
      }
      this.foriegnField = options.foreignField;
      this.options.foreignTable.addField(options.foreignField!);

      this.options.primaryTable.primaryRelation(this);
      this.options.foreignTable.foriegnRelation(this, this.foriegnField);

      this.path = Base.createElement("path");
      let clazz = styles.line;
      if (this.options.weak) { clazz += ` ${styles.weak}`; }
      this.native.appendChild(applyAttribute(this.path, { class: clazz }));

      this.many = Visualization.createReferencePathIcon(icons.many);
      this.pone = Visualization.createReferencePathIcon(icons.one);

      this.native.appendChild(applyAttribute(this.many, { class: styles.many }));
      this.native.appendChild(applyAttribute(this.pone, { class: styles.one }));

      this.options.foreignTable.front();
      this.options.primaryTable.front();

      this.render().attach(parent);
   }

   /**
    * Toggle visibiliy of the relationship.
    */
   public visibility(visible: boolean): this {
      const visibility = this.native.getAttribute("visibility");
      if (visible && visibility !== "visible") {
         applyAttribute(this.native, { visibility: "visible" });
      } else if (!visible && visibility !== "hidden") {
         applyAttribute(this.native, { visibility: "hidden" });
      }
      return this;
   }

   /**
    * Create path line data to connect 2 tables.
    */
   public render(): this {
      const pBox = this.options.primaryTable.box();
      const fBox = this.options.foreignTable.box();

      const l1 = pBox.x;
      const l2 = fBox.x;
      const r1 = l1 + pBox.width;
      const r2 = l2 + fBox.width;

      let p1: Point;
      let p2: Point;

      const icons = this.parent.visualization.getIconsDts();

      const oneSize = this.parent.visualization.getIconsElementSize(icons.one);
      const oneMidY = (oneSize.height / 2);

      const manySize = this.parent.visualization.getIconsElementSize(icons.many);
      const manyMidY = (manySize.height / 2);
      const manyMidX = (manySize.width / 2);

      if (r1 < l2 || r2 < l1) {  // in between table
         const pL = this.options.primaryTable.primaryFieldCoordinate();
         const fL = this.options.foreignTable.fieldCoordinate(this.options.foreignTable.fieldIndex(this.foriegnField));

         if (Math.abs(r1 - l2) < Math.abs(r2 - l1)) {
            p1 = pL.right;
            p2 = fL.left;
            applyAttribute(this.pone, { transform: `translate(${p1.x}, ${p1.y - oneMidY})` });
            applyAttribute(this.many, { transform: `translate(${p2.x - manySize.width}, ${p2.y - manyMidY})` });
         } else {
            p1 = fL.right;
            p2 = pL.left;
            applyAttribute(this.pone, { transform: `translate(${p2.x - oneSize.width}, ${p2.y - oneMidY})` });
            applyAttribute(this.many, { transform: `translate(${p1.x}, ${p1.y - manyMidY}) rotate(180, ${manyMidX}, ${manyMidY})` });
         }

         const str = this.options.line ?
            this.generateLineCurveInBetween(p1, p2) : this.generateCurveInBetween(p1, p2);
         applyAttribute(this.path, { d: str });

      } else {
         const pL = this.options.primaryTable.primaryFieldCoordinate();
         const fL = this.options.foreignTable.fieldCoordinate(this.options.foreignTable.fieldIndex(this.foriegnField));

         let right = false;
         if (Math.abs(l1 - l2) < Math.abs(r1 - r2)) {
            p1 = pL.right;
            p2 = fL.right;
            right = true;
            applyAttribute(this.pone, { transform: `translate(${p1.x}, ${p1.y - oneMidY})` });
            applyAttribute(this.many, { transform: `translate(${p2.x}, ${p2.y - manyMidY}) rotate(180, ${manyMidX}, ${manyMidY})` });
         } else {
            p1 = pL.left;
            p2 = fL.left;
            applyAttribute(this.pone, { transform: `translate(${p1.x - oneSize.width}, ${p1.y - oneMidY})` });
            applyAttribute(this.many, { transform: `translate(${p2.x - manySize.width}, ${p2.y - manyMidY})` });
         }

         const str = this.options.line ?
            this.generateLineCurveSameSide(p1, p2, right) : this.generateCurveSameSide(p1, p2, right);
         applyAttribute(this.path, { d: str });

      }
      return this;
   }

   /**
    * Attach current relation to the diagram.
    * @param it
    */
   public attach(it: Diagram): this {
      return super.attach(it);
   }

   /** generate curve line in between table */
   private generateCurveInBetween(p1: Point, p2: Point): string {
      const half = Math.floor((p2.x - p1.x) / 2);
      return `M ${p1.x} ${p1.y} L${p1.x + 10} ${p1.y} C${p1.x + half} ${p1.y} ${p2.x - half} ${p2.y} ${p2.x - 10} ${p2.y}`;
   }

   /** generate curve line when table align vertical or overlap on each other. */
   private generateCurveSameSide(p1: Point, p2: Point, right: boolean): string {
      let x: number;
      let dx: number;
      if (right) {
         x = Math.max(p2.x, p1.x) + 50;
         dx = 10;
      } else {
         x = Math.min(p2.x, p1.x) - 50;
         dx = -10;
      }
      return `M${p1.x} ${p1.y} L${p1.x + dx} ${p1.y} C${x} ${p1.y} ${x} ${p2.y} ${p2.x + dx} ${p2.y}`;
   }

   /** create straight line in between table */
   private generateLineCurveInBetween(p1: Point, p2: Point): string {
      const dh = p1.y - p2.y;
      const adh = Math.abs(dh);
      const multiplyDir = dh === 0 ? 0 : adh / dh;

      const curveSize = adh >= 16 ? 8 : (adh / 2);
      const halfW = p1.x + Math.abs(p1.x - p2.x) / 2;

      const x1 = p1.x;
      const y1 = p1.y;
      const x2 = halfW - curveSize;
      const y2 = y1;
      const x3 = halfW;
      const y3 = y1 - (multiplyDir * curveSize);
      const x4 = halfW;
      const y4 = p2.y + (multiplyDir * curveSize);
      const x5 = halfW + curveSize;
      const y5 = p2.y;
      const x6 = p2.x;
      const y6 = p2.y;

      return `M${x1},${y1} L${x2},${y2} Q${x3},${y1} ${x3},${y3} L${x4},${y4} Q${x4},${y5} ${x5},${y5} L${x6},${y6}`;
   }

   /** create straight line when table align vertical or overlap on each other. */
   private generateLineCurveSameSide(p1: Point, p2: Point, right: boolean): string {
      const dh = p1.y - p2.y;
      const adh = Math.abs(dh);
      const multiplyV = dh === 0 ? 1 : dh / adh;

      const curveSize = adh >= 16 ? 8 : (adh / 2);

      let multiplyDir: number;
      let vlinex: number;
      if (right) {
         multiplyDir = -1;
         vlinex = Math.max(p1.x, p2.x) + 30;
      } else {
         multiplyDir = 1;
         vlinex = Math.min(p1.x, p2.x) - 30;
      }

      const x1 = p1.x;
      const y1 = p1.y;
      const x2 = vlinex + (multiplyDir * curveSize);
      const y2 = y1;
      const x3 = vlinex;
      const y3 = y1 - (multiplyV * curveSize);
      const x4 = vlinex;
      const y4 = p2.y + (multiplyV * curveSize);
      const x5 = vlinex + (multiplyDir * curveSize);
      const y5 = p2.y;
      const x6 = p2.x;
      const y6 = p2.y;

      return `M${x1},${y1} L${x2},${y2} Q${x3},${y1} ${x3},${y3} L${x4},${y4} Q${x4},${y5} ${x5},${y5} L${x6},${y6}`;
   }

}
