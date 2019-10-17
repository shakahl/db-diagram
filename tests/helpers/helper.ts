import "@db-diagram/@extensions/strings";
import { Diagram } from "@db-diagram/elements/diagram";
import { Table } from "@db-diagram/elements/table";
import { ParseViewBox, ViewBox } from "@db-diagram/elements/utils/attributes";
import { FieldOptions, TableOptions } from "@db-diagram/elements/utils/options";
import { loadFixtures } from "./karma";

/**
 *
 */
export function loadAttributeFixture(name: string) {
    const attr = loadFixtures<any>(name).data;
    if (attr.viewBox !== undefined) {
        attr.viewBox = ParseViewBox(attr.viewBox);
    }
    return attr;
}

/**
 *
 */
export interface DiagramFixtures {
    diagram: Diagram;
    tables: Array<{ opt: TableOptions, fields: FieldOptions[], table: Table }>;
    cleanup: () => void;
}

/** */
interface FixtureTableOptions extends TableOptions {
    fields: FieldOptions[];
}

/**
 *
 */
export function loadTableFixture(optName: string): DiagramFixtures {
    const opts = loadFixtures<FixtureTableOptions[]>(optName);
    const absContainer = loadFixtures<HTMLDivElement>("abscontainer.html");
    const diagram = new Diagram();
    diagram.attach(absContainer.data);
    const df: DiagramFixtures = { cleanup: () => {
        diagram.detach();
        absContainer.reset!.call(absContainer);
    }, diagram, tables: []};
    opts.data.forEach((tbOpt) => {
        const fields = tbOpt.fields;
        delete tbOpt.fields;
        const table = diagram.table(tbOpt)!;
        fields.forEach((field) => { table.addField(field); });
        df.tables!.push({ opt: tbOpt, fields, table });
    });
    return df;
}

/**
 * Load all attribute from svg element into a object, represent element attribute.
 * @param ele svg element
 */
export function loadAttributeFrom(ele: Element, excludeAttr?: string[]) {
    const names = ele.getAttributeNames();
    const attr: { [index: string]: string | number | undefined | null | ViewBox } = {};
    names.forEach((name) => {
        if (!excludeAttr || excludeAttr.indexOf(name) >= 0) {
            if (name === "viewBox") {
                attr[name] = ParseViewBox(ele.getAttribute(name)!);
            } else {
                attr[name] = ele.getAttribute(name);
            }
        }
    });
    return attr;
}
