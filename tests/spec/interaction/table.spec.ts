import { EventSimulation } from "@db-diagram/tests/helpers/events";
import { DiagramFixtures, loadTableFixture } from "@db-diagram/tests/helpers/helper";
import { calculateFinalCoordinate } from "@db-diagram/tests/helpers/svg";

import { TableGraph } from "@db-diagram/elements/table";
import { Point, Size } from "@db-diagram/services/documents/types";
import { onDomReady, Visualization } from "@db-diagram/shares/elements";

const styles = Visualization.getInstance().getStylesDts();
let inspectDiagram: DiagramFixtures;

const hasSelected = (table: TableGraph) => {
    return table.native.hasAttribute("class") &&
        table.native.getAttribute("class")!.includes(styles.selected);
};

beforeAll((done) => {
    onDomReady(done);
});

describe("Table Action", () => {

    beforeEach(() => {
        inspectDiagram = loadTableFixture("tables.json");
    });

    afterEach(() => {
        inspectDiagram.cleanup();
    });

    it("Selection", async () => {
        inspectDiagram.tables[0].tableGraph.x(200).y(20);
        inspectDiagram.tables[1].tableGraph.x(100).y(350);

        const table = inspectDiagram.tables[0].tableGraph;
        expect(hasSelected(table)).toEqual(false);
        const box = table.native.getBoundingClientRect();
        // check if selection class is added
        await EventSimulation.click(table.native, { x: box.left + 15, y: box.top + 15 });
        expect(hasSelected(table)).toEqual(true);

        await EventSimulation.move(inspectDiagram.diagram.native, window, { x: 10, y: 10 }, { x: 40, y: 100 });
        expect(hasSelected(table)).toEqual(true);

        // check if selection class is removed
        await EventSimulation.click(
            inspectDiagram.diagram.native,
            { x: box.left + box.width + 10, y: box.top + box.height + 10 });
        expect(hasSelected(table)).toEqual(false);
    }, 1000);

    it("Move", async () => {
        const table = inspectDiagram.tables[0].tableGraph;
        expect(table.isDraggable()).toEqual(true);
        const tableBox = table.native.getBBox();

        const verifyPos = async (t: TableGraph, moveP1: Point, moveP2: Point, expected: Point, tbSize: Size) => {
            await EventSimulation.move(t.native, t.native, moveP1, moveP2);
            const matrix = (t as any).transformMatrix as DOMMatrix;
            expect(matrix).toBeTruthy();
            expect(matrix.e).toEqual(expected.x);
            expect(matrix.f).toEqual(expected.y);
            expect(matrix.a).toEqual(1);
            expect(matrix.d).toEqual(1);

            const tbBox = t.native.getBBox();
            expect(tbBox.width).toEqual(tbSize.width);
            expect(tbBox.height).toEqual(tbSize.height);
        };
        const size = { width: tableBox.width, height: tableBox.height };
        await verifyPos(table, { x: 10, y: 10 }, { x: 100, y: 10 }, { x: 90, y: 0 }, size);
        await verifyPos(table, { x: 100, y: 10 }, { x: 20, y: 30 }, { x: 10, y: 20 }, size);

        const box = table.native.getBoundingClientRect();
        await EventSimulation.click(table.native, { x: box.left + 10, y: box.top + 10 });
        await verifyPos(table, { x: 10, y: 30 }, { x: 0, y: 30 }, { x: 0, y: 20 }, size);
        expect(hasSelected(table)).toEqual(true);

        table.draggable(false);
        await verifyPos(table, { x: 10, y: 30 }, { x: 100, y: 130 }, { x: 0, y: 20 }, size);

        const table1 = inspectDiagram.tables[1].tableGraph;
        const tableBox1 = table1.native.getBBox();
        const size1 = { width: tableBox1.width, height: tableBox1.height };
        await verifyPos(table1, { x: 10, y: 10 }, { x: 210, y: 50 }, { x: 200, y: 40 }, size1);

        // zoom in
        inspectDiagram.diagram.zoom = 1.5;
        let p1 = { x: 210, y: 50 };
        let p2 = { x: 210, y: 110 };
        let fp = calculateFinalCoordinate(inspectDiagram.diagram, { x: 200, y: 40 }, p1, p2);
        await verifyPos(table1, p1, p2, fp, size1);

        await EventSimulation.move(inspectDiagram.diagram.native, window, { x: 10, y: 10 }, { x: 40, y: 100 });
        let tb1Box = table1.native.getBoundingClientRect();
        p1 = { x: tb1Box.left + 10, y: tb1Box.top + 10 };
        p2 = { x: tb1Box.left + 100, y: tb1Box.top - 50 };
        fp = calculateFinalCoordinate(inspectDiagram.diagram, fp, p1, p2);
        await verifyPos(table1, p1, p2, fp, size1);
        expect(table1.x(true)).toEqual(fp.x);
        expect(table1.y(true)).toEqual(fp.y);

        // check selection while moving
        tb1Box = table1.native.getBoundingClientRect();
        await EventSimulation.click(table1.native, { x: tb1Box.left + 10, y: tb1Box.top + 10 });
        expect(hasSelected(table1)).toEqual(true);

        tb1Box = table1.native.getBoundingClientRect();
        p1 = { x: tb1Box.left + 10, y: tb1Box.top + 10 };
        p2 = { x: tb1Box.left + 100, y: tb1Box.top - 50 };
        fp = calculateFinalCoordinate(inspectDiagram.diagram, fp, p1, p2);
        await verifyPos(table1, p1, p2, fp, size1);
        expect(table1.x(true)).toEqual(fp.x);
        expect(table1.y(true)).toEqual(fp.y);
    }, 10000);

    it("Coordinate", () => {
        const table = inspectDiagram.tables[0].tableGraph;
        const oriBound = table.native.getBoundingClientRect();
        table.x(100).y(80);
        expect(table.x()).toEqual(100);
        expect(table.y()).toEqual(80);
        const newBound = table.native.getBoundingClientRect();
        expect(newBound.left - oriBound.left).toEqual(100);
        expect(newBound.top - oriBound.top).toEqual(80);
        const svgPoint = inspectDiagram.diagram.toSvgCoordinate({ x: 100, y: 80 });
        expect(table.x(true)).toEqual(svgPoint.x);
        expect(table.y(true)).toEqual(svgPoint.y);

        const box = table.box();
        expect(box.x).toEqual(svgPoint.x);
        expect(box.y).toEqual(svgPoint.y);
    });

});
