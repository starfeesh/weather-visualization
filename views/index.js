import Vue from 'vue'
import App from './App'
import Layout from './layouts/Layout'
import router from './router'
import { store } from './store'

Vue.prototype.$eventBus = new Vue({
  el: '#app',
  router,
  store,
  components: { Layout },
  template: '<Layout/>'
})
