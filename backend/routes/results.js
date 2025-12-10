// backend/routes/results.js
const router = require("express").Router();
const auth = require("../middleware/auth");
const Result = require("../models/Result");
const mongoose = require("mongoose");
// GET /results  -> all results for this user (newest first)
router.get("/", auth, async (req, res) => {
  try {
    const results = await Result.find({ userId: req.user.uid })
      .sort({ createdAt: -1 });
    res.json({ results });
  } catch (err) {
    console.error("Get results error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /results/latest -> last result per domain
router.get("/latest", auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.uid);
    const pipeline = [
      { $match: { userId } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$domain",
          latest: { $first: "$$ROOT" },
        },
      },
      { $replaceWith: "$latest" },
      { $project: { __v: 0 } },
    ];

    const latest = await Result.aggregate(pipeline);
    res.json({ results: latest });
  } catch (err) {
    console.error("Get latest results error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
