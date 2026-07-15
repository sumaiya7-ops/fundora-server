const express = require("express");
const cors = require("cors");
require("dotenv").config();

const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");


const { connectDB } = require("./config/db");
const campaignRoutes = require("./routes/campaignRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const userRoutes = require("./routes/userRoutes");
const contributionRoutes = require("./routes/contributionRoutes");
const withdrawalRoutes = require("./routes/withdrawalRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reportRoutes = require("./routes/reportRoutes");
const authRoutes = require("./routes/jwtRoutes");
const jwtRoutes = require("./routes/jwtRoutes");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/campaigns", campaignRoutes);
app.use("/notifications", notificationRoutes);
app.use("/users", userRoutes);
app.use("/contributions", contributionRoutes);
app.use("/withdrawals", withdrawalRoutes);
app.use("/payments", paymentRoutes);
app.use("/reports", reportRoutes);
app.use("/", jwtRoutes);
app.use(authRoutes);

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