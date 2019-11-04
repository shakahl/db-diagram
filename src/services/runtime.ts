import {
    AnyEventMap,
    Data,
    DataEventListener,
    EventType,
    Request,
} from "@db-diagram/services/command";
import { DataEvent } from "@db-diagram/services/documents/types";

export interface ServiceWorkerOptions {
    scope: string;
}

type ListDataEventListener<T> = Array<DataEventListener<T>>;

declare var __webpack_public_path__: string;

const scriptUrl: string = __webpack_public_path__ + "[[script-url]]";

export class DataServiceWorker {

    private static dsw?: DataServiceWorker;

    public static get instance(): DataServiceWorker {
        if (!this.dsw) {
            this.dsw = new DataServiceWorker();
        }
        return this.dsw!;
    }

    private serviceReg?: ServiceWorkerRegistration;
    private messageListener?: (evt: MessageEvent) => void;
    private eventListeners?: Map<EventType, ListDataEventListener<any>>;

    constructor() {
        if (!("serviceWorker" in navigator)) {
            throw new Error("ServiceWorker is not supported.");
        }
        window.addEventListener("unload", () => {
            this.unregister();
            if (this.messageListener) {
                navigator.serviceWorker.removeEventListener("message", this.messageListener!);
            }
        });
    }

    public register(options?: ServiceWorkerOptions): Promise<ServiceWorkerRegistration> {
        return navigator.serviceWorker.register(scriptUrl, options).then((swr) => {
            this.serviceReg = swr;
            navigator.serviceWorker.addEventListener("message",
                this.messageListener = (evt) => this.handleMessage(evt));
            return swr;
        });
    }

    public unregister() {
        if (this.serviceReg) {
            this.serviceReg.unregister();
            this.serviceReg = undefined;
        }
    }

    public addEventListener(type: EventType, listener: DataEventListener<AnyEventMap[EventType]>) {

        if (!this.eventListeners) {
            this.eventListeners = new Map();
        }
        let allListener = this.eventListeners.get(type);
        if (!allListener) {
            allListener = new Array();
            this.eventListeners.set(type, allListener);
        }
        allListener.push(listener);
    }

    public removeventListener(type: EventType, listener: DataEventListener<AnyEventMap[EventType]>) {

        if (!this.eventListeners) {
            return;
        }
        const allListener = this.eventListeners.get(type);
        if (!allListener) {
            return;
        }
        const index = allListener.indexOf(listener);
        if (index >= 0) {
            allListener.splice(index, 1);
        }
    }

    public post<T extends Data>(request: Request<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (event) => {
                if (event.data && event.data.error) {
                    reject(event.data.error);
                } else {
                    resolve(event.data);
                }
            };
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller!.postMessage(request,
                    [messageChannel.port2]);
            }
        });
    }

    private handleMessage(evt: MessageEvent) {
        const evtData = evt.data as DataEvent<Data>;
        if (this.eventListeners) {
            const batchListeners = this.eventListeners.get(evtData.type);
            if (batchListeners) {
                batchListeners.forEach((listener) => {
                    listener(evtData);
                });
            }
        }
    }

}
