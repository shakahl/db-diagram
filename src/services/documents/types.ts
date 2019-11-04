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
    ids: string[];
    key: string;
}

/**
 * Type alias which represent length type value in SVG space.
 */
export type LengthNumericType = number | LengthType;

/**
 * Type alias which represent length value in SVG space.
 */
export type LengthType = "string";

/**
 * Type represent size of the object.
 */
export interface Size { width: number; height: number; }

/**
 * Object represent field axis coordinate left and right relative SVG root coordinate.
 */
export interface FieldCoordinate {
   left: Point;
   right: Point;
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
    target: string;
    destination: string;
    weak?: boolean;
    reference?: boolean;
}

/**
 * An object define where the original field is.
 */
export interface ReferenceField {
    origin: string;
    source: string;
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
