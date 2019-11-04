import { Database } from "@db-diagram/services/documents/database";
import {
    ExecResult,
    ExecStatus,
    IndexedDBSchema,
    StorageDeclaration,
    StorageWorker,
} from "@db-diagram/services/storage.worker";

export class DatabaseWorker implements StorageDeclaration<Database> {

    public static get schema(): IndexedDBSchema {
        return {
            indexes: [
                {
                    keyPath: "name",
                    name: DatabaseWorker.queryIndexName,
                    options: { unique: true },
                },
            ],
            name: DatabaseWorker.storeName,
            primary: { keyPath: "id" },
        };
    }

    private static readonly storeName = "database";
    private static readonly queryIndexName = "name";

    // ****************************** //
    // Implmeneted StorageDeclaration //

    public get store(): string {
        return DatabaseWorker.storeName;
    }

    public validate(data: Database, insert?: boolean): { reason: ExecStatus, detail?: string } {
        if (!insert && !data.id) {
            return { reason: ExecStatus.ID_REQUIRED };
        } else if (insert && data.id) {
            return { reason: ExecStatus.ID_EXISTED };
        }
        if (!data.name) { return { reason: ExecStatus.NAME_REQUIRED, detail: `` }; }
        if (data.type === undefined) { return { reason: ExecStatus.TYPE_REQUIRED }; }

        if (!data.matrix) { data.matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }; }
        if (data.tables) { delete data.tables; }
        return { reason: ExecStatus.VALID };
    }

    // ****************************** //

    public async showDatabases(): Promise<ExecResult<Database[]>> {
        const sw = await StorageWorker.getInstance();
        return sw.queryAll<Database>(this);
    }

    public async getDatabase(it: string, name?: boolean): Promise<ExecResult<Database>> {
        const sw = await StorageWorker.getInstance();
        return name ? sw.queryAllByIndex<Database>(this, DatabaseWorker.queryIndexName, it)
            .then((dbs) => {
                if (dbs.reason !== ExecStatus.SUCCESS) {
                    return { reason: dbs.reason };
                }
                return { reason: dbs.reason, data: dbs.data![0] };
            }) : sw.queryById<Database>(this, it);
    }

    public async createDatabase(database: Database): Promise<ExecResult<Database>> {
        const sw = await StorageWorker.getInstance();
        return sw.insert(this, database);
    }

    public async alterDatabase(database: Database): Promise<ExecResult<Database>> {
        const sw = await StorageWorker.getInstance();
        return sw.queryById<Database>(this, database.id)
            .then((dbs) => {
                if (dbs.reason !== ExecStatus.SUCCESS) {
                    return dbs;
                }
                // allow only a few data to be replace
                // NOTE: do not assign table. Table store in different object store.
                const data = dbs.data!;
                data.name = database.name || data.name;
                data.engine = database.engine || data.engine;
                data.matrix = database.matrix || data.matrix;
                data.type = database.type || data.type;
                Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);
                return sw.replace(this, data);
            });
    }

    public async dropDatabase(database: Database | string): Promise<ExecResult<Database>> {
        const sw = await StorageWorker.getInstance();
        if (typeof database === "string") {
            // drop database by name
            return this.getDatabase(database, true).then((result) => {
                if (result.reason !== ExecStatus.SUCCESS) {
                    return result;
                }
                return sw.delete<Database>(this, result.data!.id)
                    .then((rs) => {
                        rs.data = result.data;
                        return rs;
                    });
            });
        } else {
            return sw.delete(this, database.id, true);
        }
    }

}
