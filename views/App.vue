<template>
  <Layout></Layout>
</template>

<script>
  import Layout from './layouts/Layout'

  export default {
    computed: {
      layout () {
        return this.$store.getters.layout
      }
    },
    components: {
      Layout

    }
  }
</script>
