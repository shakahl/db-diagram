<template>
  <div id="diagram"></div>
</template>

<script>
import { Diagram, Relation } from "@krobkrong/db-diagram";

export default {
  name: "Diagram",
  mounted: async () => {
    const diagram = new Diagram({ height: "100%" }).attach("#diagram");
    const data = await fetch(
      "https://storage.googleapis.com/krobkrong/sample.table.json"
    ).then(response => {
      if (response.ok) return response.json();
      // handle error here
    });

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
  }
};
</script>

<style scoped>
#diagram {
  width: 100vw;
  height: 100vh;
}
</style>