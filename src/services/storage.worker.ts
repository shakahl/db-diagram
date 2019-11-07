import { ServiceError } from "@db-diagram//services/common/error";
import { MD5 } from "@db-diagram//services/common/md5";
import { DatabaseWorker } from "@db-diagram/services/database.worker";
import { FieldWorker } from "@db-diagram/services/field.worker";
import { TableWorker } from "@db-diagram/services/table.worker";

import { Database } from "@db-diagram/services/documents/database";
import { Field } from "@db-diagram/services/documents/field";
import { Table } from "@db-diagram/services/documents/table";

declare var navigator: Navigator;
if (!navigator) { navigator = window.navigator; }

let isChrome = navigator.userAgent.indexOf("Chrome") > -1;
const isFirefox = navigator.userAgent.indexOf("Firefox") > -1;
let isSafari = navigator.userAgent.indexOf("Safari") > -1;
const isOpera = navigator.userAgent.toLowerCase().indexOf("op") > -1;
if ((isChrome) && (isSafari)) { isSafari = false; }
if ((isChrome) && (isOpera)) { isChrome = false; }

type StoreItem = Database | Table | Field;

// a store promise wrapper, useful to handle multiple promise
// in a transaction.
type Task = (store: IDBObjectStore) => any;

type QueryRange = string | number | Date | ArrayBufferView | ArrayBuffer | IDBArrayKey | IDBKeyRange | undefined;

/**
 * Index schema use to define indexeddb object store's index.
 */
export interface IndexedDBIndexSchema {
    name: string;
    keyPath: string | string[];
    options?: IDBIndexParameters;
}

/**
 * Database schema use to define indexeddb object store.
 */
export interface IndexedDBSchema {
    name: string;
    primary: IDBObjectStoreParameters;
    indexes: IndexedDBIndexSchema[];
}

/**
 * Enum represent failure type.
 */
export enum ExecStatus {
    // common status
    VALID = 0,
    SUCCESS = 1,
    FAILED = 2,
    ID_EXISTED = 3,
    ID_REQUIRED = 4,
    NAME_EXIST = 5,
    NAME_REQUIRED = 6,
    ITEM_NOT_FOUND = 7,

    // database status
    TYPE_REQUIRED = 100,

    // table status
    DATABASE_NAME_REQUIRED = 200,

    // field status
    DATA_TYPE_REQUIRED = 300,
    TYPE_SIZE_REQUIRED = 301,
    TYPE_ITEM_REQUIRED = 302,
    TABLE_NAME_REQUIRED = 303,
    FLOATING_POINT_REQUIRED = 304,
    FLOATING_DIGIT_REQUIRED = 305,
}

/**
 * Object represent response to the call for manipulating data.
 */
export interface ExecResult<T> {
    reason: ExecStatus;
    data?: T;
    detail?: string;
}

/**
 * Interface define a minimum implementation to be able to use storage worker class.
 */
export interface StorageDeclaration<T> {
    store: string;
    /**
     * Validate data properties. If the data is valid return `ExecStatus.Valid`.
     * @param data store item to be validated.
     */
    validate(data: T, insert?: boolean): { reason: ExecStatus, detail?: string };
}

/**
 * Indexeddb class helper to manage indexeddb schema as well as manipulating data.
 */
export class StorageWorker {

    public static readonly DB_NAME = "diagram-storage";
    public static readonly VERSION = 1;

    public static getInstance(): Promise<StorageWorker> {
        return new Promise<StorageWorker>((resolve, reject) => {
            if (!this.instance) {
                this.instance = new StorageWorker();
                this.instance.oq = indexedDB.open(StorageWorker.DB_NAME, StorageWorker.VERSION);
                this.instance.oq.onupgradeneeded = (evt) => this.instance!.upgrade(evt);
                this.instance.oq.onsuccess = () => {
                    this.instance!.db = this.instance!.oq!.result;
                    this.instance!.db.onclose = () => {
                        StorageWorker.instance = undefined;
                    };
                    resolve(this.instance);
                };
                this.instance.oq.onerror = () => reject(new ServiceError(this.instance!.oq!.error));
            } else {
                resolve(this.instance);
            }
        });
    }

