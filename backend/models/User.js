const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },

  // first-time survey (optional fields for now)
survey: {
  education: String,
  profession: String,
  experience: String,
  workType: String,
  age: String,
  selfAssessment: String,
  digitalFrequency: String,
  mainTools: String
},


  // progress/badges placeholders
  badges: { type: [String], default: [] },
  progress: { type: Map, of: new mongoose.Schema({
    level: { type: Number, min: 1, max: 8 },
    score: { type: Number, min: 0, max: 100 },
    lastAssessedAt: Date
  }, { _id: false }) }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
