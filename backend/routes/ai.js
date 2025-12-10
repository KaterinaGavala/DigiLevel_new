const router = require("express").Router();
const auth = require("../middleware/auth");

// If you're on Node 18+, fetch is global. If not, uncomment next line and:
// npm i node-fetch
// const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const recCache = new Map(); // key -> { recommendation, raw, ts }

/**
 * Δημιουργεί ένα σταθερό key με βάση userId + survey
 */
function makeKey(userId, survey) {
  try {
    return userId + ":" + JSON.stringify(survey);
  } catch {
    return userId + ":invalid";
  }
}

const planCache = new Map(); // key -> { plan, raw, ts }

function makePlanKey(userId, domain, survey) {
  try {
    return userId + ":" + domain + ":" + JSON.stringify(survey);
  } catch {
    return userId + ":" + domain + ":invalid";
  }
}

router.post("/recommend", auth, async (req, res) => {
  try {
    const { survey } = req.body;
    if (!survey) return res.status(400).json({ message: "Missing survey data" });

    const userId = req.user.uid;                 // identify user
    const key = makeKey(userId, survey);         // unique cache key

    // ---------- CHECK CACHE FIRST ----------
    const cached = recCache.get(key);
    if (cached) {
      const ageMs = Date.now() - cached.ts;
      const maxAgeMs = 1000 * 60 * 60 * 24; // 24 hours cache lifetime

      if (ageMs < maxAgeMs) {
        console.log("✔ Using CACHED recommendation for user", userId);
        return res.json({
          recommendation: cached.recommendation,
          raw: cached.raw,
          cached: true,
        });
      } else {
        recCache.delete(key); // remove expired cache
      }
    }
    // --------------------------------------- //

    // ----------- AI CALL (as is) ------------
    const prompt = `
Δεδομένα χρήστη:
- Εκπαίδευση: ${survey.education || "-"}
- Επάγγελμα/Τομέας: ${survey.profession || "-"}
- Εμπειρία: ${survey.experience || "-"}
- Είδος εργασίας: ${survey.workType || "-"}
- Ηλικία: ${survey.age || "-"}
- Αυτοαξιολόγηση: ${survey.selfAssessment || "-"}
- Συχνότητα χρήσης: ${survey.digitalFrequency || "-"}
- Κύρια εργαλεία: ${survey.mainTools || "-"}

Με βάση το DigComp (5 domains: Information & Data Literacy, Communication & Collaboration, Digital Content Creation, Safety, Problem Solving):
1) Πρότεινε **ένα** domain για να ξεκινήσει ο χρήστης.
2) Δώσε ΜΙΑ σύντομη αιτιολόγηση (1–2 προτάσεις).
3) Το "domain" ΠΡΕΠΕΙ να είναι ΑΚΡΙΒΩΣ ένα από αυτά:
   "Information & Data Literacy", "Communication & Collaboration", "Digital Content Creation", "Safety", "Problem Solving".

ΠΡΟΣΟΧΗ – ΠΟΛΥ ΣΗΜΑΝΤΙΚΟ:
- Θα απαντήσεις ΜΟΝΟ με έγκυρο JSON.
- Το ΠΡΩΤΟ χαρακτήρα της απάντησης πρέπει να είναι '{' και ο ΤΕΛΕΥΤΑΙΟΣ '}'.
- ΔΕΝ θα γράψεις τίποτα άλλο πριν ή μετά από αυτό. ΟΧΙ σχόλια, ΟΧΙ εξηγήσεις, ΟΧΙ κείμενο.

Ακριβής μορφή:

{
  "domain": "<ένα από τα 5 ακριβώς όπως είναι>",
  "reason": "<αιτιολόγηση στα ελληνικά>"
}
4)Απόφυγε αγγλισμούς. Χρησιμοποίησε «συνάδελφοι», όχι «κολέγες/κολεγιές»
5)Γράφε σε καθαρά ελληνικά (όχι greeklish ή μεταγραφές αγγλικών).    

Απάντησε στα Ελληνικά.
`;

    const resp = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt,
        stream: false,
        options: { temperature: 0,
        num_predict: 120
         }
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(500).json({ message: "Ollama error", detail: text });
    }

    const data = await resp.json();
    const raw = data.response || "";
console.log("RAW AI RESPONSE:\n", raw);

    let parsed = null;
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
  const candidate = raw.slice(firstBrace, lastBrace + 1).trim();
      try { parsed = JSON.parse(candidate); } catch (e) {
        console.warn("JSON parse error in /ai/recommend:", e.message);
      }
    }
if (!parsed || typeof parsed.domain !== "string" || typeof parsed.reason !== "string") {
  parsed = {
    domain: "Information & Data Literacy",
    reason:
      "Δεν κατέστη δυνατή η εξαγωγή δομημένης πρότασης. Ξεκίνα με βασικές δεξιότητες αναζήτησης και αξιολόγησης πληροφοριών.",
  };
    }
    // -----------------------------------------

    // ---------- SAVE TO CACHE ----------
    recCache.set(key, {
      recommendation: parsed,
      raw,
      ts: Date.now()
    });
    console.log("💾 Saved recommendation to cache for user", userId);
    // ------------------------------------

    res.json({ recommendation: parsed, raw, cached: false });

  } catch (err) {
    console.error("AI recommend error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// POST /ai/plan
// Δημιουργεί πλάνο 10 βημάτων (level + competence) για ένα domain
router.post("/plan", auth, async (req, res) => {
  try {
    const { domain, survey } = req.body;
    if (!domain) {
      return res.status(400).json({ message: "Missing domain" });
    }

    const userId = req.user.uid;
    const s = survey || {};

    // ---------- CACHE CHECK ΠΡΙΝ ΑΠΟ ΟΛΑ ----------
    const cacheKey = makePlanKey(userId, domain, s);
    const cached = planCache.get(cacheKey);
    if (cached) {
      const ageMs = Date.now() - cached.ts;
      const maxAgeMs = 1000 * 60 * 10; // 10 λεπτά cache

      if (ageMs < maxAgeMs) {
        console.log("✔ Using CACHED plan for user", userId, "domain", domain);
        return res.json({
          plan: cached.plan,
          raw: cached.raw,
          cached: true,
        });
      } else {
        planCache.delete(cacheKey);
      }
    }
    // ----------------------------------------------

    // Μικρός χάρτης domain -> ετικέτα DigComp για το prompt
    const domainLabels = {
      "info-data": "1. Πληροφορίες & Δεδομένα (Information & Data Literacy)",
      communication:
        "2. Επικοινωνία & Συνεργασία (Communication & Collaboration)",
      content:
        "3. Δημιουργία Ψηφιακού Περιεχομένου (Digital Content Creation)",
      safety: "4. Ασφάλεια (Safety)",
      "problem-solving": "5. Επίλυση Προβλημάτων (Problem Solving)",
    };

    const domainLabel =
      domainLabels[domain] || `Άγνωστος τομέας: ${domain}`;

    const prompt = `
Είσαι ειδικός στο DigComp 2.2 και σχεδιάζεις ένα μικρό προσαρμοστικό quiz 10 ερωτήσεων.

Στόχος: Να εκτιμήσεις το επίπεδο (1–8) του χρήστη στον τομέα:
${domainLabel}

Δεδομένα χρήστη (ερωτηματολόγιο):
- Εκπαίδευση: ${s.education || "-"}
- Επάγγελμα/Τομέας: ${s.profession || "-"}
- Εμπειρία με υπολογιστές: ${s.experience || "-"}
- Τύπος εργασίας: ${s.workType || "-"}
- Ηλικία: ${s.age || "-"}
- Αυτοαξιολόγηση ψηφιακών δεξιοτήτων: ${s.selfAssessment || "-"}
- Συχνότητα χρήσης ψηφιακών εργαλείων: ${s.digitalFrequency || "-"}
- Κύρια εργαλεία/εφαρμογές: ${s.mainTools || "-"}

Οδηγίες:
- Θέλω ένα ΠΛΑΝΟ 10 ΒΗΜΑΤΩΝ για το quiz.
- Κάθε βήμα πρέπει να έχει:
  * step: ακέραιος 1–10 (σειρά ερώτησης)
  * level: ακέραιος 1–8 (επίπεδο δυσκολίας DigComp)
  * competence: σύντομη περιγραφή δεξιότητας, π.χ. "1.1 Browsing, searching, filtering data" ή "2.4 Collaborating through digital technologies".
- Ξεκίνα από σχετικά εύκολο επίπεδο (1–3) και σταδιακά ανέβασε τη δυσκολία ανάλογα με τα δεδομένα του χρήστη.
- Κάλυψε 2–3 διαφορετικές competences του συγκεκριμένου τομέα, όχι μόνο μία.

ΠΟΛΥ ΣΗΜΑΝΤΙΚΟ:
- ΕΠΕΣΤΡΕΨΕ ΜΟΝΟ ΕΝΑ JSON ARRAY, χωρίς κείμενο γύρω γύρω.
Παράδειγμα μορφής (μόνο ως μορφή, ΟΧΙ ως περιεχόμενο):

[
  { "step": 1, "level": 1, "competence": "1.1 Browsing, searching, filtering data" },
  { "step": 2, "level": 2, "competence": "1.2 Evaluating data and information" }
]

Τώρα δώσε το τελικό πλάνο:
    `.trim();

    const ollamaUrl =
      process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
    const model = process.env.OLLAMA_MODEL || "llama3";

    const response = await fetch(ollamaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
          options: {
    temperature: 0,
    num_predict: 400    // ⬅ χρειάζεσαι λίγη παραπάνω “ανάσα” για τα 10 steps
  }
      }),
    });

    if (!response.ok) {
      console.error("Ollama /plan HTTP error:", response.status);
      return res
        .status(500)
        .json({ message: "AI service error (HTTP)", status: response.status });
    }

    const data = await response.json();
    const raw = (data.response || "").trim();

    let plan = [];

    // Προσπαθούμε να βρούμε καθαρό JSON array μέσα στο text
    const startIdx = raw.indexOf("[");
    const endIdx = raw.lastIndexOf("]");
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const jsonSlice = raw.substring(startIdx, endIdx + 1);
      try {
        const parsed = JSON.parse(jsonSlice);
        if (Array.isArray(parsed)) {
          plan = parsed
            .filter(
              (step) =>
                typeof step.level === "number" &&
                step.level >= 1 &&
                step.level <= 8
            )
            .slice(0, 10);
        }
      } catch (e) {
        console.error("JSON parse error in /ai/plan:", e.message);
      }
    }

    // Αν για κάποιο λόγο δεν πήραμε αξιοπρεπές plan, φτιάξε ένα απλό fallback
    if (!plan.length) {
      plan = Array.from({ length: 10 }).map((_, i) => {
        const level = Math.min(8, 1 + Math.floor(i / 2)); // κάθε 2 ερωτήσεις ανεβαίνουμε level
        return {
          step: i + 1,
          level,
          competence: domainLabel,
        };
      });
    }

    // ---------- ΑΠΟΘΗΚΕΥΣΗ ΣΤΟ CACHE ----------
    planCache.set(cacheKey, {
      plan,
      raw,
      ts: Date.now(),
    });
    console.log("💾 Saved plan to cache for user", userId, "domain", domain);
    // -------------------------------------------

    res.json({ plan, raw, cached: false });
  } catch (err) {
    console.error("AI plan error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/warmup", auth, async (req, res) => {
  try {
    const ollamaUrl =
      process.env.OLLAMA_URL || "http://localhost:11434/api/generate";

    const response = await fetch(ollamaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: 'Return only {"ok":true}',
        stream: false,
        options: { temperature: 0 }
      }),
    });

    if (!response.ok) {
      console.error("Warmup HTTP error", response.status);
      return res.json({ warmed: false });
    }

    return res.json({ warmed: true });

  } catch (err) {
    console.error("Warmup error:", err);
    return res.json({ warmed: false });
  }
});


module.exports = router;
