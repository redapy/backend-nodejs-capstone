/* jshint esversion: 8 */
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const pinoHttp = require('pino-http')
const logger = require('./logger')
// eslint-disable-next-line no-unused-vars
const { loadData } = require('./util/import-mongo/index')
const secondChanceItemsRoutes = require('./routes/secondChanceItemsRoutes')
const searchRoutes = require('./routes/searchRoutes')
const authRoutes = require('./routes/authRoutes')

const connectToDatabase = require('./models/db')

const app = express()
app.use('*', cors())
const port = 3060

// Connect to MongoDB; we just do this one time
connectToDatabase()

app.use(express.json())

// Route files
app.use(pinoHttp({ logger }))

// Use Routes
app.use('/images', express.static('public/images'))
app.use('/api/auth', authRoutes)
app.use('/api/secondchance/items', secondChanceItemsRoutes)
app.use('/api/secondchance/search', searchRoutes)

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(err)
  res.status(500).send('Internal Server Error')
})

app.get('/', (req, res) => {
  res.send('Inside the server')
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
