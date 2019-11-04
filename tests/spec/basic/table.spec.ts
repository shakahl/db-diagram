import { DiagramFixtures, loadTableFixture } from "@db-diagram/tests/helpers/helper";
import { Fixture, loadFixtures } from "@db-diagram/tests/helpers/karma";
import { VennType } from "@db-diagram/tests/helpers/svg";

import { binary } from "@db-diagram/@gen/binary/types_generated";
import { Diagram } from "@db-diagram/elements/diagram";
import { TableGraph } from "@db-diagram/elements/table";
import { Field } from "@db-diagram/services/documents/field";
import { Table } from "@db-diagram/services/documents/table";
import { FieldCoordinate } from "@db-diagram/services/documents/types";
import { onDomReady, Visualization } from "@db-diagram/shares/elements";

let htmlFixture: Fixture<HTMLElement>;
let fields: Fixture<Field[]>;
const styles = Visualization.getInstance().getStylesDts();
const icons = Visualization.getInstance().getIconsDts();
let diagram: Diagram;
let tableData: DiagramFixtures;
const dbName = "sample";

/** */
const verifyField = (table: TableGraph, childCount: number, index: number, field: Field) => {
    const parent = table.native.querySelector("g.wrapped") as SVGGElement;
    const allChild = parent.querySelectorAll("g");
    expect(allChild.length).toEqual(childCount);

    expect(allChild[0].querySelectorAll("text").length).toEqual(2);

    let clazz = styles.fieldTextName;
    if (field.kind === binary.FieldKind.Primary) {
        clazz = styles.primary;
    } else if (field.kind === binary.FieldKind.Unique) {
        clazz = styles.unique;
    } else if (field.kind === binary.FieldKind.Foriegn) {
        clazz = styles.foreign;
    }

    if (clazz !== styles.fieldTextName) {
        const use = allChild[index].querySelector("use");
        expect(use).toBeTruthy();
        expect(use!.getAttribute("href")).toEqual(`#${icons.primaryKeyIcon}`);
    }

    const fieldName = allChild[index].querySelector(`text.${clazz}`);
    expect(fieldName).toBeTruthy();
    expect(fieldName!.textContent).toEqual(field.name);

    let typeRaw = `${binary.DataType[field.type].toUpperCase()}`;
    if (field.size && field.size > 0) {
        typeRaw += `(${field.size})`;
    }
    const fieldType = allChild[index].querySelector(`text.${styles.fieldTextType}`);
    expect(fieldType).toBeTruthy();
    expect(fieldType!.textContent).toEqual(typeRaw!);
};

// wait for dom to finish before starting test
beforeAll((done) => {
    onDomReady(done);
});

