import { EventSimulation } from "@db-diagram/tests/helpers/events";
import { DiagramFixtures, loadTableFixture } from "@db-diagram/tests/helpers/helper";
import { calculateBound } from "@db-diagram/tests/helpers/svg";

import { Pointer } from "@db-diagram/elements/pointer";
import { Point, Size } from "@db-diagram/services/documents/types";
import { onDomReady } from "@db-diagram/shares/elements";

beforeAll((done) => {
    onDomReady(done);
});

let inspectDiagram: DiagramFixtures;

describe("Diagram Action", () => {

    beforeEach(() => {
        inspectDiagram = loadTableFixture("tables.json");
    });

    afterEach(() => {
        inspectDiagram.cleanup();
    });

    it("pannable", () => {
        expect(inspectDiagram.diagram.isPannable()).toEqual(true);
        expect((inspectDiagram.diagram as any).dragRegistered).toEqual(true);

        spyOn(inspectDiagram.diagram.native, "removeEventListener");

        inspectDiagram.diagram.pannable(false);
        expect(inspectDiagram.diagram.isPannable()).toEqual(false);
        expect((inspectDiagram.diagram as any).dragRegistered).toEqual(false);
        expect(inspectDiagram.diagram.native.removeEventListener).toHaveBeenCalled();
        expect(inspectDiagram.diagram.native.removeEventListener)
            .toHaveBeenCalledWith("pointercancel", (Pointer as any).onPointerAbort);

        spyOn(inspectDiagram.diagram.native, "addEventListener");

        inspectDiagram.diagram.pannable(true);
        expect(inspectDiagram.diagram.isPannable()).toEqual(true);
        expect((inspectDiagram.diagram as any).dragRegistered).toEqual(true);
        expect(inspectDiagram.diagram.native.addEventListener).toHaveBeenCalled();
        expect(inspectDiagram.diagram.native.addEventListener)
            .toHaveBeenCalledWith("pointercancel", (Pointer as any).onPointerAbort);
    });

    it("zoomable", () => {
        expect(inspectDiagram.diagram.isZoomable()).toEqual(true);

        spyOn(inspectDiagram.diagram.native, "removeEventListener");

        const attachedListener = (inspectDiagram.diagram as any).zoomListener.listener;
        inspectDiagram.diagram.zoomable(false);

        expect(inspectDiagram.diagram.isZoomable()).toEqual(false);
        expect(inspectDiagram.diagram.native.removeEventListener).toHaveBeenCalled();
        expect(inspectDiagram.diagram.native.removeEventListener)
            .toHaveBeenCalledWith("wheel", attachedListener);

        spyOn(inspectDiagram.diagram.native, "addEventListener");

        inspectDiagram.diagram.zoomable(true);
        expect(inspectDiagram.diagram.isZoomable()).toEqual(true);
        expect(inspectDiagram.diagram.native.addEventListener).toHaveBeenCalled();
        expect(inspectDiagram.diagram.native.addEventListener)
            .toHaveBeenCalledWith("wheel", (inspectDiagram.diagram as any).zoomListener.listener);
    });

    it("Pan", async () => {
        const diaBox = inspectDiagram.diagram.holder.getBBox();
        expect(inspectDiagram.diagram.isPannable()).toBeTruthy();
        const verifyPos = async (p1: Point, p2: Point, expected: Point, diaSize: Size) => {
            await EventSimulation.move(inspectDiagram.diagram.native, window, p1, p2);
            const matrix = (inspectDiagram.diagram as any).transformMatrix as DOMMatrix;
            expect(matrix).toBeTruthy();
            expect(matrix.e).toEqual(expected.x);
            expect(matrix.f).toEqual(expected.y);
            expect(matrix.a).toEqual(1);
            expect(matrix.d).toEqual(1);

            const box = inspectDiagram.diagram.holder.getBBox();
            expect(box.width).toEqual(diaSize.width);
            expect(box.height).toEqual(diaSize.height);
        };
        const size = { width: diaBox.width, height: diaBox.height };
        await verifyPos({ x: 0, y: 0 }, { x: -100, y: 0 }, { x: -100, y: 0 }, size);
        await verifyPos({ x: 0, y: 0 }, { x: -100, y: -100 }, { x: -200, y: -100 }, size);
        await verifyPos({ x: 0, y: 0 }, { x: 140, y: 150 }, { x: -60, y: 50 }, size);

        inspectDiagram.diagram.pannable(false);
        await verifyPos({ x: 0, y: 0 }, { x: -110, y: 181 }, { x: -60, y: 50 }, size);
        await verifyPos({ x: 0, y: 0 }, { x: 210, y: -381 }, { x: -60, y: 50 }, size);

        inspectDiagram.diagram.pannable(true);
        await verifyPos({ x: 10, y: 10 }, { x: 20, y: 72 }, { x: -50, y: 112 }, size);
    });

    it("Set Zoom", async () => {
        const diaBox = inspectDiagram.diagram.holder.getBoundingClientRect();
        expect(inspectDiagram.diagram.isZoomable()).toBeTruthy();
        expect(inspectDiagram.diagram.zoom).toEqual(1);

        const verifyZoom = async (zoomLvl: number, ebox: DOMRect) => {
            expect(inspectDiagram.diagram.zoom).toBeCloseTo(zoomLvl);
            const box = inspectDiagram.diagram.holder.getBoundingClientRect();
            expect(box).toEqual(ebox);
        };

        // check invoking
        const spy = spyOn(inspectDiagram.diagram, "setZoom").and.callThrough();
        inspectDiagram.diagram.zoom += 1;
        expect(inspectDiagram.diagram.setZoom).toHaveBeenCalled();
        expect(inspectDiagram.diagram.setZoom).toHaveBeenCalledWith(2);
        verifyZoom(2, calculateBound(inspectDiagram.diagram.native, diaBox, 2));

        for (const v of [1.5, 2.2, 4, 1.2]) {
            const zoomPoint = { x: diaBox.left + Math.random() * 20, y: diaBox.top + Math.random() * 40 };
            inspectDiagram.diagram.setZoom(v, zoomPoint);
            expect(inspectDiagram.diagram.setZoom).toHaveBeenCalled();
            expect(inspectDiagram.diagram.setZoom).toHaveBeenCalledWith(v, zoomPoint);
            verifyZoom(v, calculateBound(inspectDiagram.diagram.native, diaBox, v, zoomPoint));
        }
    });

    it("Pin zoom", async () => {
        const diaBox = inspectDiagram.diagram.holder.getBBox();
        expect(inspectDiagram.diagram.isZoomable()).toBeTruthy();
        const verifyZoom = async (startZoom: number, endZoom: number, ebox: DOMRect, point: Point) => {
            await EventSimulation.wheel(inspectDiagram.diagram.native, startZoom, endZoom, point);
            expect(inspectDiagram.diagram.zoom).toBeCloseTo(endZoom);
            const box = inspectDiagram.diagram.holder.getBoundingClientRect();
            expect(box).toEqual(ebox);
        };

        let prevZoom = 1;
        for (const v of [1.5, 2.1, 1.7, 3.2, 4.4, 1]) {
            const zoomPoint = { x: diaBox.x + Math.random() * 20, y: diaBox.y + Math.random() * 40 };
            verifyZoom(prevZoom, v, calculateBound(inspectDiagram.diagram.native, diaBox, v, zoomPoint), zoomPoint);
            prevZoom = v;
        }
    });

});
