import { Fixture, loadFixtures } from "@db-diagram/tests/helpers/karma";

import { Table } from "@db-diagram/services/documents/table";
import { ExecStatus, StorageWorker } from "@db-diagram/services/storage.worker";
import { TableWorker } from "@db-diagram/services/table.worker";

describe("Table worker", () => {

    let tableWorker: TableWorker;
    let table: Table;

    let tables: Fixture<Table[]>;

    beforeEach(async () => {
        table = {
            database: "Database-1",
            name: "Table",
            position: {
                x: 0,
                y: 0,
            },
        } as Table;
        tableWorker = new TableWorker();
        const result = await tableWorker.createTable(table);
        expect(result).toBeTruthy();
        expect(result.reason).toEqual(ExecStatus.SUCCESS);
        tables = loadFixtures("document/tables.json");
    });

    afterEach(async () => {
        (await StorageWorker.getInstance()).close();
        await StorageWorker.removeDatabse();
    });

    const insertNewTb = async () => {
        for (const tb of tables.data) {
            const result = await tableWorker.createTable(tb);
            expect(result).toBeTruthy();
            expect(result.reason).toEqual(ExecStatus.SUCCESS);
        }
    };

    const verifyAllTB = async () => {
        tables.data.unshift(table);
        const tbsmap = mappingTablesWithID();
        const allKeys = tbsmap.keys();

        let db: IteratorResult<string, any>;
        do {
            db = allKeys.next();
            const tbmap = tbsmap.get(db.value);
            const results = await tableWorker.showTables(db.value);
            expect(results.reason).toEqual(ExecStatus.SUCCESS);
            expect(results.data!.length).toEqual(tbmap!.size);
            results.data!.forEach((tb) => {
                expect(tb).withContext(`name "${tb.name}" not matched.`).toEqual(tbmap!.get(tb.id)!);
            });
        } while (db.done);
    };

    const mappingTablesWithID = (): Map<string, Map<string, Table>> => {
        const tbsmap = new Map<string, Map<string, Table>>();
        tables.data.forEach((tb) => {
            let tbmap = tbsmap.get(tb.database);
            if (!tbmap) {
                tbmap = new Map<string, Table>();
                tbsmap.set(tb.database, tbmap);
            }
            tbmap.set(tb.id, tb);
        });
        return tbsmap;
    };

    it("create/query", async () => {
        expect(table.id).toBeTruthy();
        expect(typeof table.id).toEqual("string");
        expect(table.id.length).toEqual(22);

        const results = await tableWorker.showTables(table.database);
        expect(results).toBeTruthy();
        expect(results.reason).toEqual(ExecStatus.SUCCESS);
        expect(results.data!.length).toEqual(1);
        expect(results.data![0]).toEqual(table);

        await insertNewTb();
        await verifyAllTB();
    });

    it("failed create", async () => {
        // as of the time of writing this code, DOMException name and code for indexeddb
        // still mark as experimentation thus we don't want to check it value until
        // it become standard.
        const expectStatus = [ExecStatus.ID_EXISTED, ExecStatus.NAME_EXIST];
        const tmpName = table.name;
        table.name = "ANY-NAME";
        for (const status of expectStatus) {
            const results = await tableWorker.createTable(table);
            expect(results).toBeTruthy();
            expect(results.reason).toEqual(status);
            if (table.id) {
                delete table.id;
                table.name = tmpName;
            }
        }
    });

    it("query", async () => {
        await insertNewTb();
        tables.data.unshift(table);
        for (const tb of tables.data) {
            const results = await tableWorker.getTable(tb.name, tb.database);
            expect(results.reason).toEqual(ExecStatus.SUCCESS);
            expect(results.data).toEqual(tb);
        }
    });

    it("failed query", async () => {
        let result = await tableWorker.getTable(table.name);
        expect(result).toBeTruthy();
        expect(result.reason).toEqual(ExecStatus.ITEM_NOT_FOUND);
        result = await tableWorker.getTable("Not Found", table.database);
        expect(result).toBeTruthy();
        expect(result.reason).toEqual(ExecStatus.ITEM_NOT_FOUND);
    });

    it("alter", async () => {
        const results = await tableWorker.showTables(table.database);
        expect(results.reason).toEqual(ExecStatus.SUCCESS);
        expect(results.data!.length).toEqual(1);
        expect(results.data![0]).toEqual(table);
        await insertNewTb();

        const newName = "new table name";
        results.data![0].name = newName;
        const alterResults = await tableWorker.alterTable(results.data![0]);
        expect(alterResults.reason).toEqual(ExecStatus.SUCCESS);

        const tbs = await tableWorker.getTable(table.id);
        expect(tbs).toBeTruthy();
        expect(tbs.reason).toEqual(ExecStatus.SUCCESS);
        expect(tbs.data!.name).not.toEqual(table.name);
        expect(tbs.data!.name).toEqual(newName);

        table.name = newName;
        await verifyAllTB();
    });

    it("failed alter", async () => {
        const tb = {
            database: table.database,
            name: "Table-a1",
            position: {
                x: 0,
                y: 0,
            },
        } as Table;
        const expectReason = [ExecStatus.ID_REQUIRED, ExecStatus.NAME_EXIST];
        for (const status of expectReason) {
            const result = await tableWorker.alterTable(tb);
            expect(result).toBeTruthy();
            expect(result.reason).toEqual(status);
            if (!tb.id) {
                await tableWorker.createTable(tb);
                tb.name = table.name;
            }
        }
    });

    it("drop", async () => {
        let results = await tableWorker.showTables(table.database);
        expect(results).toBeTruthy();
        expect(results.reason).toEqual(ExecStatus.SUCCESS);
        expect(results.data!.length).toEqual(1);

        const newTb1 = {
            database: table.database,
            name: "Table 23",
            position: {
                x: 10,
                y: 22,
            },
        } as Table;
        await tableWorker.createTable(newTb1);
        results = await tableWorker.showTables(newTb1.database);
        expect(results).toBeTruthy();
        expect(results.reason).toEqual(ExecStatus.SUCCESS);
        expect(results.data!.length).toEqual(2);

        const tb = (newTb1.name === results.data![0].name) ? results.data![0] : results.data![1];
        let dropResults = await tableWorker.dropTable(tb);
        expect(dropResults.reason).toEqual(ExecStatus.SUCCESS);
        results = await tableWorker.showTables(table.database);
        expect(results).toBeTruthy();
        expect(results.reason).toEqual(ExecStatus.SUCCESS);
        expect(results.data!.length).toEqual(1);
        expect(results.data![0]).toEqual(table);

        dropResults = await tableWorker.dropTable(table.name, table.database);
        expect(dropResults.reason).toEqual(ExecStatus.SUCCESS);
        results = await tableWorker.showTables(table.database);
        expect(results).toBeTruthy();
        expect(results.reason).toEqual(ExecStatus.ITEM_NOT_FOUND);
    });

    it("failed drop", async () => {
        let result = await tableWorker.dropTable({ id: "123abc-Not-Found" } as Table);
        expect(result).toBeTruthy();
        expect(result.reason).toEqual(ExecStatus.ITEM_NOT_FOUND);
        result = await tableWorker.dropTable("123abc-Not-Found", table.database);
        expect(result).toBeTruthy();
        expect(result.reason).toEqual(ExecStatus.ITEM_NOT_FOUND);
    });

});