    public static removeDatabse(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const request = indexedDB.deleteDatabase(this.DB_NAME);
            request.onerror = () => reject(new ServiceError(request.error));
            request.onsuccess = () => resolve(true);
        });
    }

    private static instance: StorageWorker | undefined;

    private static DataMessage = (store: string, data: StoreItem): string => {
        return `data type ${store} name: ${data.name} with id: ${data.id}`;
    }

    private oq?: IDBOpenDBRequest;
    private db?: IDBDatabase;
    private md5?: MD5;

    public close() {
        if (this.db) {
            this.db!.close();
            StorageWorker.instance = undefined;
        }
    }

    public insert<T extends StoreItem>(sdc: StorageDeclaration<T>, data: T): Promise<ExecResult<T>> {
        const status = sdc.validate(data, true);
        return (status.reason !== ExecStatus.VALID) ? Promise.resolve({
            detail: status.detail,
            reason: status.reason,
        }) : this.exec(sdc.store, (store: IDBObjectStore): IDBRequest => {
            data.id = this.getId(data.name, window.location.origin);
            return store.add(data);
        }).then((results) => {
            return results[1] ? { reason: ExecStatus.SUCCESS, data } : { reason: ExecStatus.ID_EXISTED };
        }).catch((reason: Error) => this.catchUniquenessError(data, reason));
    }

    public replace<T extends StoreItem>(sdc: StorageDeclaration<T>, data: T): Promise<ExecResult<T>> {
        const status = sdc.validate(data);
        return (status.reason !== ExecStatus.VALID) ? Promise.resolve({
            detail: status.detail,
            reason: status.reason,
        }) : this.exec(sdc.store, (store: IDBObjectStore): IDBRequest => {
            return store.put(data);
        }).then((results) => {
            return results[1] ? { reason: ExecStatus.SUCCESS, data } : { reason: ExecStatus.FAILED };
        }).catch((reason: Error) => this.catchUniquenessError(data, reason));
    }

    public delete<T extends StoreItem>(sdc: StorageDeclaration<T>,
                                       id: string, query?: boolean): Promise<ExecResult<T>> {

        if (!id) { return Promise.resolve({ reason: ExecStatus.ID_REQUIRED }); }
        const deleteItem = (data?: T): Promise<ExecResult<T>> => {
            return this.exec(sdc.store, (store) => store.delete(id)).then((rs) => {
                if (rs[1]) {
                    return { reason: ExecStatus.SUCCESS, data };
                } else {
                    return { reason: ExecStatus.FAILED };
                }
            });
        };
        if (query) {
            return this.exec(sdc.store, (store): IDBRequest => {
                return store.get(id);
            }).then((results) => {
                if (!results[0]) {
                    return Promise.resolve({ reason: ExecStatus.ITEM_NOT_FOUND });
                }
                return deleteItem(results[0]);
            });
        } else {
            return deleteItem(undefined);
        }
    }

    public queryAll<T extends StoreItem>(sdc: StorageDeclaration<T>,
                                         query?: QueryRange, count?: number): Promise<ExecResult<T[]>> {
        return new Promise((resolve, reject) => {
            const tran = this.db!.transaction(sdc.store, "readonly");
            const store = tran.objectStore(sdc.store);
            const dataRequest: IDBRequest<T[]> = store.getAll(query, count);
            dataRequest.onsuccess = () => {
                if (dataRequest.result && dataRequest.result.length > 0) {
                    resolve({ reason: ExecStatus.SUCCESS, data: dataRequest.result });
                } else {
                    resolve({ reason: ExecStatus.ITEM_NOT_FOUND });
                }
            };
            tran.onerror = () => reject(new ServiceError(tran.error || dataRequest.error));
        });
    }

    public queryById<T extends StoreItem>(sdc: StorageDeclaration<T>, id: string): Promise<ExecResult<T>> {
        return (!id) ? Promise.resolve({ reason: ExecStatus.ID_REQUIRED }) :
            new Promise((resolve, reject) => {
                const tran = this.db!.transaction(sdc.store, "readonly");
                const store = tran.objectStore(sdc.store);
                const dataRequest: IDBRequest<T> = store.get(id);
                dataRequest.onsuccess = () => {
                    if (dataRequest.result) {
                        resolve({ reason: ExecStatus.SUCCESS, data: dataRequest.result });
                    } else {
                        resolve({ reason: ExecStatus.ITEM_NOT_FOUND });
                    }
                };
                tran.onerror = () => reject(new ServiceError(tran.error || dataRequest.error));
            });
    }

    public queryAllByIndex<T extends StoreItem>(sdc: StorageDeclaration<T>,
                                                index: string, value: any): Promise<ExecResult<T[]>> {
        return new Promise((resolve, reject) => {
            const tran = this.db!.transaction(sdc.store, "readonly");
            const store = tran.objectStore(sdc.store);
            const dbIndex = store.index(index);
            // not sure, however query a single string value in array is not working.
            // however when every with multiple value does work. Chrome and Firefox
            // work just fine.
            if (isSafari && Array.isArray(value) && value.length === 1) {
                value = value[0];
            }
            const dataRequest: IDBRequest<T[]> = dbIndex.getAll(IDBKeyRange.only(value));
            dataRequest.onsuccess = () => {
                if (dataRequest.result && dataRequest.result.length > 0) {
                    resolve({ reason: ExecStatus.SUCCESS, data: dataRequest.result });
                } else {
                    resolve({ reason: ExecStatus.ITEM_NOT_FOUND });
                }
            };
            tran.onerror = () => reject(new ServiceError(tran.error || dataRequest.error));
        });
    }

    public count(sdc: StorageDeclaration<any>, query?: QueryRange,
                 index?: string): Promise<ExecResult<number>> {
        return new Promise((resolve, reject) => {
            const tran = this.db!.transaction(sdc.store, "readonly");
            const store = tran.objectStore(sdc.store);
            let idbRequest: IDBRequest;
            if (index) {
                idbRequest = store.index(index).count(query);
            } else {
                idbRequest = store.count(query);
            }
            idbRequest.onsuccess = () => resolve({ reason: ExecStatus.SUCCESS, data: idbRequest.result });
            tran.onerror = () => reject(new ServiceError(tran.error || idbRequest.error));
        });
    }

    private getId(sample: string, namespace: string = "", random: boolean = true): string {
        if (!this.md5) {
            this.md5 = new MD5();
        }
        sample += namespace;
        return this.md5!.sum(sample, random).base64();
    }

    // ************************ //
    // Promise wrapper section  //
    // ************************ //

    private async exec(name: string, ...tasks: Task[]): Promise<any[]> {
        const tran = this.db!.transaction(name, "readwrite");
        const store = tran.objectStore(name);
        const allPromiseTask: Array<Promise<any>> = [];
        tasks.forEach((task) => allPromiseTask.push(this.promiseObjectStore(store, task)));
        allPromiseTask.push(this.promiseTransaction(tran));
        return Promise.all(allPromiseTask);
    }

    private promiseObjectStore(store: IDBObjectStore, spw: Task): Promise<any> {
        return new Promise((resolve, reject) => {
            const iq = spw(store);
            iq.onerror = () => reject(new ServiceError(iq.error));
            iq.onsuccess = () => resolve(iq.result);
        });
    }

    private promiseTransaction(tran: IDBTransaction): Promise<boolean> {
        return new Promise((resolve, reject) => {
            tran.onerror = () => reject(new ServiceError(tran.error));
            tran.oncomplete = () => resolve(true);
        });
    }

    private catchUniquenessError<T extends StoreItem>(data: T, reason: ServiceError): Promise<ExecResult<T>> {
        // indexeddb dom exception is still in experiment at this point
        // check message with unique word consider unique constraint failed.

        // chrome did include unique word.
        let constrainError = (reason.message.includes("uniqueness") || reason.message.includes("unique"));
        // this is generic error as firefox and safari did not included anything related to unique word.
        constrainError = constrainError ||
            (reason.domException !== undefined && reason.domException!.name === "ConstraintError");

        if (constrainError) {
            return Promise.resolve({
                detail: `item name ${data.name} already existed.`,
                reason: ExecStatus.NAME_EXIST,
            } as ExecResult<T>);
        }
        throw reason;
    }

    // ************************ //
    // Upgrade Database section //
    // ************************ //

    private upgrade(_: IDBVersionChangeEvent) {
        this.upgradeBySchema(DatabaseWorker.schema);
        this.upgradeBySchema(TableWorker.schema);
        this.upgradeBySchema(FieldWorker.schema);
    }

    private upgradeBySchema(schema: IndexedDBSchema) {
        const db = (this.db! || this.oq!.result);
        const names = db.objectStoreNames;
        if (!names.contains(schema.name)) {
            const store = db.createObjectStore(schema.name, schema.primary);
            schema.indexes.forEach((index) => {
                store.createIndex(index.name, index.keyPath, index.options);
            });
        } else {
            const store = this.oq!.transaction!.objectStore(schema.name);
            const indexNames = [...store.indexNames];
            schema.indexes.forEach((index) => {
                const i = indexNames.indexOf(index.name);
                if (i === -1) {
                    store.createIndex(index.name, index.keyPath, index.options);
                } else {
                    indexNames.splice(i, 1);
                }
            });
            // remaining index consider dropped.
            indexNames.forEach((name) => {
                store.deleteIndex(name);
            });
        }
    }

}
