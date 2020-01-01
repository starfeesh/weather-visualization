const express = require('express')
const app = express()
const Lookup = require('./lookup.js')
const CityInfoGetter = require('./infogetter.js')

module.exports = class WebServer {
  constructor(config) {
    app.use(function (req, res, next) {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
      next()
    })

    app.get('/getcity', async (req, res) => {
      let city = req.query.name

      res.send(await new CityInfoGetter(city, config.db))
    })
    app.get('/getsunset', async (req, res) => {
      let lat = req.query.lat
      let lon = req.query.lon
    })

    app.use(express.static('src/public'))

    try {
      app.listen(config.webport)
    } catch (err) {
      console.error(err.message)
    }
  }
}
