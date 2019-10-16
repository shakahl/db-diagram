import { Point } from "@db-diagram/elements/utils/types";
import { Diagram } from "@db-diagram/elements/diagram";

declare global {
    interface Element {
        /**
         * Check whether the element is render on top of other element.
         * @param other element to compare
         */
        isTopOf(other: Element): boolean

        /**
         * Get venn type against other element.
         * @param other element to compare
         */
        vennType(other: Element): VennType
    }
}

/**
 * Type of venn between 2 element.
 */
export enum VennType {
    Inside = 1,
    Overlap = 2,
    Outside = 3
}

Element.prototype.vennType = function (other: Element): VennType {
    const t = this.getBoundingClientRect();
    const f = other.getBoundingClientRect();
    if (t.left > f.right || t.right < f.left || t.top > f.bottom || t.bottom < f.top) {
        return VennType.Overlap;
    } else if (f.left <= t.left && t.right <= f.right && f.top <= t.top && t.bottom <= f.bottom) {
        return VennType.Inside;
    } else {
        return VennType.Outside;
    }
}

Element.prototype.isTopOf = function (other: Element): boolean {
    if (this.vennType(other) === VennType.Outside) return false;
    const t = this.getBoundingClientRect();
    const left = t.left + 1;
    const top = t.top + 1;
    const right = t.right - 1;
    const bottom = t.bottom - 1;
    return document.elementFromPoint(left, top) === this ||
        document.elementFromPoint(left, bottom) === this ||
        document.elementFromPoint(right, top) === this ||
        document.elementFromPoint(right, bottom) === this;
}

/**
 * 
 * @param svg 
 * @param box 
 * @param scale 
 * @param point 
 */
export function calculateBound(svg: SVGSVGElement, box: SVGRect | DOMRect | ClientRect, scale: number, point?: Point): DOMRect {
    if (!point) {
        const rootBox = svg.getBoundingClientRect();
        point = { x: rootBox.left + rootBox.width / 2, y: rootBox.top + rootBox.height / 2 };
    }
    let tp = svg.createSVGPoint();
    tp.x = point.x;
    tp.y = point.y;
    const svgPoint = tp.matrixTransform(svg.getScreenCTM()!.inverse());

    let m = svg.createSVGMatrix()
    m.e = box.left || (box as SVGRect).x || 0;
    m.f = box.top || (box as SVGRect).y || 0;

    const relativePoint = svgPoint.matrixTransform(m.inverse());
    const modifier = svg.createSVGMatrix()
        .translate(relativePoint.x, relativePoint.y)
        .scale(scale)
        .translate(-relativePoint.x, -relativePoint.y);

    m = m.multiply(modifier);
    return new DOMRect(m.e, m.f, box.width * m.a, box.width * m.d);
}

/**
 * 
 * @param p1 
 * @param p2 
 * @param scale 
 */
export function calculateFinalCoordinate(diagram: Diagram, origin: Point, p1: Point, p2: Point): Point {
    const m = (diagram as any).transformMatrix;

    const sp1 = diagram.toSvgCoordinate(p1), sp2 = diagram.toSvgCoordinate(p2);
    const dx = sp2.x - sp1.x, dy = sp2.y - sp1.y;

    const om = diagram.native.createSVGMatrix();
    om.e = origin.x, om.f = origin.y;
    const fm = om.multiply(m.inverse()).translate(dx, dy).multiply(m);

    return { x: Math.round(fm.e), y: Math.round(fm.f) };
}

/**
 * 
 * @param id 
 * @param parent 
 */
export function getElementCoordinate(diagram: Diagram, clazz: string, parent: SVGGElement): DOMRect | undefined {
    const ele = parent.querySelector(`.${clazz}`) as SVGGraphicsElement;
    if (!ele) return undefined;
    return calculateBound(diagram.native, ele.getBoundingClientRect(), 1);
}