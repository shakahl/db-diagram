import { binary } from "@db-diagram/@gen/binary/types_generated";
import { Base } from "@db-diagram/elements/base";
import { Diagram } from "@db-diagram/elements/diagram";
import { Relation } from "@db-diagram/elements/relation";
import { UIElement } from "@db-diagram/elements/uielement";
import {
   applyAttribute,
   GlobalAttribute,
   PathAttribute,
   RectAttribute,
   TableAttribute,
   TextAttribute,
} from "@db-diagram/elements/utils/attributes";
import { Box } from "@db-diagram/elements/utils/box";
import { Field } from "@db-diagram/services/documents/field";
import { Table } from "@db-diagram/services/documents/table";
import { FieldCoordinate, Point, Size } from "@db-diagram/services/documents/types";
import { Visualization } from "@db-diagram/shares/elements";

/**
 * Object represent table field element.
 */
interface FieldUI {
   icon?: SVGUseElement;
   name: SVGTextElement;
   type: SVGTextElement;
   mark?: SVGUseElement;
   fieldGroup: SVGGElement;
   relation?: Relation[];

   // keep some data from Field object
   field: Field;
}

/**
 * Element diagram represent database table.
 */
export class TableGraph extends UIElement<SVGGElement, GlobalAttribute> {

   private static readonly roundCorner = 6;

   // create field table element.
   private static createField(table: TableGraph, field: Field): FieldUI {
      const visual = table.parent!.visualization;
      const icons = visual.getIconsDts();
      const styles = visual.getStylesDts();
      const padding = Visualization.TableTextPadding;

      const rowHeight = visual.tableFieldHeight;
      const half = rowHeight / 2;
      const nameBox = visual.getTableTextFieldVariableSize(field);
      const typeBox = visual.getTableTextFieldTypeSize(field);
      const fieldWidth = Math.max(table.size.width, visual.tableFieldIconWidth +
         nameBox.width + typeBox.width + padding.left + padding.right + Visualization.FieldNameTypeSpacing);

      const fieldUi = {
         field,
         fieldGroup: Base.createElement("g"),
         name: applyAttribute(Base.createElement("text"), {
            alignmentBaseline: "middle",
            class: styles.fieldTextName,
            dominantBaseline: "middle",
            // 1 space for a line
            x: visual.tableFieldIconWidth + padding.left + 1,
            y: half,
         } as TextAttribute),
         type: applyAttribute(Base.createElement("text"), {
            alignmentBaseline: "middle",
            class: styles.fieldTextType,
            dominantBaseline: "middle",
            textAnchor: "end",
            x: (fieldWidth - padding.right),
            y: half,
         } as TextAttribute),
      } as FieldUI;

      if (field.key) {
         let size: Box;
         let clazz: string;
         if (field.kind === binary.FieldKind.Primary) {
            fieldUi.icon = Visualization.createReferencePathIcon(icons.primaryKeyIcon);
            size = visual.getIconsElementSize(icons.primaryKeyIcon);
            clazz = styles.primary;
         } else if (field.kind === binary.FieldKind.Unique) {
            fieldUi.icon = Visualization.createReferencePathIcon(icons.uniqueKeyIcon);
            size = visual.getIconsElementSize(icons.uniqueKeyIcon);
            clazz = styles.unique;
         } else if (field.kind === binary.FieldKind.Foriegn) {
            fieldUi.icon = Visualization.createReferencePathIcon(icons.foriegnKeyIcon);
            size = visual.getIconsElementSize(icons.foriegnKeyIcon);
            clazz = styles.foreign;
         } else {
            throw new Error("expected error");
         }
         applyAttribute(fieldUi.icon, {
            class: clazz,
            transform: `translate(${padding.left}, ${(rowHeight - size.height) / 2})`,
         });
         applyAttribute(fieldUi.name, { class: clazz });
         fieldUi.fieldGroup.appendChild(fieldUi.icon);
      }
      fieldUi.fieldGroup.appendChild(fieldUi.name);
      fieldUi.fieldGroup.appendChild(fieldUi.type);

      if (field.type === binary.DataType.Enum) {
         fieldUi.mark = Base.createElement("use");
         fieldUi.fieldGroup.appendChild(fieldUi.mark);
      }

      const totalFieldHeight = (rowHeight * (table.fieldsUi.length));
      const rowY = visual.tableHeaderHeight + totalFieldHeight + padding.top;

      table.onSizeChange(fieldWidth, rowY + visual.tableFooterHeight + visual.tableFieldHeight + padding.bottom);
      applyAttribute(fieldUi.fieldGroup, { transform: `translate(0,${rowY})` });

      return fieldUi;
   }

