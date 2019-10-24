import { LitElement, html, css } from 'lit-element';
import '@krobkrong/db-diagram';

class Daigram extends LitElement {

    static get styles() {
        return css`
            #fit {
                width: 100%;
                height: 100%;
            }
        `;
    }

    firstUpdated() {
        fetch(
            "../node_modules/@krobkrong/db-diagram/dist/resources/icons.svg"
        ).then(response => {
            if (response.ok) return response.text();
            // handle error here
        }).then(txt => {
            DBDiagram.addIconSet(txt, this.shadowRoot);
            this.showDemo();
        });
    }

    showDemo() {
        const ele = this.shadowRoot.getElementById("fit");
        var diagram = new DBDiagram.Diagram().attach(ele);
        fetch(
            "https://storage.googleapis.com/krobkrong/sample.table.json"
        ).then(response => {
            if (response.ok) return response.json();
            // handle error here
        }).then(data => {
            let tables = [];
            data.forEach((tbOpt) => {
                const fields = tbOpt.fields;
                delete tbOpt.fields;
                const table = diagram.table(tbOpt);
                fields.forEach(field => {
                    table.addField(field);
                });
                tables.push(table);
            });

            tables[0].x(100).y(50);
            tables[1].x(450).y(120);
            tables[2].x(150).y(320);

            new DBDiagram.Relation(diagram, {
                primaryTable: tables[0],
                foreignTable: tables[1],
                line: false,
                weak: true
            });
            new DBDiagram.Relation(diagram, {
                primaryTable: tables[2],
                foreignTable: tables[1],
                line: false,
                weak: true
            });
        });
    }

    render() {
        return html`
            <link rel="stylesheet" href="node_modules/@krobkrong/db-diagram/dist/resources/styles/style-dark.css">
            <div id="fit"></div>
        `;
    }
}

customElements.define('db-diagram', Daigram);