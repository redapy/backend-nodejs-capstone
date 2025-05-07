/* eslint-disable camelcase */
const express = require('express')
const searchRouter = express.Router()
const connectToDatabase = require('../models/db')
const collectionName = process.env.MONGO_COLLECTION
// Search for gifts
searchRouter.get('/', async (req, res, next) => {
  try {
    const { name, category, condition, age_years } = req.query
    const db = await connectToDatabase()

    const collection = db.collection(collectionName)

    // Initialize the query object
    const query = {}

    // Add the name filter to the query if the name parameter is not empty
    if (name && name.trim() !== '') {
      query.name = { $regex: name, $options: 'i' } // Using regex for partial match, case-insensitive
    }

    // Task 3: Add other filters to the query
    if (category) {
      query.category = category
    }
    if (condition) {
      query.condition = condition
    }
    if (age_years && !isNaN(parseInt(age_years))) {
      query.age_years = { $lte: parseInt(age_years) }
    }

    // Task 4: Fetch filtered gifts using the find(query) method. Make sure to use await and store the result in the `gifts` constant
    const filteredItems = await collection.find(query).toArray()
    if (!Array.isArray(filteredItems) || filteredItems.length === 0) {
      return res.status(404).json({ message: 'No items found' })
    }

    res.status(200).json(filteredItems)
  } catch (e) {
    next(e)
  }
})

module.exports = searchRouter
