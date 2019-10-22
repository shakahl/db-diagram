import "@db-diagram/@extensions/strings";

/** export class represent sql object such as table and relationship */
export {
   Diagram,
} from "@db-diagram/elements/diagram";
export {
   Table,
} from "@db-diagram/elements/table";
export {
   Relation,
} from "@db-diagram/elements/relation";

/** export attribute */
export {
   SvgAttribute,
   ViewBox,
} from "@db-diagram/elements/utils/attributes";

export {
   Plugin,
   DiagramPlugin,
} from "@db-diagram/plugins/plugin";

export {
   Database,
} from "@db-diagram/plugins/database";

export {
   onDomReady,
   Visualization,
} from "@db-diagram/shares/elements";

/** export options */
export {
   FieldOptions,
   RelationshipOptions,
   TableOptions,
} from "@db-diagram/elements/utils/options";

/** export preference setting */
export * from "@db-diagram/preference/defaults";
export * from "@db-diagram/preference/pref";

/** export data type */
export {
   DataType,
   TableMetadata,
} from "@db-diagram/elements/utils/types";

let svgIconsSet: SVGSVGElement | undefined;
/**
 * Add a set of icons into html dom hierarchy.
 * @param url url to icon set
 */
export function addIconSet(url: string): Promise<boolean> | boolean {
   if (!svgIconsSet) {
      return fetch(url).then(async (response) => {
         if (response.ok) {
            return response.text();
         } else {
            return false;
         }
      }).then((txt) => {
         if (txt) {
            const div = document.createElement("div");
            div.innerHTML = txt;
            div.children[0].setAttribute("style", "display: none;");
            svgIconsSet = div.children[0] as SVGSVGElement;
            document.body.append(svgIconsSet!);
            return true;
         } else {
            return false;
         }
      });
   }
   return true;
}
