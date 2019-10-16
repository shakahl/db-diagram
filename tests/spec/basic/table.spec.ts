import { Fixture, loadFixtures } from "@db-diagram/tests/helpers/karma";
import { Diagram } from "@db-diagram/elements/diagram";
import { Table } from "@db-diagram/elements/table";
import { TableOptions, FieldOptions } from "@db-diagram/elements/utils/options";
import { Visualization, onDomReady } from "@db-diagram/shares/elements";
import { VennType } from "@db-diagram/tests/helpers/svg";
import { DiagramFixtures, loadTableFixture } from "@db-diagram/tests/helpers/helper";
import { FieldCoordinate } from "@db-diagram/elements/utils/types";

let htmlFixture: Fixture<HTMLElement>;
let fields: Fixture<FieldOptions[]>;
const styles = Visualization.getInstance().getStylesDts();
const icons = Visualization.getInstance().getIconsDts();
let diagram: Diagram;
let tableData: DiagramFixtures;

/** */
const verifyField = (table: Table, childCount: number, index: number, opt: FieldOptions) => {
    let parent = table.native.querySelector("g.wrapped") as SVGGElement;
    let allChild = parent.querySelectorAll("g");
    expect(allChild.length).toEqual(childCount);

    expect(allChild[0].querySelectorAll("text").length).toEqual(2);

    let clazz = styles.fieldTextName;
    if (opt.primary) clazz = styles.primary;
    else if (opt.unique) clazz = styles.unique;
    else if (opt.foreign) clazz = styles.foreign;

    if (clazz !== styles.fieldTextName) {
        const use = allChild[index].querySelector("use");
        expect(use).toBeTruthy();
        expect(use!.getAttribute("href")).toEqual(`#${icons.primaryKeyIcon}`);
    }

    const fieldName = allChild[index].querySelector(`text${clazz}`);
    expect(fieldName).toBeTruthy();
    expect(fieldName!.textContent).toEqual(opt.name);

    const fieldType = allChild[index].querySelector(`text${styles.fieldTextType}`);
    expect(fieldType).toBeTruthy();
    expect(fieldType!.textContent).toEqual(opt.typeRaw!);
};

// wait for dom to finish before starting test
beforeAll((done) => {
    onDomReady(done);
});

describe("Table", () => {

    beforeEach(() => {
        htmlFixture = loadFixtures("container.html");
        fields = loadFixtures("fields.json");
        diagram = new Diagram().attach(htmlFixture.data);
        diagram.native.style.zIndex = "1000";
        diagram.native.style.position = "absolute";
        diagram.native.style.left = diagram.native.style.top = "0";
        diagram.native.style.bottom = diagram.native.style.right = "0";
        tableData = loadTableFixture("table.json");
    });

    afterEach(() => {
        if (htmlFixture.reset) htmlFixture.reset();
        if (fields.reset) fields.reset();
        diagram.detach();
        tableData.cleanup();
    });

    it("Create", () => {
        let ntbOpt: TableOptions = { name: "Table1" };
        const ntable = new Table(diagram, ntbOpt);
        expect(ntable.native).toBeTruthy();
        expect(ntable.name).toEqual(ntbOpt.name);
        expect(ntable.native.childElementCount).toEqual(1);
        expect(ntable.native.children[0] instanceof SVGGElement).toEqual(true);
        expect(ntable.native.children[0].getAttribute("class")).toEqual("wrapped");
        expect(ntable.native.querySelectorAll("text").length).toEqual(1);

        const txtTitle = ntable.native.querySelector(`text${styles.title}`);
        expect(txtTitle).toBeTruthy();
        expect(txtTitle!.textContent).toEqual(ntbOpt.name);

        const pathIcon = ntable.native.querySelector(`use${styles.tableIcon}`);
        expect(pathIcon).toBeTruthy();
        expect(pathIcon!.getAttribute("href")).toEqual(`#${icons.tableIcon}`);

        const pathHeader = ntable.native.querySelector(`path${styles.header}`);
        expect(pathHeader).toBeTruthy();
        expect(pathHeader!.getAttribute("d")).toBeTruthy();

        const pathFooter = ntable.native.querySelector(`path${styles.footer}`);
        expect(pathFooter).toBeTruthy();
        expect(pathFooter!.getAttribute("d")).toBeTruthy();

        expect(txtTitle!.vennType(pathHeader!)).toEqual(VennType.Inside);
        expect(pathIcon!.vennType(pathHeader!)).toEqual(VennType.Inside);
        expect(txtTitle!.isTopOf(pathHeader!)).toEqual(true);
    });

    it("Create with options", () => {
        const ntbOpt = { name: "New Table", engine: "InnoDB" };
        const ntable = new Table(diagram, ntbOpt);
        expect(ntable.native).toBeTruthy();

        const txtChilds = ntable.native.querySelectorAll("text");
        expect(txtChilds.length).toEqual(2);
        expect(txtChilds[0].textContent).toEqual(ntbOpt.name);
        expect(txtChilds[1].textContent).toEqual(ntbOpt.engine!);

        const pathHeader = ntable.native.querySelector(`path${styles.header}`);
        const pathFooter = ntable.native.querySelector(`path${styles.footer}`);

        expect(txtChilds[0]!.vennType(pathHeader!)).toEqual(VennType.Inside);
        expect(txtChilds[1]!.vennType(pathFooter!)).toEqual(VennType.Inside);

        expect(txtChilds[0]!.isTopOf(pathHeader!)).toEqual(true);
        expect(txtChilds[1]!.isTopOf(pathFooter!)).toEqual(true);
    });

    it("Create field", () => {
        const ntable = new Table(diagram, { name: "New Table" });
        fields.data.forEach((opt, index) => {
            let fieldIndex = ntable.addField(opt);
            expect(fieldIndex).toEqual(index);
            verifyField(ntable, index + 1, index, opt);
        });
    });

    it("Remove field", () => {
        const tbOpt = tableData.tables![0].opt;
        const table = tableData.tables![0].table;
        const fields = tableData.tables![0].fields;
        expect(table.removeField(0)).toEqual(fields[0]);
        const wrapped = table.native.querySelector("g.wrapped");
        expect(wrapped!.querySelectorAll("g").length).toEqual(fields.length - 1);

        const tbmeta = table.metadata();
        expect(tbmeta.name).toEqual(tbOpt.name);
        expect(tbmeta.engine).toEqual(tbOpt.engine);
        expect(tbmeta.additional).toEqual(tbOpt.additional);
        expect(tbmeta.fields).toBeTruthy();
        expect(tbmeta.fields!.length).toEqual(fields.length - 1);
        // verify the exist field.
        fields.splice(0, 1);
        fields.forEach((opt, index) => {
            verifyField(table, fields.length, index, opt);
        });
    });

    it("Field Meta", () => {
        const table = tableData.tables![0].table;
        const fields = tableData.tables![0].fields;
        fields.forEach((field, index) => {
            expect(table.field(index)).toEqual(field);
            expect(table.fieldIndex(field)).toEqual(index);
        });
        expect(table.primaryField()).toEqual(fields[0]);
    });

    it("Field Coordination", () => {
        const table = tableData.tables![0].table;
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
        const tbBox2 = tableData2.tables![0].table.native.getBoundingClientRect();
        const svgBox2 = tableData2.diagram.native.getBoundingClientRect();
        const primaryField = tableData2.tables![0].table.native.querySelector("g.wrapped")!.querySelectorAll("g")[4];
        verifyCoordinate(tableData2.tables![0].table.primaryFieldCoordinate(), primaryField, tbBox2, svgBox2);
        tableData2.cleanup();
    });

});