import { Point } from "@db-diagram/elements/utils/types";

interface EventCallback {
    progress: (fragtion: number) => boolean;
    done: () => void;
}

/**
 *
 */
export class EventSimulation {

    public static click(ele: SVGElement | Window, p: Point): Promise<boolean> {
        return new Promise((resolve) => {
            this.firePointerEvent(ele, "pointerdown", p.x, p.y, { buttons: 1, button: 0 });
            setTimeout(() => {
                this.firePointerEvent(ele, "pointerup", p.x, p.y, { buttons: 1, button: 0 });
                resolve(true);
            }, 20);
        });
    }

    public static move(ele: SVGElement, moveEle: SVGElement | Window, p1: Point, p2: Point): Promise<boolean> {
        return new Promise((resolve) => {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            this.firePointerEvent(ele, "pointerdown", p1.x, p1.y);
            const es = new EventSimulation(100, {
                done: () => {
                    this.firePointerEvent(ele, "pointerup", p2.x, p2.y);
                    resolve(true);
                },
                progress: (frag: number) => {
                    this.firePointerEvent(moveEle, "pointermove", p1.x + (dx * frag), p1.y + (dy * frag));
                    return false;
                },
            });
            es.start();
        });
    }

    public static wheel(ele: SVGElement, startZoom: number, endZoom: number, point: Point): Promise<boolean> {
        return new Promise((resolve) => {
            const delta = endZoom > startZoom ? -0.28 : 0.28;
            const numOfEvt = Math.abs(endZoom - startZoom / delta);
            let count = 0;
            const firstEvent = () => {
                const wheelEvt = new WheelEvent("wheel", {
                    bubbles: true,
                    cancelable: true,
                    clientX: point.x,
                    clientY: point.y,
                    ctrlKey: true,
                    deltaX: 0.0,
                    deltaY: delta,
                });
                count += 1;
                if (count < numOfEvt) {
                    ele.dispatchEvent(wheelEvt);
                } else {
                    resolve(true);
                }
            };
            setTimeout(firstEvent, 10);
        });
    }

    private static firePointerEvent(ele: SVGElement | Window,
                                    name: string, x: number, y: number,
                                    additionEvent: PointerEventInit = {}): PointerEvent {
        const evt = new PointerEvent(name, Object.assign(additionEvent, {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
        }));
        ele.dispatchEvent(evt);
        return evt;
    }

    private startTime?: number;
    private duration: number;
    private callback: EventCallback;

    constructor(duration: number, callback: EventCallback) {
        this.duration = duration;
        this.callback = callback;
    }

    private start() {
        window.requestAnimationFrame(this.step.bind(this));
    }

    private step(t: number) {
        if (!this.startTime) { this.startTime = t; }
        const spent = t - this.startTime!;
        if (this.callback.progress(Math.min(spent / this.duration, 1)) || spent < this.duration) {
            window.requestAnimationFrame(this.step.bind(this));
        } else {
            this.callback.done();
        }
    }

}
