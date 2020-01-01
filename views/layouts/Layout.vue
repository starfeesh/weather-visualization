<style>
  #nav {
    z-index: 30;
  }
  #form {
    z-index: 20;
  }
</style>
<template>
  <v-app>
    <v-content app>
      <v-responsive :max-height="mainH" :height="mainH">
        <MainCanvas></MainCanvas>
      </v-responsive>
    </v-content>

  </v-app>
</template>

<script>
  import MainCanvas from '../components/Canvas'

  export default {
    data: () => ({
      mainH: window.innerHeight,
      drawer: true,
      mini: true,
      right: null
    }),
    props: {
      source: String
    },
    components: {
      MainCanvas
    }
  }
</script>

