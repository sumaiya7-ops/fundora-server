const express = require("express");
const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const contributionsCollection = getDB().collection("contributions");
    const usersCollection = getDB().collection("users");
    const notificationsCollection = getDB().collection("notifications");

    const contribution = req.body;

    const supporter = await usersCollection.findOne({
      email: contribution.supporter_email,
    });

    if (!supporter) {
      return res.status(404).send({
        message: "Supporter not found",
      });
    }

    if (supporter.credits < Number(contribution.contribution_amount)) {
      return res.status(400).send({
        message: "Insufficient credits",
      });
    }

    await usersCollection.updateOne(
      { email: contribution.supporter_email },
      {
        $inc: {
          credits: -Number(contribution.contribution_amount),
        },
      }
    );

    const newContribution = {
      ...contribution,
      contribution_amount: Number(contribution.contribution_amount),
      current_date: new Date(),
      status: "pending",
    };

    const result = await contributionsCollection.insertOne(newContribution);

    await notificationsCollection.insertOne({
  message: `${contribution.supporter_name} contributed ${contribution.contribution_amount} credits to your campaign "${contribution.campaign_title}"`,
  toEmail: contribution.creator_email,
  actionRoute: "/dashboard",
  time: new Date(),
});

    res.status(201).send({
      message: "Contribution submitted successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Create contribution error:", error);

    res.status(500).send({
      message: "Failed to create contribution",
    });
  }
});


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
    const notificationsCollection = getDB().collection("notifications");

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
    
    await notificationsCollection.insertOne({
  message: `Your contribution of ${contribution.contribution_amount} credits to "${contribution.campaign_title}" was approved by ${contribution.creator_name}.`,
  toEmail: contribution.supporter_email,
  actionRoute: "/dashboard/my-contributions",
  time: new Date(),
});

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

router.get("/supporter-stats/:email", async (req, res) => {
  try {
    const contributionsCollection = getDB().collection("contributions");

    const email = req.params.email;

    const contributions = await contributionsCollection
      .find({
        supporter_email: email,
      })
      .toArray();

    const totalContributions = contributions.length;

    const pendingContributions = contributions.filter(
      (contribution) => contribution.status === "pending"
    ).length;

    const totalAmountContributed = contributions
      .filter((contribution) => contribution.status === "approved")
      .reduce(
        (total, contribution) =>
          total + Number(contribution.contribution_amount),
        0
      );

    res.send({
      totalContributions,
      pendingContributions,
      totalAmountContributed,
    });
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to fetch supporter stats",
    });
  }
});

router.get("/approved/:email", async (req, res) => {
  try {
    const contributionsCollection = getDB().collection("contributions");

    const contributions = await contributionsCollection
      .find({
        supporter_email: req.params.email,
        status: "approved",
      })
      .toArray();

    res.status(200).send(contributions);
  } catch (error) {
    console.error("Approved contributions error:", error);

    res.status(500).send({
      message: "Failed to fetch approved contributions",
    });
  }
});

router.get("/supporter/:email", async (req, res) => {
  try {
    const contributionsCollection = getDB().collection("contributions");

    const email = req.params.email;

    const contributions = await contributionsCollection
      .find({
        supporter_email: email,
      })
      .sort({
        current_date: -1,
      })
      .toArray();

    res.status(200).send(contributions);
  } catch (error) {
    console.error("Supporter contributions error:", error);

    res.status(500).send({
      message: "Failed to fetch contributions",
    });
  }
});

module.exports = router;