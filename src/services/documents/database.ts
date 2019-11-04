import { Document } from "@db-diagram/@gen/document/types_generated";
import { Table } from "@db-diagram/services/documents/table";
import { Matrix } from "@db-diagram/services/documents/types";

export interface Database {

    // More comment see `resources/flatbuffer/document.fbs`
    id: string;
    name: string;
    engine?: string;
    type: Document.DatabaseType;
    tables?: Table[];
    matrix: Matrix;
    createdAt: number;
    lastUpdateAt: number;

}
