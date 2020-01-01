const WebServer = require('./webserver.js')
const DatabaseHandler = require('./database.js')

const db = new DatabaseHandler()
const config = {
  webport: 80,
  db: db
}
new WebServer(config)