import { DiagramFixtures, loadTableFixture } from "@db-diagram/tests/helpers/helper";
import { onDomReady } from "@db-diagram/shares/elements";
import { Preference } from "@db-diagram/preference/pref";
import { defaultTableSetting, defaultRelationshipSetting, ControlLocation, defaultDiagramSetting } from "@db-diagram/preference/defaults";


let inspectDiagram: DiagramFixtures;

// wait for dom to finish before starting test
beforeAll((done) => {
    onDomReady(done);
});

describe("Preference", () => {
    
    beforeEach(() => {
        inspectDiagram = loadTableFixture("table.json");
        window.localStorage.clear();
    });

    afterEach(() => {
        inspectDiagram.cleanup();
        window.localStorage.clear();
    });

    it("Table", () => {
        const key = (Preference as any).tableSettingKey;

        const item = window.localStorage.getItem(key);
        const defaultTable = inspectDiagram.diagram.preference.table;
        const defaultT = defaultTableSetting(inspectDiagram.diagram.visualization);
        expect(item).toBeFalsy();
        expect(defaultTable).toEqual(defaultT);

        const fakeFont = "ANY FONT Test";
        defaultTable.field!.fontName!.fontFamily = fakeFont;
        inspectDiagram.diagram.preference.table = defaultTable;
        const newTBS = inspectDiagram.diagram.preference.table;
        expect(window.localStorage.getItem(key)).toBeTruthy();
        expect(newTBS.field!.fontName!.fontFamily).toEqual(fakeFont);
        expect(newTBS).toEqual(defaultTable);
        expect(newTBS).not.toEqual(defaultT);
    });

    it("Relationship", () => {
        const key = (Preference as any).relationshipSettingKey;

        const item = window.localStorage.getItem(key);
        const defaultRelationship = inspectDiagram.diagram.preference.relationship;
        const defaultR = defaultRelationshipSetting(inspectDiagram.diagram.visualization);
        expect(item).toBeFalsy();
        expect(defaultRelationship).toEqual(defaultR);

        const dashArrayLine = "4 1 2";
        defaultRelationship.strongLineStyle!.strokeDasharray = dashArrayLine;
        inspectDiagram.diagram.preference.relationship = defaultRelationship;
        const newRLS = inspectDiagram.diagram.preference.relationship;
        expect(window.localStorage.getItem(key)).toBeTruthy();
        expect(newRLS.strongLineStyle!.strokeDasharray).toEqual(dashArrayLine);
        expect(newRLS).toEqual(defaultRelationship);
        expect(newRLS).not.toEqual(defaultR);
    });

    it("Diagram", () => {
        const key = (Preference as any).diagramSettingKey;

        const item = window.localStorage.getItem(key);
        const defaultDiagram = inspectDiagram.diagram.preference.diagram;
        const defaultD = defaultDiagramSetting(inspectDiagram.diagram.visualization);
        expect(item).toBeFalsy();
        expect(defaultDiagram).toEqual(defaultD);

        defaultDiagram.controlLocation = ControlLocation.TOP_LEFT;
        inspectDiagram.diagram.preference.diagram = defaultDiagram;
        const newDS = inspectDiagram.diagram.preference.diagram;
        expect(window.localStorage.getItem(key)).toBeTruthy();
        expect(newDS.controlLocation).toEqual(ControlLocation.TOP_LEFT);
        expect(newDS).toEqual(defaultDiagram);
        expect(newDS).not.toEqual(defaultD);
    });

});