describe("Table", () => {

    beforeEach(() => {
        htmlFixture = loadFixtures("container.html");
        fields = loadFixtures("fields.json");
        diagram = new Diagram(dbName).attach(htmlFixture.data);
        diagram.native.style.zIndex = "1000";
        diagram.native.style.position = "absolute";
        diagram.native.style.left = diagram.native.style.top = "0";
        diagram.native.style.bottom = diagram.native.style.right = "0";
        tableData = loadTableFixture("table.json");
    });

    afterEach(() => {
        if (htmlFixture.reset) { htmlFixture.reset(); }
        if (fields.reset) { fields.reset(); }
        diagram.detach();
        tableData.cleanup();
    });

    it("Create", () => {
        const ntb: Table = { name: "Table1", database: dbName };
        const ntable = new TableGraph(diagram, ntb);
        expect(ntable.native).toBeTruthy();
        expect(ntable.name).toEqual(ntb.name);
        expect(ntable.native.childElementCount).toEqual(1);
        expect(ntable.native.children[0] instanceof SVGGElement).toEqual(true);
        expect(ntable.native.children[0].getAttribute("class")).toEqual("wrapped");
        expect(ntable.native.querySelectorAll("text").length).toEqual(1);

        const txtTitle = ntable.native.querySelector(`text.${styles.title}`);
        expect(txtTitle).toBeTruthy();
        expect(txtTitle!.textContent).toEqual(ntb.name);

        const pathIcon = ntable.native.querySelector(`use.${styles.tableIcon}`);
        expect(pathIcon).toBeTruthy();
        expect(pathIcon!.getAttribute("href")).toEqual(`#${icons.tableIcon}`);

        const pathHeader = ntable.native.querySelector(`path.${styles.header}`);
        expect(pathHeader).toBeTruthy();
        expect(pathHeader!.getAttribute("d")).toBeTruthy();

        const pathFooter = ntable.native.querySelector(`path.${styles.footer}`);
        expect(pathFooter).toBeTruthy();
        expect(pathFooter!.getAttribute("d")).toBeTruthy();

        expect(txtTitle!.vennType(pathHeader!)).toEqual(VennType.Inside);
        expect(pathIcon!.vennType(pathHeader!)).toEqual(VennType.Inside);
        expect(txtTitle!.isTopOf(pathHeader!)).toEqual(true);
    });

    it("Create with options", () => {
        const ntb: Table = { name: "New Table", engine: "InnoDB", database: dbName };
        const ntable = new TableGraph(diagram, ntb);
        expect(ntable.native).toBeTruthy();

        const txtChilds = ntable.native.querySelectorAll("text");
        expect(txtChilds.length).toEqual(2);
        expect(txtChilds[0].textContent).toEqual(ntb.name);
        expect(txtChilds[1].textContent).toEqual(ntb.engine!);

        const pathHeader = ntable.native.querySelector(`path.${styles.header}`);
        const pathFooter = ntable.native.querySelector(`path.${styles.footer}`);

        expect(txtChilds[0]!.vennType(pathHeader!)).toEqual(VennType.Inside);
        expect(txtChilds[1]!.vennType(pathFooter!)).toEqual(VennType.Inside);

        expect(txtChilds[0]!.isTopOf(pathHeader!)).toEqual(true);
        expect(txtChilds[1]!.isTopOf(pathFooter!)).toEqual(true);
    });

    it("Create field", () => {
        const ntable = new TableGraph(diagram, { name: "New Table", database: dbName });
        fields.data.forEach((opt, index) => {
            const fieldIndex = ntable.addField(opt);
            expect(fieldIndex).toEqual(index);
            verifyField(ntable, index + 1, index, opt);
        });
    });

    it("Remove field", () => {
        const tbOpt = tableData.tables![0].tableGraph;
        const table = tableData.tables![0].tableGraph;
        const tbFields = tableData.tables![0].fields;
        expect(table.removeField(0)).toEqual(tbFields[0]);
        const wrapped = table.native.querySelector("g.wrapped");
        expect(wrapped!.querySelectorAll("g").length).toEqual(tbFields.length - 1);

        // verify the exist field.
        tbFields.splice(0, 1);
        tbFields.forEach((opt, index) => {
            verifyField(table, tbFields.length, index, opt);
        });
    });

    it("Field Meta", () => {
        const table = tableData.tables![0].tableGraph;
        const tbFields = tableData.tables![0].fields;
        tbFields.forEach((field, index) => {
            expect(table.field(index)).toEqual(field);
            expect(table.fieldIndex(field)).toEqual(index);
        });
        expect(table.primaryField()).toEqual(tbFields[0]);
    });

    it("Field Coordination", () => {
        const table = tableData.tables![0].tableGraph;
        const wrapped = table.native.querySelector("g.wrapped");
        const allFieldChild = wrapped!.querySelectorAll("g");
        const tbBox = table.native.getBoundingClientRect();
        const svgBox = tableData.diagram.native.getBoundingClientRect();
        const verifyCoordinate = (fieldLoc: FieldCoordinate, tbfield: Element,
                                  pBox: DOMRect | ClientRect, diaBox: DOMRect | ClientRect) => {
            const box = tbfield.getBoundingClientRect();
            const yt = box.top - pBox.top;
            const yb = yt + box.height;
            expect(fieldLoc.left.x).toEqual(pBox.left - diaBox.left);
            expect(fieldLoc.left.y > yt).toEqual(true);
            expect(fieldLoc.left.y < yb).toEqual(true);
            expect(fieldLoc.right.x).toBeCloseTo(pBox.right - diaBox.left, 1);
            expect(fieldLoc.right.y > yt).toEqual(true);
            expect(fieldLoc.right.y < yb).toEqual(true);
        };
        fields.data.forEach((_, index) => {
            verifyCoordinate(table.fieldCoordinate(index), allFieldChild[index], tbBox, svgBox);
        });
        verifyCoordinate(table.primaryFieldCoordinate(), allFieldChild[0], tbBox, svgBox);

        const tableData2 = loadTableFixture("table1.json");
        const tbBox2 = tableData2.tables![0].tableGraph.native.getBoundingClientRect();
        const svgBox2 = tableData2.diagram.native.getBoundingClientRect();
        const primaryField = tableData2.tables![0].tableGraph.native.querySelector("g.wrapped")!
            .querySelectorAll("g")[4];
        verifyCoordinate(tableData2.tables![0].tableGraph.primaryFieldCoordinate(), primaryField, tbBox2, svgBox2);
        tableData2.cleanup();
    });

});
