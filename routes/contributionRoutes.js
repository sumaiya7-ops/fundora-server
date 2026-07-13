const express = require("express");
const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

const router = express.Router();


router.get("/pending/:creatorEmail", async (req, res) => {
  try {
    const contributionsCollection = getDB().collection("contributions");

    const creatorEmail = req.params.creatorEmail;

    const contributions = await contributionsCollection
      .find({
        creator_email: creatorEmail,
        status: "pending",
      })
      .toArray();

    res.status(200).send(contributions);
  } catch (error) {
    console.error("Pending contributions error:", error);

    res.status(500).send({
      message: "Failed to get pending contributions",
    });
  }
});

router.patch("/approve/:id", async (req, res) => {
  try {
    const contributionsCollection = getDB().collection("contributions");
    const campaignsCollection = getDB().collection("campaigns");

    const id = req.params.id;

    const contribution = await contributionsCollection.findOne({
      _id: new ObjectId(id),
      status: "pending",
    });

    if (!contribution) {
      return res.status(404).send({
        message: "Pending contribution not found",
      });
    }

    const campaignResult = await campaignsCollection.updateOne(
      {
        _id: new ObjectId(contribution.campaign_id),
      },
      {
        $inc: {
          amount_raised: Number(contribution.contribution_amount),
        },
      }
    );

    if (campaignResult.matchedCount === 0) {
      return res.status(404).send({
        message: "Campaign not found",
      });
    }

    await contributionsCollection.updateOne(
      {
        _id: new ObjectId(id),
        status: "pending",
      },
      {
        $set: {
          status: "approved",
        },
      }
    );

    res.status(200).send({
      message: "Contribution approved successfully",
    });
  } catch (error) {
    console.error("Approve contribution error:", error);

    res.status(500).send({
      message: "Failed to approve contribution",
    });
  }
});

router.patch("/reject/:id", async (req, res) => {
  try {
    const contributionsCollection = getDB().collection("contributions");
    const usersCollection = getDB().collection("users");

    const id = req.params.id;

    const contribution = await contributionsCollection.findOne({
      _id: new ObjectId(id),
      status: "pending",
    });

    if (!contribution) {
      return res.status(404).send({
        message: "Pending contribution not found",
      });
    }

    const supporterResult = await usersCollection.updateOne(
      {
        email: contribution.supporter_email,
      },
      {
        $inc: {
          credits: Number(contribution.contribution_amount),
        },
      }
    );

    if (supporterResult.matchedCount === 0) {
      return res.status(404).send({
        message: "Supporter not found",
      });
    }

    await contributionsCollection.updateOne(
      {
        _id: new ObjectId(id),
        status: "pending",
      },
      {
        $set: {
          status: "rejected",
        },
      }
    );

    res.status(200).send({
      message: "Contribution rejected and credits refunded successfully",
    });
  } catch (error) {
    console.error("Reject contribution error:", error);

    res.status(500).send({
      message: "Failed to reject contribution",
    });
  }
});

module.exports = router;