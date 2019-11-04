import { Document } from "@db-diagram/@gen/document/types_generated";
import { ReferenceField, UtilizedField } from "@db-diagram/services/documents/types";

export interface Field {

    // More comment see `resources/flatbuffer/document.fbs`
    id: string;
    name: string;
    type: Document.DataType;
    size?: number;
    digit?: number;
    fpoint?: number;
    items?: string[];
    kind: Document.FieldKind;
    key: boolean;
    utilizeds?: UtilizedField[];
    reference?: ReferenceField;
    order: number;
    createdAt: number;
    lastUpdateAt: number;

    // use for unique index only.
    database: string;
    table: string;
}
