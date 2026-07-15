const { getDB } = require("../config/db");

const verifyCreator = async (req, res, next) => {
  const usersCollection = getDB().collection("users");

  const email = req.decoded.email;

  const user = await usersCollection.findOne({ email });

  if (!user || user.role !== "creator") {
    return res.status(403).send({
      message: "Forbidden access",
    });
  }

  next();
};

module.exports = verifyCreator;