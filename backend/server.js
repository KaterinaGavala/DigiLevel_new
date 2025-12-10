const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true })); // Vite default port
app.use(express.json());

// routes
app.use("/auth", require("./routes/auth"));
app.use("/survey", require("./routes/survey"));
app.use("/seed", require("./routes/seed"));
app.use("/quiz", require("./routes/quiz"));
app.use("/ai", require("./routes/ai"));
app.use("/results", require("./routes/results"));
app.get("/", (req, res) => res.send("API is running..."));

// mongo connect + start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT, () =>
      console.log(`🚀 Server on http://localhost:${process.env.PORT}`)
    );
  })
  .catch(err => {
    console.error("❌ Mongo error", err);
    process.exit(1);
  });
