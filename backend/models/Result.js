const mongoose = require("mongoose");

const ResultSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    domain: { type: String, required: true },
    finalLevel: { type: Number, min: 1, max: 8, required: true },
    correctAnswers: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Result", ResultSchema);
