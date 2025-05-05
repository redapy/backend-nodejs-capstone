const authRouter = require("express").Router();
const logger = require("../logger");
const connectToDatabase = require("../models/db");
const bcrypt = require("bcrypt");
const collectionName = process.env.MONGO_USER_COLLECTION;
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

authRouter.post("/register", async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    // get users collection
    const db = await connectToDatabase();
    const usersCollection = db.collection(collectionName);

    // check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      logger.error("Email id already exists");
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password and store data
    const salt = await bcrypt.genSalt();
    const hashedPswd = await bcrypt.hash(password, salt);

    const result = await usersCollection.insertOne({
      email,
      password: hashedPswd,
      firstName: firstName || "",
      lastName: lastName || "",
      createdAt: new Date(),
    });

    const userId = result.insertedId;
    if (!userId) {
      logger.error("Error creating user");
      return res.status(500).json({ message: "Error creating user" });
    }

    // create JWT token
    const payload = {
      user: {
        id: userId,
      },
    };
    const authtoken = jwt.sign(payload, jwtSecret, {
      expiresIn: JWT_EXPIRES_IN,
    });

    logger.info("User registered successfully");
    return res.status(200).json({ authtoken, email });
  } catch (e) {
    logger.error("Error in register route", e);
    next(e);
  }
});

module.exports = authRouter;