   // create table header background
   private static createHeaderPath(size: Size, headerHeight: number): string {
      const x = 0;
      const y = 0;
      const hy = y + headerHeight;
      const rp = y + TableGraph.roundCorner;
      const vx = x + size.width - TableGraph.roundCorner;
      const rxl = x + TableGraph.roundCorner;
      const rxr = x + size.width;
      return `M${x},${hy} V${rp} Q${x},${y} ${rxl},${y} H${vx} Q${rxr},${y} ${rxr},${rp} V${hy} H${x}Z`;
   }

   // create table footer background
   private static createFooterPath(size: Size, iconWidth: number, headerHeight: number, footerHeight: number): string {
      const x = 0;
      const ty = headerHeight;
      const y = size.height - footerHeight;
      const hy = y + footerHeight - TableGraph.roundCorner;
      const rp = hy + TableGraph.roundCorner;
      const vx = x + size.width - TableGraph.roundCorner;
      const rxl = x + TableGraph.roundCorner;
      const rxr = x + size.width;
      return `M${x},${ty} V${hy} Q${x},${rp} ${rxl},${rp} H${vx} Q${rxr},${rp} ${rxr},${hy}` +
         ` V${ty} H${rxr} V${y} H${(x + iconWidth + 1)} V${ty} H${(x + iconWidth)} V${y} H${x} V${ty} H${x}Z`;
   }

   private tableBg: SVGRectElement;
   private tableTitle: SVGTextElement;
   private header: SVGPathElement;
   private footer: SVGPathElement;
   private tableEngine?: SVGTextElement;
   private wrapped: SVGGElement;
   private fieldsUi: FieldUI[] = [];

   private size: Size;
   private parent?: Diagram;

   /**
    * Return table name.
    */
   public get name(): string {
      return this.tableTitle.textContent!;
   }

   /**
    * Return table field count.
    */
   public get fieldCount(): number {
      return this.fieldsUi.length;
   }

   constructor(parent: Diagram, table: Table, attr?: GlobalAttribute) {
      super(Base.createElement("g"), Object.assign({ "data-name": table.name } as TableAttribute, attr));
      this.parent = parent;

      const visual = parent.visualization;
      const icons = visual.getIconsDts();
      const styles = visual.getStylesDts();

      this.wrapped = this.native.appendChild(Base.createElement("g"));
      applyAttribute(this.wrapped, { class: "wrapped" });

      const size = parent.preference.table.minimumSize;

      this.tableBg = this.wrapped.appendChild(applyAttribute(Base.createElement("rect"), {
         class: styles.tableBackground,
         height: size.height,
         rx: TableGraph.roundCorner,
         ry: TableGraph.roundCorner,
         width: size.width,
      } as RectAttribute));

      const padding = Visualization.TableTextPadding;

      const iconHeight = visual.getIconsElementSize(icons.tableIcon).height;

      this.header = this.wrapped.appendChild(applyAttribute(Base.createElement("path"), {
         class: `${styles.header}`,
         d: TableGraph.createHeaderPath(size, visual.tableHeaderHeight),
      } as PathAttribute));

      this.footer = this.wrapped.appendChild(applyAttribute(Base.createElement("path"), {
         class: `${styles.footer}`,
         d: TableGraph.createFooterPath(
            size, visual.tableFieldIconWidth, visual.tableHeaderHeight, visual.tableFooterHeight),
      } as PathAttribute));

      this.tableTitle = this.wrapped.appendChild(Base.createElement("text"));
      this.tableTitle.textContent = table.name;
      let txtLeft = (2 * padding.left) + visual.getIconsElementSize(icons.tableIcon).width;
      let txtTop = (visual.tableHeaderHeight / 2) + 1;
      applyAttribute(this.tableTitle, {
         alignmentBaseline: "middle",
         class: styles.title,
         dominantBaseline: "middle",
         transform: `translate(${txtLeft}, ${txtTop})`,
      } as TextAttribute);

      this.wrapped.appendChild(applyAttribute(Visualization.createReferencePathIcon(icons.tableIcon), {
         class: styles.tableIcon,
         transform: `translate(${padding.left}, ${(visual.tableHeaderHeight - iconHeight) / 2})`,
      } as PathAttribute));

      if (table.engine) {
         this.tableEngine = this.wrapped.appendChild(Base.createElement("text"));
         this.tableEngine.textContent = table.engine!;
         txtLeft = padding.left;
         txtTop = size.height - (visual.tableFooterHeight / 2) + 1;
         applyAttribute(this.tableEngine, {
            alignmentBaseline: "middle",
            class: styles.footer,
            dominantBaseline: "middle",
            transform: `translate(${txtLeft}, ${txtTop})`,
         } as TextAttribute);
      }

      // attach to parent right away
      this.attach(parent);
      this.draggable(true);
      this.selectable(true);

      this.size = size;
   }

