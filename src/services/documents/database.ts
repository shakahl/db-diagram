import { binary } from "@db-diagram/@gen/binary/types_generated";
import { Table } from "@db-diagram/services/documents/table";
import { Matrix } from "@db-diagram/services/documents/types";

export interface Database {

    // More comment see `resources/flatbuffer/document.fbs`
    id?: string;
    name: string;
    engine?: string;
    type: binary.DatabaseType;
    tables?: Table[];
    matrix?: Matrix;
    createdAt?: number;
    lastUpdateAt?: number;

}
