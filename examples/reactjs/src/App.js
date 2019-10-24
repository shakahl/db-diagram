import React from 'react';
import './App.css';
import { ReactComponent as Icon } from '../node_modules/@krobkrong/db-diagram/dist/resources/icons.svg';
import { Diagram, Relation } from '@krobkrong/db-diagram';

class App extends React.Component {
  componentDidMount() {
    const diagram = new Diagram({ height: "100%" }).attach("#app");
    fetch(
      "https://storage.googleapis.com/krobkrong/sample.table.json"
    ).then(response => {
      if (response.ok) return response.json();
      // handle error here
    }).then(data => {
      let tables = [];
      data.forEach(tbOpt => {
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
    });
  }

  render() {
    return (
      <div id="app">
        <Icon id="share-svg"></Icon>
      </div>
    );
  }
}

export default App;
