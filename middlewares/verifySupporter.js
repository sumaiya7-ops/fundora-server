const { getDB } = require("../config/db");

const verifySupporter = async (req, res, next) => {
  const usersCollection = getDB().collection("users");

  const email = req.decoded.email;

  const user = await usersCollection.findOne({ email });

  if (!user || user.role !== "supporter") {
    return res.status(403).send({
      message: "Forbidden access",
    });
  }

  next();
};

module.exports = verifySupporter;