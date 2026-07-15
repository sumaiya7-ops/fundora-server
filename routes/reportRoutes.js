const express = require("express");
const { getDB } = require("../config/db");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const reportsCollection = getDB().collection("reports");

    const report = {
      ...req.body,
      report_date: new Date(),
    };

    const result = await reportsCollection.insertOne(report);

    res.status(201).send({
      message: "Report submitted successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to submit report",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const reportsCollection = getDB().collection("reports");

    const reports = await reportsCollection
      .find()
      .sort({ report_date: -1 })
      .toArray();

    res.status(200).send(reports);
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to fetch reports",
    });
  }
});

module.exports = router;