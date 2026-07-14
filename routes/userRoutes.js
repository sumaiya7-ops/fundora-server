const express = require("express");
const { getDB } = require("../config/db");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const usersCollection = getDB().collection("users");
    const { name, email, photoURL, role } = req.body;

    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      return res.status(200).send({
        message: "User already exists",
        user: existingUser,
      });
    }

    const credits = role === "supporter" ? 50 : 20;

    const newUser = {
      name,
      email,
      photoURL,
      role,
      credits,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    res.status(201).send({
      message: "User created successfully",
      insertedId: result.insertedId,
      user: newUser,
    });
  } catch (error) {
    console.error("Create user error:", error);

    res.status(500).send({
      message: "Failed to create user",
    });
  }
});

router.get("/:email", async (req, res) => {
  try {
    const usersCollection = getDB().collection("users");
  const email = req.params.email;

const user = await usersCollection.findOne({
  email: {
    $regex: `^${email}$`,
    $options: "i",
  },
});
    if (!user) {
      return res.status(404).send({
        message: "User not found",
      });
    }

    res.status(200).send(user);
  } catch (error) {
    console.error("Get user error:", error);

    res.status(500).send({
      message: "Failed to get user",
    });
  }
});

module.exports = router;