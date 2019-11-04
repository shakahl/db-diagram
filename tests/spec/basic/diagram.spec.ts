import { loadAttributeFixture, loadAttributeFrom } from "@db-diagram/tests/helpers/helper";
import { Fixture, loadFixtures } from "@db-diagram/tests/helpers/karma";

import { Diagram } from "@db-diagram/elements/diagram";
import { TableGraph } from "@db-diagram/elements/table";
import { Table } from "@db-diagram/services/documents/table";
import { onDomReady } from "@db-diagram/shares/elements";

let htmlFixture: Fixture<HTMLElement>;
const dbName = "sample";

// wait for dom to finish before starting test
beforeAll((done) => {
   onDomReady(done);
});

describe("Diagram", () => {

   beforeEach(() => {
      htmlFixture = loadFixtures("container.html");
   });

   afterEach(() => {
      if (htmlFixture.reset) { htmlFixture.reset(); }
   });

   it("create", () => {
      const diagram = new Diagram(dbName);
      diagram.attach(document.body);
      expect(diagram).toBeTruthy();
      expect(diagram.native).toBeTruthy();
      expect(diagram.native.tagName).toBe("svg");
      expect(diagram.native.childElementCount).toEqual(1);
      expect(diagram.holder).toBeTruthy();
      expect(diagram.holder.tagName).toBe("g");
      expect(diagram.holder).toEqual(diagram.native.children[0] as SVGGElement);
      expect(diagram.native.children[0].childElementCount).toEqual(0);
      expect(diagram.native.parentElement).toBe(document.body);
      expect(htmlFixture.data.childElementCount).toEqual(0);
      diagram.detach();
   });

   it("create with id", () => {
      const id = htmlFixture.data.getAttribute("id")!;
      const diagram = new Diagram(dbName, { id });
      diagram.attach(`#${id}`);
      expect(diagram).toBeTruthy();
      expect(diagram.native).toBeTruthy();
      expect(diagram.native.tagName).toBe("svg");
      expect(diagram.native.childElementCount).toEqual(1);
      expect(diagram.holder).toBeTruthy();
      expect(diagram.holder.tagName).toBe("g");
      expect(diagram.holder).toEqual(diagram.native.children[0] as SVGGElement);
      expect(diagram.native.children[0].childElementCount).toEqual(0);
      expect(htmlFixture.data.childElementCount).toEqual(1);
      expect(htmlFixture.data.children[0] instanceof SVGSVGElement).toBeTruthy();
      expect(diagram.native).toBe(htmlFixture.data.children[0] as SVGSVGElement);
      diagram.detach();
   });

   it("attach", () => {
      const diagram1 = new Diagram(dbName);
      diagram1.attach(`#${htmlFixture.data.getAttribute("id")!}`);
      expect(htmlFixture.data.childElementCount).toBe(1);
      expect(htmlFixture.data.children[0].tagName).toBe("svg");
      expect(htmlFixture.data.children[0]).toBe(diagram1.native);
      diagram1.detach();

      const diagram2 = new Diagram(dbName);
      diagram2.attach(htmlFixture.data.getAttribute("id")!);
      expect(htmlFixture.data.childElementCount).toBe(1);
      expect(htmlFixture.data.children[0].tagName).toBe("svg");
      expect(htmlFixture.data.children[0]).toBe(diagram2.native);
      diagram2.detach();
   });

   it("verify attribute", () => {
      const expectedAttr = loadAttributeFixture("svg.attr.json");
      const diagram = new Diagram(expectedAttr, expectedAttr);
      diagram.attach(htmlFixture.data);
      const attr = loadAttributeFrom(diagram.native);
      // remove function toString as we only care about properties
      delete expectedAttr.viewBox.toString;
      delete attr.viewBox!.toString;
      expect(attr).toEqual(expectedAttr);
      diagram.detach();
   });

   it("create table", () => {
      const opt = loadAttributeFixture("svg.attr.json");
      const diagram = new Diagram(dbName, opt);
      diagram.attach(htmlFixture.data);

      const verify = (table: TableGraph, tbOpt: Table, childCount: number, index: number) => {
         expect(table).toBeTruthy();
         expect(table.native).toBeTruthy();
         expect(table.native).toBeTruthy();
         expect(diagram.holder.childElementCount).toEqual(childCount);
         expect(diagram.holder.children[index] instanceof SVGGElement).toBeTruthy();
         expect(table.native).toBe(diagram.holder.children[index] as SVGGElement);

         expect(diagram.table(tbOpt)).toBeTruthy();
         expect(diagram.indexOf(table)).toEqual(index);
      };

      const tbOpt1: Table = { name: "Table1", database: dbName };
      const tb1 = diagram.table(tbOpt1);
      verify(tb1!, tbOpt1, 1, 0);

      const tbOpt2: Table = { name: "Table2", database: dbName };
      const tb2 = diagram.table(tbOpt2);
      verify(tb2!, tbOpt2, 2, 1);

      const tbOpt3: Table = { name: "Table3", database: dbName };
      const tb3 = diagram.table(tbOpt3);
      verify(tb3!, tbOpt3, 3, 2);

      expect(diagram.allTables()).toBeTruthy();
      expect(diagram.tableCount).toEqual(3);

      const tb1RM = diagram.table(tbOpt1, true);
      expect(tb1RM).toEqual(tb1);
      expect(diagram.indexOf(tb1!)).toEqual(-1);
      expect(diagram.tableCount).toEqual(2);
      expect(diagram.holder.childElementCount).toEqual(2);
      expect(tb1!.native.parentElement).toBeNull();
      diagram.detach();
   });

});
