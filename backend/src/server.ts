import { app } from './app.js'
import { config } from './config.js'
import { database } from './database.js'

const server = app.listen(config.port, () => {
  console.log(`KolayRandevu API listening on http://localhost:${config.port}`)
})

function shutdown() {
  server.close(() => {
    database.close()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
