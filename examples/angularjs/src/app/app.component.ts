import { Component, AfterViewInit, ViewEncapsulation, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { Diagram, Relation } from "@krobkrong/db-diagram"

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  encapsulation: ViewEncapsulation.ShadowDom,
  styleUrls: ['./app.component.css', '../../node_modules/@krobkrong/db-diagram/dist/resources/styles/style-dark.css']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('container', {static: false}) container: ElementRef;
  title = 'angularjs';

  ngAfterViewInit(): void {
    const diagram = new Diagram().attach(this.container.nativeElement);
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
      tables[2].x(150).y(360);

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
}
