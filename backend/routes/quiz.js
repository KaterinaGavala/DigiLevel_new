const router = require("express").Router();
const Question = require("../models/Question");
const Result = require("../models/Result");
const auth = require("../middleware/auth");

// Temporary in-memory session store (later you can move it to DB)
const sessions = {};

/**
 * POST /quiz/start
 * body: { domain }
 */
router.post("/start", auth, async (req, res) => {
  try {
    const { domain, plan } = req.body;
    if (!domain) {
      return res.status(400).json({ message: "Domain required" });
    }

    // χρησιμοποιούμε plan ΜΟΝΟ αν είναι κανονικό array με τουλάχιστον 1 στοιχείο
    const usePlan = Array.isArray(plan) && plan.length > 0;

    // αν έχουμε plan → πρώτο level από εκεί, αλλιώς fallback στο 2 όπως πριν
    const startLevel = usePlan
      ? Math.max(1, Math.min(8, Number(plan[0].level) || 1))
      : 2;

    // βρίσκουμε την πρώτη ερώτηση σε αυτό το level
    const question = await Question.aggregate([
      { $match: { domain, level: startLevel } },
      { $sample: { size: 1 } },
    ]);

    if (!question.length) {
      return res.status(404).json({
        message: "No questions found for this domain/level",
      });
    }

    // create session
    const sid = Math.random().toString(36).substring(2, 9);
    sessions[sid] = {
      userId: req.user.uid,
      domain,
      currentLevel: startLevel,
      answered: 0,
      correctAnswers: 0,
      total: 10,
      // νέα πεδία για AI-based ροή
      plan: usePlan ? plan : null,
      currentStep: 0, // index στο plan (0 = πρώτη ερώτηση)
    };

    res.json({ sessionId: sid, question: question[0] });
  } catch (err) {
    console.error("Quiz start error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * POST /quiz/:sid/answer
 * body: { questionId, answer }
 */
router.post("/:sid/answer", auth, async (req, res) => {
  try {
    const { sid } = req.params;
    const { questionId, answer } = req.body;
    const session = sessions[sid];

    if (!session) return res.status(404).json({ message: "Session not found" });

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });

    // 1) check correctness
    const correct = question.correct === answer;

    // 2) update counters
    session.answered += 1;
    if (correct) session.correctAnswers += 1;

    // --------------------------------------
    // NEW PART -> AI PLAN MODE CHECK
    // --------------------------------------
    const hasPlan = Array.isArray(session.plan) && session.plan.length > 0;

    if (hasPlan) {
      // AI MODE: ignore old level up/down logic
      const nextStepIndex =
        typeof session.currentStep === "number"
          ? session.currentStep + 1
          : 1;

      session.currentStep = nextStepIndex;

      const step = session.plan[nextStepIndex];
      const targetLevel =
        step && typeof step.level === "number"
          ? step.level
          : session.currentLevel || 1;

      // clamp between 1 and 8
      session.currentLevel = Math.max(1, Math.min(8, Number(targetLevel)));
    } else {
      // OLD MODE: fallback adaptive logic
      if (correct) {
        session.currentLevel += 1;
      } else {
        session.currentLevel -= 1;
      }

      // clamp between 1 and 8
      session.currentLevel = Math.max(1, Math.min(8, session.currentLevel));
    }

    // --------------------------------------
    // FINISH QUIZ?
    // --------------------------------------
    const finishedByCount = session.answered >= session.total;
    const finishedByPlan =
      hasPlan &&
      typeof session.currentStep === "number" &&
      session.currentStep  >= session.plan.length;

    if (finishedByCount || finishedByPlan) {
      const ratio = session.correctAnswers / session.total;
      let finalLevel = Math.round(ratio * 8);
      finalLevel = Math.max(1, Math.min(8, finalLevel)); // clamp

      try {
        const result = await Result.create({
          userId: session.userId,
          domain: session.domain,
          finalLevel,
          correctAnswers: session.correctAnswers,
          total: session.total,
        });

        delete sessions[sid];
        return res.json({ finished: true, result });
      } catch (err) {
        console.error("Save result error:", err);
        return res.status(500).json({ message: "Could not save result" });
      }
    }

    // --------------------------------------
    // NEXT QUESTION
    // --------------------------------------
    const nextQ = await Question.aggregate([
      { $match: { domain: session.domain, level: session.currentLevel } },
      { $sample: { size: 1 } },
    ]);

    if (!nextQ.length)
      return res.status(404).json({ message: "No next question found" });

    res.json({
      finished: false,
      correct,
      nextQuestion: nextQ[0],
      progress: { answered: session.answered, total: session.total },
      currentLevel: session.currentLevel,
    });
  } catch (err) {
    console.error("Answer error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * POST /quiz/:sid/finish
 * Ends the quiz manually (optional)
 */
router.post("/:sid/finish", auth, async (req, res) => {
  try {
    const { sid } = req.params;
    const session = sessions[sid];
    if (!session) return res.status(404).json({ message: "Session not found" });

    const finalLevel = Math.round((session.correctAnswers / session.total) * 8);

    const result = await Result.create({
      userId: session.userId,
      domain: session.domain,
      finalLevel,
      correctAnswers: session.correctAnswers,
      total: session.total,
    });

    delete sessions[sid];
    res.json({ finished: true, result });
  } catch (err) {
    console.error("Finish error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
