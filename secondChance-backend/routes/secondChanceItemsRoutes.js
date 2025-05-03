const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const itemsRouter = express.Router();
const connectToDatabase = require("../models/db");
const logger = require("../logger");
const { log } = require("console");
// const logger = require("../logger");

// Define the upload directory path
const directoryPath = "public/images";

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath); // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage: storage });

const collectionName = process.env.MONGO_COLLECTION;

// Get all secondChanceItems
itemsRouter.get("/", async (req, res, next) => {
  logger.info("/ called");
  try {
    const db = await connectToDatabase();
    const collection = db.collection(collectionName);
    const secondChanceItems = await collection.find({}).toArray();
    res.status(200).json(secondChanceItems);
  } catch (e) {
    logger.error("error", e);
    next(e);
  }
});

// Add a new item
itemsRouter.post("/", upload.single("file"), async (req, res, next) => {
  try {
    // task 3
    let secondChanceItem = req.body;
    if (!secondChanceItem) {
      next(new Error("secondChanceItem data is required"));
    }
    // task 1
    const db = await connectToDatabase();
    // task 2
    const collection = db.collection(collectionName);
    // task 4
    const itemsArray = await collection
      .find({})
      .sort({ id: -1 })
      .limit(1)
      .toArray();

    if (!Array.isArray(itemsArray) || itemsArray.length === 0) {
      logger.error("No items found in the collection");
      throw new Error("No items found in the collection");
    } else {
      const lastItem = itemsArray[0];
      secondChanceItem.id = (parseInt(lastItem.id) + 1).toString();
    }

    // task 5
    const date_added = Math.floor(new Date().getTime() / 1000);
    secondChanceItem.date_added = date_added;
    // task 6
    secondChanceItem = await collection.insertOne(secondChanceItem);

    res.status(201).json(secondChanceItem);
  } catch (e) {
    next(e);
  }
});

// Get a single secondChanceItem by ID
itemsRouter.get("/:id", async (req, res, next) => {
  try {
    let { id } = req.params;
    if (!id || isNaN(id)) {
      next(new Error("id must be a number"));
    }
    // task 1
    const db = await connectToDatabase();
    // task 2
    const collection = db.collection(collectionName);
    // task 3
    const secondChanceItem = await collection.findOne({ id });

    if (!secondChanceItem) {
      return res.status(404).send("secondChanceItem not found");
    }
    return res.status(200).json(secondChanceItem);
  } catch (e) {
    next(e);
  }
});

// Update and existing item
itemsRouter.put("/:id", async (req, res, next) => {
  try {
    const { category, condition, age_days, description } = req.body;

    const { id } = req.params;
    if (!id) {
      next(new Error("id is required"));
    }
    // task 1
    const db = await connectToDatabase();
    // task 2
    const collection = db.collection(collectionName);

    // Calculate age_years from age_days (to one decimal place)
    const age_years = parseFloat((age_days / 365).toFixed(1));

    // Calculate updatedAt from the current date
    const updatedAt = Math.floor(new Date().getTime() / 1000);

    const updateResult = await collection.updateOne(
      { id },
      {
        $set: {
          category,
          condition,
          age_days,
          age_years,
          description,
          updatedAt,
        },
      }
    );

    // task 3
    if (updateResult.matchedCount === 0) {
      return res.status(404).send("Item not found");
    }

    if (updateResult.modifiedCount === 0) {
      return res.status(304).send("No changes made to the Item");
    }

    res.status(200).send("Item updated successfully");
  } catch (e) {
    next(e);
  }
});

// Delete an existing item
itemsRouter.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      next(new Error("id is required"));
    }
    // task 1
    const db = await connectToDatabase();
    // task 2
    const collection = db.collection(collectionName);

    const deleteResult = await collection.deleteOne({ id });
    // task 3
    if (deleteResult.deletedCount === 0) {
      return res.status(404).send("Item not found");
    }

    // task 4
    return res
      .status(200)
      .send(`Item with ${id} has been deleted successfully`);
  } catch (e) {
    next(e);
  }
});

module.exports = itemsRouter;
