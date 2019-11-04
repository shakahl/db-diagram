import { Document } from "@db-diagram/@gen/document/types_generated";
import { Field } from "@db-diagram/services/documents/field";
import {
    ExecResult,
    ExecStatus,
    IndexedDBSchema,
    StorageDeclaration,
    StorageWorker,
} from "@db-diagram/services/storage.worker";

export class FieldWorker implements StorageDeclaration<Field> {

    public static get schema(): IndexedDBSchema {
        return {
            indexes: [
                {
                    keyPath: ["database", "table"],
                    name: FieldWorker.queryIndex,
                    options: { unique: false },
                },
                {
                    keyPath: ["name", "database", "table"],
                    name: FieldWorker.queryKeyUinque,
                    options: { unique: true },
                },
            ],
            name: FieldWorker.storeName,
            primary: { keyPath: "id" },
        };
    }

    private static readonly storeName = "field";
    private static readonly queryIndex = "db-table";
    private static readonly queryKeyUinque = "db-table-field";

    // ****************************** //
    // Implmeneted StorageDeclaration //

    public get store(): string {
        return FieldWorker.storeName;
    }

    public validate(data: Field, insert?: boolean): { reason: ExecStatus, detail?: string } {
        if (!insert && !data.id) {
            return { reason: ExecStatus.ID_REQUIRED };
        } else if (insert && data.id) {
            return { reason: ExecStatus.ID_EXISTED };
        }
        if (!data.name) { return { reason: ExecStatus.NAME_REQUIRED }; }
        if (!data.table) { return { reason: ExecStatus.TABLE_NAME_REQUIRED }; }
        if (!data.database) { return { reason: ExecStatus.DATABASE_NAME_REQUIRED }; }
        if (!data.type) { return { reason: ExecStatus.DATA_TYPE_REQUIRED }; }
        // check specific condition
        const dt = Document.DataType;
        switch (data.type) {
            case Document.DataType.Enum:
                if (!data.items) {
                    return {
                        detail: `Field ${data.name} type ${dt[data.type]} required additional items`,
                        reason: ExecStatus.TYPE_ITEM_REQUIRED,
                    };
                }
                break;

            // TODO: experiment, this validation may vary depend on Database Engine.
            case Document.DataType.Float:
                if (!data.fpoint && (!data.size || !data.digit)) {
                    return { reason: ExecStatus.FLOATING_POINT_REQUIRED };
                }
            case Document.DataType.Double:
            case Document.DataType.Decimal:
                if (data.size === undefined) {
                    return {
                        detail: `Field ${data.name} type ${dt[data.type]} required additional size`,
                        reason: ExecStatus.TYPE_SIZE_REQUIRED,
                    };
                }
                if (data.digit === undefined) {
                    return {
                        detail: `Field ${data.name} type ${dt[data.type]} required additional digit count`,
                        reason: ExecStatus.FLOATING_DIGIT_REQUIRED,
                    };
                }
                break;

            case Document.DataType.UnicodeVarChar:
            case Document.DataType.TinyInt:
            case Document.DataType.SmallInt:
            case Document.DataType.Medium:
            case Document.DataType.Int:
            case Document.DataType.BigInt:
            case Document.DataType.Text:
            case Document.DataType.Blob:
            case Document.DataType.VarBinary:
            case Document.DataType.VarChar:
                if (data.size === undefined) {
                    return {
                        detail: `Field ${data.name} type ${dt[data.type]} required additional size`,
                        reason: ExecStatus.TYPE_SIZE_REQUIRED,
                    };
                }
                break;
        }
        // set default if not existed
        if (data.kind === undefined) { data.kind = Document.FieldKind.Normal; }
        if (!data.key) { data.key = data.kind !== Document.FieldKind.Normal; }
        if (data.order === undefined) {
            const count = async () => {
                const sw = await StorageWorker.getInstance();
                const result = await sw.count(this, [data.database, data.table], FieldWorker.queryIndex);
                data.order = result.data!;
            };
            count();
        }
        return { reason: ExecStatus.VALID };
    }

    // ****************************** //

    public async showFields(database: string, table: string): Promise<ExecResult<Field[]>> {
        const sw = await StorageWorker.getInstance();
        return sw.queryAllByIndex<Field>(this, FieldWorker.queryIndex, [database, table]);
    }

    public async getField(it: string, database?: string, table?: string): Promise<ExecResult<Field>> {
        const sw = await StorageWorker.getInstance();
        return (database && table) ? sw.queryAllByIndex<Field>(this, FieldWorker.queryKeyUinque,
            [it, database, table]).then((fds) => {
                if (fds.reason !== ExecStatus.SUCCESS) {
                    return { reason: fds.reason };
                }
                return { reason: fds.reason, data: fds.data![0] };
            }) : sw.queryById(this, it);
    }

    public async createField(field: Field): Promise<ExecResult<Field>> {
        const sw = await StorageWorker.getInstance();
        return sw.insert(this, field);
    }

    public async alterField(field: Field): Promise<ExecResult<Field>> {
        const sw = await StorageWorker.getInstance();
        return sw.queryById<Field>(this, field.id).then((fds) => {
            if (fds.reason !== ExecStatus.SUCCESS) {
                return fds;
            }
            // allow only a few data to be replace
            const data = fds.data!;
            data.name = field.name || data.name;
            data.type = field.type || data.type;
            data.size = field.size || data.size;
            data.items = field.items || data.items;
            data.kind = field.kind || data.kind;
            data.key = field.key || data.key;
            data.utilizeds = field.utilizeds || data.utilizeds;
            data.reference = field.reference || data.reference;
            data.order = field.order || data.order;
            Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);
            return sw.replace(this, data);
        });
    }

    public async dropField(it: Field | string, database?: string, table?: string): Promise<ExecResult<Field>> {
        const sw = await StorageWorker.getInstance();
        if (typeof it === "string") {
            if (!table || !database) {
                return Promise.reject(new Error(`drop field ${name} required table and database name`));
            }
            return this.getField(it, database, table).then((fds) => {
                if (fds.reason !== ExecStatus.SUCCESS) {
                    return fds;
                }
                return sw.delete<Field>(this, fds.data!.id).then((fdsd) => {
                    fdsd.data = fds.data;
                    return fdsd;
                });
            });
        } else {
            return sw.delete(this, (it as Field).id, true);
        }
    }

}
