const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./config/db");
const campaignRoutes = require("./routes/campaignRoutes");
const userRoutes = require("./routes/userRoutes");
const contributionRoutes = require("./routes/contributionRoutes");
const withdrawalRoutes = require("./routes/withdrawalRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/campaigns", campaignRoutes);
app.use("/users", userRoutes);
app.use("/contributions", contributionRoutes);
app.use("/withdrawals", withdrawalRoutes);
app.use("/payments", paymentRoutes);


app.get("/", (req, res) => {
  res.send("Fundora server is running");
});

const startServer = async () => {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`Fundora server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
};

startServer();