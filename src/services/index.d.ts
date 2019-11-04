import { AnyEventMap, Data, DataEventListener, Request } from "@db-diagram/services/command";

declare module "@db-diagram/services/data.service.worker" {

    export interface ServiceWorkerOptions {
        scope: string;
    }

    export class DataServiceWorker {

        public static instance: DataServiceWorker;

        public register(options?: ServiceWorkerOptions): Promise<ServiceWorkerRegistration>;

        public addEventListener<K extends keyof AnyEventMap>(type: K,
                                                             listener: DataEventListener<AnyEventMap[K]>): void;

        public removeventListener<K extends keyof AnyEventMap>(type: K,
                                                               listener: DataEventListener<AnyEventMap[K]>): void;

        public post<T extends Data>(request: Request<T>): Promise<T>;

    }
}
