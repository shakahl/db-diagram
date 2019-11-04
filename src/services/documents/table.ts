import { Field } from "@db-diagram/services/documents/field";
import { KeyGroup, Point } from "@db-diagram/services/documents/types";

export interface Table {

    // More comment see `resources/flatbuffer/document.fbs`
    id: string;
    name: string;
    fields?: Field[];
    primaries?: string[];
    uniques?: KeyGroup[];
    foriegns?: KeyGroup[];
    position: Point;
    createdAt: number;
    lastUpdateAt: number;

    // use for unique index only.
    database: string;
}
