import "@db-diagram/@extensions/strings";
import { Diagram } from "@db-diagram/elements/diagram";
import { TableGraph } from "@db-diagram/elements/table";
import { ParseViewBox, ViewBox } from "@db-diagram/elements/utils/attributes";
import { Field } from "@db-diagram/services/documents/field";
import { Table } from "@db-diagram/services/documents/table";
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
    tables: Array<{ table: Table, fields: Field[], tableGraph: TableGraph }>;
    cleanup: () => void;
}

/** */
interface FixtureTable extends Table {
    fields: Field[];
}

/**
 *
 */
export function loadTableFixture(tableName: string): DiagramFixtures {
    const tbs = loadFixtures<FixtureTable[]>(tableName);
    const absContainer = loadFixtures<HTMLDivElement>("abscontainer.html");
    const diagram = new Diagram("sample");
    diagram.attach(absContainer.data);
    const df: DiagramFixtures = { cleanup: () => {
        diagram.detach();
        absContainer.reset!.call(absContainer);
    }, diagram, tables: []};
    tbs.data.forEach((tb) => {
        const fields = tb.fields;
        delete tb.fields;
        const tableGraph = diagram.table(tb)!;
        fields.forEach((field) => { tableGraph.addField(field); });
        df.tables.push({ fields, table: tb, tableGraph });
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
