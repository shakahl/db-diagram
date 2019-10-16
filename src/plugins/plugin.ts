import { Table } from "@db-diagram/elements/table";
import { FieldOptions, TableOptions } from "@db-diagram/elements/utils/options";

/**
 * interface provide definition of the plugin.
 */
export interface Plugin {
   /**
    * generate list table from the given sql
    * @param sql sql query syntax
    */
   import(sql: string): Table[];
   /**
    * generate sql syntax from the given list of table
    * @param tables list of table
    */
   export(tables: Table[]): string;
   /**
    * generate sql syntax from the given table or field options
    * @param options table or field options
    */
   sql(options: TableOptions | FieldOptions): string;
   /**
    * parse the given sql into table or field options
    * @param sql string sql syntax
    */
   parse(sql: string): TableOptions | FieldOptions;
   /**
    * validate whether the given options is valid
    * @param options table or field opitions
    */
   validate(options: TableOptions | FieldOptions): boolean;
}

/**
 * Allow include customizable plugin implemented by third party.
 */
export class DiagramPlugin {

   private static plugin: DiagramPlugin;

   /**
    * Get singleton instance of diagram plugin
    */
   public static get instance(): DiagramPlugin {
      if (!DiagramPlugin.plugin) {
         DiagramPlugin.plugin = new DiagramPlugin();
      }
      return DiagramPlugin.plugin;
   }

   private plugins: Map<string, Plugin>;

   private constructor() { this.plugins = new Map(); }

   /**
    * Replace existing plugin of the given database db
    * @param plugin new plugin
    * @param db database engine
    */
   public setPlugin(plugin: Plugin, db: string): this {
      this.plugins.set(db, plugin);
      return this;
   }

   /**
    * Return the plugin use by the given database engine db
    * @param db database engine
    */
   public getPlugin(db: string): Plugin | undefined {
      return this.plugins.get(db);
   }

}