   /**
    * Attach table to the diagram. By default it attached to diagram automatically
    * when table is created.
    * @param it diagram.
    */
   public attach(it: Diagram): this {
      return super.attach(it);
   }

   /**
    * remove itself from the diagram
    */
   public detach(): this {
      this.parent!.table(this.name, true);
      return super.detach();
   }

   /**
    * Add primary relationship.
    * @param relation relationship object.
    */
   public primaryRelation(relation: Relation): this {
      for (const fieldUI of this.fieldsUi) {
         if (fieldUI.field.kind === binary.FieldKind.Primary) {
            if (!fieldUI.relation) {
               fieldUI.relation = [];
            }
            if (fieldUI.relation!.indexOf(relation) < 0) {
               fieldUI.relation!.push(relation);
            }
            break;
         }
      }
      return this;
   }

   /**
    * Add foriegn relationship.
    * @param relation relationship object.
    */
   public foriegnRelation(relation: Relation, field: Field): this {
      for (const fieldUI of this.fieldsUi) {
         if (fieldUI.field.kind === binary.FieldKind.Foriegn &&
            fieldUI.field.name === field.name &&
            fieldUI.field.type === field.type) {
            if (!fieldUI.relation) {
               fieldUI.relation = [];
            }
            if (fieldUI.relation!.indexOf(relation) < 0) {
               fieldUI.relation!.push(relation);
            }
            break;
         }
      }
      return this;
   }

   /**
    * Get field option.
    * @param index field index.
    */
   public field(index: number): Field {
      return this.fieldsUi[index].field;
   }

   /**
    * Get field index.
    * @param field field option.
    */
   public fieldIndex(field: Field): number {
      for (const [i, fieldUI] of this.fieldsUi.entries()) {
         if (fieldUI.field.name === field.name && fieldUI.field.type === field.type) {
            return i;
         }
      }
      return -1;
   }

   /**
    * Get primary field optoins.
    */
   public primaryField(): Field {
      let field: Field | undefined;
      for (const fieldUI of this.fieldsUi) {
         if (fieldUI.field.kind === binary.FieldKind.Primary) {
            field = fieldUI.field;
            break;
         }
      }
      if (!field) { throw new Error(`table ${this.attr!.name} does not have primary key.`); }
      return field;
   }

   /**
    * Get coordinate left and right of a field primary key.
    * This coordinate is related to parent svg diagram.
    */
   public primaryFieldCoordinate(): FieldCoordinate {
      let primaryIndex = -1;
      for (let i = 0; i < this.fieldsUi.length; i++) {
         if (this.fieldsUi[i].field.kind === binary.FieldKind.Primary) {
            primaryIndex = i;
            break;
         }
      }
      if (primaryIndex === -1) {
         throw new Error(`table ${this.attr!.name} has no primary key`);
      }
      return this.fieldCoordinate(primaryIndex);
   }

   /**
    * Get coordinate left and right of a field of the given index.
    * This coordinate is related to parent svg diagram.
    * @param index field index
    */
   public fieldCoordinate(index: number): FieldCoordinate {
      if (index < 0 || index >= this.fieldsUi.length) {
         throw new Error(`index ${index} is out of range of 0 to ${this.fieldsUi.length}`);
      }

      const visual = this.parent!.visualization;

      const top = Visualization.TableFieldPadding.top;
      const y = visual.tableHeaderHeight + (index * visual.tableFieldHeight) +
         (visual.tableFieldHeight / 2) + (2 * top) + this.y(true);

      return {
         left: { x: this.x(true), y },
         right: { x: this.x(true) + this.size.width, y },
      } as FieldCoordinate;
   }

   /**
    * Add field to the table.
    * @param options field options.
    * @param index index of the field.
    */
   public addField(field: Field, index?: number): number {
      let typeRaw = `${binary.DataType[field.type].toUpperCase()}`;
      if (field.size && field.size > 0) {
         typeRaw += `(${field.size})`;
      }

      const fieldUi = TableGraph.createField(this, field);

      fieldUi.name.textContent = field.name;
      fieldUi.type.textContent = typeRaw!;

      this.wrapped.appendChild(fieldUi.fieldGroup);

      if (index && index >= 0 && index <= this.fieldsUi.length) {
         this.fieldsUi.splice(index, 0, fieldUi);
         return index;
      } else {
         this.fieldsUi.push(fieldUi);
         return this.fieldsUi.length - 1;
      }
   }

