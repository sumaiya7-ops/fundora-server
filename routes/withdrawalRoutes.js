const express = require("express");
const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

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

router.get("/pending", async (req, res) => {
  try {
    const withdrawalsCollection = getDB().collection("withdrawals");

    const withdrawals = await withdrawalsCollection
      .find({
        status: "pending",
      })
      .sort({ withdraw_date: -1 })
      .toArray();

    res.status(200).send(withdrawals);
  } catch (error) {
    console.error("Pending withdrawals error:", error);

    res.status(500).send({
      message: "Failed to fetch pending withdrawals",
    });
  }
});

router.patch("/approve/:id", async (req, res) => {
  try {
    const withdrawalsCollection = getDB().collection("withdrawals");
    const campaignsCollection = getDB().collection("campaigns");
    const notificationsCollection = getDB().collection("notifications");

   
    const withdrawal = await withdrawalsCollection.findOne({
      _id: new ObjectId(req.params.id),
      status: "pending",
    });

    if (!withdrawal) {
      return res.status(404).send({
        message: "Withdrawal not found",
      });
    }

    await campaignsCollection.updateOne(
      {
        creator_email: withdrawal.creator_email,
      },
      {
        $inc: {
          amount_raised: -Number(withdrawal.withdrawal_credit),
        },
      }
    );

    await withdrawalsCollection.updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      {
        $set: {
          status: "approved",
        },
      }
    );

    await notificationsCollection.insertOne({
  message: `Your withdrawal request for ${withdrawal.withdrawal_credit} credits has been approved.`,
  toEmail: withdrawal.creator_email,
  actionRoute: "/dashboard/withdrawals",
  time: new Date(),
});

    res.status(200).send({
      message: "Payment completed successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to complete payment",
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