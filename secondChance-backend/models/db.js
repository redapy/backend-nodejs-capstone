require("dotenv").config();
const logger = require("../logger");
const { MongoClient } = require("mongodb");

const url = process.env.MONGO_URL;
const dbName = process.env.MONGO_DB;

let dbInstance = null;
let client = null;

async function connectToDatabase() {
  if (dbInstance) return dbInstance;

  try {
    client = new MongoClient(url);
    await client.connect();

    await client.db("admin").command({ ping: 1 });
    logger.info(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    dbInstance = client.db(dbName);
    return dbInstance;
  } catch (e) {
    logger.error("Failed to connect to DB", e);
    throw e;
  }
}

module.exports = connectToDatabase;