   /**
    * Remove field from table.
    * @param index field index
    */
   public removeField(index: number): Field {
      if (index < this.fieldsUi.length) {
         const fieldUi = Object.assign({}, this.fieldsUi[index]);
         this.fieldsUi.splice(index, 1);

         const size = this.parent!.preference.table.minimumSize;
         const space = 6;
         const rowHeight = Math.max(fieldUi.type.getBBox().height, fieldUi.name.getBBox().height);
         let mW = 0;
         this.fieldsUi.forEach((fUI) => {
            const typeWidth = fUI.type.getBBox().width;
            mW = Math.max(mW, size.width,
               fUI.name.getBBox().width + typeWidth + 16 + 16 + 8 + (space * 3));
         });

         const visual = this.parent!.visualization;

         this.wrapped.removeChild(fieldUi.fieldGroup);
         const totalFieldHeight = (rowHeight * (this.fieldsUi.length));
         const rowY = visual.tableHeaderHeight + totalFieldHeight;

         this.onSizeChange(mW, rowY + visual.tableFooterHeight + (4 + space));

         return fieldUi.field;
      }
      throw new Error("Index not exist");
   }

   /**
    * Accumulate the bounding box value to it root element.
    */
   protected applyTranform(box: DOMRect): DOMRect {
      box.x += this.transformMatrix!.e;
      box.y += this.transformMatrix!.f;
      return box;
   }

   /**
    * Call when table position changed.
    * @param p point or coordinate
    */
   protected onPositionChange(_: Point) {
      this.fieldsUi.forEach((item) => {
         if (item.relation && item.relation.length > 0) {
            item.relation.forEach((relation) => {
               relation.render();
            });
         }
      });
   }

   /**
    * Call when pointer down.
    */
   protected onPointerDown(): void {
      this.wrapped.classList.add("down");
   }

   /**
    * Call when pointer up.
    */
   protected onPointerUp(): void {
      this.wrapped.classList.remove("down");
      this.fieldsUi.forEach((item) => {
         if (item.relation && item.relation.length > 0) {
            item.relation.forEach((relation) => {
               relation.render();
               relation.visibility(true);
            });
         }
      });
   }

   /**
    * Call whenn a drag event is detected.
    */
   protected onDragStart() {
      if (!this.parent!.preference.table.showRelationWhileDrag) {
         this.relationVisibility(false);
      }
   }

   /**
    * Call when a drag event is aborted.
    */
   protected onDragAbort() {
      if (!this.parent!.preference.table.showRelationWhileDrag) {
         this.relationVisibility(true);
      }
   }

   /**
    * Call when a drag event ended.
    */
   protected onDragEnd() { this.relationVisibility(true); }

   /** update relation visibility */
   private relationVisibility(visible: boolean) {
      this.native.parentElement!.appendChild(this.native);
      this.fieldsUi.forEach((item) => {
         if (item.relation && item.relation.length > 0) {
            item.relation.forEach((relation) => {
               relation.visibility(visible);
            });
         }
      });
   }

   /**
    * Call when table size is changed.
    * @param width table width
    * @param height table height
    */
   private onSizeChange(width: number, height: number) {
      let updateFooter: boolean = false;
      let updateHeader: boolean = false;

      const visual = this.parent!.visualization;
      const padding = Visualization.TableTextPadding;

      if (height !== this.size.height) {
         if (height < this.size.height) {
            this.fieldsUi.forEach((fieldUi: FieldUI, index: number) => {
               const rowHeight = visual.tableFieldHeight;
               const totalFieldHeight = (rowHeight * (index + 1));
               const rowY = visual.tableHeaderHeight + totalFieldHeight;
               applyAttribute(fieldUi.fieldGroup, {
                  transform: `translate(0,${rowY})`,
               });
            });
         }
         this.size.height = height;
         updateFooter = true;
      }
      if (width !== this.size.width) {
         this.size.width = width;
         updateFooter = true;
         updateHeader = true;
         // update exist field type position
         this.fieldsUi.forEach((fieldUi) => {
            applyAttribute(fieldUi.type, { x: width - padding.left - padding.right });
         });
      }

      if (updateHeader) {
         applyAttribute(this.header, {
            d: TableGraph.createHeaderPath(this.size, visual.tableHeaderHeight),
         });
      }
      if (updateFooter) {
         applyAttribute(this.footer, {
            d: TableGraph.createFooterPath(
               this.size, visual.tableFieldIconWidth, visual.tableHeaderHeight, visual.tableFooterHeight),
         });
         if (this.tableEngine) {
            applyAttribute(this.tableEngine, {
               transform: `translate(${padding.left}, ${this.size.height - (visual.tableFooterHeight / 2) + 1})`,
            } as TextAttribute);
         }
      }

      applyAttribute(this.tableBg, {
         height: this.size.height,
         width: this.size.width,
      });
   }
}
