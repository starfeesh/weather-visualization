<style>
  html, body {
    margin:0;
    padding:0;
    overflow:hidden;
  }
  div#app {
    background: transparent;
  }
  #mainCanvas {
    position: absolute;
    top: 0;
    background: transparent;
    z-index: 0;
  }
  #cityForm {
    position: fixed;
    z-index: 20;
  }
  .background-main {
    position: absolute;
    top: 0;
    width: 100vw;
    height: 100vh;
    z-index: 0;
  }
  #title {
    z-index: 10;
  }
  .stats {
      text-shadow: 2px 2px rgba(0, 0, 0, 0.30);
      z-index: 10;
      position: absolute;
      top: 50px;
      left: 50px;
  }
  .midtext {
    position: relative;
    z-index: 20;
    text-shadow: 2px 2px rgba(0, 0, 0, 0.30);
  }
  .clock {
    text-shadow: 2px 2px rgba(0, 0, 0, 0.30);
    position: absolute;
    top: 50px;
    right: 50px;
  }
  .fadeIn {
    -webkit-transition: 3s;
    -moz-transition: 3s;
    -ms-transition: 3s;
    -o-transition: 3s;
    transition: 3s;
    opacity: 1;
  }
  .fadeOut {
    -webkit-transition: 3s;
    -moz-transition: 3s;
    -ms-transition: 3s;
    -o-transition: 3s;
    transition: 3s;
    opacity: 0;
  }
</style>
<template>
  <v-container fluid fill-height class="pa-0">
    <v-layout row wrap align-end>
      <v-container fluid class="pa-0" fill-height>
        <v-layout column align-center justify-center>
          <v-container fluid class="pa-0" fill-height>
            <v-layout row align-end justify-center fill-height>
              <v-flex xs12 id="title" class="white--text">
                <div class="stats">
                  <span class="display-3 font-weight-thin">{{ currentCity }}</span>
                  <h2 class="display-2 font-weight-thin">{{ condition }}</h2>
                  <div class="display-1">{{ temperature }}&deg;</div>
                </div>
                <div class="clock">
                  <div class="text-xs-center text-uppercase font-weight-thin">As of local time</div>
                  <p class="display-3 font-weight-light">{{ localTime }}</p>
                </div>
                <div class="midtext">
                  <h1 class="display-2 font-weight-thin text-xs-center">Enter a city or town.</h1>
                  <div class="subheading text-xs-center">I will visualize (most) weather conditions.</div>
                </div>
              </v-flex>
            </v-layout>
          </v-container>
          <v-container fluid class="pa-0" fill-height>
            <v-layout row align-end justify-center fill-height>
              <v-flex xs12>
                <CityLookup class="mx-auto mb-2" id="form"></CityLookup>
              </v-flex>
            </v-layout>
          </v-container>
        </v-layout>
      </v-container>
      <div class="background-main" :style="primary" id="first"></div>
      <div class="background-main" :style="secondary" id="second"></div>
      <canvas :width="w" :height="h" id="mainCanvas"></canvas>
    </v-layout>
  </v-container>
</template>

