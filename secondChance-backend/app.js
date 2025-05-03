/*jshint esversion: 8 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const secondChanceItemsRoutes = require("./routes/secondChanceItemsRoutes");

const connectToDatabase = require("./models/db");

const app = express();
app.use("*", cors());
const port = 3060;

// Connect to MongoDB; we just do this one time
connectToDatabase();

app.use(express.json());

// Route files

// authRoutes Step 2: import the authRoutes and store in a constant called authRoutes
//{{insert code here}}

// Search API Task 1: import the searchRoutes and store in a constant called searchRoutes
//{{insert code here}}

const pinoHttp = require("pino-http");
const logger = require("./logger");

app.use(pinoHttp({ logger }));

// Use Routes
// authRoutes Step 2: add the authRoutes and to the server by using the app.use() method.
//{{insert code here}}

app.use("/api/secondchance/items", secondChanceItemsRoutes);

// Search API Task 2: add the searchRoutes to the server by using the app.use() method.
//{{insert code here}}

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).send("Internal Server Error");
});

app.get("/", (req, res) => {
  res.send("Inside the server");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
