const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    // DigComp domain key: "info-data" | "communication" | "content" | "safety" | "problem-solving"
    domain: { type: String, required: true, index: true },

    // Difficulty aligned to DigComp levels (1–8)
    level: { type: Number, min: 1, max: 8, required: true, index: true },

    // Question content
    prompt: { type: String, required: true },

    // Multiple choice options (2–6 options typically)
    options: {
      type: [String],
      validate: { validator: (v) => Array.isArray(v) && v.length >= 2 },
      required: true,
    },

    // The correct option as exact string match to one of options[]
    correct: { type: String, required: true },

    // (Optional) tags per competence if you later want per-competence analytics
    competence: { type: String, default: "" } // e.g., "2.1 Browsing, searching, filtering information"
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", QuestionSchema);
