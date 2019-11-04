import { Fixture, loadFixtures } from "@db-diagram/tests/helpers/karma";

import { Document } from "@db-diagram/@gen/document/types_generated";
import { DatabaseWorker } from "@db-diagram/services/database.worker";
import { Database } from "@db-diagram/services/documents/database";
import { ExecStatus, StorageWorker } from "@db-diagram/services/storage.worker";

describe("Database worker", () => {

    let databaseWorker: DatabaseWorker;
    let database: Database;
    let databases: Fixture<Database[]>;

    beforeEach(async () => {
        database = {
            engine: "Test",
            matrix: {
                a: 1, b: 0, c: 0, d: 1, e: 0, f: 0,
            },
            name: "Test",
            type: Document.DatabaseType.RDMS,
        } as Database;
        databaseWorker = new DatabaseWorker();
        const result = await databaseWorker.createDatabase(database);
        expect(result.reason).toEqual(ExecStatus.SUCCESS);
        databases = loadFixtures("document/databases.json");
    });

    afterEach(async () => {
        (await StorageWorker.getInstance()).close();
        await StorageWorker.removeDatabse();
    });

    const insertNewDb = async () => {
        for (const db of databases.data) {
            await databaseWorker.createDatabase(db);
        }
    };

    const verifyAllDB = async () => {
        databases.data.unshift(database);
        const dbmap = mappingDatabaseWithID();

        const results = await databaseWorker.showDatabases();
        expect(results.data!.length).toEqual(databases.data.length);
        results.data!.forEach((db) => {
            expect(db).withContext(`name "${db.name}" not matched.`).toEqual(dbmap.get(db.id)!);
        });
    };

    const mappingDatabaseWithID = (): Map<string, Database> => {
        const dbmap = new Map<string, Database>();
        databases.data.forEach((db) => {
            dbmap.set(db.id, db);
        });
        return dbmap;
    };

    it("create/query", async () => {
        expect(database.id).toBeTruthy();
        expect(typeof database.id).toEqual("string");
        expect(database.id.length).toEqual(22); // base64 of 16 bytes with padding

        const results = await databaseWorker.showDatabases();
        expect(results).toBeTruthy();
        expect(results.reason).toEqual(ExecStatus.SUCCESS);
        expect(results.data!.length).toEqual(1);
        expect(results.data![0]).toEqual(database);

        await insertNewDb();
        await verifyAllDB();
    });

    it("failed create", async () => {
        // as of the time of writing this code, DOMException name and code for indexeddb
        // still mark as experimentation thus we don't want to check it value until
        // it become standard.
        const expectStatus = [ExecStatus.ID_EXISTED, ExecStatus.NAME_EXIST];
        const tmpName = database.name;
        database.name = "ANY-NAME";
        for (const status of expectStatus) {
            const results = await databaseWorker.createDatabase(database);
            expect(results).toBeTruthy();
            expect(results.reason).toEqual(status);
            if (database.id) {
                delete database.id;
                database.name = tmpName;
            }
        }
    });

    it("query", async () => {
        await insertNewDb();
        databases.data.unshift(database);
        for (const db of databases.data) {
            const results = await databaseWorker.getDatabase(db.name, true);
            expect(results.reason).toEqual(ExecStatus.SUCCESS);
            expect(results.data!).toEqual(db);
        }
    });

    it("failed query", async () => {
        let result = await databaseWorker.getDatabase(database.name);
        expect(result).toBeTruthy();
        expect(result.reason).toEqual(ExecStatus.ITEM_NOT_FOUND);
        result = await databaseWorker.getDatabase("Not Found", true);
        expect(result).toBeTruthy();
        expect(result.reason).toEqual(ExecStatus.ITEM_NOT_FOUND);
    });

    it("alter", async () => {
        const results = await databaseWorker.showDatabases();
        expect(results.reason).toEqual(ExecStatus.SUCCESS);
        expect(results.data!.length).toEqual(1);
        expect(results.data![0]).toEqual(database);
        await insertNewDb();

        const newName = "changed";
        results.data![0].name = newName;
        const alterResult = await databaseWorker.alterDatabase(results.data![0]);
        expect(alterResult).toBeTruthy();
        expect(alterResult.reason).toEqual(ExecStatus.SUCCESS);
        expect(alterResult.data).toEqual(results.data![0]);

        const dbs = await databaseWorker.getDatabase(database.id);
        expect(dbs).toBeTruthy();
        expect(dbs.reason).toEqual(ExecStatus.SUCCESS);
        expect(dbs.data).toBeTruthy();
        expect(dbs.data!.name).not.toEqual(database.name);
        expect(dbs.data!.name).toEqual(newName);

        database.name = newName;
        await verifyAllDB();
    });

    it("failed alter", async () => {
        const db = {
            engine: "Test",
            matrix: {
                a: 1, b: 0, c: 0, d: 1, e: 0, f: 0,
            },
            name: "DB-Test",
            type: Document.DatabaseType.RDMS,
        } as Database;
        const expectReason = [ExecStatus.ID_REQUIRED, ExecStatus.NAME_EXIST];
        for (const status of expectReason) {
            const result = await databaseWorker.alterDatabase(db);
            expect(result).toBeTruthy();
            expect(result.reason).toEqual(status);
            if (!db.id) {
                await databaseWorker.createDatabase(db);
                db.name = database.name;
            }
        }
    });

    it("drop", async () => {
        let result = await databaseWorker.showDatabases();
        expect(result).toBeTruthy();
        expect(result.reason).toEqual(ExecStatus.SUCCESS);
        expect(result.data!.length).toEqual(1);

        const newDB1 = {
            engine: "Test",
            name: "DB1",
            type: Document.DatabaseType.RDMS,
        } as Database;
        await databaseWorker.createDatabase(newDB1);
        result = await databaseWorker.showDatabases();
        expect(result).toBeTruthy();
        expect(result.reason).toEqual(ExecStatus.SUCCESS);
        expect(result.data!.length).toEqual(2);

        const db = (newDB1.name === result.data![0].name) ? result.data![0] : result.data![1];
        let dropResult = await databaseWorker.dropDatabase(db);
        expect(dropResult).toBeTruthy();
        expect(dropResult.reason).toEqual(ExecStatus.SUCCESS);
        expect(dropResult.data).toEqual(db);
        result = await databaseWorker.showDatabases();
        expect(result).toBeTruthy();
        expect(dropResult.reason).toEqual(ExecStatus.SUCCESS);
        expect(result.data!.length).toEqual(1);
        expect(result.data![0]).toEqual(database);
        // test drop database by name
        dropResult = await databaseWorker.dropDatabase(database.name);
        expect(dropResult).toBeTruthy();
        expect(dropResult.reason).toEqual(ExecStatus.SUCCESS);
        expect(dropResult.data).toEqual(database);
        result = await databaseWorker.showDatabases();
        expect(result).toBeTruthy();
        expect(result.reason).toEqual(ExecStatus.ITEM_NOT_FOUND);
    });

    it("failed drop", async () => {
        let result = await databaseWorker.dropDatabase({ id: "123abc-Not-Found" } as Database);
        expect(result).toBeTruthy();
        expect(result.reason).toEqual(ExecStatus.ITEM_NOT_FOUND);
        result = await databaseWorker.dropDatabase("123abc-Not-Found");
        expect(result).toBeTruthy();
        expect(result.reason).toEqual(ExecStatus.ITEM_NOT_FOUND);
    });

});
