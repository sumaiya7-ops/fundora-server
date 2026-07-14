const express = require("express");
const { getDB } = require("../config/db");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const paymentsCollection = getDB().collection("payments");
    const usersCollection = getDB().collection("users");

    const payment = req.body;

    const result = await paymentsCollection.insertOne({
      ...payment,
      payment_date: new Date(),
    });

    await usersCollection.updateOne(
      { email: payment.supporter_email },
      {
        $inc: {
          credits: Number(payment.credits),
        },
      }
    );

    res.status(201).send({
      message: "Payment successful",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Payment error:", error);

    res.status(500).send({
      message: "Payment failed",
    });
  }
});

router.get("/:email", async (req, res) => {
  try {
    const paymentsCollection = getDB().collection("payments");

    const payments = await paymentsCollection
      .find({
        supporter_email: req.params.email,
      })
      .sort({
        payment_date: -1,
      })
      .toArray();

    res.status(200).send(payments);
  } catch (error) {
    console.error("Payment history error:", error);

    res.status(500).send({
      message: "Failed to fetch payment history",
    });
  }
});

module.exports = router;