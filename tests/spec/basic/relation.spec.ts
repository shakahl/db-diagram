import { DiagramFixtures, loadTableFixture } from "@db-diagram/tests/helpers/helper";
import { Visualization, onDomReady } from "@db-diagram/shares/elements";
import { RelationshipOptions } from "@db-diagram/elements/utils/options";
import { Relation } from "@db-diagram/elements/relation";

// wait for dom to finish before starting test
beforeAll((done) => {
    onDomReady(done);
});

const styles = Visualization.getInstance().getStylesDts();
const icons = Visualization.getInstance().getIconsDts();
let inspectDiagram: DiagramFixtures;

describe("Relation", () => {

    beforeEach(() => {
        inspectDiagram = loadTableFixture("tables.json");
    });

    afterEach(() => {
        inspectDiagram.cleanup();
    });

    it("Create", () => {
        const relationOpt: RelationshipOptions = {
            primaryTable: inspectDiagram.tables![0].table,
            foreignTable: inspectDiagram.tables![1].table
        };
        const relation1 = new Relation(inspectDiagram.diagram, relationOpt);
        const svgRoot = inspectDiagram.diagram.native;
        const gRelation1 = svgRoot.querySelector(`g${styles.relation}`);
        expect(gRelation1).toEqual(relation1.native);
        expect(svgRoot.querySelectorAll(`g${styles.relation}`).length).toEqual(1);

        const relation2 = new Relation(inspectDiagram.diagram, relationOpt);
        const gRelation2 = svgRoot.querySelector(`g${styles.relation}`);
        expect(gRelation2).toEqual(relation2.native);
        expect(svgRoot.querySelectorAll(`g${styles.relation}`).length).toEqual(2);

        expect(gRelation1!.querySelectorAll("path").length).toEqual(1);
        expect(gRelation1!.querySelectorAll("use").length).toEqual(2);

        const one = gRelation1!.querySelector(`use${styles.one}`)
        expect(one).toBeTruthy();
        expect(one!.getAttribute("href")).toEqual(`#${icons.one}`);

        const many = gRelation1!.querySelector(`use${styles.many}`)
        expect(many).toBeTruthy();
        expect(many!.getAttribute("href")).toEqual(`#${icons.many}`);

        const line = gRelation1!.querySelector(`path${styles.line}`);
        expect(line).toBeTruthy();
        expect(line!.getAttribute("d")).toBeTruthy();
    });

    it("Visibility", () => {
        const relationOpt: RelationshipOptions = {
            primaryTable: inspectDiagram.tables![0].table,
            foreignTable: inspectDiagram.tables![1].table
        };
        const relation = new Relation(inspectDiagram.diagram, relationOpt);
        expect(relation.native.getAttribute("visibility")).toBeNull();
        relation.visibility(false);
        expect(relation.native.getAttribute("visibility")).toEqual("hidden");
        relation.visibility(true);
        expect(relation.native.getAttribute("visibility")).toEqual("visible");
    });

    it("Options", () => {
        const relationOpt: RelationshipOptions = {
            primaryTable: inspectDiagram.tables![0].table,
            foreignTable: inspectDiagram.tables![1].table,
            weak: true
        };
        const relation = new Relation(inspectDiagram.diagram, relationOpt);
        const line = relation.native!.querySelector(`path${styles.weak}`);
        expect(line).toBeTruthy();
        expect(line!.getAttribute("d")).toBeTruthy();
    });

});
