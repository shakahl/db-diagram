import "@db-diagram/@extensions/strings";

/** export class represent sql object such as table and relationship */
export {
   Diagram,
} from "@db-diagram/elements/diagram";
export {
   TableGraph,
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
   onDomReady,
   Visualization,
} from "@db-diagram/shares/elements";
/** export preference setting */
export * from "@db-diagram/preference/defaults";
export * from "@db-diagram/preference/pref";

/** export data type */
export * from "@db-diagram/@gen/binary/types_generated";

/** export data service worker to the plugins */
export { DataServiceWorker } from "@db-diagram/services/data.service.worker";
export * from "@db-diagram/services/documents/database";
export * from "@db-diagram/services/documents/types";

let svgIconsSet: SVGSVGElement | undefined;
/**
 * Add a set of icons into html dom hierarchy.
 * @param url url to icon set
 */
export function addIconSet(urlOrContent: string, parent?: HTMLElement | Node): Promise<boolean> | boolean {
   const inject = (raw: string | boolean): boolean => {
      if (typeof raw === "string") {
         const div = document.createElement("div");
         div.innerHTML = raw;
         div.children[0].setAttribute("style", "display: none;");
         svgIconsSet = div.children[0] as SVGSVGElement;
         parent ? parent.appendChild(svgIconsSet) : document.body.append(svgIconsSet!);
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
