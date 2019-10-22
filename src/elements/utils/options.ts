import { Table } from "@db-diagram/elements/table";
import { DataType } from "@db-diagram/elements/utils/types";

/**
 * The option that provide base initialize properties value when
 * create database diagram.
 */
export interface DiagramOptions {
   minZoom?: number;
   maxZoom?: number;
   showMinimap?: boolean;
   showZoom?: boolean;
}

/**
 * The option that provide table data such as name and table engine.
 */
export interface TableOptions {
   // name of the table
   name: string;
   // table engine, database like Mysql does have different engine for each table.
   engine?: string;
   // TODO: probably not needed.
   additional?: string;
   // If relation between table should stay visible while table table is moving
   showRelationOnDrag?: boolean;
}

/**
 * The option that provide table field information.
 */
export interface FieldOptions {
   name: string;
   typeRaw?: string;
   type: DataType;
   // size of data type, for instance varchar must supply maximum length.
   typeSize?: number;
   // use a long side with Enum type to define enum type declaration
   typeItemize?: string[];

   primary?: boolean;
   unique?: boolean;
   foreign?: boolean;

   additionalRaw?: string;
   // javascript object that handle any metadata and it can be render as SQL
   // syntax with the method `toString()`
   additional?: any;
}

/**
 * Compare two field options and return true if the the two is identical.
 * @param fopt1 field option
 * @param fopt2 field option
 */
export function fieldOptionEqual(fopt1: FieldOptions, fopt2: FieldOptions): boolean {
   return fopt1.name === fopt2.name &&
      fopt1.type === fopt2.type &&
      fopt1.typeSize === fopt2.typeSize &&
      fopt1.primary === fopt2.primary &&
      fopt1.unique === fopt2.unique &&
      fopt1.foreign === fopt2.foreign;
}

/**
 * The option that provide information of the relationship.
 */
export interface RelationshipOptions {
   /** primary table as primary relationship */
   primaryTable: Table;
   /** foreign table */
   foreignTable: Table;
   /** an optional field that represent foreign key field from primary table */
   foreignField?: FieldOptions;

   // true indicate the relation is draw using straight line otherwise a curve line
   // is draw instead. By default, the curve is used.
   line?: boolean;

   // use to identify if the relation is strong or weak
   // `strong` the relationship will required cascading delete on all relationship data,
   // this is by default use by most of relational database.
   // `weak` the relationship does not enforce or required cascading delete when delete a row
   // data from the table.
   // default to strong.
   weak?: boolean;
   // use to identify NO-SQL relation database
   reference?: boolean;
   embed?: boolean;
}
