import { Database } from "@db-diagram/services/documents/database";
import { Field } from "@db-diagram/services/documents/field";
import { Table } from "@db-diagram/services/documents/table";
import { DataEvent, Relation } from "@db-diagram/services/documents/types";

/**
 * Command use to sent request to service worker.
 */
export enum Command {
    // get information about client
    META = 0,
    // request service worker to provide data of diagram or database.
    SHOW = 1,
    // request service worker to create data such as database, table ...etc.
    CREATE = 2,
    // request service worker to delete data such as database, table ...etc.
    DELETE = 3,
    // request service worker to udpate exit data such as database, table ...etc.
    UPDATE = 4,
    // force service worker to push data to the server.
    PUSH = 5,
    // force service worker to retrieve latest data from the server.
    SYNC = 6,
}

/**
 * Sub command represent action in the request.
 */
export enum SubCommand {
    // Default sub command reserve for client metadata information only.
    META = 0,
    // database data to be returned from or push to service worker.
    DATABASE = 1,
    // table data to be returned from or push to service worker.
    TABLE = 2,
    // field data to be returned from or push to service worker.
    FIELD = 3,
    // relation data to be returned from or push to service worker.
    RELATION = 4,
}

/**
 * Request data provide from client to service worker.
 */
export interface Request<T> {
    // command to request service worker.
    command: Command;
    // sub command to request service worker.
    subCommand: SubCommand;
    // data can be database, table or field.
    data?: T;
}

/**
 * Response data return from service worker.
 */
export interface Response<T> {
    // state if the request is success
    success: boolean;
    // data from the request
    data?: T;
    // the error encounter during the request
    error?: Error;
}

/**
 * Event map for client info.
 */
export interface EventMetadataMap {
    "client-info": ClientInfo;
}

/**
 * Event map for database type.
 */
export interface EventDatabaseMap {
    "create-database": Database;
    "drop-database": Database;
    "alter-database": Database;
    "alter-databases": Database[];
}

/**
 * Event map for table type.
 */
export interface EventTableMap {
    "create-table": Table;
    "drop-table": Table;
    "alter-table": Table;
    "alter-tables": Table[];
}

/**
 * Event map for field type.
 */
export interface EventFieldMap {
    "create-field": Field;
    "drop-field": Field;
    "alter-field": Field;
    "alter-fields": Field[];
}

/**
 * Event map for field type.
 */
export interface EventRelationMap {
    "create-relation": Relation;
    "drop-relation": Relation;
    "alter-relation": Relation;
    "alter-relations": Relation[];
}

/**
 * Merge all event map
 */
export interface AnyEventMap extends EventMetadataMap, EventDatabaseMap, EventTableMap,
    EventFieldMap, EventRelationMap { }

export type EventType = keyof AnyEventMap;

/**
 * Listener callback to receive data event from Service Worker.
 */
export type DataEventListener<T> = (event: DataEvent<T>) => void;

/**
 * Service work's client Information.
 */
export interface ClientInfo {
    readonly frameType: FrameType;
    readonly id: string;
    readonly type: ClientTypes;
    readonly url: string;
}

/**
 * Data an alias type to database model as well as service worker info.
 */
export type Data = Database | Database[] | Table | Table[] | Field | Field[] |
    Relation | Relation[] | Uint8Array | ClientInfo;
