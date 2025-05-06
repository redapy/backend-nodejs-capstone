const authRouter = require("express").Router();
const logger = require("../logger");
const connectToDatabase = require("../models/db");
const bcrypt = require("bcrypt");
const collectionName = process.env.MONGO_USER_COLLECTION;
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const { body, validationResult } = require("express-validator");

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

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    // get users collection
    const db = await connectToDatabase();
    const usersCollection = db.collection(collectionName);

    // check if user already exists
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      logger.error("Passwords do not match");
      return res.status(404).json({ error: "Wrong pasword" });
    }

    const { _id, firstName } = user;
    const payload = {
      user: {
        id: _id.toString(),
      },
    };
    const authtoken = jwt.sign(payload, jwtSecret, {
      expiresIn: JWT_EXPIRES_IN,
    });
    res.status(200).json({ authtoken, firstName, email });
  } catch (e) {
    logger.error("Error in login route", e);
    next(e);
  }
});

// Validation middleware
const validateUpdate = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),
];

authRouter.put("/update", validateUpdate, async (req, res) => {
  // Step 1: Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error("Validation failed", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  // Step 2: Check for email in headers
  const email = req.headers.email;
  if (!email) {
    logger.error("Email not found in request headers");
    return res
      .status(400)
      .json({ error: "Email is required in request headers" });
  }

  try {
    // Step 3: Connect to DB and get collection
    const db = await connectToDatabase();
    const usersCollection = db.collection(collectionName);

    // Step 4: Check if user exists
    const existingUser = await usersCollection.findOne({ email });

    if (!existingUser) {
      logger.error("User not found");
      return res.status(404).json({ error: "User not found" });
    }

    // Step 5: Update user data
    const updateData = {
      firstName: req.body.name,
      updatedAt: new Date(),
    };

    const result = await usersCollection.findOneAndUpdate(
      { email },
      { $set: updateData },
      { returnDocument: "after" }
    );

    // Step 6: Create JWT
    const payload = { user: { id: result?._id?.toString() } };
    const authtoken = jwt.sign(payload, jwtSecret, {
      expiresIn: JWT_EXPIRES_IN,
    });

    logger.info("User updated successfully");
    return res.status(200).json({ authtoken });
  } catch (err) {
    logger.error("Error updating user", err);
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = authRouter;
