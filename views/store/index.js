import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export const store = new Vuex.Store({
  state: {
    layout: 'layout',
    currentCity: 'Paris'
  },
  mutations: {
    SET_LAYOUT (state, payload) {
      state.layout = payload
    },
    setCity (state, city) {
      state.currentCity = city
    }
  },
  getters: {
    layout (state) {
      return state.layout
    },
    currentCity (state) {
      return state.currentCity
    }
  }
})