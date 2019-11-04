import { DiagramFixtures, loadTableFixture } from "@db-diagram/tests/helpers/helper";

import { Relation } from "@db-diagram/elements/relation";
import { ReferenceField } from "@db-diagram/services/documents/types";
import { onDomReady, Visualization } from "@db-diagram/shares/elements";

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
        const ftb = inspectDiagram.tables![1].tableGraph;
        const ptb = inspectDiagram.tables![0].tableGraph;

        const relation1 = new Relation(inspectDiagram.diagram, ptb, ftb);
        const svgRoot = inspectDiagram.diagram.native;
        const gRelation1 = svgRoot.querySelector(`g.${styles.relation}`);
        expect(gRelation1).toEqual(relation1.native);
        expect(svgRoot.querySelectorAll(`g.${styles.relation}`).length).toEqual(1);

        const relation2 = new Relation(inspectDiagram.diagram, ptb, ftb);
        const gRelation2 = svgRoot.querySelector(`g.${styles.relation}`);
        expect(gRelation2).toEqual(relation2.native);
        expect(svgRoot.querySelectorAll(`g.${styles.relation}`).length).toEqual(2);

        expect(gRelation1!.querySelectorAll("path").length).toEqual(1);
        expect(gRelation1!.querySelectorAll("use").length).toEqual(2);

        const one = gRelation1!.querySelector(`use.${styles.one}`);
        expect(one).toBeTruthy();
        expect(one!.getAttribute("href")).toEqual(`#${icons.one}`);

        const many = gRelation1!.querySelector(`use.${styles.many}`);
        expect(many).toBeTruthy();
        expect(many!.getAttribute("href")).toEqual(`#${icons.many}`);

        const line = gRelation1!.querySelector(`path.${styles.line}`);
        expect(line).toBeTruthy();
        expect(line!.getAttribute("d")).toBeTruthy();
    });

    it("Visibility", () => {
        const ftb = inspectDiagram.tables![1].tableGraph;
        const ptb = inspectDiagram.tables![0].tableGraph;

        const relation = new Relation(inspectDiagram.diagram, ptb, ftb);
        expect(relation.native.getAttribute("visibility")).toBeNull();
        relation.visibility(false);
        expect(relation.native.getAttribute("visibility")).toEqual("hidden");
        relation.visibility(true);
        expect(relation.native.getAttribute("visibility")).toEqual("visible");
    });

    it("Options", () => {
        const ftb = inspectDiagram.tables![1].tableGraph;
        const ptb = inspectDiagram.tables![0].tableGraph;
        const pfield = ptb.primaryField();
        const field = {
            database: inspectDiagram.diagram.database,
            digit: pfield.digit,
            fpoint: pfield.fpoint,
            items: pfield.items,
            name: `${ptb.name}_id`,
            // origin and source should be fill in by data service worker.
            // in this test origin and source does not use in Relation class.
            reference: { origin: "--", source: "--", weak: true } as ReferenceField,
            size: pfield.size,
            table: ftb.name,
            type: pfield.type,
         };

        const relation = new Relation(inspectDiagram.diagram, ptb, ftb, field);
        const line = relation.native!.querySelector(`path.${styles.weak}`);
        expect(line).toBeTruthy();
        expect(line!.getAttribute("d")).toBeTruthy();
    });

});
