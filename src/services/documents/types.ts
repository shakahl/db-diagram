import { EventType } from "@db-diagram/services/command";

/**
 * Matrix represent 2D transformation.
 */
export interface Matrix {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
}

/**
 * A group that contain a key and list of ids.
 */
export interface KeyGroup {
    ids: Uint8Array[];
    key: string;
}

/**
 * Coordinate of diagram.
 */
export interface Point {
    x: number;
    y: number;
}

/**
 * An object define where the field is being use. This is use with primary
 * to better know which table has been using this primary field.
 */
export interface UtilizedField {
    target: Uint8Array;
    destination: Uint8Array;
    weak?: boolean;
    reference?: boolean;
}

/**
 * An object define where the original field is.
 */
export interface ReferenceField {
    origin: Uint8Array;
    source: Uint8Array;
    weak?: boolean;
    reference?: boolean;
}

export type Relation = UtilizedField | ReferenceField;

/**
 * Event data exchange between service worker and client.
 */
export interface DataEvent<T> {
    // data present the origin of change.
    source?: any;
    // type of event
    type: EventType;
    // detail information about event
    detail: T;
}
