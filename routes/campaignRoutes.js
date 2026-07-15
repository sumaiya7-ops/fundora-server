const express = require("express");
const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

const router = express.Router();



// Get all campaigns
router.get("/", async (req, res) => {
  try {
    const campaignsCollection = getDB().collection("campaigns");
    
    const campaigns = await campaignsCollection.find().toArray();

    res.send(campaigns);
  } catch (error) {
    console.error("Get campaigns error:", error);

    res.status(500).send({
      message: "Failed to get campaigns",
    });
  }
});


router.get("/top-funded", async (req, res) => {
  try {
    const campaignsCollection = getDB().collection("campaigns");

    const campaigns = await campaignsCollection
      .find({ status: "approved" })
      .sort({ amount_raised: -1 })
      .limit(6)
      .toArray();

    res.send(campaigns);
  } catch (error) {
    console.error("Top funded campaigns error:", error);

    res.status(500).send({
      message: "Failed to get top funded campaigns",
    });
  }
});

router.get("/pending", async (req, res) => {
  try {
    const campaignsCollection = getDB().collection("campaigns");

    const campaigns = await campaignsCollection
      .find({
        status: "pending",
      })
      .sort({
        createdAt: -1,
      })
      .toArray();

    res.status(200).send(campaigns);
  } catch (error) {
    console.error("Pending campaigns error:", error);

    res.status(500).send({
      message: "Failed to fetch pending campaigns",
    });
  }
});

