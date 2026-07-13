const express = require("express");
const { getDB } = require("../config/db");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const withdrawalsCollection = getDB().collection("withdrawals");

    const withdrawal = {
      ...req.body,
      status: "pending",
      withdraw_date: new Date(),
    };

    const result = await withdrawalsCollection.insertOne(withdrawal);

    res.status(201).send(result);
  } catch (error) {
    console.error("Withdrawal error:", error);

    res.status(500).send({
      message: "Failed to submit withdrawal request",
    });
  }
});

router.get("/:email", async (req, res) => {
  try {
    const withdrawalsCollection = getDB().collection("withdrawals");

    const email = req.params.email;

    const withdrawals = await withdrawalsCollection
      .find({ creator_email: email })
      .sort({ withdraw_date: -1 })
      .toArray();

    res.send(withdrawals);
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to fetch payment history",
    });
  }
});

module.exports = router;