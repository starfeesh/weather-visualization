module.exports = class CityInfoGetter {
  constructor (city, db) {
    return this.checkDatabase(city, db)

  }
  async checkDatabase (city, db) {
    return await db.insertCityIfNotExists(city)

  }
}