
/**
 * Type of zoom event callback
 */
export enum PanZoomEventType {
    onPanZoomBegin = "panzoon.start",
    onPanZoomMove = "panzoon.move",
    onPanZoomEnd = "panzoon.end",
}

/**
 * Wheel event data
 */
export interface WheelData {
    clientX: number;
    clientY: number;
    deltaX: number;
    deltaY: number;
    deltaZ: number;
    deltaMode: number;
}

/**
 * Helper class to handle pin zoom on wheel event.
 */
export class ZoomEventListener {

    private listener?: (evt: WheelEvent) => void;
    private move?: boolean;
    private panPoint: number = 0;

    private ele: SVGElement;

    constructor(ele: SVGElement) {
        this.ele = ele;
    }

    /**
     * Register wheel event.
     */
    public register() {
        this.ele.addEventListener("wheel", this.listener = (evt: WheelEvent) => {
            if (!evt.ctrlKey) { return; }

            evt.preventDefault();
            evt.stopPropagation();

            this.onWheel(evt);
        });
    }

    /**
     * Unregister wheel event.
     */
    public unregister() {
        if (this.listener) {
            this.ele.removeEventListener("wheel", this.listener!);
            this.listener = undefined;
            this.panPoint = 0;
            this.move = undefined;
        }
    }

    /**
     * Handle wheel event.
     * @param evt wheel event.
     */
    private onWheel(evt: WheelEvent) {
        if (!this.move) {
            this.move = true;
            this.panPoint = 0;
            this.ele.dispatchEvent(this.newEvent(PanZoomEventType.onPanZoomBegin, evt));
        } else {
            this.panPoint += 1;
            this.checkDone(this.panPoint);
            this.ele.dispatchEvent(this.newEvent(PanZoomEventType.onPanZoomMove, evt));
        }
    }

    /** verifiy if wheel event end */
    private checkDone(pp: number) {
        setTimeout(() => {
            if (pp === this.panPoint) {
                this.panPoint = 0;
                this.move = undefined;
                this.ele.dispatchEvent(this.newEvent(PanZoomEventType.onPanZoomEnd));
            }
        }, 100);
    }

    /** create new custom wheel event data */
    private newEvent(type: PanZoomEventType, evt?: WheelEvent): CustomEvent {
        return new CustomEvent(type, {
            bubbles: true,
            cancelable: true,
            detail: evt ? {
                clientX: evt.clientX,
                clientY: evt.clientY,
                deltaMode: evt.deltaMode,
                deltaX: evt.deltaX,
                deltaY: evt.deltaY,
                deltaZ: evt.deltaZ,
            } as WheelData : undefined,
        });
    }

}
