<template>
  <div id="app">
    <img id="share-svg" svg-inline src="../node_modules/@krobkrong/db-diagram/dist/resources/icons.svg" />
    <Diagram />
  </div>
</template>

<script>
import Diagram from './components/Diagram.vue'

export default {
  name: 'app',
  components: {
    Diagram
  }
}
</script>

<style src="../node_modules/@krobkrong/db-diagram/dist/resources/styles/style-dark.css">
</style>
<style>
body, html {
  margin: 0;
  padding: 0;
}

#share-svg {
  position: absolute;
  left: 0;
  top: 0;
  width: 1px;
  height: 1px;
}

#app {
  width: 100vw;
  height: 100vh;
}
</style>