router.patch("/approve/:id", async (req, res) => {
  try {
    const campaignsCollection = getDB().collection("campaigns");
    const notificationsCollection = getDB().collection("notifications");

    const campaign = await campaignsCollection.findOne({
  _id: new ObjectId(req.params.id),
});

    const result = await campaignsCollection.updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      {
        $set: {
          status: "approved",
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({
        message: "Campaign not found",
      });
    }

    await notificationsCollection.insertOne({
  message: `Your campaign "${campaign.campaign_title}" has been approved.`,
  toEmail: campaign.creator_email,
  actionRoute: "/dashboard/my-campaigns",
  time: new Date(),
});

    res.status(200).send({
      message: "Campaign approved successfully",
    });
  } catch (error) {
    console.error("Approve campaign error:", error);

    res.status(500).send({
      message: "Failed to approve campaign",
    });
  }
});

router.patch("/reject/:id", async (req, res) => {
  try {
    const campaignsCollection = getDB().collection("campaigns");

    const notificationsCollection = getDB().collection("notifications");

const campaign = await campaignsCollection.findOne({
  _id: new ObjectId(req.params.id),
});

    const result = await campaignsCollection.updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      {
        $set: {
          status: "rejected",
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({
        message: "Campaign not found",
      });
    }

    await notificationsCollection.insertOne({
  message: `Your campaign "${campaign.campaign_title}" has been rejected.`,
  toEmail: campaign.creator_email,
  actionRoute: "/dashboard/my-campaigns",
  time: new Date(),
});

    res.status(200).send({
      message: "Campaign rejected successfully",
    });
  } catch (error) {
    console.error("Reject campaign error:", error);

    res.status(500).send({
      message: "Failed to reject campaign",
    });
  }
});

router.patch("/suspend/:id", async (req, res) => {
  try {
    const campaignsCollection = getDB().collection("campaigns");

    const result = await campaignsCollection.updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      {
        $set: {
          status: "suspended",
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({
        message: "Campaign not found",
      });
    }

    res.status(200).send({
      message: "Campaign suspended successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to suspend campaign",
    });
  }
});


router.get("/creator-stats/:email", async (req, res) => {
  try {
    const campaignsCollection = getDB().collection("campaigns");
    const email = req.params.email;

    const campaigns = await campaignsCollection
      .find({ creator_email: email })
      .toArray();

    const currentDate = new Date();

    const totalCampaigns = campaigns.length;

    const activeCampaigns = campaigns.filter(
      (campaign) => new Date(campaign.deadline) >= currentDate
    ).length;

    const totalAmountRaised = campaigns.reduce(
      (total, campaign) => total + Number(campaign.amount_raised || 0),
      0
    );

    res.status(200).send({
      totalCampaigns,
      activeCampaigns,
      totalAmountRaised,
    });
  } catch (error) {
    console.error("Creator stats error:", error);

    res.status(500).send({
      message: "Failed to get creator stats",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const campaignsCollection = getDB().collection("campaigns");

    const campaignData = req.body;

    const newCampaign = {
      campaign_title: campaignData.campaign_title,
      campaign_story: campaignData.campaign_story,
      category: campaignData.category,
      funding_goal: Number(campaignData.funding_goal),
      minimum_Contribution: Number(campaignData.minimum_Contribution),
      deadline: campaignData.deadline,
      reward_info: campaignData.reward_info,
      campaign_image_url: campaignData.campaign_image_url,
      creator_name: campaignData.creator_name,
      creator_email: campaignData.creator_email,
      amount_raised: 0,
      status: "pending",
      createdAt: new Date(),
    };

    const result = await campaignsCollection.insertOne(newCampaign);

    res.status(201).send({
      message: "Campaign added successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Add campaign error:", error);

    res.status(500).send({
      message: "Failed to add campaign",
    });
  }
});

router.get("/creator/:email", async (req, res) => {
  try {
    const campaignsCollection = getDB().collection("campaigns");

    const email = req.params.email;

    const campaigns = await campaignsCollection
      .find({
        creator_email: email,
      })
      .sort({
        deadline: -1,
      })
      .toArray();

    res.status(200).send(campaigns);
  } catch (error) {
    console.error("Creator campaigns error:", error);

    res.status(500).send({
      message: "Failed to fetch creator campaigns",
    });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const campaignsCollection = getDB().collection("campaigns");

    const { id } = req.params;
    const { campaign_title, campaign_story, reward_info } = req.body;

    const result = await campaignsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          campaign_title,
          campaign_story,
          reward_info,
        },
      }
    );

    res.status(200).send({
      message: "Campaign updated successfully",
      result,
    });
  } catch (error) {
    console.error("Update campaign error:", error);

    res.status(500).send({
      message: "Failed to update campaign",
    });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const campaignsCollection = getDB().collection("campaigns");
    const contributionsCollection = getDB().collection("contributions");
    const usersCollection = getDB().collection("users");
     const reportsCollection = getDB().collection("reports");

    const { id } = req.params;

    const campaign = await campaignsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!campaign) {
      return res.status(404).send({
        message: "Campaign not found",
      });
    }

    const approvedContributions = await contributionsCollection
      .find({
        campaign_id: id,
        status: "approved",
      })
      .toArray();

    for (const contribution of approvedContributions) {
      await usersCollection.updateOne(
        { email: contribution.supporter_email },
        {
          $inc: {
            credits: contribution.contribution_amount,
          },
        }
      );
    }

    await contributionsCollection.deleteMany({
      campaign_id: id,
    });

    await reportsCollection.deleteMany({
  campaign_id: id,
});

    await campaignsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    res.status(200).send({
      message: "Campaign deleted and supporters refunded successfully",
    });
  } catch (error) {
    console.error("Delete campaign error:", error);

    res.status(500).send({
      message: "Failed to delete campaign",
    });
  }
});

router.get("/creator-earnings/:email", async (req, res) => {
  try {
    const campaignsCollection = getDB().collection("campaigns");

    const email = req.params.email;

    const campaigns = await campaignsCollection
      .find({ creator_email: email })
      .toArray();

    const totalCredits = campaigns.reduce(
      (sum, campaign) => sum + (campaign.amount_raised || 0),
      0
    );

    const withdrawAmount = totalCredits / 20;

    res.send({
      totalCredits,
      withdrawAmount,
    });
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to fetch creator earnings",
    });
  }
});

router.get("/explore", async (req, res) => {
  try {
    const campaignsCollection = getDB().collection("campaigns");

    const today = new Date().toISOString().split("T")[0];

    const campaigns = await campaignsCollection
      .find({
        status: "approved",
        deadline: {
          $gte: today,
        },
      })
      .sort({
           createdAt: -1,
           })
      .toArray();

    res.status(200).send(campaigns);
  } catch (error) {
    console.error("Explore campaigns error:", error);

    res.status(500).send({
      message: "Failed to fetch campaigns",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const campaignsCollection = getDB().collection("campaigns");

    const campaign = await campaignsCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!campaign) {
      return res.status(404).send({
        message: "Campaign not found",
      });
    }

    res.status(200).send(campaign);
  } catch (error) {
    console.error("Campaign details error:", error);

    res.status(500).send({
      message: "Failed to fetch campaign details",
    });
  }
});


module.exports = router;