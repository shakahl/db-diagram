import { Table } from "@db-diagram/services/documents/table";
import {
    ExecResult,
    ExecStatus,
    IndexedDBSchema,
    StorageDeclaration,
    StorageWorker,
} from "@db-diagram/services/storage.worker";

export class TableWorker implements StorageDeclaration<Table> {

    public static get schema(): IndexedDBSchema {
        return {
            indexes: [
                {
                    keyPath: ["database"],
                    name: TableWorker.queryIndex,
                    options: { unique: false },
                },
                {
                    keyPath: ["name", "database"],
                    name: TableWorker.queryUnique,
                    options: { unique: true },
                },
            ],
            name: TableWorker.storeName,
            primary: { keyPath: "id" },
        };
    }

    private static readonly storeName = "table";
    private static readonly queryIndex = "database";
    private static readonly queryUnique = "name";

    // ****************************** //
    // Implmeneted StorageDeclaration //

    public get store(): string {
        return TableWorker.storeName;
    }

    public validate(data: Table, insert?: boolean): { reason: ExecStatus, detail?: string } {
        if (!insert && !data.id) {
            return { reason: ExecStatus.ID_REQUIRED };
        } else if (insert && data.id) {
            return { reason: ExecStatus.ID_EXISTED };
        }
        if (!data.name) { return { reason: ExecStatus.NAME_REQUIRED }; }
        if (!data.database) { return { reason: ExecStatus.DATABASE_NAME_REQUIRED }; }
        if (!data.position) { data.position = { x: 0, y: 0 }; }
        if (!data.fields) { delete data.fields; }
        return { reason: ExecStatus.VALID };
    }

    // ****************************** //

    public async showTables(database: string): Promise<ExecResult<Table[]>> {
        const sw = await StorageWorker.getInstance();
        return sw.queryAllByIndex<Table>(this, TableWorker.queryIndex, [database]);
    }

    public async getTable(it: string, database?: string): Promise<ExecResult<Table>> {
        const sw = await StorageWorker.getInstance();
        return database ? sw.queryAllByIndex<Table>(this, TableWorker.queryUnique, [it, database])
            .then((tbs) => {
                if (tbs.reason !== ExecStatus.SUCCESS) {
                    return { reason: tbs.reason };
                }
                return { reason: tbs.reason, data: tbs.data![0] };
            }) : sw.queryById<Table>(this, it);
    }

    public async createTable(table: Table): Promise<ExecResult<Table>> {
        const sw = await StorageWorker.getInstance();
        return sw.insert(this, table);
    }

    public async alterTable(table: Table): Promise<ExecResult<Table>> {
        const sw = await StorageWorker.getInstance();
        return sw.queryById<Table>(this, table.id!).then((tbs) => {
            if (tbs.reason !== ExecStatus.SUCCESS) {
                return tbs;
            }
            // allow only a few data to be replace
            // NOTE: do not assign field. Field store in different object store.
            const data = tbs.data!;
            data.name = table.name || data.name;
            data.primaries = table.primaries || data.primaries;
            data.uniques = table.uniques || data.uniques;
            data.foriegns = table.foriegns || data.foriegns;
            data.position = table.position || data.position;
            Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);
            return sw.replace(this, data);
        });
    }

    public async dropTable(it: Table | string, database?: string): Promise<ExecResult<Table>> {
        const sw = await StorageWorker.getInstance();
        if (typeof it === "string") {
            if (!database) {
                return Promise.reject(new Error("drop table required table object or table name and database name"));
            }
            return this.getTable(it, database).then((tbs) => {
                if (tbs.reason !== ExecStatus.SUCCESS) {
                    return tbs;
                }
                return sw.delete<Table>(this, tbs.data!.id!)
                    .then((rs) => {
                        rs.data = tbs.data;
                        return rs;
                    });
            });
        } else {
            return sw.delete(this, (it as Table).id!, true);
        }
    }

}
