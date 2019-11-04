import { DiagramFixtures, loadTableFixture } from "@db-diagram/tests/helpers/helper";
import { getElementCoordinate } from "@db-diagram/tests/helpers/svg";

import { Relation } from "@db-diagram/elements/relation";
import { TableGraph } from "@db-diagram/elements/table";
import { onDomReady, Visualization } from "@db-diagram/shares/elements";

const shareUI = Visualization.getInstance();
const icons = shareUI.getIconsDts();

let inspectDiagram: DiagramFixtures;

enum Side {
    MID_MANY_TOP_LEFT = 1,
    MID_MANY_TOP_RIGHT = 2,
    MID_MANY_BOTTOM_LEFT = 3,
    MID_MANY_BOTTOM_RIGHT = 4,
    OVERLAP_TOP = 5,
    OVERLAP_BOTTOM = 6,
}

const verifyCoordinate = (relation: Relation, primaryTb: TableGraph, foreignTb: TableGraph, side: Side) => {
    const primaryCoord = primaryTb.primaryFieldCoordinate();
    const foreignCoord = foreignTb.fieldCoordinate(foreignTb.fieldCount - 1);
    const box = relation.native.getBBox();
    const halfMany = shareUI.getIconsElementSize(icons.many).height / 2;
    const halfOne = shareUI.getIconsElementSize(icons.one).height / 2;

    switch (side) {
        case Side.MID_MANY_BOTTOM_RIGHT:
            expect(primaryCoord.right.x).toBeCloseTo(box.x);
            expect(primaryCoord.right.y).toBeCloseTo(box.y + halfOne);
            expect(foreignCoord.left.x).toBeCloseTo(box.x + box.width);
            expect(foreignCoord.left.y).toBeCloseTo(box.y + box.height - halfMany);
            break;

        case Side.MID_MANY_BOTTOM_LEFT:
            expect(primaryCoord.left.x).toBeCloseTo(box.x + box.width);
            expect(primaryCoord.left.y).toBeCloseTo(box.y + halfOne);
            expect(foreignCoord.right.x).toBeCloseTo(box.x);
            expect(foreignCoord.right.y).toBeCloseTo(box.y + box.height - halfMany);
            break;

        case Side.MID_MANY_TOP_LEFT:
            expect(primaryCoord.left.x).toBeCloseTo(box.x + box.width);
            expect(primaryCoord.left.y).toBeCloseTo(box.y + box.height - halfOne);
            expect(foreignCoord.right.x).toBeCloseTo(box.x);
            expect(foreignCoord.right.y).toBeCloseTo(box.y + halfMany);
            break;

        case Side.MID_MANY_TOP_RIGHT:
            expect(primaryCoord.right.x).toBeCloseTo(box.x);
            expect(primaryCoord.right.y).toBeCloseTo(box.y + box.height - halfOne);
            expect(foreignCoord.left.x).toBeCloseTo(box.x + box.width);
            expect(foreignCoord.left.y).toBeCloseTo(box.y + halfMany);
            break;

        case Side.OVERLAP_TOP:
        case Side.OVERLAP_BOTTOM:
            const oneBox = getElementCoordinate(inspectDiagram.diagram, icons.one, relation.native);
            const manyBox = getElementCoordinate(inspectDiagram.diagram, icons.many, relation.native);
            expect(oneBox).toBeTruthy();
            expect(manyBox).toBeTruthy();

            expect(primaryCoord.left.x).toBeCloseTo(oneBox!.x + oneBox!.width);
            expect(primaryCoord.left.y).toBeCloseTo(oneBox!.y + halfOne);
            expect(foreignCoord.left.x).toBeCloseTo(manyBox!.x + manyBox!.width);
            expect(foreignCoord.left.y).toBeCloseTo(manyBox!.y + halfMany);

            const width = Math.abs(primaryCoord.left.x - foreignCoord.left.x);
            const height = Math.abs(primaryCoord.left.y - foreignCoord.left.y) + halfMany + halfOne;
            expect(width).toBeLessThan(relation.native.getBBox().width);
            expect(height).toEqual(relation.native.getBBox().height);
            break;
    }
};

beforeAll((done) => {
    onDomReady(done);
});

describe("Relation Action", () => {

    beforeEach(() => {
        inspectDiagram = loadTableFixture("tables.json");
    });

    afterEach(() => {
        inspectDiagram.cleanup();
    });

    it("Coordinate", () => {
        const rs = [{
            ftb: inspectDiagram.tables![1].tableGraph,
            ptb: inspectDiagram.tables![0].tableGraph,
            useLine: true,
        }, {
            ftb: inspectDiagram.tables![1].tableGraph,
            ptb: inspectDiagram.tables![2].tableGraph,
            useLine: false,
        }];

        rs.forEach((it) => {
            inspectDiagram.diagram.preference.relationship.useStraightLine = it.useLine;
            const relation = new Relation(inspectDiagram.diagram, it.ptb, it.ftb);
            const primaryTable = it.ptb;
            const foreignTable = it.ftb;

            primaryTable.x(100).y(50);
            foreignTable.x(400).y(120);
            verifyCoordinate(relation, primaryTable, foreignTable, Side.MID_MANY_BOTTOM_RIGHT);

            primaryTable.x(300).y(20);
            foreignTable.x(50).y(220);
            verifyCoordinate(relation, primaryTable, foreignTable, Side.MID_MANY_BOTTOM_LEFT);

            primaryTable.x(300).y(320);
            foreignTable.x(50).y(120);
            verifyCoordinate(relation, primaryTable, foreignTable, Side.MID_MANY_TOP_LEFT);

            primaryTable.x(50).y(320);
            foreignTable.x(350).y(20);
            verifyCoordinate(relation, primaryTable, foreignTable, Side.MID_MANY_TOP_RIGHT);

            primaryTable.x(100).y(10);
            foreignTable.x(90).y(320);
            verifyCoordinate(relation, primaryTable, foreignTable, Side.OVERLAP_BOTTOM);

            primaryTable.x(90).y(410);
            foreignTable.x(120).y(20);
            verifyCoordinate(relation, primaryTable, foreignTable, Side.OVERLAP_TOP);
        });
    });

});
