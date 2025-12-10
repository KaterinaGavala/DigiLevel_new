import { useEffect, useState ,useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";

const DOMAINS = [
  { key: "info-data", title: "Πληροφορίες & Δεδομένα", subtitle: "Information & Data Literacy", emoji: "📘" },
  { key: "communication", title: "Επικοινωνία & Συνεργασία", subtitle: "Communication & Collaboration", emoji: "💬" },
  { key: "content", title: "Δημιουργία Ψηφ. Περιεχομένου", subtitle: "Digital Content Creation", emoji: "🧩" },
  { key: "safety", title: "Ασφάλεια", subtitle: "Safety", emoji: "🔒" },
  { key: "problem-solving", title: "Επίλυση Προβλημάτων", subtitle: "Problem Solving", emoji: "⚙️" },
];

export default function QuizSelection() {
  const navigate = useNavigate();
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const hasFetchedRef = useRef(false);
  useEffect(() => {
      if (hasFetchedRef.current) return;   // 👈 αν έχει ξανατρέξει, μην ξανακάνεις request
    hasFetchedRef.current = true;
    // If no survey, send them back to fill it
    if (!user?.survey || Object.keys(user.survey).length === 0) {
      navigate("/survey");
      return;
    }

    const fetchRec = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.post(
          "http://localhost:5000/ai/recommend",
          { survey: user.survey },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRec(res.data.recommendation);
      } catch (e) {
        // fallback if AI not available
        setRec({
          domain: "Information & Data Literacy",
          reason: "Ξεκίνα με βασικές δεξιότητες αναζήτησης και αξιολόγησης πληροφοριών."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRec();
  }, []);

  const goToQuiz = (domainKey) => {
    // Later this will be /quiz/:domainKey
    navigate(`/quiz?domain=${encodeURIComponent(domainKey)}`);
  };

  return (
      <>
      <Navbar />
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e0f2fe, #ffffff)",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* AI Recommendation Banner */}
        <div style={{
          background: "#ecfeff",
          border: "1px solid #bae6fd",
          borderRadius: 12,
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem"
        }}>
          {loading ? (
            <strong>🔄 Φόρτωση προτεινόμενου quiz…</strong>
          ) : (
            <>
              <strong>💡 Προτεινόμενο Quiz:</strong>{" "}
              <span style={{ fontWeight: 700 }}>
                {translateDomain(rec?.domain)}
              </span>
              <div style={{ marginTop: 6, color: "#334155" }}>{rec?.reason}</div>
            </>
          )}
        </div>

        {/* Grid of 5 domains */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1rem",
          }}
        >
          {DOMAINS.map((d) => (
            <div key={d.key} style={{
              background: "#fff",
              borderRadius: 12,
              padding: "1rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}>
              <div>
                <div style={{ fontSize: 28 }}>{d.emoji}</div>
                <h3 style={{ margin: "0.5rem 0 0.25rem 0" }}>{d.title}</h3>
                <div style={{ color: "#64748b", fontSize: 14 }}>{d.subtitle}</div>
              </div>
              <button
                onClick={() => goToQuiz(d.key)}
                style={{
                  marginTop: "1rem",
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  padding: "10px 12px",
                  borderRadius: 10,
                  cursor: "pointer"
                }}
              >
                Ξεκίνα Quiz →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>  
    );
}

function translateDomain(englishName = "") {
  const map = {
    "Information & Data Literacy": "Πληροφορίες & Γραμματισμός Δεδομένων",
    "Communication & Collaboration": "Επικοινωνία & Συνεργασία",
    "Digital Content Creation": "Δημιουργία Ψηφιακού Περιεχομένου",
    "Safety": "Ασφάλεια",
    "Problem Solving": "Επίλυση Προβλημάτων",
  };
  return map[englishName] || englishName;
}
