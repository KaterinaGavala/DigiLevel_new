const router = require("express").Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

// POST /survey
router.post("/", auth, async (req, res) => {
  try {
    
    const {
      education,
      profession,
      experience,
      workType,
      age,
      selfAssessment,
      digitalFrequency,
      mainTools,
    } = req.body;

    
    const user = await User.findByIdAndUpdate(
      req.user.uid,
      {
        survey: {
          education,
          profession,
          experience,
          workType,
          age,
          selfAssessment,
          digitalFrequency,
          mainTools,
        },
      },
      { new: true }
    );

    res.json({ message: "✅ Survey saved", user });
  } catch (err) {
    console.error("Survey error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;