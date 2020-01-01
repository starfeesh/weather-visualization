const sqlite = require('sqlite3')
const db = new sqlite.Database('weather.db')
const LookupHandler = require('./lookup.js')

module.exports = class DatabaseHandler {
  constructor () {
    this.initializeDatabase()
  }

  initializeDatabase () {
    this.createTable(
      `CREATE TABLE weather
      (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city VARCHAR(128) NOT NULL,
        country VARCHAR(16) NOT NULL,
        lat INTEGER NOT NULL,
        lon INTEGER NOT NULL,
        localtime VARCHAR (32) NOT NULL,
        timezone VARCHAR(32) NOT NULL,
        temperature INTEGER NOT NULL,
        weather_code INTEGER NOT NULL,
        condition VARCHAR(64) NOT NULL,
        wind_speed INTEGER NOT NULL,          
        precip INTEGER NOT NULL,
        cloudcover INTEGER NOT NULL,
        visibility INTEGER NOT NULL,
        retrieved DATETIME NOT NULL
      );`, 'weather')
  }

  checkIfTableExists (tableName) {
    let stmt = db.prepare(`SELECT COUNT(*) AS tablecount FROM sqlite_master WHERE type = 'table' AND name = ?`)
    return new Promise((resolve, reject) => {
      stmt.all([tableName], function (err, rows) {
        if (!err) {
          resolve(rows[0].tablecount)
        } else {
          reject(new Error('Failed to resolve promise: select tablecount from sqlite_master'))
        }
      })
    })
  }

  async createTable (statement, name) {
    if (await this.checkIfTableExists(name) !== 1) {
      await new Promise((resolve, reject) => {
        try {
          db.run(statement, [], (err, result) => {
            if (!err) {
              resolve(result)
            } else {
              reject(new Error('Failed to resolve promise in createTable method'))
            }
          })
        } catch (err) {
          console.error(err.message)
        }
      })
    }
  }

  insertCityIfNotExists (city) {
    let stmt = db.prepare(`SELECT COUNT(*) AS matches FROM weather WHERE city = ? AND retrieved > date('now','-1 day')`)
    return new Promise((resolve, reject) => {
      stmt.all([city], async function (err, rows) {
        if (!err) {
          if (rows[0].matches > 0) {
            let select = db.prepare(`
            SELECT city, country, lat, lon, localtime, timezone, temperature, weather_code, condition, wind_speed, 
            precip, cloudcover, visibility, retrieved FROM weather WHERE city = ? ORDER BY retrieved DESC`)
            select.all([city], function (err, result) {
              if (!err) {
                resolve(result[0])
              } else {
                reject(new Error('Failed to resolve promise selecting weather details'))
              }
            })
          } else {
            let lookup = new LookupHandler(city)
            let freshData = await lookup.requestEntry()
            console.log(freshData)

            let stmt = db.prepare(`
            INSERT INTO weather 
              (
              city, 
              country, 
              lat,
              lon,
              localtime,
              timezone, 
              temperature,
              weather_code, 
              condition, 
              wind_speed, 
              precip, 
              cloudcover, 
              visibility, 
              retrieved
              ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)

            stmt.run(
              freshData.location.name, freshData.location.country, freshData.location.lat, freshData.location.lon, freshData.location.localtime,
              freshData.location.timezone_id,
              freshData.current.temperature, freshData.current.weather_code, freshData.current.weather_descriptions[0],
              freshData.current.wind_speed, freshData.current.precip, freshData.current.cloudcover, freshData.current.visibility,
              new Date().toISOString())
            stmt.finalize()

            const data = {
              city: freshData.location.name,
              country: freshData.location.country,
              lat: freshData.location.lat,
              lon: freshData.location.lon,
              localtime: freshData.location.localtime,
              timezone: freshData.location.timezone_id,
              temperature: freshData.current.temperature,
              weather_code: freshData.current.weather_code,
              condition: freshData.current.weather_descriptions[0],
              wind_speed: freshData.current.wind_speed,
              precip: freshData.current.precip,
              cloudcover: freshData.current.cloudcover,
              visibility: freshData.current.visibility,
              retrieved: new Date().toISOString()
            }
            resolve(data)

            //DELETE FROM weather WHERE retrieved < now - 5 days
          }
        } else {
          reject(new Error('Failed to resolve promise in insertCityIfNotExists'))
        }
      })
    })
  }
}


console.log('here')

