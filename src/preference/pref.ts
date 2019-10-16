import {
   defaultDiagramSetting,
   defaultRelationshipSetting,
   defaultTableSetting,
   DiagramSetting,
   RelationshipSetting,
   TableSetting,
} from "@db-diagram/preference/defaults";
import { Visualization } from "@db-diagram/shares/elements";

// preference enable developer to customize the diagram appearance and setting
// for their own desired. By default, preference will provide 2 different theme
// for diagram appearance the light theme and the dark theme.

/**
 * Provide a static getter and setter to get or update theme and diagram setting.
 * @public
 */
export class Preference {

   private static relationshipSettingKey = "key.relationship.setting";
   private static tableSettingKey = "key.table.setting";
   private static diagramSettingKey = "key.diagram.setting";

   private visualization: Visualization;

   constructor(visualization: Visualization) {
      this.visualization = visualization;
   }

   /**
    * Get relationship setting
    */
   public get relationship(): RelationshipSetting {
      if (window.localStorage) {
         const rawRelationshipSetting = window.localStorage.getItem(Preference.relationshipSettingKey);
         if (!rawRelationshipSetting) {
            return defaultRelationshipSetting(this.visualization);
         }
         const relationshipSetting = JSON.parse(rawRelationshipSetting);
         if (!relationshipSetting) {
            return defaultRelationshipSetting(this.visualization);
         }
         return relationshipSetting;
      }
      throw new Error("browser does not support local storage");
   }

   /**
    * Update relationship setting
    */
   public set relationship(rls: RelationshipSetting) {
      if (window.localStorage) {
         const oldtbs = this.relationship;
         rls = Object.assign({}, oldtbs, rls);
         window.localStorage.setItem(Preference.relationshipSettingKey, JSON.stringify(rls));
      }
   }

   /**
    * Get table setting
    */
   public get table(): TableSetting {
      if (window.localStorage) {
         const rawDiagramSetting = window.localStorage.getItem(Preference.tableSettingKey);
         if (!rawDiagramSetting) {
            return defaultTableSetting(this.visualization);
         }
         const diagramSetting = JSON.parse(rawDiagramSetting);
         if (!diagramSetting) {
            return defaultTableSetting(this.visualization);
         }
         return diagramSetting;
      }
      throw new Error("browser does not support local storage");
   }

   /**
    * Update table setting
    */
   public set table(tbs: TableSetting) {
      if (window.localStorage) {
         const oldtbs = this.table;
         tbs = Object.assign({}, oldtbs, tbs);
         window.localStorage.setItem(Preference.tableSettingKey, JSON.stringify(tbs));
      }
   }

   /**
    * Get diagram setting
    */
   public get diagram(): DiagramSetting {
      if (window.localStorage) {
         const rawDiagramSetting = window.localStorage.getItem(Preference.diagramSettingKey);
         if (!rawDiagramSetting) {
            return defaultDiagramSetting(this.visualization);
         }
         const diagramSetting = JSON.parse(rawDiagramSetting);
         if (!diagramSetting) {
            return defaultDiagramSetting(this.visualization);
         }
         return diagramSetting;
      }
      throw new Error("browser does not support local storage");
   }

   /**
    * Update current diagram setting with the given ds. The given diagram setting will be merge into
    * the active existing and override it if the properties was available in ds.
    */
   public set diagram(ds: DiagramSetting) {
      if (window.localStorage) {
         const oldDS = this.diagram;
         ds = Object.assign({}, oldDS, ds);
         window.localStorage.setItem(Preference.diagramSettingKey, JSON.stringify(ds));
      }
   }

}
