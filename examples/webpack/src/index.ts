import { Diagram, Relation, Table, TableOptions, FieldOptions, addIconSet } from "@krobkrong/db-diagram";
import "@krobkrong/db-diagram/dist/resources/styles/style-dark.css";

interface Data extends TableOptions {
    fields: FieldOptions[];
}

export async function showDemo() {
    const rawSvg = require("../node_modules/@krobkrong/db-diagram/dist/resources/icons.svg");
    addIconSet(rawSvg);

    var diagram = new Diagram().attach("#mydiv");
    const data: Data[] = await fetch(
        "https://storage.googleapis.com/krobkrong/sample.table.json"
    ).then(response => {
        if (response.ok) return response.json();
        // handle error here
    });

    let tables: Table[] = [];
    data.forEach((tbOpt) => {
        const fields = tbOpt.fields;
        delete tbOpt.fields;
        const table = diagram.table(tbOpt);
        fields.forEach(field => {
            table!.addField(field);
        });
        tables.push(table!);
    });

    tables[0].x(100).y(50);
    tables[1].x(450).y(120);
    tables[2].x(150).y(320);

    new Relation(diagram, {
        primaryTable: tables[0],
        foreignTable: tables[1],
        line: false,
        weak: true
    });
    new Relation(diagram, {
        primaryTable: tables[2],
        foreignTable: tables[1],
        line: false,
        weak: true
    });
}