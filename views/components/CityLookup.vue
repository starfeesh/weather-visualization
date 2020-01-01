<template>
  <v-card class="elevation-12" width="410" tile>
    <v-form v-model="valid" ref="form">
      <v-container grid-list-md text-xs-center fill-height>
        <v-layout row wrap align-center>
          <v-flex xs7>
            <v-text-field
                v-model="cityName"
                :rules="nameRules"
                :counter="30"
                label="City name"
                required
                @keydown.enter.prevent
            ></v-text-field>
          </v-flex>
          <v-flex xs4 class="mx-auto">
            <v-btn
                :disabled="!valid"
                @click="submit"
            >
              Get weather
            </v-btn>
          </v-flex>
        </v-layout>
      </v-container>
    </v-form>
  </v-card>
</template>

<script>
  import axios from 'axios'
  import Content from './Canvas'
  export default {
    data: () => ({
      valid: true,
      cityName: 'Paris',
      nameRules: [
        v => !!v || 'City name is required',
        v => (v.length && v.length >= 2) || 'City name must be more than 2 characters'
      ]
    }),
    async mounted () {
      const response = await fetch('/getcity?name=' + this.cityName)
      const json = await response.json()
    },
    methods: {
      async submit () {
        try {
          const response = await fetch('/getcity?name=' + this.cityName)
          const json = await response.json()
          this.$store.commit('setCity', this.cityName)
          //this.$parent.checkWeather(json)
          this.$root.$emit('checkWeather', json);
        } catch (err) {
          console.error(err.message)
        }

      }
    }
  }
</script>