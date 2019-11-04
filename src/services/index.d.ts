import { AnyEventMap, Data, DataEventListener, Request } from "@db-diagram/services/command";

declare module "@db-diagram/services/data.service.worker" {

    export interface ServiceWorkerOptions {
        scope: string
    }

    export class DataServiceWorker {

        register(options?: ServiceWorkerOptions): Promise<ServiceWorkerRegistration>;

        addEventListener<K extends keyof AnyEventMap>(type: K, listener: DataEventListener<AnyEventMap[K]>): void;

        removeventListener<K extends keyof AnyEventMap>(type: K, listener: DataEventListener<AnyEventMap[K]>): void;

        post<T extends Data>(request: Request<T>): Promise<T>;

    }
}