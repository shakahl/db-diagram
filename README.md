# SVG Database Diagram

[![npm][npm-beta]][npm-url]
[![npm][npm-latest]][npm-url]
[![test][test]][test-url]
[![coverage][cover]][cover-url]
[![Codacy Badge][codacy]][codacy-url]

### Browsers support

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br>IE / Edge | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br>Safari |
| --------- | --------- | --------- | --------- |
| N/A | 68+ | 75+ | 12.1+ |

A lightweight library for manipulating Database diagram using SVG, without any dependencies.

**Note:** Edge browser's latest is a fork of Chromium project, we expect the browser to work fine as Chrome does. As for older version of Edge(17), it does support inline SVG element however it hasn't been tested.

## Start using database diagram

### Using Node Module

```bash
yarn add @krobkrong/db-diagram@beta
```
or
```bash
npm install @krobkrong/db-diagram@beta
```

For more example on how to use it with VueJS, React, Angular ...etc see [examples](example)

### Using CDN

#### Default embed style and icons

The default javascript is embeded stylesheet as well as icons within javascrit itself thus you don't need to include stylesheet or embed svg icons into HTML Document. By default, dark theme is being used. If you want to customize or using light theme then see below instruction [Customizable style and icons](#customizable-style-and-icons).

[https://storage.googleapis.com/krobkrong/db-diagram.default.js](https://storage.googleapis.com/krobkrong/db-diagram.default.js)
[https://storage.googleapis.com/krobkrong/db-diagram.default.min.js](https://storage.googleapis.com/krobkrong/db-diagram.default.min.js)

#### Customizable style and icons

Customizable via stylesheet and svg content. This version of javascript does not embeded stylesheet or svg icons thus your you need to include stylesheet and embed SVG icons inline into your HTML Documentation. This way, allow you to change stylesheet as well as icons as your deserve.

[https://storage.googleapis.com/krobkrong/db-diagram.js](https://storage.googleapis.com/krobkrong/db-diagram.js)
[https://storage.googleapis.com/krobkrong/db-diagram.min.js](https://storage.googleapis.com/krobkrong/db-diagram.min.js)

##### Icons

[https://storage.googleapis.com/krobkrong/resources/icons.svg](https://storage.googleapis.com/krobkrong/resources/icons.svg)

##### Stylesheets

[https://storage.googleapis.com/krobkrong/resources/styles/style-dark.css](https://storage.googleapis.com/krobkrong/resources/styles/style-dark.css)
[https://storage.googleapis.com/krobkrong/resources/styles/style-light.css](https://storage.googleapis.com/krobkrong/resources/styles/style-light.css)

Add the style into your HTML header.

```html
<link rel="stylesheet" type="text/css" href="https://storage.googleapis.com/krobkrong/resources/styles/style-dark.css">
```

Add the below code into your HTML body.

```html
<div id="mydiv" style="width: 100%; height:100%;"></div>
<script src="https://storage.googleapis.com/krobkrong/db-diagram.js"></script>
<script>
    DBDiagram.onDomReady(async () => {
        await DBDiagram.addIconSet("https://storage.googleapis.com/krobkrong/resources/icons.svg");
        var diagram = new DBDiagram.Diagram({height: '100%'}).attach("#mydiv");
        const data = await fetch('https://storage.googleapis.com/krobkrong/sample.table.json')
        .then((response) => {
            if (response.ok) return response.json();
            // handle error here
        });
        let tables = [];
        data.forEach(tbOpt => {
            const fields = tbOpt.fields;
            delete tbOpt.fields;
            const table = diagram.table(tbOpt);
            fields.forEach((field) => { table.addField(field) });
            tables.push(table);
        });

        tables[0].x(100).y(50);
        tables[1].x(450).y(120);
        tables[2].x(150).y(320);

        const relation1 = new DBDiagram.Relation(diagram, {
            primaryTable: tables[0],
            foreignTable: tables[1],
            line: false,
            weak: true
        });
        const relation2 = new DBDiagram.Relation(diagram, {
            primaryTable: tables[2],
            foreignTable: tables[1],
            line: false,
            weak: true
        });
      });
</script>
```

## Contribution

### Development

Before you can start develop **db-diagram** you will need to install all the dependencies.

1.  Install dependencies run `yarn install` or `npm install`.
2.  Try demo, run the command `yarn serve` or `npm run serve` then browse to the address [http://localhost:8080](http://localhost:8080)
3.  Automate test the project, run the command `yarn test:headless` or `npm run test:headless`

Note: To run command `yarn test:headless`, you must have at least Chrome and Firefox installed on your machine. To run the test with your available browser use `yarn test --browsers=Chrome,Firefox,Safari` instead.

The project, **db-diagram** is young and welcome any contributor to the project.

## Documentation

[To Be Available](https://github.com/krobkrong/db-diagram)

[npm-beta]: https://img.shields.io/npm/v/@krobkrong/db-diagram/beta.svg
[npm-latest]: https://img.shields.io/npm/v/@krobkrong/db-diagram/latest.svg
[npm-url]: https://www.npmjs.com/package/@krobkrong/db-diagram

[test]: https://circleci.com/gh/krobkrong/db-diagram.svg?style=svg
[test-url]: https://circleci.com/gh/krobkrong/db-diagram

[cover]: https://codecov.io/gh/krobkrong/db-diagram/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/krobkrong/db-diagram

[codacy]: https://api.codacy.com/project/badge/Grade/2ba7d698a9de48b8bd091666f0ec0913
[codacy-url]: https://www.codacy.com/manual/cmidt-veasna/db-diagram?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=krobkrong/db-diagram&amp;utm_campaign=Badge_Grade
