const express = require("express");
const { getDB } = require("../config/db");

const router = express.Router();

// Get notifications by email
router.get("/:email", async (req, res) => {
  try {
    const notificationsCollection =
      getDB().collection("notifications");

    const notifications = await notificationsCollection
      .find({
        toEmail: req.params.email,
      })
      .sort({
        time: -1,
      })
      .toArray();

    res.send(notifications);
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to fetch notifications",
    });
  }
});

module.exports = router;