<script>
  'use strict'
  import { Stage, Shape, Graphics, Bitmap, Tween, Ticker, Ease, Container } from 'createjs'
  import moment from 'moment'
  import CityLookup from './CityLookup'
  import helper from '../helpers/canvasHelper'

  export default {
    data: () => ({
      w: window.innerWidth,
      h: window.innerHeight,
      color: '#7728ff',
      primary: {
        background: ''
      },
      secondary: {
        background: ''
      },
      trunkBounds: {},
      prevSeason: '',
      defaultCity: 'Paris',
      leaves: [],
      grass: [],
      rain: [],
      snow: [],
      fog: [],
      clouds: [],
      condition: '',
      temperature: 0,
      localTime: ''
    }),
    computed: {
      currentCity () {
        return this.$store.getters.currentCity
      }
    },
    async mounted () {
      this.stage = new Stage('mainCanvas')
      Ticker.addEventListener("tick", this.stage)

      this.$el.querySelector('#first').state = 'active'
      this.$el.querySelector('#second').state = 'inactive'

      let response = await fetch('/data/vectors.json')
      this.vectorJson = await response.json()

      response = await fetch('/getcity?name=' + this.defaultCity)
      let dataJson = await response.json()

      this.drawHills()
      this.drawTree()
      this.drawGrass()

      this.$root.$on('checkWeather', json => {
        this.checkWeather(json)
        this.checkSeason(json)
        this.localTime = helper.timezoneToTime(json.timezone).format("HH:mm")
      });
      this.checkWeather(dataJson)
      this.checkSeason(dataJson)

      this.localTime = helper.timezoneToTime(dataJson.timezone).format("HH:mm")
    },
    methods: {
      drawSky (newGradient) {
        let first = this.$el.querySelector('#first')
        let second = this.$el.querySelector('#second')

        if (first.state === 'active') {
          first.state  = 'inactive'
          first.classList.remove('fadeIn')
          first.classList.add('fadeOut')
        } else {
         first.state = 'active'
          this.primary.background = newGradient
          first.classList.add('fadeIn')
          first.classList.remove('fadeOut')
        }

        if (second.state === 'active') {
          second.state  = 'inactive'
          second.classList.remove('fadeIn')
          second.classList.add('fadeOut')
        } else {
          second.state = 'active'
          this.secondary.background = newGradient
          second.classList.add('fadeIn')
          second.classList.remove('fadeOut')
        }
      },
      drawHills () {
        const json = this.vectorJson
        const getHillInfo = (hillType) => {
          return {
            foreground: {
              color: '#25380a',
              height: 112
            },
            midground: {
              color: '#42601e',
              height: 151
            },
            background: {
              color: '#659149',
              height: 223
            }
          }[hillType];
        }
        for (const hill in json.hills) {

          if (json.hills.hasOwnProperty(hill)) {
            const hillInfo = getHillInfo(hill)

            let hillShape = new Shape()
            hillShape.graphics.append({exec:function(ctx, shape) {
                const newHill = new Path2D(json.hills[hill])
                ctx.fillStyle = hillInfo.color
                ctx.fill(newHill)
              }})
            hillShape.setBounds(0, 0, this.w, hillInfo.height)
            hillShape.setTransform(0, this.h - hillInfo.height, 3, 1.5)
            this.stage.addChild(hillShape)
          }
        }
      },
      drawGrass () {
        const json = this.vectorJson
        const grassShape = new Shape()
        grassShape.graphics.append({exec:function(ctx, shape) {
          let grass = new Path2D(json.grass)
          ctx.fillStyle = '#75b14d'
          ctx.fill(grass);
        }});
        grassShape.setBounds(0, 0, 61, 54)
        const width = window.innerWidth - grassShape.getBounds().width
        const offset = 30
        const count = 20
        grassShape.setTransform(0, this.h - grassShape.getBounds().height)

        for (let i = 0; i < count; i++) {
          let clone = 'clone' + i
          let ranPos = Math.floor(Math.random() * (width - grassShape.getBounds().width) + grassShape.getBounds().width)
          let ranScale = Math.random() * (2.2 - 1) + 1
          clone = grassShape.clone(true)
          clone.setBounds(0, 0, 61, 54)

          clone.setTransform(ranPos, this.h + offset, ranScale, ranScale, 0, 0, 0,
            clone.getBounds().width / 4, clone.getBounds().height)

          if (i % 2) {
          clone.setTransform(ranPos, this.h + offset, '-' + ranScale, ranScale, 0, 0, 0,
            clone.getBounds().width / 4, clone.getBounds().height)
          }
          this.stage.addChild(clone)
          this.grass.push(clone)
        }
      },
      drawTree () {
        const json = this.vectorJson
        const trunk = {
          width: 455,
          height: 458,
          size: 1.5
        }
        const trunkShape = new Shape()
        trunkShape.graphics.append({exec:function(ctx, shape) {
            let trunk = new Path2D(json.trunk)
            ctx.fillStyle = '#492402'
            ctx.fill(trunk);
          }});
        let xPos = window.innerWidth / 3 * 2 // Divide width into thirds, move 1.5 thirds into width
        trunkShape.setBounds(0, 0, trunk.width * trunk.size, trunk.height * trunk.size)
        trunkShape.setTransform(xPos, this.h - trunkShape.getBounds().height, trunk.size, trunk.size)

        this.trunkBounds.height = trunkShape.getBounds().height
        this.stage.addChild(trunkShape)
        trunkShape.name = 'trunk'
      },
      async checkSeason (json) {
        const seasons = {
          december: { northern: 'winter', southern: 'summer' },
          january: { northern: 'winter', southern: 'summer' },
          february: { northern: 'winter', southern: 'summer' },

          march: { northern: 'spring', southern: 'autumn' },
          april: { northern: 'spring', southern: 'autumn' },
          may: { northern: 'spring', southern: 'autumn' },

          june: { northern: 'summer', southern: 'winter' },
          july: { northern: 'summer', southern: 'winter' },
          august: { northern: 'summer', southern: 'winter' },

          september: { northern: 'autumn', southern: 'spring' },
          october: { northern: 'autumn', southern: 'spring' },
          november: { northern: 'autumn', southern: 'spring' }
        }
        let hemisphere = ''

        if (json.lat > 0) {
          hemisphere = 'northern'
        } else {
          hemisphere = 'southern'
        }
        let month = moment(json.localtime).format('MMMM').toLowerCase()
        let season = seasons[month][hemisphere]
        switch (season) {
          case 'spring':
            this.color = '#9bb446'
            this.growLeaves()
            console.log('Spring')
            break;
          case 'summer':
            this.color = '#65b45a'
            this.growLeaves()
            console.log('Summer')
            break;
          case 'autumn':
            this.color = '#b48d4d'
            this.growLeaves()
            console.log('Autumn')
            break;
          case 'winter':
            //this.color = 'rgba(107,99,123,0)'
            this.ungrowLeaves()
            console.log('Winter')
        }

        this.prevSeason = season
      },
      async ungrowLeaves() {
        const self = this
        if (this.leafGrowAnim) {
          this.leafGrowAnim.paused = true
          if (this.leaves.length > 0) {
            let index = 0
            for (let leaf of this.leaves) {
              index++
              const ranTime = Math.floor(Math.random() * (200 - 150) + 150)
              const ranVal = Math.floor(Math.random() * (1500 - 1200) + 1200)

              await new Promise ((resolve, reject) => {
                Tween.get(leaf)
                  .to({y: window.innerHeight + 200, x: Math.sin(index * ranVal) * 5}, ranTime, Ease.linear)
                  .call(() => {
                  resolve()
                })
              })
            }
          }
        }
      },
      async growLeaves () {
        const json = this.vectorJson
        const leavesInfo = {
          width: 455,
          height: 287,
          size: 1.5
        }
        let xPos = window.innerWidth / 3 * 2 // Divide width into thirds, move 1.5 thirds into width
        let self = this
        this.leaves = json.leaves.map(leaf => {
          let leafShape = new Shape()
          leafShape.graphics.append({exec:function(ctx, shape) {
            let newLeaf = new Path2D(leaf)
            ctx.fillStyle = self.color
            ctx.fill(newLeaf);
          }});
          leafShape.setTransform(xPos, this.h - this.trunkBounds.height, 0, 0)
          this.stage.addChild(leafShape)
          return leafShape
        })
        for (const leaf of this.leaves) {
          await new Promise ((resolve, reject) => {
            this.leafGrowAnim = Tween.get(leaf)
              .to({scale: leavesInfo.size}, 250, Ease.elasticOut)
              .call(() => {
              resolve()
            })
          })
        }
      },
      async checkWeather (json) {
        this.condition = json.condition
        this.temperature = json.temperature

        await this.startTime(json.timezone, json.localtime, json.lat, json.lon)

        const rain = await json.precip
        this.startRain(rain)

        const wind = await json.wind_speed
        this.startWind(wind)

        const condition = await json.condition
        this.startSnow(condition)

        const visibility = await json.visibility
        this.startFogOrMist(condition, visibility)

        const cloudCover = await json.cloudcover
        this.startClouds(json.wind_speed, cloudCover)
      },
      startClouds (speed, cloudCover) {
        if (this.clouds.length > 0) {
          for (const cloud of this.clouds) {
            this.stage.removeChild(cloud)
          }
          this.clouds = []
        }
        const getColors = (vector) => {
          return {
            white: "rgb(250,250,250)",
            grey: "rgba(225,225,225)"
          }[vector]
        }
        const iterate = (cloudVectors) => {
          for (let cloud of cloudVectors) {
            const cloudPieces = new Container()
            for (let color in cloud) {
              if (cloud.hasOwnProperty(color)){
                cloud[color].map(data => {
                  let shape = new Shape()
                  shape.graphics.append({
                    exec: function (ctx, shape) {
                      const newPath = new Path2D(data)
                      ctx.fillStyle = getColors(color)
                      ctx.fill(newPath)
                    }
                  })
                  shape.setBounds(0, 0, 100, 60)
                  cloudPieces.addChild(shape)
                })
              }
            }
            this.clouds.push(cloudPieces)
          }
        }
        if (cloudCover > 0) {
          iterate(this.vectorJson.clouds)
        } else if (this.clouds.length > 0) {
          for (const cloud of this.clouds) {
            this.stage.removeChild(cloud)
          }
          this.clouds = []
        }

        for (let i = 0; i < Math.floor(cloudCover / 2); i++) {
          let clone = this.clouds[Math.floor(Math.random() * this.clouds.length)].clone(true)
          this.clouds.push(clone)
        }
        for (let cloud of this.clouds) {
          const x = Math.floor(Math.random()* -this.w)
          const ranY = Math.floor(Math.random()* this.h) - 100
          const scale = Math.random() * (1.5 - 1) + 1


          cloud.setTransform(x, ranY, scale, scale)
          this.stage.addChild(cloud)
          this.stage.setChildIndex(cloud, 0)

          const movementSpeed = Math.floor(Math.random() * (speed * 5000 - 30000) + 30000)

          Tween.get(cloud, {loop: true})
            .to({x:window.innerWidth}, movementSpeed)
            .to({x: 0}, 0)

          this.stage.update()
        }

      },
      async startFogOrMist (condition, visibility) {
        if (this.fog.length > 0) {
          for (const layer of this.fog) {
            this.stage.removeChild(layer)
          }
          this.fog = []
        }

        let lowercaseCondition = condition.toLowerCase()

        if (lowercaseCondition.includes('fog') || lowercaseCondition.includes('mist')) {
          let img = new Image(),
                  fogLayer = new Bitmap(img);

          img.onload = () => {
            fogLayer.scaleX = window.innerWidth / img.width * 3
            fogLayer.scaleY = window.innerHeight / img.height

            let w = img.width * 3

            this.fog.push(fogLayer)
            this.stage.addChild(fogLayer)

            this.stage.update()

            Tween.get(fogLayer, {loop: true, bounce: true})
                    .to({x: fogLayer.x - w}, 60000)
          }
          img.src = "/assets/fog-2.png"
        }
      },
      async startSnow (condition) {
        if (this.snow.length > 0) {
          for (const flake of this.snow) {
            this.stage.removeChild(flake)
          }
          this.snow = []
        }

        let amount = 0
        let lowercaseCondition = condition.toLowerCase()
        if (lowercaseCondition.includes('snow')) {
          if (lowercaseCondition.includes('heavy')) {
            amount = 1
          }
          else if (lowercaseCondition.includes('moderate')) {
            amount = 0.66
          }
          else if (lowercaseCondition.includes('light')) {
            amount = 0.33
          }
        }
        let maxSnow = amount * 300
        const g = new Graphics()
        g.beginFill('rgba(255,255,255, 1)')
        g.drawCircle(0,0,3)

        const s = new Shape(g)
        s.y = -100

        for (let i = 0; i < maxSnow; i++) {
          let clone = 'clone' + i
          let ranX = Math.floor(Math.random() * window.innerWidth)
          let y = -200
          let ranSize = 5 * Math.random()

          clone = s.clone(true)
          clone.setTransform(ranX, y, ranSize, ranSize)
          this.stage.addChild(clone)
          this.snow.push(clone)
        }
        this.stage.addChild(s)
        for (const flake of this.snow) {
          const ranTime = Math.floor(Math.random() * (6000 - 500) + 500)

          Tween.get(flake, {loop: true})
            .to({ y:this.h + 200, alpha: Math.random() }, ranTime, Ease.linear)
        }
      },
      async startTime (timestamp, localtime, lat, lon) {
        const t = helper.timezoneToTime(timestamp).hours()
        const grad = await helper.getGradients(timestamp, t, lat, lon)

        let sky = this.drawSky(helper.gradientFromData(grad))
      },
      async startRain (amount) {

        if (amount) {
          if (this.rain.length > 0) {
            for (const drop of this.rain) {
              this.stage.removeChild(drop)
            }
            this.rain = []
          }

          const maxRain = 40 * amount
          const g = new Graphics()
          g.lf(['rgba(103,209,251,0.3)','rgba(255,255,255,0.6)'], [0, 1], 1, 0, 1, 90)
          g.drawRect(0, 0, 2, 90)

          const s = new Shape(g)
          s.y = -100

          for (let i = 0; i < maxRain; i++) {
            let clone = 'clone' + i
            let ranX = Math.floor(Math.random() * window.innerWidth)
            let y = -200
            clone = s.clone(true)
            clone.setTransform(ranX, y, 1, 1)
            this.stage.addChild(clone)
            this.rain.push(clone)
          }
          this.stage.addChild(s)
          for (const drop of this.rain) {
            const ranTime = Math.floor(Math.random() * (1000 - 300) + 300)

            Tween.get(drop, {loop: true})
              .to({y: this.h + 200}, ranTime, Ease.linear)
            }
        } else if (this.rain.length > 0 && !amount) {
          for (const drop of this.rain) {
            this.stage.removeChild(drop)
          }
          this.rain = []
        } else {
          this.rain = []
        }
      },
      startWind (amount) {
        let scale = 45 / 60 * amount
        const max = scale += 5
        const min = scale -= 5
        const rotAmount = Math.floor(Math.random() * (max - min) + min)
        let windyGrass = this.grass.map(blade => {
          Tween.get(blade, {loop: true, bounce: true})
            .to({rotation: rotAmount}, 1200)
        })
      }
    },
    components: {
      CityLookup
    }
  }
</script>
