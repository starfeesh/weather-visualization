const axios = require('axios')

module.exports = class Lookup {
  constructor (city) {
    this.key = '007ee10036824cb1d8146997d182f13e'
    this.city = city

    this.placeholder = {
      location: {
          name: 'Paris',
          country: 'France',
          lat: 48.867,
          lon: 2.333,
          localtime: '2019-12-12 15:00',
          timezone_id: 'Europe/Paris',
      },
      current: {
          temperature: 8,
          condition_code: 113,
          weather_descriptions: ['Sunny'],
          wind_speed: 9,
          precip: 10,
          cloudcover: 0,
          visibility: 10
      }
    }
  }

  async requestEntry () {
    const response = await axios.get('http://api.weatherstack.com/current?access_key=' + this.key + '&query=' + this.city)
    const json = await response.data
    console.log(json)
    return json
  }
}