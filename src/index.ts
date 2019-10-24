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
export function addIconSet(urlOrContent: string): Promise<boolean> | boolean {
   const inject = (raw: string | boolean): boolean => {
      if (typeof raw === "string") {
         const div = document.createElement("div");
         div.innerHTML = raw;
         div.children[0].setAttribute("style", "display: none;");
         svgIconsSet = div.children[0] as SVGSVGElement;
         document.body.append(svgIconsSet!);
         return true;
      } else {
         return false;
      }
   };
   if (!svgIconsSet) {
      if (urlOrContent.includes("<svg>")) {
         return inject(urlOrContent);
      } else {
         return fetch(urlOrContent).then(async (response) => {
            if (response.ok) {
               return response.text();
            } else {
               return false;
            }
         }).then((raw: string | boolean) => {
            return inject(raw);
         });
      }
   }
   return true;
}
