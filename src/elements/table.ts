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
import { fieldOptionEqual, FieldOptions, TableOptions } from "@db-diagram/elements/utils/options";
import { Box, DataType, FieldCoordinate, Point, Size, TableMetadata } from "@db-diagram/elements/utils/types";
import { Visualization } from "@db-diagram/shares/elements";

/**
 * Object represent table field element.
 */
interface FieldUI {
   fieldOptions: FieldOptions;
   icon?: SVGUseElement;
   name: SVGTextElement;
   type: SVGTextElement;
   mark?: SVGUseElement;
   fieldGroup: SVGGElement;
   relation?: Relation[];
}

/**
 * Element diagram represent database table.
 */
export class Table extends UIElement<SVGGElement, GlobalAttribute> {

   private static readonly roundCorner = 6;

   // create field table element.
   private static createField(table: Table, options: FieldOptions): FieldUI {
      const visual = Visualization.getInstance();
      const icons = visual.getIconsDts();
      const styles = visual.getStylesDts();
      const padding = Visualization.TableTextPadding;

      const rowHeight = visual.tableFieldHeight;
      const half = rowHeight / 2;
      const nameBox = visual.getTableTextFieldVariableSize(options);
      const typeBox = visual.getTableTextFieldTypeSize(options);
      const fieldWidth = Math.max(table.size.width, visual.tableFieldIconWidth +
         nameBox.width + typeBox.width + padding.left! + padding.right! + Visualization.FieldNameTypeSpacing);

      const fieldUi = {
         fieldGroup: Base.createElement("g"),
         fieldOptions: options,
         name: applyAttribute(Base.createElement("text"), {
            alignmentBaseline: "middle",
            class: styles.fieldTextName.noTypeSelector(),
            dominantBaseline: "middle",
            // 1 space for a line
            x: visual.tableFieldIconWidth + padding.left! + 1,
            y: half,
         } as TextAttribute),
         type: applyAttribute(Base.createElement("text"), {
            alignmentBaseline: "middle",
            class: styles.fieldTextType.noTypeSelector(),
            dominantBaseline: "middle",
            textAnchor: "end",
            x: (fieldWidth - padding.right!),
            y: half,
         } as TextAttribute),
      } as FieldUI;

      if (options.primary || options.unique || options.foreign) {
         let size: Box;
         let clazz: string;
         if (options.primary) {
            fieldUi.icon = Visualization.createReferencePathIcon(icons.primaryKeyIcon);
            size = visual.getIconsElementSize(icons.primaryKeyIcon);
            clazz = styles.primary.noTypeSelector();
         } else if (options.unique) {
            fieldUi.icon = Visualization.createReferencePathIcon(icons.uniqueKeyIcon);
            size = visual.getIconsElementSize(icons.uniqueKeyIcon);
            clazz = styles.unique.noTypeSelector();
         } else if (options.foreign) {
            fieldUi.icon = Visualization.createReferencePathIcon(icons.foriegnKeyIcon);
            size = visual.getIconsElementSize(icons.foriegnKeyIcon);
            clazz = styles.foreign.noTypeSelector();
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

      if (options.type === DataType.Enum) {
         fieldUi.mark = Base.createElement("use");
         fieldUi.fieldGroup.appendChild(fieldUi.mark);
      }

      const totalFieldHeight = (rowHeight * (table.fieldsUi.length));
      const rowY = visual.tableHeaderHeight + totalFieldHeight + padding.top!;

      table.onSizeChange(fieldWidth, rowY + visual.tableFooterHeight + visual.tableFieldHeight + padding.bottom!);
      applyAttribute(fieldUi.fieldGroup, { transform: `translate(0,${rowY})` });

      return fieldUi;
   }

   // create table header background
   private static createHeaderPath(size: Size, headerHeight: number): string {
      const x = 0;
      const y = 0;
      const hy = y + headerHeight;
      const rp = y + Table.roundCorner;
      const vx = x + size.width - Table.roundCorner;
      const rxl = x + Table.roundCorner;
      const rxr = x + size.width;
      return `M${x},${hy} V${rp} Q${x},${y} ${rxl},${y} H${vx} Q${rxr},${y} ${rxr},${rp} V${hy} H${x}Z`;
   }

   // create table footer background
   private static createFooterPath(size: Size, headerHeight: number, footerHeight: number): string {
      const x = 0;
      const ty = headerHeight;
      const y = size.height - footerHeight;
      const hy = y + footerHeight - Table.roundCorner;
      const rp = hy + Table.roundCorner;
      const vx = x + size.width - Table.roundCorner;
      const rxl = x + Table.roundCorner;
      const rxr = x + size.width;
      const iconWidth = Visualization.getInstance().tableFieldIconWidth;
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

   private tableOptions: TableOptions;

   private parent?: Diagram;

   /**
    * Return table name.
    */
   public get name(): string {
      return this.tableOptions.name;
   }

   /**
    * Return table field count.
    */
   public get fieldCount(): number {
      return this.fieldsUi.length;
   }

   constructor(parent: Diagram, options: TableOptions, attr?: GlobalAttribute) {
      super(Base.createElement("g"), Object.assign({ "data-name": options.name } as TableAttribute, attr));
      this.tableOptions = options;
      this.parent = parent;

      const visual = Visualization.getInstance();
      const icons = visual.getIconsDts();
      const styles = visual.getStylesDts();

      this.wrapped = this.native.appendChild(Base.createElement("g"));
      applyAttribute(this.wrapped, { class: "wrapped" });

      const size = parent.preference.table.minimumSize;

      this.tableBg = this.wrapped.appendChild(applyAttribute(Base.createElement("rect"), {
         class: styles.tableBackground.noTypeSelector(),
         height: size.height,
         rx: Table.roundCorner,
         ry: Table.roundCorner,
         width: size.width,
      } as RectAttribute));

      const padding = Visualization.TableTextPadding;

      const iconHeight = visual.getIconsElementSize(icons.tableIcon).height;

      this.header = this.wrapped.appendChild(applyAttribute(Base.createElement("path"), {
         class: `${styles.header.noTypeSelector()}`,
         d: Table.createHeaderPath(size, visual.tableHeaderHeight),
      } as PathAttribute));

      this.footer = this.wrapped.appendChild(applyAttribute(Base.createElement("path"), {
         class: `${styles.footer.noTypeSelector()}`,
         d: Table.createFooterPath(size, visual.tableHeaderHeight, visual.tableFooterHeight),
      } as PathAttribute));

      this.tableTitle = this.wrapped.appendChild(Base.createElement("text"));
      this.tableTitle.textContent = options.name;
      let txtLeft = (2 * padding.left!) + visual.getIconsElementSize(icons.tableIcon).width;
      let txtTop = (visual.tableHeaderHeight / 2) + 1;
      applyAttribute(this.tableTitle, {
         alignmentBaseline: "middle",
         class: styles.title.noTypeSelector(),
         dominantBaseline: "middle",
         transform: `translate(${txtLeft}, ${txtTop})`,
      } as TextAttribute);

      this.wrapped.appendChild(applyAttribute(Visualization.createReferencePathIcon(icons.tableIcon), {
         class: styles.tableIcon.noTypeSelector(),
         transform: `translate(${padding.left!}, ${(visual.tableHeaderHeight - iconHeight) / 2})`,
      } as PathAttribute));

      if (options.engine) {
         this.tableEngine = this.wrapped.appendChild(Base.createElement("text"));
         this.tableEngine.textContent = options.engine!;
         txtLeft = padding.left!;
         txtTop = size.height - (visual.tableFooterHeight / 2) + 1;
         applyAttribute(this.tableEngine, {
            alignmentBaseline: "middle",
            class: styles.footer.noTypeSelector(),
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
      this.parent!.table(this.tableOptions, true);
      return super.detach();
   }

   /**
    * Return table metadata.
    */
   public metadata(): TableMetadata {
      const tm = {
         additional: this.tableOptions.additional,
         engine: this.tableOptions.engine,
         name: this.name,
      } as TableMetadata;

      if (this.fieldsUi && this.fieldsUi.length > 0) {
         tm.fields = [];
         this.fieldsUi.forEach((fieldUi) => {
            tm.fields!.push(Object.assign({}, fieldUi.fieldOptions));
         });
      }
      return tm;
   }

   /**
    * Add primary relationship.
    * @param relation relationship object.
    */
   public primaryRelation(relation: Relation): this {
      for (const fieldUI of this.fieldsUi) {
         if (fieldUI.fieldOptions.primary) {
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
   public foriegnRelation(relation: Relation, field: FieldOptions): this {
      for (const fieldUI of this.fieldsUi) {
         if (fieldUI.fieldOptions.foreign && fieldUI.fieldOptions === field) {
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
   public field(index: number): FieldOptions {
      return this.fieldsUi[index].fieldOptions;
   }

   /**
    * Get field index.
    * @param field field option.
    */
   public fieldIndex(field: FieldOptions): number {
      for (let i = 0; i < this.fieldsUi.length; i++) {
         if (fieldOptionEqual(this.fieldsUi[i].fieldOptions, field)) {
            return i;
         }
      }
      return -1;
   }

   /**
    * Get primary field optoins.
    */
   public primaryField(): FieldOptions {
      let field: FieldOptions | undefined;
      for (const fieldUI of this.fieldsUi) {
         if (fieldUI.fieldOptions.primary) {
            field = fieldUI.fieldOptions;
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
         if (this.fieldsUi[i].fieldOptions.primary) {
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

      const visual = Visualization.getInstance();

      const top = Visualization.TableFieldPadding.top!;
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
   public addField(options: FieldOptions, index?: number): number {
      options.typeRaw = `${DataType[options.type].toLowerCase()}`;
      if (options.typeSize && options.typeSize > 0) {
         options.typeRaw += `(${options.typeSize})`;
      }

      const fieldUi = Table.createField(this, options);

      fieldUi.name.textContent = options.name;
      fieldUi.type.textContent = options.typeRaw!;

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
   public removeField(index: number): FieldOptions {
      if (index < this.fieldsUi.length) {
         const fieldUi = Object.assign({}, this.fieldsUi[index]);
         this.fieldsUi.splice(index, 1);

         const size = this.parent!.preference.table.minimumSize;
         const space = 6;
         const rowHeight = Math.max(12, fieldUi.type.getBBox().height, fieldUi.name.getBBox().height);
         let mW = 0;
         this.fieldsUi.forEach((fUI) => {
            const typeWidth = fUI.type.getBBox().width;
            mW = Math.max(mW, size.width,
               fUI.name.getBBox().width + typeWidth + 16 + 16 + 8 + (space * 3));
         });

         const visual = Visualization.getInstance();

         this.wrapped.removeChild(fieldUi.fieldGroup);
         const totalFieldHeight = (rowHeight * (this.fieldsUi.length));
         const rowY = visual.tableHeaderHeight + totalFieldHeight;

         this.onSizeChange(mW, rowY + visual.tableFooterHeight + (4 + space));

         return fieldUi.fieldOptions;
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
      this.relationVisibility(false);
   }

   /**
    * Call when a drag event is aborted.
    */
   protected onDragAbort() { this.relationVisibility(true); }

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

      const visual = Visualization.getInstance();
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
            applyAttribute(fieldUi.type, { x: width - padding.left! - padding.right! });
         });
      }

      if (updateHeader) { applyAttribute(this.header, {
         d: Table.createHeaderPath(this.size, visual.tableHeaderHeight),
      });
      }
      if (updateFooter) {
         applyAttribute(this.footer, {
            d: Table.createFooterPath(this.size, visual.tableHeaderHeight, visual.tableFooterHeight),
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
