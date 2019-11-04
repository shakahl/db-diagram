import {
    AnyEventMap,
    ClientInfo,
    Command,
    Data,
    Request,
    Response,
    SubCommand,
} from "@db-diagram/services/command";
import { Database } from "@db-diagram/services/documents/database";
import { Field } from "@db-diagram/services/documents/field";
import { Table } from "@db-diagram/services/documents/table";
import { DataEvent } from "@db-diagram/services/documents/types";

import { DatabaseWorker } from "@db-diagram/services/database.worker";
import { FieldWorker } from "@db-diagram/services/field.worker";
import { TableWorker } from "@db-diagram/services/table.worker";

/**
 * Object mapping
 */
interface ObjectHandlerMapping {
    [index: number]: {
        [index: number]: ((evt: ExtendableMessageEvent, req: Request<any>) => void) | undefined;
    } | undefined;
}

/**
 * Data service worker
 */
class DataServiceWorker {

    private self: ServiceWorkerGlobalScope;
    private handlerIndex: ObjectHandlerMapping;

    private databaseWoker: DatabaseWorker;
    private tableWorker: TableWorker;
    private fieldWorker: FieldWorker;

    constructor(self: ServiceWorkerGlobalScope) {
        this.self = self;
        this.self.addEventListener("message", (evt) => this.handleMessage(evt));
        this.handlerIndex = {};
        this.databaseWoker = new DatabaseWorker();
        this.fieldWorker = new FieldWorker();
        this.tableWorker = new TableWorker();

        // add metadata
        this.handlerIndex[Command.META] = {};
        this.handlerIndex[Command.META]![SubCommand.META] = this.handleMetadata;

        // add load request show type
        this.handlerIndex[Command.SHOW] = {};
        this.handlerIndex[Command.SHOW]![SubCommand.DATABASE] = this.handleShowDatabases;
        this.handlerIndex[Command.SHOW]![SubCommand.TABLE] = this.handleShowTables;
        this.handlerIndex[Command.SHOW]![SubCommand.FIELD] = this.handleDescribeTable;

        // add load request create type
        this.handlerIndex[Command.CREATE] = {};
        this.handlerIndex[Command.CREATE]![SubCommand.DATABASE] = this.handleCreateDatabase;
        this.handlerIndex[Command.CREATE]![SubCommand.TABLE] = this.handleCreateTable;
        this.handlerIndex[Command.CREATE]![SubCommand.FIELD] = this.handleCreateField;
    }

    private postMessage<K extends keyof AnyEventMap, T extends AnyEventMap[K]>(
        client: Client, source: string, type: K, detail: T) {

        return new Promise((resolve) => {
            const msgCh = new MessageChannel();
            msgCh.port1.onmessage = (evt) => {
                if (evt.data && evt.data.error) {
                    resolve(evt.data.error);
                } else {
                    resolve(evt.data);
                }
            };

            client.postMessage({
                detail,
                source,
                type,
            } as DataEvent<T>, [msgCh.port2]);
        });
    }

    private async dispatch<K extends keyof AnyEventMap, T extends AnyEventMap[K]>(source: string, type: K, detail: T) {
        this.self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
                if (source !== client.id) {
                    this.postMessage(client, source, type, detail);
                }
            });
        });
    }

    private async response(evt: ExtendableMessageEvent, data: Data | Error | any) {
        const response: Response<Data | any> = (data instanceof Error) ?
            { success: false, error: data } : { success: true, data };

        if (evt.source instanceof MessagePort || evt.ports && evt.ports.length > 0) {
            evt.ports[0].postMessage(response);
        }
    }

    private handleMetadata(evt: ExtendableMessageEvent) {
        if (evt.source instanceof Client) {
            this.response(evt, {
                frameType: evt.source.frameType,
                id: evt.source.id,
                type: evt.source.type,
                url: evt.source.url,
            } as ClientInfo);
        }
    }

    private handleMessage(evt: ExtendableMessageEvent) {
        const request = evt.data as Request<Data>;
        const command = request.command;
        const subCommand = request.subCommand;
        if (this.handlerIndex[command]) {
            if (this.handlerIndex[command]![subCommand]) {
                return this.handlerIndex[command]![subCommand]!.apply(this, [evt, request]);
            }
        }
        const error = new Error(`Request commnad ${command} sub command: ${subCommand} is not supported`);
        this.response(evt, error);
    }

    private async handleShowDatabases(evt: ExtendableMessageEvent, _: Request<any>) {
        await this.databaseWoker.showDatabases()
            .then((data) => this.response(evt, data))
            .catch((err) => this.response(evt, err));
    }

    private async handleShowTables(evt: ExtendableMessageEvent, request: Request<Database>) {
        await this.tableWorker.showTables(request.data!.name)
            .then((data) => this.response(evt, data))
            .catch((err) => this.response(evt, err));
    }

    private async handleDescribeTable(evt: ExtendableMessageEvent, request: Request<Table>) {
        await this.fieldWorker.showFields(request.data!.database, request.data!.name)
            .then((data) => this.response(evt, data))
            .catch((err) => this.response(evt, err));
    }

    private async handleCreateDatabase(evt: ExtendableMessageEvent, request: Request<Database>) {
        await this.databaseWoker.createDatabase(request.data!)
            .then(() => this.response(evt, request.data!))
            .catch((err) => this.response(evt, err));
    }

    private async handleCreateTable(evt: ExtendableMessageEvent, request: Request<Table>) {
        await this.tableWorker.createTable(request.data!)
            .then(() => this.response(evt, request.data!))
            .catch((err) => this.response(evt, err));
    }

    private async handleCreateField(evt: ExtendableMessageEvent, request: Request<Field>) {
        await this.fieldWorker.createField(request.data!)
            .then(() => this.response(evt, request.data!))
            .catch((err) => this.response(evt, err));
    }

}

const dsw = new DataServiceWorker(self as any);
