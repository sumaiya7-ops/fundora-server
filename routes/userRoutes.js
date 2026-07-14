const express = require("express");
const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

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

router.get("/admin-stats", async (req, res) => {
  try {
    const usersCollection = getDB().collection("users");
    const paymentsCollection = getDB().collection("payments");

    const users = await usersCollection.find().toArray();

    const payments = await paymentsCollection.find().toArray();

    const totalSupporters = users.filter(
      (user) => user.role === "supporter"
    ).length;

    const totalCreators = users.filter(
      (user) => user.role === "creator"
    ).length;

    const totalCredits = users.reduce(
      (sum, user) => sum + Number(user.credits || 0),
      0
    );

    const totalPayments = payments.length;

    res.status(200).send({
      totalSupporters,
      totalCreators,
      totalCredits,
      totalPayments,
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    res.status(500).send({
      message: "Failed to fetch admin stats",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const usersCollection = getDB().collection("users");

    const users = await usersCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).send(users);
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).send({
      message: "Failed to fetch users",
    });
  }
});

router.patch("/role/:id", async (req, res) => {
  try {
    const usersCollection = getDB().collection("users");

    const { role } = req.body;

    const result = await usersCollection.updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      {
        $set: {
          role,
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({
        message: "User not found",
      });
    }

    res.status(200).send({
      message: "User role updated successfully",
    });
  } catch (error) {
    console.error("Update role error:", error);

    res.status(500).send({
      message: "Failed to update user role",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const usersCollection = getDB().collection("users");

    const result = await usersCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).send({
        message: "User not found",
      });
    }

    res.status(200).send({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).send({
      message: "Failed to delete user",
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