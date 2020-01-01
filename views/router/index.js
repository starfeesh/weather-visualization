import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import Router from 'vue-router'
import Layout from '../layouts/Layout'
import Content from '../components/Canvas'
import CityLookup from '../components/CityLookup'

Vue.use(Router)
Vue.use(Vuetify)
export default new Router({
  routes: [
    { path: '/',
      component: Layout,
      children: [
        {
          path: '/',
          component: Content,
          children: [
            {
              path: '',
              component: CityLookup,

            }
          ]
        }
      ]
    }
  ]
})
