import { useEffect, useMemo, useState,useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Progress from "../components/Progress.jsx";
import QuestionOption from "../components/QuestionOption.jsx";


export default function Quiz() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const domain = params.get("domain");
  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const [sid, setSid] = useState(null);
  const [question, setQuestion] = useState(null);
  const [choice, setChoice] = useState("");
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState("");
  const [progress, setProgress] = useState({ answered: 0, total: 10 });
  const [level, setLevel] = useState(null);
   const [feedback, setFeedback] = useState(null);
   const hasStartedRef = useRef(false);

  // Start quiz (με AI plan αν γίνεται)
  useEffect(() => {
  
    if (!domain) return navigate("/quiz-selection");
     if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    const start = async () => {
      setLoading(true);
      try {
        // 1) Παίρνουμε τον χρήστη & survey από localStorage
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (!storedUser.survey || Object.keys(storedUser.survey).length === 0) {
          // αν για κάποιο λόγο δεν έχει survey, γυρνάμε πίσω
          navigate("/survey");
          return;
        }

        let plan = null;

        // 2) Προσπαθούμε να πάρουμε πλάνο από το AI (προαιρετικά)
        try {
          const planRes = await axios.post(
            "http://localhost:5000/ai/plan",
            { domain, survey: storedUser.survey },
            { headers }
          );
          plan = planRes.data.plan || null;
        } catch (e) {
          console.warn("AI plan error – fallback σε κλασικό adaptive:", e);
          setBanner("⚠️ Το AI plan δεν είναι διαθέσιμο. Χρησιμοποιείται κλασικό adaptive quiz.");
        }

        // 3) Ξεκινάμε το quiz στο backend (με ή χωρίς plan)
        const res = await axios.post(
          "http://localhost:5000/quiz/start",
          { domain, plan },
          { headers }
        );

        setSid(res.data.sessionId);
        setQuestion(res.data.question);
        setProgress({ answered: 0, total: 10 });
        setLevel(res.data.question?.level || null);
      } catch (err) {
        console.error(err);
        setBanner(err.response?.data?.message || "Σφάλμα εκκίνησης quiz");
      } finally {
        setLoading(false);
      }
    };

    start();
  }, [domain, headers, navigate]);

  // Submit answer
  const submit = async () => {
    if (!choice || !sid || !question) return;
    setLoading(true);

    try {
      const res = await axios.post(
        `http://localhost:5000/quiz/${sid}/answer`,
        { questionId: question._id, answer: choice },
        { headers }
      );

      if (res.data.finished) {
        localStorage.setItem("lastResult", JSON.stringify(res.data.result));
        return navigate("/results");
      }
     if (typeof res.data.correct === "boolean") {
        setFeedback(
          res.data.correct
            ? "✅ Σωστή απάντηση!"
            : "❌ Λάθος απάντηση, προχωράμε στην επόμενη."
        );
      } setTimeout(() => {
      setQuestion(res.data.nextQuestion);
      setProgress(res.data.progress);
      setLevel(res.data.currentLevel);
      setChoice("");
      setFeedback(null); // καθάρισε feedback για την επόμενη
    }, 1200);
      }
     catch (err) {
      console.error(err);
      setBanner(err.response?.data?.message || "Σφάλμα απάντησης");
    } finally {
      setLoading(false);
    }
  };

  if (!domain) return null;
 const answeredLabel = `${progress.answered}/${progress.total}`;
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "2rem" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <img src="/DigiLevel_.png" alt="" style={{ width: 40 }} />
          <h2 style={{ margin: 0 }}>Quiz — {domain}</h2>
         <div style={{ marginLeft: "auto", width: 180 }}>
            <Progress total={progress.total} active={progress.answered} />
          </div>
        </header>

        {banner && (
          <div
            style={{
              background: "#fff7ed",
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
              border: "1px solid #fed7aa",
            }}
          >
            {banner}
          </div>
        )}

        {loading && <div>Φόρτωση…</div>}

        {!loading && question && (
          <div style={{ background: "#fff", padding: 18, borderRadius: 12 }}>
            <h3>{question.prompt}</h3>

            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              {question.options.map((opt, i) => (
                <label
                  key={i}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border:
                      choice === opt
                        ? "2px solid #2563eb"
                        : "1px solid #e5e7eb",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="options"
                    value={opt}
                    checked={choice === opt}
                    onChange={() => setChoice(opt)}
                    style={{ marginRight: 10 }}
                  />
                  {opt}
                </label>
              ))}
            </div>

             {feedback && (
              <p
                style={{
                  marginTop: 12,
                  fontSize: "0.95rem",
                  color: feedback.startsWith("✅") ? "#166534" : "#b91c1c",
                }}
              >
                {feedback}
              </p>
            )}

            <div style={{ marginTop: 16 }}>
              <button
                onClick={submit}
                disabled={!choice || loading}
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: 10,
                  cursor: choice ? "pointer" : "not-allowed",
                }}
              >
                Επόμενη ερώτηση →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
