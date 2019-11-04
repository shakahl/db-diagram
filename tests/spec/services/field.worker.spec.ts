import { Fixture, loadFixtures } from "@db-diagram/tests/helpers/karma";

import { Document } from "@db-diagram/@gen/document/types_generated";
import { Field } from "@db-diagram/services/documents/field";
import { FieldWorker } from "@db-diagram/services/field.worker";
import { ExecStatus, StorageWorker } from "@db-diagram/services/storage.worker";

describe("Field", () => {

    let fieldWorker: FieldWorker;
    let field: Field;

    let fields: Fixture<Field[]>;
    let fields1: Fixture<Field[]>;

    beforeEach(async () => {
        field = {
            database: "database abc",
            key: false,
            kind: 0,
            name: "name",
            order: 1,
            size: 40,
            table: "table abc",
            type: 15,
        } as Field;
        fieldWorker = new FieldWorker();
        const result = await fieldWorker.createField(field);
        expect(result).toBeTruthy();
        expect(result.reason).toEqual(ExecStatus.SUCCESS);
        fields = loadFixtures("document/fields.json");
        fields1 = loadFixtures("document/fields1.json");
    });

    afterEach(async () => {
        (await StorageWorker.getInstance()).close();
        await StorageWorker.removeDatabse();
    });

    const insertNewField = async () => {
        for (const fd of fields.data) {
            const result = await fieldWorker.createField(fd);
            expect(result.reason).toEqual(ExecStatus.SUCCESS);
            expect(result.data).toEqual(fd);
        }
        for (const fd of fields1.data) {
            const result = await fieldWorker.createField(fd);
            expect(result.reason).withContext(result.detail!).toEqual(ExecStatus.SUCCESS);
            expect(result.data).toEqual(fd);
        }
    };

    const verifyAllFields = async () => {
        fields.data.unshift(field);
        fields.data.push(...fields1.data);
        const fdsmap = mappingFieldsWithID();
        const allKeys = fdsmap.keys();

        let db: IteratorResult<string, any>;
        let tb: IteratorResult<string, any>;
        do {
            db = allKeys.next();
            const tbmap = fdsmap.get(db.value);
            const tbAllKeys = tbmap!.keys();
            do {
                tb = tbAllKeys.next();
                const fdmap = tbmap!.get(tb.value);
                const results = await fieldWorker.showFields(db.value, tb.value);
                expect(results.reason).toEqual(ExecStatus.SUCCESS);
                expect(results.data!.length).toEqual(fdmap!.size);
                results.data!.forEach((fd) => {
                    expect(fd).withContext(`name "${fd.name}" not matched.`).toEqual(fdmap!.get(fd.id)!);
                });
            } while (tb.done);
        } while (db.done);
    };

    const mappingFieldsWithID = (): Map<string, Map<string, Map<string, Field>>> => {
        const fieldsMap = new Map<string, Map<string, Map<string, Field>>>();
        const computeMap = (fds: Field[]) => {
            fds.forEach((fd) => {
                let tbmap = fieldsMap.get(fd.database);
                if (!tbmap) {
                    tbmap = new Map<string, Map<string, Field>>();
                    fieldsMap.set(fd.database, tbmap);
                }
                let fdmap = tbmap.get(fd.table);
                if (!fdmap) {
                    fdmap = new Map<string, Field>();
                    tbmap.set(fd.table, fdmap);
                }
                fdmap.set(fd.id, fd);
            });
        };
        computeMap(fields.data);
        computeMap(fields1.data);
        return fieldsMap;
    };

    it("create/query", async () => {
        expect(field.id).toBeTruthy();
        expect(typeof field.id).toEqual("string");
        expect(field.id.length).toEqual(22);

        const results = await fieldWorker.showFields(field.database, field.table);
        expect(results).toBeTruthy();
        expect(results.reason).toEqual(ExecStatus.SUCCESS);
        expect(results.data!.length).toEqual(1);
        expect(results.data![0]).toEqual(field);

        await insertNewField();
        await verifyAllFields();
    });

    it("failed create", async () => {
        // as of the time of writing this code, DOMException name and code for indexeddb
        // still mark as experimentation thus we don't want to check it value until
        // it become standard.
        const expectStatus = [ExecStatus.ID_EXISTED, ExecStatus.NAME_EXIST];
        const tmpName = field.name;
        field.name = "ANY-NAME";
        for (const status of expectStatus) {
            const results = await fieldWorker.createField(field);
            expect(results).toBeTruthy();
            expect(results.reason).toEqual(status);
            if (field.id) {
                delete field.id;
                field.name = tmpName;
            }
        }
    });

    it("validation", async () => {
        let fd = { } as Field;
        const patchs = [
            { name: "test" },
            { table: "Test" },
            { database: "DB" },
            { type: Document.DataType.VarChar },
            { type: Document.DataType.Enum },
            { items: ["Test1", "Test2"] },
            {}];
        const expectStatus = [
            ExecStatus.NAME_REQUIRED,
            ExecStatus.TABLE_NAME_REQUIRED,
            ExecStatus.DATABASE_NAME_REQUIRED,
            ExecStatus.DATA_TYPE_REQUIRED,
            ExecStatus.TYPE_SIZE_REQUIRED,
            ExecStatus.TYPE_ITEM_REQUIRED,
            ExecStatus.SUCCESS];
        for (const [i, status] of expectStatus.entries()) {
            const results = await fieldWorker.createField(fd);
            expect(results).toBeTruthy();
            expect(results.reason).toEqual(status);
            fd = Object.assign(fd, patchs[i]);
        }
    });

    it("query", async () => {
        await insertNewField();
        fields.data.unshift(field);
        for (const fd of fields.data) {
            const results = await fieldWorker.getField(fd.name, fd.database, fd.table);
            expect(results).toBeTruthy();
            expect(results.reason).toEqual(ExecStatus.SUCCESS);
            expect(results.data!).toEqual(fd);
        }
    });

    it("failed query", async () => {
        let result = await fieldWorker.getField(field.name);
        expect(result).toBeTruthy();
        expect(result.reason).toEqual(ExecStatus.ITEM_NOT_FOUND);
        result = await fieldWorker.getField("Not Found", field.database, field.table);
        expect(result).toBeTruthy();
        expect(result.reason).toEqual(ExecStatus.ITEM_NOT_FOUND);
    });

    it("alter", async () => {
        const results = await fieldWorker.showFields(field.database, field.table);
        expect(results).toBeTruthy();
        expect(results.reason).toEqual(ExecStatus.SUCCESS);
        expect(results.data!.length).toEqual(1);
        expect(results.data![0]).toEqual(field);
        await insertNewField();

        const newName = "new field name";
        results.data![0].name = newName;
        const alterResult = await fieldWorker.alterField(results.data![0]);
        expect(alterResult).toBeTruthy();
        expect(alterResult.reason).toEqual(ExecStatus.SUCCESS);

        const fds = await fieldWorker.getField(field.id);
        expect(fds).toBeTruthy();
        expect(fds.reason).toEqual(ExecStatus.SUCCESS);
        expect(fds.data!.name).not.toEqual(field.name);
        expect(fds.data!.name).toEqual(newName);

        field.name = newName;
        await verifyAllFields();
    });

    it("failed alter", async () => {
        const fd = {
            database: "database abc",
            key: false,
            kind: 0,
            name: "name-1a",
            order: 1,
            size: 40,
            table: "table abc",
            type: 15,
        } as Field;
        const expectReason = [ExecStatus.ID_REQUIRED, ExecStatus.NAME_EXIST];
        for (const status of expectReason) {
            const result = await fieldWorker.alterField(fd);
            expect(result).toBeTruthy();
            expect(result.reason).toEqual(status);
            if (!fd.id) {
                const rs = await fieldWorker.createField(fd);
                expect(rs.reason).toEqual(ExecStatus.SUCCESS);
                fd.name = field.name;
            }
        }
    });

    it("drop", async () => {
        let results = await fieldWorker.showFields(field.database, field.table);
        expect(results).toBeTruthy();
        expect(results.reason).toEqual(ExecStatus.SUCCESS);
        expect(results.data).toBeTruthy();
        expect(results.data!.length).toEqual(1);

        const newFd1 = {
            database: field.database,
            key: false,
            kind: 0,
            name: "Field1-abc",
            order: 1,
            size: 55,
            table: field.table,
            type: 15,
        } as Field;
        await fieldWorker.createField(newFd1);
        results = await fieldWorker.showFields(newFd1.database, newFd1.table);
        expect(results).toBeTruthy();
        expect(results.reason).toEqual(ExecStatus.SUCCESS);
        expect(results.data!.length).toEqual(2);

        const fd = (newFd1.name === results.data![0].name) ? results.data![0] : results.data![1];
        let dropResults = await fieldWorker.dropField(fd);
        expect(dropResults).toBeTruthy();
        expect(dropResults.reason).toEqual(ExecStatus.SUCCESS);
        results = await fieldWorker.showFields(field.database, field.table);
        expect(results).toBeTruthy();
        expect(results.reason).toEqual(ExecStatus.SUCCESS);
        expect(results.data!.length).toEqual(1);
        expect(results.data![0]).toEqual(field);

        dropResults = await fieldWorker.dropField(field.name, field.database, field.table);
        expect(dropResults).toBeTruthy();
        expect(dropResults.reason).toEqual(ExecStatus.SUCCESS);
        results = await fieldWorker.showFields(field.database, field.table);
        expect(results).toBeTruthy();
        expect(results.reason).toEqual(ExecStatus.ITEM_NOT_FOUND);
    });

    it("failed drop", async () => {
        let result = await fieldWorker.dropField({ id: "123abc-Not-Found" } as Field);
        expect(result).toBeTruthy();
        expect(result.reason).toEqual(ExecStatus.ITEM_NOT_FOUND);
        result = await fieldWorker.dropField("123abc-Not-Found", field.database, field.table);
        expect(result).toBeTruthy();
        expect(result.reason).toEqual(ExecStatus.ITEM_NOT_FOUND);
    });

});
