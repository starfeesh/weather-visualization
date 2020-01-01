const moment = require('moment')
const momenttz = require('moment-timezone')

export default {
  async getGradients (timezone, hour, lat, lon) {
    let response = await fetch('/data/daygradients.json')
    let dayGradients = await response.json()

    response = await fetch('/data/nightgradients.json')
    let nightGradients = await response.json()

    response = await fetch('https://api.sunrise-sunset.org/json?lat=' + lat + '&lng=' + lon)
    let sunJson = await response.json()

    const now = this.timezoneToTime(timezone)

    let sunrise = moment(sunJson.results.sunrise, 'hh:mm:ss a').tz(timezone)
    let sunset = moment(sunJson.results.sunset, 'hh:mm:ss a').tz(timezone)

    let daylightDuration = moment.duration(sunJson.results.day_length)
    let nightDuration = moment.duration(24, 'hours').subtract(daylightDuration)

    let timeSinceSunrise = now.diff(sunrise)
    let timeSinceSunset = now.diff(sunset)
    let progressThroughDaylight = moment.duration(timeSinceSunrise) / daylightDuration
    let progressThroughNight = moment.duration(timeSinceSunset) / nightDuration

    let progressThroughDayGradients = Math.floor(dayGradients.gradients.length * progressThroughDaylight)
    let progressThroughNightGradients = Math.floor(nightGradients.gradients.length * progressThroughNight)

    let nowTime = moment(now).set({'year': now.year(), 'month': now.month(), 'date': now.date()})
    let sunriseTime = moment(sunrise).set({'year': now.year(), 'month': now.month(), 'date': now.date()})
    let sunsetTime = moment(sunset).set({'year': now.year(), 'month': now.month(), 'date': now.date()})

    if (nowTime.isBetween(sunriseTime, sunsetTime)) {
      return dayGradients.gradients[progressThroughDayGradients]
    } else {
      return nightGradients.gradients[progressThroughNightGradients]
    }
  },
  roundToHour(m) {
    const interval = 60 //minutes
    const roundedMinutes = Math.round(m.clone().minute() / interval) * interval

    return m.clone().minute(roundedMinutes).second(0).format('H')
  },
  gradientFromData (gradients) {
    let string = "linear-gradient(to bottom, ";
    let stops = gradients.length

    for (let i = 0; i < stops; i++) {
      let colorStop = gradients[i]
      string += " #" + colorStop.color + " " + colorStop.position + "%"
      if (i < stops - 1 ) string += ","
    }
    return string + ")"
  },
  timezoneToTime (timestamp) {
    return momenttz().tz(timestamp)
  }
}